import { Component, OnInit,SimpleChanges , OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { ChatMessage, ChatThread, MessageType, SendMessageRequest } from '../../../core/models/chat.models';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css']
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

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService
    , private cdr: ChangeDetectorRef
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
  }
}

}
