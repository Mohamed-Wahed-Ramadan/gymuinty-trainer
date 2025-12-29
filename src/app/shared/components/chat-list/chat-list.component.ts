import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { ChatThread } from '../../../core/models/chat.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-list-container">
      <!-- Header -->
      <div class="chat-list-header">
        <h5 class="mb-0">
          <i class="bi bi-chat-dots"></i> Messages
        </h5>
        <button class="btn btn-sm btn-primary rounded-circle" (click)="onNewChat.emit()">
          <i class="bi bi-plus"></i>
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-box mb-3">
        <input 
          type="text" 
          class="form-control form-control-sm"
          placeholder="Search chats..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="filterChats()">
      </div>

      <!-- Chat List -->
      <div class="chat-list-scroll">
        <div *ngIf="filteredChats.length === 0" class="empty-state">
          <i class="bi bi-chat-left"></i>
          <p>No chats yet</p>
        </div>

        <div *ngFor="let thread of filteredChats" 
             (click)="onSelectThread.emit(thread)"
             [class.active]="selectedThreadId === thread.id"
             class="chat-item">
          
          <!-- Avatar & Info -->
          <div class="chat-item-avatar">
            <img [src]="thread.otherUserProfilePhoto || 'assets/default-avatar.png'" 
                 alt="{{ thread.otherUserName }}"
                 class="rounded-circle">
            <span *ngIf="isUserOnline(thread.otherUserId)" class="online-badge"></span>
          </div>

          <div class="chat-item-content">
            <div class="chat-item-header">
              <h6 class="chat-item-name">{{ thread.otherUserName }}</h6>
              <span class="chat-time">{{ thread.lastMessageAt | date:'short' }}</span>
            </div>
            <p class="chat-item-preview mb-0">Last message preview...</p>
          </div>

          <!-- Unread Badge -->
          <div class="chat-item-badge" *ngIf="thread.unreadCount > 0">
            <span class="badge bg-danger rounded-pill">{{ thread.unreadCount }}</span>
          </div>

          <!-- Priority Star (for trainers) -->
          <div *ngIf="thread.isPriority" class="priority-star">
            <i class="bi bi-star-fill text-warning"></i>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-list-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .chat-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e9ecef;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .chat-list-header h5 {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-box {
      padding: 0 12px;
      padding-top: 12px;
    }

    .search-box input {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .search-box input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .chat-list-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      gap: 12px;
    }

    .empty-state i {
      font-size: 48px;
      opacity: 0.3;
    }

    .chat-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 4px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      gap: 12px;
    }

    .chat-item:hover {
      background: #f5f5f5;
    }

    .chat-item.active {
      background: #667eea;
      color: white;
    }

    .chat-item.active .chat-item-preview,
    .chat-item.active .chat-time {
      color: rgba(255, 255, 255, 0.8);
    }

    .chat-item-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .chat-item-avatar img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border: 2px solid #e0e0e0;
    }

    .online-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      background: #00d084;
      border: 2px solid white;
      border-radius: 50%;
    }

    .chat-item-content {
      flex: 1;
      min-width: 0;
    }

    .chat-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .chat-item-name {
      margin: 0;
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-time {
      font-size: 12px;
      color: #999;
      white-space: nowrap;
      margin-left: 8px;
    }

    .chat-item-preview {
      font-size: 13px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-item-badge {
      flex-shrink: 0;
    }

    .priority-star {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  `]
})
export class ChatListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() threads: ChatThread[] = [];
  @Input() selectedThreadId: number | null = null;
  @Output() onSelectThread = new EventEmitter<ChatThread>();
  @Output() onNewChat = new EventEmitter<void>();

  filteredChats: ChatThread[] = [];
  searchQuery = '';
  onlineUsers: Set<string> = new Set();

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService
    , private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Listen for online status updates
    this.signalRService.userOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.isOnline) {
          this.onlineUsers.add(event.userId);
        } else {
          this.onlineUsers.delete(event.userId);
        }
        this.cdr.detectChanges();
      });

    this.filterChats();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['threads']) {
      this.filterChats();
      this.cdr.detectChanges();
    }
  }

  filterChats(): void {
    if (!this.searchQuery.trim()) {
      this.filteredChats = [...this.threads];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredChats = this.threads.filter(thread =>
        thread.otherUserName?.toLowerCase().includes(query)
      );
    }
  }

  isUserOnline(userId: string | undefined): boolean {
    return userId ? this.onlineUsers.has(userId) : false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
