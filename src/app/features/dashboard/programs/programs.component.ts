import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Program, ProgramService } from '../../../core/services';
import { TrainerService } from '../../../core/services/trainer.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProgramDetailModalComponent } from '../../../shared/components/program-detail-modal/program-detail-modal.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgramDetailModalComponent],
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.css']
})
export class ProgramsComponent implements OnInit {
  @Input() programs: Program[] = [];
  @Input() isLoading = false;
  @Output() reload = new EventEmitter<void>();

  programForm!: FormGroup;
  showModal = false;
  isEditMode = false;
  selectedProgram: Program | null = null;
  userId: string | null = null;
  isSaving = false;
  showProgramModal = false;
  modalProgramId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private programService: ProgramService,
    private authService: AuthService,
    private trainerService: TrainerService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.userId = this.authService.getUserIdFromToken();
  }

  // inject TrainerService for resolving trainerProfileId
  

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.programForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: [1, Validators.required],
      durationWeeks: [12, [Validators.required, Validators.min(1), Validators.max(52)]],
      price: [0, [Validators.required, Validators.min(0)]],
      isPublic: [false],
      maxClients: [50, [Validators.required, Validators.min(1)]],
      thumbnailUrl: ['']
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedProgram = null;
    this.programForm.reset({ type: 1, durationWeeks: 12, isPublic: false, maxClients: 50, price: 0 });
    this.showModal = true;
  }

  openEditModal(program: Program): void {
    this.isEditMode = true;
    this.selectedProgram = program;
    this.programForm.patchValue({
      title: program.title,
      description: program.description,
      type: program.type,
      durationWeeks: program.durationWeeks,
      price: program.price,
      isPublic: program.isPublic,
      maxClients: program.maxClients,
      thumbnailUrl: program.thumbnailUrl
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.programForm.reset();
    this.selectedProgram = null;
  }

  onSubmit(): void {
    if (!this.programForm.valid) return;

    this.isSaving = true;
    const formValue = this.programForm.value;

    if (this.isEditMode && this.selectedProgram?.id) {
      this.programService.updateProgram(this.selectedProgram.id, formValue)
        .subscribe({
          next: () => {
            this.notificationService.success('Success', 'Program updated successfully');
            this.closeModal();
            this.reload.emit();
            this.isSaving = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.notificationService.error('Error', 'Failed to update program');
            console.error(error);
            this.isSaving = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      // Need trainerProfileId (backend expects trainerProfileId). Fetch profile by userId then create.
      if (!this.userId) {
        this.notificationService.error('Error', 'Unable to identify trainer. Please login again.');
        this.isSaving = false;
        return;
      }

      this.trainerService.getProfileByUserId(this.userId).subscribe({
        next: profile => {
          const trainerProfileId = profile?.id;
          if (!trainerProfileId) {
            this.notificationService.error('Error', 'Trainer profile not found. Create a trainer profile first.');
            this.isSaving = false;
            this.cdr.detectChanges();
            return;
          }

          const payloadForServer = { ...formValue, trainerProfileId };
          console.log('Creating program payload:', payloadForServer);
          try { console.log('Creating program payload (json):', JSON.stringify(payloadForServer)); } catch (e) { console.warn('Could not stringify payload', e); }

          this.programService.createProgram(trainerProfileId, formValue).subscribe({
            next: () => {
              this.notificationService.success('Success', 'Program created successfully');
              this.closeModal();
              this.reload.emit();
              this.isSaving = false;
              this.cdr.detectChanges();
            },
            error: (error) => {
              this.notificationService.error('Error', 'Failed to create program');
              console.error('Create program error:', error);
              try { console.error('Server response body (json):', JSON.stringify(error?.error)); } catch (e) { console.error('Server response body (raw):', error?.error); }
              console.error('HTTP status:', error?.status, 'statusText:', error?.statusText);
              this.isSaving = false;
              this.cdr.detectChanges();
            }
          });
        },
        error: err => {
          this.notificationService.error('Error', 'Failed to resolve trainer profile');
          console.error('Failed to get trainer profile', err);
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteProgram(program: Program): void {
    if (!program.id) return;

    if (confirm(`Are you sure you want to delete "${program.title}"?`)) {
      this.programService.deleteProgram(program.id).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Program deleted successfully');
          this.reload.emit();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.notificationService.error('Error', 'Failed to delete program');
          console.error(error);
          this.cdr.detectChanges();
        }
      });
    }
  }

  selectProgram(program: Program): void {
    console.log('Program clicked for details:', program);
    if (!program.id) {
      console.warn('Program has no id — setting selection directly for debugging', program);
      this.programService.setSelectedProgram(program);
      return;
    }

    this.programService.getProgramDetails(program.id).subscribe({
      next: p => { this.programService.setSelectedProgram(p); this.cdr.detectChanges(); },
      error: err => { console.error('Failed to load program details', err); this.notificationService.error('Error','Failed to load program details'); this.cdr.detectChanges(); }
    });
  }

  openProgramModal(program: Program): void {
    if (!program?.id) return;
    this.modalProgramId = program.id;
    this.showProgramModal = true;
  }

  closeProgramModal(): void {
    this.showProgramModal = false;
    this.modalProgramId = null;
  }
}
