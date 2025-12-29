import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
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
  template: `
    <div class="chat-detail-container" *ngIf="thread">
      <!-- Header -->
      <div class="chat-detail-header">
        <div class="header-content">
          <img [src]="thread.otherUserProfilePhoto || 'assets/default-avatar.png'"
               alt="{{ thread.otherUserName }}"
               class="header-avatar">
          <div class="header-info">
            <h6 class="mb-0">{{ thread.otherUserName }}</h6>
            <small [class]="isOtherUserOnline ? 'text-success' : 'text-muted'">
              <i class="bi" [ngClass]="isOtherUserOnline ? 'bi-circle-fill' : 'bi-circle'"></i>
              {{ isOtherUserOnline ? 'Online' : 'Offline' }}
            </small>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-sm btn-light">
            <i class="bi bi-telephone"></i>
          </button>
          <button class="btn btn-sm btn-light">
            <i class="bi bi-info-circle"></i>
          </button>
        </div>
      </div>

      <!-- Messages Container -->
      <div class="messages-container" #messagesContainer>
        <div *ngIf="messages.length === 0" class="no-messages">
          <i class="bi bi-chat-left-dots"></i>
          <p>Start a conversation</p>
        </div>

        <div *ngFor="let message of messages" 
             [class.own-message]="isOwnMessage(message)"
             class="message-wrapper">
          
          <div class="message-group">
            <!-- Other user avatar (only for their messages) -->
            <img *ngIf="!isOwnMessage(message)"
                 [src]="message.senderProfilePhoto || 'assets/default-avatar.png'"
                 alt="{{ message.senderName }}"
                 class="message-avatar">
            
            <!-- Message bubble -->
            <div class="message-bubble" [ngClass]="isOwnMessage(message) ? 'own' : 'other'">
              <div class="message-content">
                <p class="mb-0">{{ message.content }}</p>
                
                <!-- Media if exists -->
                <img *ngIf="message.mediaUrl && isImageType(message.type)"
                     [src]="message.mediaUrl"
                     alt="Media"
                     class="message-media">
              </div>
              
              <small class="message-time">
                {{ message.createdAt | date:'HH:mm' }}
                <i *ngIf="isOwnMessage(message) && message.isRead" 
                   class="bi bi-check2-all text-primary ms-1"></i>
              </small>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div *ngIf="otherUserTyping" class="typing-indicator">
          <small class="text-muted">{{ thread.otherUserName }} is typing...</small>
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="message-input-area">
        <div class="input-wrapper">
          <button class="btn btn-light" (click)="onAttachMedia()">
            <i class="bi bi-paperclip"></i>
          </button>
          
          <input type="text"
                 class="form-control message-input"
                 placeholder="Type a message..."
                 [(ngModel)]="messageContent"
                 (keydown.enter)="sendMessage()"
                 (input)="onTyping()">
          
          <button [disabled]="!messageContent.trim()" 
                  (click)="sendMessage()"
                  class="btn btn-primary send-btn">
            <i class="bi bi-send"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-detail-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }

    .chat-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e9ecef;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid white;
    }

    .header-info h6 {
      font-weight: 600;
      margin: 0;
    }

    .header-info small {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .header-info small i {
      font-size: 8px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #f8f9fa;
    }

    .no-messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      gap: 12px;
    }

    .no-messages i {
      font-size: 48px;
      opacity: 0.3;
    }

    .message-wrapper {
      display: flex;
      margin-bottom: 8px;
    }

    .message-wrapper.own-message {
      justify-content: flex-end;
    }

    .message-group {
      display: flex;
      gap: 8px;
      max-width: 70%;
      align-items: flex-end;
    }

    .message-wrapper.own-message .message-group {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .message-bubble {
      padding: 10px 14px;
      border-radius: 12px;
      word-break: break-word;
      animation: slideIn 0.3s ease-out;
    }

    .message-bubble.other {
      background: white;
      border: 1px solid #e0e0e0;
      color: #333;
    }

    .message-bubble.own {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-content {
      margin-bottom: 4px;
    }

    .message-content p {
      font-size: 14px;
      line-height: 1.4;
    }

    .message-media {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-top: 8px;
      max-height: 300px;
    }

    .message-time {
      font-size: 11px;
      opacity: 0.7;
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: flex-end;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #e9ecef;
      border-radius: 12px;
      width: fit-content;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .typing-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typingAnimation 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typingAnimation {
      0%, 60%, 100% { opacity: 0.3; }
      30% { opacity: 1; }
    }

    .message-input-area {
      padding: 16px;
      border-top: 1px solid #e9ecef;
      background: #fff;
    }

    .input-wrapper {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .message-input {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 14px;
    }

    .message-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .send-btn {
      border-radius: 6px;
      padding: 10px 14px;
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Scrollbar styling */
    .messages-container::-webkit-scrollbar {
      width: 6px;
    }

    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #999;
    }
  `]
})
export class ChatDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
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
}
