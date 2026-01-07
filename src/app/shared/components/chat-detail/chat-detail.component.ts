import { Component, OnInit,SimpleChanges , OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { ChatMessage, ChatThread, MessageType, SendMessageRequest } from '../../../core/models/chat.models';
import { Subject, interval } from 'rxjs';
import { takeUntil, debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ChatDetailComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
  @Input() thread: ChatThread | null = null;
  @Input() messages: ChatMessage[] = [];
  @Input() currentUserId: string | null = null;
  @Output() onSendMessage = new EventEmitter<SendMessageRequest>();
  @Output() onThreadClose = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer: ElementRef | null = null;

  messageContent = '';
  otherUserTyping = false;
  isOtherUserOnline = false;

  private typingTimer: any;
  private typingTimeout: any;
  private destroy$ = new Subject<void>();
  private shouldScroll = false;
  private pollingSubscription: any = null;
  // Classified message arrays and unified display list
  myMessages: ChatMessage[] = [];
  otherMessages: ChatMessage[] = [];
  displayMessages: { message: ChatMessage; side: 'mine' | 'other' }[] = [];
  currentUserName: string | null = null;

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.thread?.id) {
      this.chatService.setCurrentThread(this.thread.id);
    }

    // Listen for typing indicator
    this.signalRService.userTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.userId !== this.currentUserId && event.threadId === this.thread?.id) {
          this.otherUserTyping = true;
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.otherUserTyping = false;
            this.cdr.detectChanges();
          }, 3000);
          this.cdr.detectChanges();
        }
      });

    // Listen for online status
    this.signalRService.userOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.userId === this.thread?.otherUserId) {
          this.isOtherUserOnline = event.isOnline;
          this.cdr.detectChanges();
        }
      });

    this.shouldScroll = true;
    // get current username from AuthService/local storage
    try {
      const u = this.authService.getCurrentUser();
      if (u) {
        this.currentUserName = (u.userName && String(u.userName).trim()) ? String(u.userName).trim() : (u.name ? String(u.name).trim() : null);
      } else {
        // fallback: try localStorage key used by AuthService
        const raw = localStorage.getItem('gymunity_trainer_user');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            this.currentUserName = parsed.userName || parsed.name || null;
          } catch (e) { /* ignore */ }
        }
      }
    } catch (e) {
      this.currentUserName = null;
    }

    // Start polling for new messages every 1.5 seconds
    this.startMessagePolling();
  }

  /**
   * Start polling for new messages every 1.5 seconds
   */
  private startMessagePolling(): void {
    if (!this.thread?.id) return;

    this.pollingSubscription = interval(1500)
      .pipe(
        switchMap(() => this.chatService.getThreadMessages(this.thread!.id)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const newMessages = response.data;
            
            // Only update if message count or last message ID changed
            const oldCount = this.messages.length;
            const newCount = newMessages.length;
            const oldLastId = this.messages.length > 0 ? this.messages[this.messages.length - 1].id : null;
            const newLastId = newMessages.length > 0 ? newMessages[newMessages.length - 1].id : null;
            
            // Only update if there are actually new messages
            if (newCount > oldCount || newLastId !== oldLastId) {
              this.messages = newMessages;
              this.organizeMessages();
              this.cdr.detectChanges();
              
              // Auto-scroll if user is near the bottom (within 7px)
              setTimeout(() => this.checkAndAutoScroll(), 0);
            }
          }
        },
        error: (error) => {
          console.warn('Polling error:', error);
        }
      });
  }

  /**
   * Stop polling when thread closes
   */
  private stopMessagePolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendMessage(): void {
    if (!this.messageContent.trim() || !this.thread) return;

    const request: SendMessageRequest = {
      content: this.messageContent.trim(),
      mediaUrl: null,
      type: MessageType.Text
    };

    this.onSendMessage.emit(request);
    this.messageContent = '';
    this.notifyStoppedTyping();
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  isImageType(type: MessageType): boolean {
    return type === MessageType.FormCheck || type === MessageType.Video;
  }

  onTyping(): void {
    // Notify server that user is typing
    if (this.thread?.id && !this.typingTimer) {
      this.signalRService.notifyTyping(this.thread.id);
      this.typingTimer = setTimeout(() => {
        this.typingTimer = null;
      }, 1000);
    }
  }

  notifyStoppedTyping(): void {
    if (this.thread?.id) {
      this.signalRService.notifyStoppedTyping(this.thread.id);
    }
    clearTimeout(this.typingTimer);
    this.typingTimer = null;
  }

  onAttachMedia(): void {
    // TODO: Implement file upload
    console.log('Attach media');
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling:', err);
    }
  }

  /**
   * Check distance between messages container and input field
   * If distance is <= 7px, auto-scroll to bottom
   */
  private checkAndAutoScroll(): void {
    try {
      if (!this.messagesContainer?.nativeElement) return;

      const container = this.messagesContainer.nativeElement;
      const containerRect = container.getBoundingClientRect();
      const containerBottom = containerRect.bottom;

      // Find input element (usually next element or in parent)
      let inputElement = document.querySelector('textarea[placeholder*="message"]') ||
                        document.querySelector('textarea[placeholder*="Message"]') ||
                        document.querySelector('input[placeholder*="message"]') ||
                        document.querySelector('input[placeholder*="Message"]');

      if (!inputElement) {
        // Fallback: scroll to bottom anyway
        this.scrollToBottom();
        return;
      }

      const inputRect = inputElement.getBoundingClientRect();
      const distance = inputRect.top - containerBottom;

      // If distance is small (within 7px), scroll to bottom
      if (distance <= 7 && distance >= -7) {
        this.scrollToBottom();
      }
    } catch (err) {
      console.warn('Error checking auto-scroll:', err);
    }
  }

  ngOnDestroy(): void {
    this.stopMessagePolling();
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.typingTimer);
    clearTimeout(this.typingTimeout);
    this.chatService.setCurrentThread(null);
  }
  ngOnChanges(changes: SimpleChanges): void {
  if (changes['messages']) {
    this.shouldScroll = true;
    // Organize messages only after API response assigned to `messages`
    this.organizeMessages();
    this.cdr.detectChanges();
  }
}

  // Organize messages into myMessages / otherMessages and prepare display list (preserve order)
  organizeMessages(): void {
    this.myMessages = [];
    this.otherMessages = [];
    this.displayMessages = [];

    const curName = this.currentUserName ? String(this.currentUserName).trim().toLowerCase() : null;
    for (const m of this.messages || []) {
      const senderName = m.senderName ? String(m.senderName).trim() : '';
      const isMineByName = curName && senderName && senderName.toLowerCase() === curName;
      const isMineById = this.currentUserId && m.senderId === this.currentUserId;
      const side: 'mine' | 'other' = (isMineByName || isMineById) ? 'mine' : 'other';
      if (side === 'mine') this.myMessages.push(m); else this.otherMessages.push(m);
      this.displayMessages.push({ message: m, side });
    }

    // Persist separated arrays per thread id (optional storage)
    try {
      const key = this.thread?.id != null ? `thread_${this.thread.id}` : 'thread_global';
      localStorage.setItem(`myMessages_${key}`, JSON.stringify(this.myMessages));
      localStorage.setItem(`otherMessages_${key}`, JSON.stringify(this.otherMessages));
    } catch (e) {
      // ignore storage errors
    }
    this.cdr.detectChanges();
  }

  // Avatar error fallback handler
  setAvatarFallback(event: any): void {
    try { event.target.src = './avatar.png'; } catch (e) { /* ignore */ }
  }

  // Helper method to get avatar URL
  getAvatarUrl(senderPhoto: string | null | undefined, fallbackPhoto: string | null | undefined): string {
    if (senderPhoto && senderPhoto.trim() && senderPhoto !== 'null' && senderPhoto !== 'undefined') {
      // إذا كان URL كامل، استخدمه مباشرة
      if (senderPhoto.startsWith('http://') || senderPhoto.startsWith('https://')) {
        return senderPhoto;
      }
      // إذا كان مسار نسبي، أضف base URL
      const baseUrl = 'https://gymunity-fp-apis.runasp.net';
      return `${baseUrl}/${senderPhoto.replace(/^\/+/, '')}`;
    }
    if (fallbackPhoto && fallbackPhoto.trim() && fallbackPhoto !== 'null' && fallbackPhoto !== 'undefined') {
      if (fallbackPhoto.startsWith('http://') || fallbackPhoto.startsWith('https://')) {
        return fallbackPhoto;
      }
      const baseUrl = 'https://gymunity-fp-apis.runasp.net';
      return `${baseUrl}/${fallbackPhoto.replace(/^\/+/, '')}`;
    }
    return './avatar.png';
  }

}
