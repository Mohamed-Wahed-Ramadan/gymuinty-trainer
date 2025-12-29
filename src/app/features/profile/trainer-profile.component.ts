import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrainerService, TrainerProfileResponse } from '../../core/services/trainer.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-trainer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="trainer-profile">
      <ng-container *ngIf="!loading">
        <!-- Show existing profile -->
        <ng-container *ngIf="profile && !isEditing; else createForm">
          <div class="profile-display">
            <h2>Your Trainer Profile</h2>
            <div class="profile-info">
              <p><strong>Handle:</strong> @{{ profile.handle }}</p>
              <p><strong>Bio:</strong> {{ profile.bio }}</p>
              <p><strong>Years of Experience:</strong> {{ profile.yearsExperience }}</p>
              <p *ngIf="profile.ratingAverage"><strong>Rating:</strong> {{ profile.ratingAverage }}/5.0</p>
              <p *ngIf="profile.totalClients"><strong>Total Clients:</strong> {{ profile.totalClients }}</p>
              <img *ngIf="profile.coverImageUrl" [src]="profile.coverImageUrl" alt="Cover" class="cover-img" />
            </div>
            <button class="btn btn-primary mt-3" (click)="editProfile()">Edit Profile</button>
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
  `]
})
export class TrainerProfileComponent implements OnInit {
  profileForm!: FormGroup;
  profile: TrainerProfileResponse | null = null;
  loading = true;
  isSubmitting = false;
  isEditing = false;
  errorMessage = '';
  imagePreview: string | null = null;

  private selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private trainerService: TrainerService,
    private auth: AuthService
  , private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
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

  // Getters for form controls
  get handle() { return this.profileForm.get('handle'); }
  get bio() { return this.profileForm.get('bio'); }
  get yearsExperience() { return this.profileForm.get('yearsExperience'); }
  get videoIntroUrl() { return this.profileForm.get('videoIntroUrl'); }
  get brandingColors() { return this.profileForm.get('brandingColors'); }
}
