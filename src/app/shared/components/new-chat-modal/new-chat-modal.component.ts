import { Component, EventEmitter, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerService, SubscriberResponse } from '../../../core/services/trainer.service';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-new-chat-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-panel">
        <div class="modal-header">
          <h5>Start New Chat</h5>
          <button class="btn-close" aria-label="Close" (click)="close()">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div class="modal-body">
          <div *ngIf="isLoading" class="py-3 text-center">Loading clients...</div>

          <ul *ngIf="!isLoading && subscribers.length" class="list-group list-group-flush">
            <li *ngFor="let subscriber of subscribers" class="list-group-item d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="avatar-placeholder">
                  <i class="bi bi-person-fill"></i>
                </div>
                <div>
                  <div class="fw-semibold">{{ subscriber.clientName }}</div>
                  <div class="text-muted small">{{ subscriber.clientEmail }}</div>
                  <div class="text-muted smaller">Package: {{ subscriber.packageName }}</div>
                  <div class="badge" [ngClass]="getStatusBadgeClass(subscriber.status)">
                    {{ subscriber.status }}
                  </div>
                </div>
              </div>
              <div>
                <button class="btn btn-sm btn-primary" (click)="selectSubscriber(subscriber)">Contact</button>
              </div>
            </li>
          </ul>

          <div *ngIf="!isLoading && !subscribers.length" class="text-center text-muted py-3">
            {{ errorMessage ? 'Error loading clients' : 'No clients available.' }}
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [
    `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
    }

    .modal-panel {
      width: 720px;
      max-width: 95%;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
    }

    .modal-body {
      padding: 12px 16px;
      max-height: 60vh;
      overflow: auto;
    }

    .avatar-sm {
      width: 40px;
      height: 40px;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 40px;
      height: 40px;
      background: #e0e0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 20px;
      flex-shrink: 0;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 4px;
      display: inline-block;
    }

    .badge-active {
      background: #d4edda;
      color: #155724;
    }

    .badge-unpaid {
      background: #fff3cd;
      color: #856404;
    }

    .badge-canceled {
      background: #f8d7da;
      color: #721c24;
    }

    .badge-expired {
      background: #e2e3e5;
      color: #383d41;
    }

    .smaller {
      font-size: 12px;
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 18px;
      color: #444;
      padding: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    `
  ]
})
export class NewChatModalComponent implements OnInit {
  @Output() onSelectTrainer = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  subscribers: SubscriberResponse[] = [];
  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private trainerService: TrainerService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSubscribers();
  }

  private loadSubscribers(): void {
    // Get trainer profile ID from the service or auth
    const userId = this.authService.getUserIdFromToken?.();
    if (!userId) {
      this.errorMessage = 'Unable to identify user';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Get subscribers directly using the new endpoint
    this.trainerService.getSubscribers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subscribers: SubscriberResponse[]) => {
          console.log('Subscribers:', subscribers);
          this.subscribers = subscribers || [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Failed to load subscribers:', err);
          this.errorMessage = 'Error loading clients';
          this.subscribers = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'active':
        return 'badge-active';
      case 'unpaid':
        return 'badge-unpaid';
      case 'canceled':
        return 'badge-canceled';
      case 'expired':
        return 'badge-expired';
      default:
        return 'badge-expired';
    }
  }

  selectSubscriber(subscriber: SubscriberResponse): void {
    // Convert subscriber to a contact object for the chat
    const contactData = {
      userId: subscriber.clientId,  // clientId is the AppUser GUID
      clientName: subscriber.clientName,
      clientEmail: subscriber.clientEmail,
      packageName: subscriber.packageName,
      subscriptionStatus: subscriber.status
    };
    this.onSelectTrainer.emit(contactData);
  }

  close(): void {
    this.onClose.emit();
  }
}

