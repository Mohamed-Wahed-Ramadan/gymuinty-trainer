import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.css']
})
export class AccountSettingsComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: 'update-profile' | 'change-password' | 'reset-password' | 'delete-profile' = 'update-profile';

  updateProfileForm!: FormGroup;
  changePasswordForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  isLoading = false;
  successMessage = '';
  errorMessage = '';
  selectedFile: File | null = null;

  showDeleteConfirmation = false;

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.initializeForms();
    // Get tab from query params
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && ['update-profile', 'change-password', 'reset-password', 'delete-profile'].includes(tab)) {
        this.activeTab = tab as 'update-profile' | 'change-password' | 'reset-password' | 'delete-profile';
      }
    });
  }

  initializeForms(): void {
    // Update Profile Form
    this.updateProfileForm = this.fb.group({
      fullName: [this.currentUser?.name || '', [Validators.required, Validators.minLength(3)]],
      userName: [this.currentUser?.userName || '', [Validators.required, Validators.minLength(3)]],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      profilePhoto: [null]
    });

    // Change Password Form
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Reset Password Form
    this.resetPasswordForm = this.fb.group({
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      token: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom Validators
  passwordStrengthValidator(control: any): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;

    return passwordValid ? null : { 'weakPassword': true };
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('newPassword');
    const confirmPassword = group.get('confirmNewPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }

    return null;
  }

  switchTab(tab: 'update-profile' | 'change-password' | 'reset-password' | 'delete-profile'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.updateProfileForm.patchValue({
        profilePhoto: file
      });
    }
  }

  // Update Profile
  submitUpdateProfile(): void {
    if (!this.updateProfileForm.valid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      userName: this.updateProfileForm.get('userName')?.value,
      email: this.updateProfileForm.get('email')?.value,
      fullName: this.updateProfileForm.get('fullName')?.value,
      profilePhoto: this.selectedFile || undefined
    };

    this.accountService.updateProfile(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '✅ Profile updated successfully!';
        this.currentUser = {
          id: response.id,
          name: response.name,
          userName: response.userName,
          email: response.email,
          role: response.role,
          profilePhotoUrl: response.profilePhotoUrl
        };
        this.selectedFile = null;
        
        // Update localStorage
        localStorage.setItem('gymunity_trainer_token', response.token);
        localStorage.setItem('gymunity_trainer_user', JSON.stringify(this.currentUser));
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to update profile. Email or username may already be taken.';
      }
    });
  }

  // Change Password
  submitChangePassword(): void {
    if (!this.changePasswordForm.valid) {
      this.errorMessage = 'Please fill in all fields correctly. Passwords must match and meet strength requirements.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      currentPassword: this.changePasswordForm.get('currentPassword')?.value,
      newPassword: this.changePasswordForm.get('newPassword')?.value,
      confirmNewPassword: this.changePasswordForm.get('confirmNewPassword')?.value
    };

    this.accountService.changePassword(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '✅ Password changed successfully!';
        this.changePasswordForm.reset();
        
        // Update token if provided
        if (response.token) {
          localStorage.setItem('gymunity_trainer_token', response.token);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to change password. Please check your current password.';
      }
    });
  }

  // Reset Password
  submitResetPassword(): void {
    if (!this.resetPasswordForm.valid) {
      this.errorMessage = 'Please fill in all fields correctly. Passwords must match and meet strength requirements.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      email: this.resetPasswordForm.get('email')?.value,
      token: this.resetPasswordForm.get('token')?.value,
      newPassword: this.resetPasswordForm.get('newPassword')?.value,
      confirmNewPassword: this.resetPasswordForm.get('confirmNewPassword')?.value
    };

    this.accountService.resetPassword(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '✅ Password reset successfully!';
        this.resetPasswordForm.reset();
        
        // Update token if provided
        if (response.token) {
          localStorage.setItem('gymunity_trainer_token', response.token);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to reset password. Please check the reset token.';
      }
    });
  }

  // Delete Trainer Profile
  submitDeleteProfile(): void {
    if (!this.currentUser?.id) {
      this.errorMessage = 'User ID not found';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userId = parseInt(this.currentUser.id, 10);
    
    this.accountService.deleteTrainerProfile(userId).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '✅ Profile deleted successfully!';
        this.showDeleteConfirmation = false;
        
        // Logout after deletion
        setTimeout(() => {
          this.authService.logout();
          window.location.href = '/login';
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to delete profile. Profile not found.';
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.errorMessage = '';
  }
}
