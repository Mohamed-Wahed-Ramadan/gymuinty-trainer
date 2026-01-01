import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';
import { SignalRService } from '../../core/services/signalr.service';
import { AuthService } from '../../core/services/auth.service';
import { TrainerService, SubscriberResponse } from '../../core/services/trainer.service';
import { Router } from '@angular/router';
import { ChatThread, ChatMessage, SendMessageRequest, MessageType } from '../../core/models/chat.models';
import { ChatListComponent } from '../../shared/components/chat-list/chat-list.component';
import { ChatDetailComponent } from '../../shared/components/chat-detail/chat-detail.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NewChatModalComponent } from '../../shared/components/new-chat-modal/new-chat-modal.component';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, ChatListComponent, ChatDetailComponent, NewChatModalComponent],
  template: `
    <div class="inbox-container">
      <!-- Header -->
      <div class="inbox-header">
        <div class="container-fluid">
          <div class="header-top">
            <div>
              <h2 class="mb-0">
                <i class="bi bi-chat-dots"></i> Messages
              </h2>
              <small class="text-muted">Your conversations and chats</small>
            </div>
            <button class="btn btn-sm btn-outline-primary" (click)="openSubscribersModal()" title="View Subscribers">
              <i class="bi bi-people"></i> My Subscribers
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="inbox-content">
        <div class="container-fluid h-100">
          <div class="row h-100 g-3">
            <!-- Chat List Column -->
            <div class="col-lg-4 col-xl-3">
              <app-chat-list 
                [threads]="threads"
                [selectedThreadId]="selectedThreadId"
                (onSelectThread)="selectThread($event)"
                (onNewChat)="openNewChatModal()">
              </app-chat-list>
            </div>

            <!-- Chat Detail Column -->
            <div class="col-lg-8 col-xl-9">
              <div *ngIf="!selectedThreadId" class="empty-state">
                <div class="empty-state-content">
                  <i class="bi bi-chat-left-dots"></i>
                  <h3>No Chat Selected</h3>
                  <p>Select a conversation from the list to start messaging</p>
                  <button class="btn btn-bton" (click)="openNewChatModal()">
                    <i class="bi bi-plus-circle"></i> Start New Chat
                  </button>
                </div>
              </div>

              <app-chat-detail 
                *ngIf="selectedThreadId"
                [thread]="selectedThread"
                [messages]="messages"
                [currentUserId]="currentUserId"
                (onSendMessage)="sendMessage($event)"
                (onThreadClose)="closeThread()">
              </app-chat-detail>
            </div>
          </div>
        </div>
      </div>

      <!-- New Chat Modal -->
      <app-new-chat-modal *ngIf="showNewChatModal" (onClose)="onNewChatModalClose()" (onSelectTrainer)="onTrainerSelected($event)"></app-new-chat-modal>

      <!-- Subscribers Modal -->
      <div *ngIf="showSubscribersModal" class="subscribers-modal-overlay" (click)="closeSubscribersModal()">
        <div class="subscribers-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h5 class="modal-title">My Subscribers</h5>
            <button type="button" class="btn-close" (click)="closeSubscribersModal()"></button>
          </div>
          <div class="modal-body">
            <div *ngIf="subscribersLoading" class="text-center py-5">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div *ngIf="!subscribersLoading && subscribers.length === 0" class="alert alert-info">
              No active subscribers yet.
            </div>
            <div *ngIf="!subscribersLoading && subscribers.length > 0" class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Package</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sub of subscribers">
                    <td><strong>{{ sub.clientName }}</strong></td>
                    <td>{{ sub.clientEmail }}</td>
                    <td>{{ sub.packageName }}</td>
                    <td>{{ formatDate(sub.subscriptionStartDate) }}</td>
                    <td>{{ formatDate(sub.subscriptionEndDate) }}</td>
                    <td>
                      <span [ngClass]="'badge badge-' + getStatusClass(sub.status)">
                        {{ sub.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      
    </div>
  `,
  styles: [`
    .inbox-container {
      height: calc(100vh - 60px);
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    .inbox-header {
      padding: 24px 0;
      background: white;
      border-bottom: 1px solid #e9ecef;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .inbox-header h2 {
      font-weight: 700;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }

    .header-top button {
      margin-top: 6px;
    }

    .inbox-header i {
      color: #667eea;
    }

    .inbox-content {
      flex: 1;
      overflow: hidden;
      padding: 16px 0;
    }

    .inbox-content .row {
      margin: 0;
      height: 100%;
      min-height: 0;
    }

    .inbox-content .col-lg-4,
    .inbox-content .col-lg-8 {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .empty-state-content {
      text-align: center;
      color: #999;
    }

    .empty-state-content i {
      font-size: 64px;
      opacity: 0.2;
      display: block;
      margin-bottom: 16px;
    }

    .empty-state-content h3 {
      color: #333;
      margin-bottom: 8px;
    }

    .empty-state-content p {
      color: #999;
      margin-bottom: 20px;
    }

    .btn-bton{
    /* color: rgb(217, 233, 255); */
    background-color: rgb(182, 208, 246);
}

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: none; /* allow interacting with underlying UI while spinner shows */
    }

    .spinner-border {
      color: #667eea;
      width: 48px;
      height: 48px;
      pointer-events: auto; /* spinner stays visible but does not block clicks to underlying UI */
      background: rgba(255,255,255,0.95);
      padding: 8px;
      border-radius: 50%;
    }

    /* Subscribers Modal Styles */
    .subscribers-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
    }

    .subscribers-modal {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 900px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .subscribers-modal .modal-header {
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
    }

    .subscribers-modal .modal-header .modal-title {
      margin: 0;
      font-weight: 600;
      color: #333;
    }

    .subscribers-modal .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .subscribers-modal table {
      font-size: 14px;
    }

    .subscribers-modal table thead {
      background: #f8f9fa;
      position: sticky;
      top: 0;
    }

    .subscribers-modal table th {
      padding: 12px;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #e9ecef;
    }

    .subscribers-modal table td {
      padding: 12px;
      vertical-align: middle;
    }

    .subscribers-modal table tbody tr:hover {
      background: #f5f5f5;
    }

    .badge-success {
      background-color: #28a745 !important;
    }

    .badge-warning {
      background-color: #ffc107 !important;
      color: #333 !important;
    }

    .badge-danger {
      background-color: #dc3545 !important;
    }

    .badge-secondary {
      background-color: #6c757d !important;
    }

    /* Responsive Design */
    @media (max-width: 991px) {
      .inbox-content .col-lg-4,
      .inbox-content .col-lg-8 {
        min-height: auto;
      }

      .empty-state-content i {
        font-size: 48px;
      }
    }

    @media (max-width: 768px) {
      .inbox-container {
        height: 100%;
      }

      .inbox-header {
        padding: 16px 0;
      }

      .inbox-header h2 {
        font-size: 20px;
      }

      .inbox-content {
        padding: 8px 0;
      }

      .empty-state-content i {
        font-size: 40px;
      }

      .empty-state-content h3 {
        font-size: 18px;
      }
    }
  `]
})
export class InboxComponent implements OnInit, OnDestroy {
  // Data
  threads: ChatThread[] = [];
  messages: ChatMessage[] = [];
  selectedThreadId: number | null = null;
  selectedThread: ChatThread | null = null;

  // Subscribers data
  subscribers: SubscriberResponse[] = [];
  subscribersLoading = false;
  showSubscribersModal = false;

  // User info
  currentUserId: string | null = null;

  // State
  isLoading = false;
  private loadingTimer: any = null;

  private destroy$ = new Subject<void>();
  private pendingThreadId: number | null = null;

  // modal state
  showNewChatModal = false;

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private authService: AuthService,
    private trainerService: TrainerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private setLoading(flag: boolean) {
    this.isLoading = !!flag;
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
    if (flag) {
      console.log('Inbox: setLoading -> true');
      // safety timeout: hide spinner after 8s to avoid blocking UI if request hangs
      this.loadingTimer = setTimeout(() => {
        if (this.isLoading) {
          console.warn('Loading timeout reached, hiding spinner to keep UI usable.');
          this.isLoading = false;
        }
      }, 8000);
    }
    if (!flag) console.log('Inbox: setLoading -> false');
  }

  ngOnInit(): void {
    this.getCurrentUser();
    // capture any navigation state threadId (from contact actions)
    try {
      const st = (history && (history.state as any)) || {};
      this.pendingThreadId = st.threadId ?? null;
    } catch (e) {
      this.pendingThreadId = null;
    }

    this.loadChats();
    this.setupSignalRConnection();
    this.listenToSignalREvents();
  }

  /**
   * Get current logged-in user
   */
  private getCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user && (user as any)?.userId) {
          this.currentUserId = (user as any).userId;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Load all chats for current user
   */
  private loadChats(): void {
    this.setLoading(true);
    this.chatService.getAllChats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.threads = response.data;
            // Update unread count
            const totalUnread = this.threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
            this.chatService.updateUnreadCount(totalUnread);
            // If navigation passed a threadId, attempt to open it now
            if (this.pendingThreadId) {
              const found = this.threads.find(t => t.id === this.pendingThreadId);
              if (found) {
                // small delay to ensure UI has rendered list
                setTimeout(() => this.selectThread(found), 50);
              } else {
                // create a lightweight placeholder thread and open it so messages can be loaded
                const tempThread: ChatThread = {
                  id: this.pendingThreadId,
                  clientId: '',
                  trainerId: '',
                  createdAt: new Date().toISOString(),
                  lastMessageAt: new Date().toISOString(),
                  unreadCount: 0,
                  otherUserId: undefined,
                  otherUserName: 'Conversation',
                  otherUserProfilePhoto: undefined
                } as ChatThread;
                this.threads.unshift(tempThread);
                setTimeout(() => this.selectThread(tempThread), 50);
              }
              this.pendingThreadId = null;
            }
            this.cdr.detectChanges();
          }
          this.setLoading(false);
        },
        error: (error) => {
          console.error('Failed to load chats:', error);
          this.setLoading(false);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Setup SignalR connection
   */
  private setupSignalRConnection(): void {
    const token = this.authService.getToken();
    if (token) {
      this.signalRService.connect(token)
        .then(() => {
          console.log('SignalR connected successfully');
        })
        .catch(error => {
          console.error('SignalR connection failed:', error);
        });
    }
  }

  /**
   * Listen to all SignalR events
   */
  private listenToSignalREvents(): void {
    // New message received
    this.signalRService.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message) {
          this.onMessageReceived(message);
          this.cdr.detectChanges();
        }
      });

    // Typing indicator
    this.signalRService.userTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        // Handled by chat-detail component
        this.cdr.detectChanges();
      });

    // Message read indicator
    this.signalRService.messageRead$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.threadId === this.selectedThreadId) {
          const message = this.messages.find(m => m.id === event.messageId);
          if (message) {
            message.isRead = true;
            this.cdr.detectChanges();
          }
        }
      });

    // Thread read indicator
    this.signalRService.threadRead$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        const thread = this.threads.find(t => t.id === event.threadId);
        if (thread) {
          this.cdr.detectChanges();
          thread.unreadCount = 0;
        }
      });
  }

  /**
   * Select thread to view
   */
  selectThread(thread: ChatThread): void {
    this.selectedThreadId = thread.id;
    this.selectedThread = thread;
    this.messages = [];

    // Load messages for this thread
    this.setLoading(true);
    this.chatService.getThreadMessages(thread.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.messages = response.data;
          }
          this.setLoading(false);
          this.cdr.detectChanges();

          // Mark thread as read
          this.markThreadAsRead(thread.id);

          // Join thread in SignalR
          const joinPromise = this.signalRService.joinThread(thread.id);
          if (joinPromise) {
            joinPromise.catch(error => console.error('Failed to join thread:', error));
          }
        },
        error: (error) => {
          console.error('Failed to load messages:', error);
          this.setLoading(false);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Send message
   */
  sendMessage(request: SendMessageRequest): void {
    if (!this.selectedThreadId) return;

    this.chatService.sendMessage(this.selectedThreadId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.messages.push(response.data);
            // Force change detection by creating a new array reference
            this.messages = [...this.messages];
            this.cdr.detectChanges();
            // Scroll to bottom is handled by chat-detail component
          }
        },
        error: (error) => {
          console.error('Failed to send message:', error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Mark thread as read
   */
  private markThreadAsRead(threadId: number): void {
    this.chatService.markThreadAsRead(threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const thread = this.threads.find(t => t.id === threadId);
          if (thread) {
            thread.unreadCount = 0;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Failed to mark thread as read:', error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Handle received message
   * Prevent full reload to avoid infinite refresh loop. Update threads locally when possible.
   */
  private onMessageReceived(message: ChatMessage): void {
    if (this.selectedThreadId === message.threadId) {
      // Message for the open thread: append and mark read
      this.messages.push(message);
      // Force change detection by creating a new array reference
      this.messages = [...this.messages];
      this.cdr.detectChanges();
      this.markThreadAsRead(message.threadId);
      return;
    }

    // Update the thread list locally to reflect new message without reloading everything
    const idx = this.threads.findIndex(t => t.id === message.threadId);
    if (idx !== -1) {
      const thread = this.threads[idx];
      thread.lastMessageAt = message.createdAt;
      thread.unreadCount = (thread.unreadCount || 0) + 1;
      // move thread to top
      this.threads.splice(idx, 1);
      this.threads.unshift(thread);
      // Force change detection by creating a new array reference
      this.threads = [...this.threads];
      this.cdr.detectChanges();
    } else {
      // Only reload when we truly don't have the thread locally
      this.loadChats();
    }
  }

  /**
   * Close current thread
   */
  closeThread(): void {
    if (this.selectedThreadId) {
      const leavePromise = this.signalRService.leaveThread(this.selectedThreadId);
      if (leavePromise) {
        leavePromise.catch(() => {});
      }
    }
    this.selectedThreadId = null;
    this.selectedThread = null;
    this.messages = [];
  }

  /**
   * Open new chat modal (to be implemented)
   */
  openNewChatModal(): void {
    this.showNewChatModal = true;
  }

  onNewChatModalClose(): void {
    this.showNewChatModal = false;
  }

  onTrainerSelected(trainer: any): void {
    if (!trainer) return;
    this.showNewChatModal = false;

    const otherUserId = trainer.userId ?? (trainer.id ? String(trainer.id) : null);
    if (!otherUserId) {
      console.warn('Selected trainer has no userId');
      return;
    }

    this.setLoading(true);
    this.chatService.createThread(otherUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.setLoading(false);
          const thread = response.data;
          if (!thread) {
            alert(response.message || 'Could not create or find thread');
            this.cdr.detectChanges();
            return;
          }
          if (!this.threads.find(t => t.id === thread.id)) this.threads.unshift(thread);
          this.selectThread(thread);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.setLoading(false);
          console.error('Create thread failed', err);
          alert('Failed to create thread. See console for details.');
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.selectedThreadId) {
      const leavePromise = this.signalRService.leaveThread(this.selectedThreadId);
      if (leavePromise) {
        leavePromise.catch(() => {});
      }
    }
    this.signalRService.disconnect().catch(() => {});
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Open subscribers modal and load subscribers
   */
  openSubscribersModal(): void {
    this.showSubscribersModal = true;
    this.loadSubscribers();
  }

  /**
   * Close subscribers modal
   */
  closeSubscribersModal(): void {
    this.showSubscribersModal = false;
  }

  /**
   * Load subscribers from backend
   */
  private loadSubscribers(): void {
    this.subscribersLoading = true;
    this.trainerService.getSubscribers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subscribers) => {
          this.subscribers = subscribers;
          this.subscribersLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load subscribers:', error);
          this.subscribersLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Format date string to local timezone
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Get badge class based on subscription status
   */
  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'active':
        return 'success';
      case 'unpaid':
        return 'warning';
      case 'canceled':
      case 'cancelled':
        return 'danger';
      case 'expired':
        return 'secondary';
      default:
        return 'secondary';
    }
  }
}


