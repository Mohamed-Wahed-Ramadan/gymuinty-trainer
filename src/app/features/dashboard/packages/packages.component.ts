import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Package, PackageService } from '../../../core/services';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit {
  @Input() packages: Package[] = [];
  @Input() isLoading = false;
  @Output() reload = new EventEmitter<void>();

  packageForm!: FormGroup;
  showModal = false;
  isEditMode = false;
  selectedPackage: Package | null = null;
  userId: string | null = null;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private packageService: PackageService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.userId = this.authService.getUserIdFromToken();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.packageForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      priceMonthly: [99, [Validators.required, Validators.min(0)]],
      priceYearly: [999, [Validators.required, Validators.min(0)]],
      isActive: [true],
      thumbnailUrl: [''],
      programIds: [[], Validators.required],
      promoCode: ['']
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedPackage = null;
    this.packageForm.reset({ isActive: true, priceMonthly: 99, priceYearly: 999 });
    this.showModal = true;
  }

  openEditModal(pkg: Package): void {
    this.isEditMode = true;
    this.selectedPackage = pkg;
    this.packageForm.patchValue({
      name: pkg.name,
      description: pkg.description,
      priceMonthly: pkg.priceMonthly,
      priceYearly: pkg.priceYearly,
      isActive: pkg.isActive,
      thumbnailUrl: pkg.thumbnailUrl,
      programIds: pkg.programIds,
      promoCode: pkg.promoCode
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.packageForm.reset();
    this.selectedPackage = null;
  }

  onSubmit(): void {
    if (!this.packageForm.valid) return;

    this.isSaving = true;
    const formValue = this.packageForm.value;

    if (this.isEditMode && this.selectedPackage?.id) {
      this.packageService.updatePackage(this.selectedPackage.id, formValue)
        .subscribe({
          next: () => {
            this.notificationService.success('Success', 'Package updated successfully');
            this.closeModal();
            this.reload.emit();
            this.isSaving = false;
          },
          error: (error) => {
            this.notificationService.error('Error', 'Failed to update package');
            console.error(error);
            this.isSaving = false;
          }
        });
    } else {
      this.packageService.createPackage(this.userId!, formValue)
        .subscribe({
          next: () => {
            this.notificationService.success('Success', 'Package created successfully');
            this.closeModal();
            this.reload.emit();
            this.isSaving = false;
          },
          error: (error) => {
            this.notificationService.error('Error', 'Failed to create package');
            console.error(error);
            this.isSaving = false;
          }
        });
    }
  }

  deletePackage(pkg: Package): void {
    if (!pkg.id) return;

    if (confirm(`Are you sure you want to delete "${pkg.name}"?`)) {
      this.packageService.deletePackage(pkg.id).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Package deleted successfully');
          this.reload.emit();
        },
        error: (error) => {
          this.notificationService.error('Error', 'Failed to delete package');
          console.error(error);
        }
      });
    }
  }

  getProgramCount(programIds: any): number {
    if (Array.isArray(programIds)) {
      return programIds.length;
    }
    return 0;
  }
}
