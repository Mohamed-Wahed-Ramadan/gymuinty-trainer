import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerService } from '../../../core/services/trainer.service';
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

  constructor(private trainerService: TrainerService) {}

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
      },
      error: (err) => {
        console.error('Error loading trainer profile:', err);
        this.isLoading = false;
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
}
