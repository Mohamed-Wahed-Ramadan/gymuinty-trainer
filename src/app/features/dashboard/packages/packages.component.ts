import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PackageService, PackageResponse, PackageCreateRequest } from '../../../core/services';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProgramService, Program } from '../../../core/services/program.service';
import { TrainerService } from '../../../core/services/trainer.service';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit {
  @Input() packages: PackageResponse[] = [];
  @Input() isLoading = false;
  @Output() reload = new EventEmitter<void>();

  packageForm!: FormGroup;
  showModal = false;
  isEditMode = false;
  selectedPackage: PackageResponse | null = null;
  userId: string | null = null;
  isSaving = false;

  // Programs dropdown
  programs: Program[] = [];
  selectedProgramIds: number[] = [];
  isLoadingPrograms = false;

  constructor(
    private fb: FormBuilder,
    private packageService: PackageService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private programService: ProgramService,
    private trainerService: TrainerService
  ) {
    this.userId = this.authService.getUserIdFromToken();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadPrograms();
  }

  loadPrograms(): void {
    if (!this.userId) return;
    
    this.isLoadingPrograms = true;
    this.programService.getMyPrograms(this.userId).subscribe({
      next: (data) => {
        this.programs = data || [];
        this.isLoadingPrograms = false;
      },
      error: (err) => {
        console.error('Failed to load programs', err);
        this.isLoadingPrograms = false;
      }
    });
  }

  initializeForm(): void {
    this.packageForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      priceMonthly: [99.99, [Validators.required, Validators.min(0.01), Validators.max(100000)]],
      priceYearly: [999.99, [Validators.min(0.01), Validators.max(100000)]],
      isActive: [true],
      isAnnual: [false],
      thumbnailUrl: [''],
      promoCode: ['', [Validators.maxLength(20), Validators.minLength(3)]]
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedPackage = null;
    this.selectedProgramIds = [];
    this.packageForm.reset({ isActive: true, priceMonthly: 99.99, priceYearly: 999.99 });
    this.showModal = true;
  }

  openEditModal(pkg: PackageResponse): void {
    this.isEditMode = true;
    this.selectedPackage = pkg;
    this.selectedProgramIds = pkg.programIds ? [...pkg.programIds] : [];
    this.packageForm.patchValue({
      name: pkg.name,
      description: pkg.description,
      priceMonthly: pkg.priceMonthly,
      priceYearly: pkg.priceYearly,
      isActive: pkg.isActive,
      isAnnual: pkg.isAnnual,
      thumbnailUrl: pkg.thumbnailUrl,
      promoCode: pkg.promoCode
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.packageForm.reset();
    this.selectedPackage = null;
    this.selectedProgramIds = [];
  }

  // Handle program selection
  onProgramChange(event: any, programId: number): void {
    if (event.target.checked) {
      if (!this.selectedProgramIds.includes(programId)) {
        this.selectedProgramIds.push(programId);
      }
    } else {
      this.selectedProgramIds = this.selectedProgramIds.filter(id => id !== programId);
    }
  }

  isProgramSelected(programId: number): boolean {
    return this.selectedProgramIds.includes(programId);
  }

  onSubmit(): void {
    if (!this.packageForm.valid) {
      this.notificationService.error('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    if (this.selectedProgramIds.length === 0) {
      this.notificationService.error('Validation Error', 'Please select at least one program.');
      return;
    }

    this.isSaving = true;
    const formValue = this.packageForm.value;
    const request: Partial<PackageCreateRequest> = {
      name: formValue.name,
      description: formValue.description,
      priceMonthly: formValue.priceMonthly,
      priceYearly: formValue.priceYearly,
      promoCode: formValue.promoCode,
      isActive: formValue.isActive,
      programIds: this.selectedProgramIds
      // NOTE: trainerId is extracted from auth token, not sent in request
    };

    // Debug logging
    console.log('Creating/Updating Package with request:', request);
    console.log('UserId:', this.userId);
    console.log('Programs:', this.selectedProgramIds);

    if (this.isEditMode && this.selectedPackage?.id) {
      this.packageService.updatePackage(this.selectedPackage.id, request)
        .subscribe({
          next: () => {
            this.notificationService.success('Success', 'Package updated successfully');
            this.closeModal();
            this.reload.emit();
            this.isSaving = false;
          },
          error: (error: Error) => {
            this.notificationService.error('Error', error.message || 'Failed to update package');
            console.error('Update error:', error);
            this.isSaving = false;
          }
        });
    } else {
        // Resolve trainer profile id and include it in request
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
              return;
            }

            const reqWithTrainer = {
              ...request,
              trainerProfileId: trainerProfileId
            } as any;
            console.log('Creating package payload with trainerId:', reqWithTrainer);
            try { console.log('Creating package payload (json):', JSON.stringify(reqWithTrainer)); } catch (e) { console.warn('Could not stringify package payload', e); }

            this.packageService.createPackage(reqWithTrainer)
              .subscribe({
                next: () => {
                  this.notificationService.success('Success', 'Package created successfully');
                  this.closeModal();
                  this.reload.emit();
                  this.isSaving = false;
                },
                error: (error: Error) => {
                  this.notificationService.error('Error', error.message || 'Failed to create package');
                  console.error('Create error:', error);
                  this.isSaving = false;
                }
              });
          },
          error: err => {
            this.notificationService.error('Error', 'Failed to resolve trainer profile');
            console.error('Failed to get trainer profile', err);
            this.isSaving = false;
          }
        });
    }
  }

  deletePackage(pkg: PackageResponse): void {
    if (!pkg.id) return;

    if (confirm(`Are you sure you want to delete "${pkg.name}"? This is a soft delete and can be restored.`)) {
      this.packageService.deletePackage(pkg.id).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Package deleted successfully');
          this.reload.emit();
        },
        error: (error: Error) => {
          this.notificationService.error('Error', error.message || 'Failed to delete package');
          console.error(error);
        }
      });
    }
  }

  /**
   * Toggle package active/inactive status
   * PATCH /api/trainer/Packages/toggle-active/{id}
   */
  toggleActiveStatus(pkg: PackageResponse): void {
    if (!pkg.id) return;

    this.packageService.toggleActiveStatus(pkg.id).subscribe({
      next: () => {
        const status = pkg.isActive ? 'deactivated' : 'activated';
        this.notificationService.success('Success', `Package ${status} successfully`);
        this.reload.emit();
      },
      error: (error: Error) => {
        this.notificationService.error('Error', error.message || 'Failed to toggle package status');
        console.error(error);
      }
    });
  }

  getProgramCount(programIds: any): number {
    if (Array.isArray(programIds)) {
      return programIds.length;
    }
    return 0;
  }

  getProgramNameById(id: number): string {
    const program = this.programs.find(p => p.id === id);
    return program?.title || `Program ${id}`;
  }
}
