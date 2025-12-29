import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgramService } from '../../../core/services/program.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-program-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './program-detail-modal.component.html',
  styleUrl: './program-detail-modal.component.css',
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
export class ProgramDetailModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() programId: number | null = null;
  @Output() closeModal = new EventEmitter<void>();

  program: any = null;
  isLoading = false;
  expandedWeek: number | null = null;
  expandedDay: number | null = null;

  programTypeMap: { [key: number]: string } = {
    1: 'Workout',
    2: 'Nutrition',
    3: 'Hybrid',
    4: 'Challenge'
  };

  constructor(private programService: ProgramService) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.isOpen && this.programId) {
      this.loadProgramDetails();
    }
  }

  loadProgramDetails(): void {
    if (!this.programId) return;
    
    this.isLoading = true;
    this.programService.getProgramDetails(this.programId).subscribe({
      next: (data) => {
        this.program = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading program details:', err);
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

  toggleWeek(weekId: number): void {
    this.expandedWeek = this.expandedWeek === weekId ? null : weekId;
  }

  toggleDay(dayId: number): void {
    this.expandedDay = this.expandedDay === dayId ? null : dayId;
  }

  isWeekExpanded(weekId: number): boolean {
    return this.expandedWeek === weekId;
  }

  isDayExpanded(dayId: number): boolean {
    return this.expandedDay === dayId;
  }

  getProgramTypeLabel(type: number): string {
    return this.programTypeMap[type] || 'Program';
  }

  getProgramTypeIcon(type: number): string {
    const icons: { [key: number]: string } = {
      1: 'bi-dumbbell',
      2: 'bi-apple',
      3: 'bi-shuffle',
      4: 'bi-lightning'
    };
    return icons[type] || 'bi-diagram-3';
  }
}
