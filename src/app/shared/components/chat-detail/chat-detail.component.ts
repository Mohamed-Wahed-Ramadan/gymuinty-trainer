import { Component, OnInit,SimpleChanges , OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { ChatMessage, ChatThread, MessageType, SendMessageRequest } from '../../../core/models/chat.models';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  ngOnDestroy(): void {
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

}
