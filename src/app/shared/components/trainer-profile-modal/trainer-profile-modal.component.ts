import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerService } from '../../../core/services/trainer.service';
import { ChatService } from '../../../core/services/chat.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-trainer-profile-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trainer-profile-modal.component.html',
  styleUrl: './trainer-profile-modal.component.css',
  animations: [
    trigger('modalSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(30px)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class TrainerProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() trainerId: number | null = null;
  @Output() closeModal = new EventEmitter<void>();

  profile: any = null;
  isLoading = false;

  constructor(
    private trainerService: TrainerService,
    private chatService: ChatService,
    private router: Router
    , private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.isOpen && this.trainerId) {
      this.loadTrainerProfile();
    }
  }

  loadTrainerProfile(): void {
    if (!this.trainerId) return;
    
    this.isLoading = true;
    this.trainerService.getProfileById(this.trainerId).subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading trainer profile:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  close(): void {
    this.closeModal.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  getBrandingColors(): any {
    if (!this.profile?.brandingColors) {
      return { primary: '#667eea', secondary: '#764ba2' };
    }
    
    const colors = this.profile.brandingColors.split(',');
    return {
      primary: colors[0]?.trim() || '#667eea',
      secondary: colors[1]?.trim() || '#764ba2'
    };
  }

  contactTrainer(): void {
    if (!this.profile || !this.profile.userId) return;

    // create or get existing thread and navigate to inbox with threadId
    this.chatService.createThread(this.profile.userId).subscribe({
      next: (res) => {
        const thread = res.data;
        if (thread && thread.id) {
          // navigate to inbox and pass threadId in navigation state
          this.router.navigate(['/inbox'], { state: { threadId: thread.id } });
          this.close();
          this.cdr.detectChanges();
        } else {
          console.warn('ContactTrainer: no thread returned', res);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('ContactTrainer failed', err);
        alert('Failed to open chat. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
}
