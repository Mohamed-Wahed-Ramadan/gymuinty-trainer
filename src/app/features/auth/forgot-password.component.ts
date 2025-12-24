import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  step: 'email' | 'reset' = 'email';
  emailForm!: FormGroup;
  resetForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  resetToken: string | null = null;
  resetEmail: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.checkResetLink();
  }

  private initializeForms(): void {
    // Step 1: Email Form
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Step 2: Reset Password Form
    this.resetForm = this.fb.group({
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+{}[\]|;:'"",.<>\/\\]).{8,}$/)
        ]
      ],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private checkResetLink(): void {
    // Check if coming from email reset link
    this.route.queryParams.subscribe(params => {
      if (params['token'] && params['email']) {
        this.resetToken = params['token'];
        this.resetEmail = decodeURIComponent(params['email']);
        this.step = 'reset';
      }
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmNewPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      group.get('confirmNewPassword')?.setErrors({ 'passwordMismatch': true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Step 1: Send Reset Link
  onSendResetLink(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const email = this.emailForm.get('email')?.value;

    this.authService.sendResetPasswordLink({ email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.success(
          'Success',
          'Reset password link has been sent to your email. Check your inbox.'
        );
        // Reset form
        this.emailForm.reset();
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Send reset link error:', error);
        this.notificationService.error(
          'Error',
          error?.message || 'Failed to send reset link. Please try again.'
        );
      }
    });
  }

  // Step 2: Reset Password
  onResetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (!this.resetToken || !this.resetEmail) {
      this.notificationService.error('Error', 'Invalid reset link. Please request a new one.');
      return;
    }

    this.isLoading = true;
    const resetRequest = {
      email: this.resetEmail,
      token: this.resetToken,
      newPassword: this.resetForm.get('newPassword')?.value,
      confirmNewPassword: this.resetForm.get('confirmNewPassword')?.value
    };

    this.authService.resetPassword(resetRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notificationService.success(
          'Success',
          'Password has been reset successfully. Logging you in...'
        );
        // Auto login
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Reset password error:', error);
        this.notificationService.error(
          'Error',
          error?.message || 'Failed to reset password. The link may have expired.'
        );
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goBack(): void {
    if (this.step === 'reset') {
      this.step = 'email';
      this.resetToken = null;
      this.resetEmail = null;
      this.resetForm.reset();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  // Getters
  get emailControl() {
    return this.emailForm.get('email');
  }

  get newPassword() {
    return this.resetForm.get('newPassword');
  }

  get confirmNewPassword() {
    return this.resetForm.get('confirmNewPassword');
  }
}

