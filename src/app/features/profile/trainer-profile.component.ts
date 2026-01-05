import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrainerService, TrainerProfileResponse } from '../../core/services/trainer.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-trainer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="trainer-profile">
      <ng-container *ngIf="!loading">
        <!-- Show existing profile -->
        <ng-container *ngIf="profile && !isEditing; else createForm">
          <div class="profile-display">
            <h2>{{ 'profile.yourTrainerProfile' | translate }}</h2>
            <div class="profile-info">
              <p><strong>{{ 'profile.handle' | translate }}:</strong> @{{ profile.handle }}</p>
              <p><strong>{{ 'profile.bio' | translate }}:</strong> {{ profile.bio }}</p>
              <p><strong>{{ 'profile.yearsOfExperience' | translate }}:</strong> {{ profile.yearsExperience }}</p>
              <p *ngIf="profile.ratingAverage"><strong>{{ 'profile.rating' | translate }}:</strong> {{ profile.ratingAverage }}/5.0</p>
              <p *ngIf="profile.totalClients"><strong>{{ 'profile.totalClients' | translate }}:</strong> {{ profile.totalClients }}</p>
              <img *ngIf="profile.coverImageUrl" [src]="profile.coverImageUrl" [alt]="'profile.cover' | translate" class="cover-img" />

              <!-- Status Section -->
              <div class="status-section mt-4 pt-4 border-top">
                <h4 class="mb-3">
                  <i class="bi bi-chat-fill status-icon"></i> {{ 'profile.status' | translate }}
                </h4>
                <div class="status-display">
                  <div *ngIf="profile.statusImageUrl" class="status-image-container">
                    <img [src]="profile.statusImageUrl" [alt]="'profile.status' | translate" class="status-image" />
                  </div>
                  <div *ngIf="!profile.statusImageUrl" class="status-placeholder">
                    <i class="bi bi-image"></i>
                  </div>
                  <div class="status-text">
                    <p *ngIf="profile.statusDescription" class="status-description">
                      {{ profile.statusDescription }}
                    </p>
                    <p *ngIf="!profile.statusDescription" class="text-muted">
                      {{ 'profile.noStatusSetYet' | translate }}
                    </p>
                  </div>
                </div>

                <!-- Status Update / View Buttons -->
                <div class="status-actions mt-3">
                  <button 
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    (click)="openStatusModal()"
                  >
                    <i class="bi bi-pencil"></i> {{ 'profile.updateStatus' | translate }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm ms-2"
                    (click)="openStatusViewer()"
                    [disabled]="!profile?.statusImageUrl && !profile?.statusDescription"
                  >
                    <i class="bi bi-eye"></i> {{ 'profile.showStatus' | translate }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Status Modal -->
            <div *ngIf="showStatusModal" class="modal-backdrop">
              <div class="modal-panel">
                <div class="modal-header">
                  <h5>{{ 'profile.updateYourStatus' | translate }}</h5>
                  <button class="btn-close" (click)="closeStatusModal()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <div class="modal-body">
                  <form [formGroup]="statusForm" (ngSubmit)="updateStatus()">
                    <!-- Status Image -->
                    <div class="form-group">
                      <label for="statusImage" class="form-label">{{ 'profile.statusImageOptional' | translate }}</label>
                      <input 
                        type="file" 
                        id="statusImage"
                        class="form-control"
                        (change)="onStatusImageSelect($event)"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      />
                      <small class="form-text">{{ 'profile.maxImageSize' | translate }}</small>

                      <!-- Preview -->
                      <div *ngIf="statusImagePreview" class="image-preview mt-2">
                        <img [src]="statusImagePreview" alt="Status preview" class="preview-img" />
                      </div>
                    </div>

                    <!-- Status Description -->
                    <div class="form-group mt-3">
                      <label for="statusDescription" class="form-label">Status Description (Optional)</label>
                      <textarea 
                        id="statusDescription"
                        class="form-control"
                        rows="3"
                        formControlName="statusDescription"
                        maxlength="200"
                        placeholder="What are you up to?"
                      ></textarea>
                      <small class="form-text">
                        {{ statusForm.get('statusDescription')?.value?.length || 0 }}/200
                      </small>
                    </div>

                    <!-- Error -->
                    <div *ngIf="statusErrorMessage" class="alert alert-danger alert-sm mt-3">
                      {{ statusErrorMessage }}
                    </div>

                    <!-- Actions -->
                    <div class="modal-actions mt-4">
                      <button 
                        type="submit"
                        class="btn btn-primary"
                        [disabled]="isUpdatingStatus"
                      >
                        <span *ngIf="!isUpdatingStatus">
                          <i class="bi bi-check-circle"></i> Update Status
                        </span>
                        <span *ngIf="isUpdatingStatus">
                          <span class="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </span>
                      </button>
                      <button 
                        type="button"
                        class="btn btn-secondary ms-2"
                        (click)="closeStatusModal()"
                        [disabled]="isUpdatingStatus"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Status Viewer Modal (large preview) -->
            <div *ngIf="showBigStatus" class="modal-backdrop">
              <div class="modal-panel">
                <div class="modal-header">
                  <h5>Status</h5>
                  <button class="btn-close" (click)="closeStatusViewer()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <div class="modal-body text-center">
                  <div *ngIf="profile?.statusImageUrl" class="mb-3">
                    <img [src]="profile?.statusImageUrl" alt="Status" style="max-width:100%; height:auto; border-radius:8px;" />
                  </div>
                  <div *ngIf="profile?.statusDescription" class="status-description">
                    {{ profile.statusDescription }}
                  </div>
                </div>

                <div class="modal-actions mt-3">
                  <button type="button" class="btn btn-secondary" (click)="closeStatusViewer()">Close</button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons mt-4">
              <button class="btn btn-primary" (click)="editProfile()">
                <i class="bi bi-pencil"></i> Edit Profile
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Form to create/edit profile -->
        <ng-template #createForm>
          <div class="create-form">
            <h2>{{ isEditing ? 'Edit Your Trainer Profile' : 'Create Your Trainer Profile' }}</h2>
            
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" novalidate>
              <!-- Handle -->
              <div class="form-group">
                <label for="handle" class="form-label">Handle <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  id="handle"
                  class="form-control" 
                  formControlName="handle"
                  placeholder="@johnfitness"
                  [class.is-invalid]="handle?.invalid && handle?.touched"
                />
                <div class="invalid-feedback" *ngIf="handle?.errors?.['required']">
                  Handle is required
                </div>
                <div class="invalid-feedback" *ngIf="handle?.errors?.['minlength']">
                  Handle must be at least 3 characters
                </div>
                <div class="invalid-feedback" *ngIf="handle?.errors?.['maxlength']">
                  Handle must not exceed 50 characters
                </div>
              </div>

              <!-- Bio -->
              <div class="form-group">
                <label for="bio" class="form-label">Bio</label>
                <textarea 
                  id="bio"
                  class="form-control" 
                  rows="4"
                  formControlName="bio"
                  placeholder="Tell us about yourself..."
                  maxlength="500"
                  [class.is-invalid]="bio?.invalid && bio?.touched"
                ></textarea>
                <small class="form-text">{{ bio?.value?.length || 0 }}/500</small>
                <div class="invalid-feedback" *ngIf="bio?.errors?.['maxlength']">
                  Bio must not exceed 500 characters
                </div>
              </div>

              <!-- Years of Experience -->
              <div class="form-group">
                <label for="yearsExperience" class="form-label">Years of Experience <span class="text-danger">*</span></label>
                <input 
                  type="number" 
                  id="yearsExperience"
                  class="form-control" 
                  formControlName="yearsExperience"
                  min="0"
                  max="50"
                  [class.is-invalid]="yearsExperience?.invalid && yearsExperience?.touched"
                />
                <div class="invalid-feedback" *ngIf="yearsExperience?.errors?.['required']">
                  Years of experience is required
                </div>
              </div>

              <!-- Cover Image -->
              <div class="form-group">
                <label for="coverImage" class="form-label">Cover Image</label>
                <input 
                  type="file" 
                  id="coverImage"
                  class="form-control" 
                  (change)="onFileSelect($event)"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                />
                <small class="form-text">Max file size: 5MB. Accepted formats: JPG, PNG, GIF, WebP</small>
                
                <!-- Image Preview -->
                <div *ngIf="imagePreview" class="image-preview mt-3">
                  <img [src]="imagePreview" alt="Cover preview" />
                </div>
              </div>

              <!-- Video Intro URL -->
              <div class="form-group">
                <label for="videoIntroUrl" class="form-label">Video Intro URL</label>
                <input 
                  type="url" 
                  id="videoIntroUrl"
                  class="form-control" 
                  formControlName="videoIntroUrl"
                  placeholder="https://youtube.com/watch?v=..."
                  [class.is-invalid]="videoIntroUrl?.invalid && videoIntroUrl?.touched"
                />
              </div>

              <!-- Branding Colors -->
              <div class="form-group">
                <label for="brandingColors" class="form-label">Branding Colors</label>
                <input 
                  type="text" 
                  id="brandingColors"
                  class="form-control" 
                  formControlName="brandingColors"
                  placeholder="#4A90E2,#8B5FBF"
                />
                <small class="form-text">Comma-separated hex colors</small>
              </div>

              <!-- Error Message -->
              <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
                {{ errorMessage }}
                <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
              </div>

              <!-- Submit Button -->
              <div class="form-group mt-4">
                <button 
                  type="submit" 
                  [disabled]="profileForm.invalid || isSubmitting"
                  class="btn btn-primary"
                >
                  <span *ngIf="!isSubmitting">{{ isEditing ? 'Update Profile' : 'Create Profile' }}</span>
                  <span *ngIf="isSubmitting">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {{ isEditing ? 'Updating...' : 'Creating...' }}
                  </span>
                </button>
                <button 
                  *ngIf="isEditing"
                  type="button" 
                  [disabled]="isSubmitting"
                  class="btn btn-secondary ms-2"
                  (click)="cancelEdit()"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </ng-template>
      </ng-container>

      <!-- Loading -->
      <div *ngIf="loading" class="alert alert-info">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Loading profile...
      </div>
    </div>
  `,
  styles: [`
    .trainer-profile {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      font-weight: 600;
      margin-bottom: 8px;
      display: block;
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #4A90E2;
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .invalid-feedback {
      display: block;
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
    }

    .image-preview {
      max-width: 100%;
      border-radius: 6px;
      overflow: hidden;
    }

    .image-preview img {
      max-width: 100%;
      height: auto;
    }

    .cover-img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin-top: 10px;
    }

    .profile-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
    }

    .text-danger {
      color: #dc3545;
    }

    .status-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }

    .status-icon {
      color: #667eea;
      font-size: 18px;
      margin-right: 8px;
    }

    .status-display {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .status-image-container {
      flex-shrink: 0;
    }

    .status-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
    }

    .status-placeholder {
      width: 80px;
      height: 80px;
      background: #ddd;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 32px;
      flex-shrink: 0;
    }

    .status-text {
      flex: 1;
      min-width: 0;
    }

    .status-description {
      margin: 0;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .status-actions {
      display: flex;
      gap: 8px;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }

    .modal-panel {
      width: 500px;
      max-width: 95%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h5 {
      margin: 0;
      font-weight: 600;
    }

    .modal-body {
      padding: 20px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 20px;
      color: #666;
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:hover {
      color: #333;
    }

    .alert-sm {
      padding: 8px 12px;
      font-size: 13px;
    }

    .preview-img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      max-height: 200px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }
  `]
})
export class TrainerProfileComponent implements OnInit {
  profileForm!: FormGroup;
  statusForm!: FormGroup;
  profile: TrainerProfileResponse | null = null;
  loading = true;
  isSubmitting = false;
  isEditing = false;
  isUpdatingStatus = false;
  errorMessage = '';
  statusErrorMessage = '';
  imagePreview: string | null = null;
  statusImagePreview: string | null = null;
  showStatusModal = false;
  showBigStatus = false;

  private selectedFile: File | null = null;
  private selectedStatusFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private trainerService: TrainerService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeStatusForm();
    this.loadProfile();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      handle: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      bio: ['', [Validators.maxLength(500)]],
      yearsExperience: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
      videoIntroUrl: ['', []],
      brandingColors: ['', []]
    });
  }

  private initializeStatusForm(): void {
    this.statusForm = this.fb.group({
      statusDescription: ['', [Validators.maxLength(200)]]
    });
  }

  private loadProfile(): void {
    const userId = this.auth.getUserIdFromToken?.();
    if (!userId) {
      this.loading = false;
      this.errorMessage = 'Unable to identify user. Please login again.';
      return;
    }

    this.trainerService.getProfileByUserId(userId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // 404 means profile doesn't exist, so show form
        this.profile = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.errorMessage = '';

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.errorMessage = `File size exceeds 5MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage = `Invalid file type. Accepted formats: JPG, PNG, GIF, WebP. Got: ${file.type}`;
      return;
    }

    this.selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const userId = this.auth.getUserIdFromToken?.();
    if (!userId) {
      this.errorMessage = 'Unable to identify user. Please login again.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('handle', String(this.profileForm.value.handle || ''));
    formData.append('bio', String(this.profileForm.value.bio || ''));
    formData.append('yearsExperience', String(this.profileForm.value.yearsExperience || 0));

    if (this.selectedFile) {
      formData.append('coverImage', this.selectedFile);
    }

    if (this.profileForm.value.videoIntroUrl) {
      formData.append('videoIntroUrl', this.profileForm.value.videoIntroUrl);
    }

    if (this.profileForm.value.brandingColors) {
      formData.append('brandingColors', this.profileForm.value.brandingColors);
    }

    // Determine whether to create or update
    const request$ = this.isEditing && this.profile
      ? this.trainerService.updateProfile(this.profile.id, formData)
      : this.trainerService.createProfile(formData);

    request$.subscribe({
      next: (profile) => {
        this.isSubmitting = false;
        this.profile = profile;
        this.isEditing = false;
        this.imagePreview = null;
        this.selectedFile = null;
        console.log('Profile saved successfully:', profile);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Failed to save profile. Please try again.';
        console.error('Error saving profile:', error);
        this.cdr.detectChanges();
      }
    });
  }

  editProfile(): void {
    this.isEditing = true;
    // Populate form with existing data
    if (this.profile) {
      this.profileForm.patchValue({
        handle: this.profile.handle,
        bio: this.profile.bio,
        yearsExperience: this.profile.yearsExperience,
        videoIntroUrl: this.profile.videoIntroUrl,
        brandingColors: this.profile.brandingColors
      });
    }
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.errorMessage = '';
    this.imagePreview = null;
    this.selectedFile = null;
    this.initializeForm();
  }

  // Status Update Methods
  openStatusModal(): void {
    this.showStatusModal = true;
    this.statusErrorMessage = '';
    this.statusImagePreview = null;
    this.selectedStatusFile = null;
    this.statusForm.reset();
    if (this.profile?.statusDescription) {
      this.statusForm.patchValue({
        statusDescription: this.profile.statusDescription
      });
    }
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.statusErrorMessage = '';
    this.statusImagePreview = null;
    this.selectedStatusFile = null;
    this.statusForm.reset();
  }

  openStatusViewer(): void {
    this.showBigStatus = true;
  }

  closeStatusViewer(): void {
    this.showBigStatus = false;
  }

  onStatusImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.statusErrorMessage = '';

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.statusErrorMessage = `File size exceeds 5MB limit.`;
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.statusErrorMessage = `Invalid file type. Accepted: JPG, PNG, GIF, WebP`;
      return;
    }

    this.selectedStatusFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.statusImagePreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  updateStatus(): void {
    if (!this.profile) return;

    this.isUpdatingStatus = true;
    this.statusErrorMessage = '';

    const formData = new FormData();
    
    if (this.selectedStatusFile) {
      formData.append('StatusImage', this.selectedStatusFile);
    }

    const description = this.statusForm.get('statusDescription')?.value || '';
    if (description) {
      formData.append('StatusDescription', description);
    }

    this.trainerService.updateStatus(this.profile.id, formData).subscribe({
      next: (updatedProfile) => {
        this.isUpdatingStatus = false;
        this.profile = updatedProfile;
        this.closeStatusModal();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isUpdatingStatus = false;
        this.statusErrorMessage = error.message || 'Failed to update status. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  clearStatus(): void {
    if (!this.profile) return;

    if (!confirm('Are you sure you want to clear your status?')) {
      return;
    }

    this.isUpdatingStatus = true;

    // Send empty status to clear
    const formData = new FormData();
    formData.append('StatusDescription', '');

    this.trainerService.updateStatus(this.profile.id, formData).subscribe({
      next: (updatedProfile) => {
        this.isUpdatingStatus = false;
        this.profile = updatedProfile;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isUpdatingStatus = false;
        console.error('Error clearing status:', error);
        this.cdr.detectChanges();
      }
    });
  }

  // Getters for form controls
  get handle() { return this.profileForm.get('handle'); }
  get bio() { return this.profileForm.get('bio'); }
  get yearsExperience() { return this.profileForm.get('yearsExperience'); }
  get videoIntroUrl() { return this.profileForm.get('videoIntroUrl'); }
  get brandingColors() { return this.profileForm.get('brandingColors'); }
}
