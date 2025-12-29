import { Component, EventEmitter, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService } from '../../../core/services/home.service';
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
          <button class="btn-close" aria-label="Close" (click)="close()"></button>
        </div>

        <div class="modal-body">
          <div *ngIf="isLoading" class="py-3 text-center">Loading trainers...</div>

          <ul *ngIf="!isLoading && trainers.length" class="list-group list-group-flush">
            <li *ngFor="let t of trainers" class="list-group-item d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <img *ngIf="t.statusImageUrl" [src]="t.statusImageUrl" class="avatar-sm rounded-circle" alt="photo" />
                <img *ngIf="!t.statusImageUrl && t.coverImageUrl" [src]="t.coverImageUrl" class="avatar-sm rounded-circle" alt="photo" />
                <div class="avatar-placeholder" *ngIf="!t.statusImageUrl && !t.coverImageUrl">
                  <i class="bi bi-person-fill"></i>
                </div>
                <div>
                  <div class="fw-semibold">{{ t.userName || t.displayName || t.handle || 'Trainer' }}</div>
                  <div class="text-muted small">{{ t.handle || t.userId }}</div>
                </div>
              </div>
              <div>
                <button class="btn btn-sm btn-primary" (click)="selectTrainer(t)">Contact</button>
              </div>
            </li>
          </ul>

          <div *ngIf="!isLoading && !trainers.length" class="text-center text-muted py-3">
            {{ errorMessage ? 'Error loading trainers' : 'No trainers available.' }}
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
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 18px;
    }
    `
  ]
})
export class NewChatModalComponent implements OnInit {
  @Output() onSelectTrainer = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  trainers: any[] = [];
  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(private homeService: HomeService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTrainers();
  }

  private normalizeArrayResp(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.result)) return data.result;
    return [];
  }

  private loadTrainers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.homeService.getTrainers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log('Trainers response:', res);
          this.trainers = this.normalizeArrayResp(res);
          console.log('Normalized trainers:', this.trainers);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load trainers:', err);
          this.errorMessage = err?.message || 'Error loading trainers';
          this.trainers = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  selectTrainer(t: any) {
    this.onSelectTrainer.emit(t);
  }

  close() {
    this.onClose.emit();
  }
}

