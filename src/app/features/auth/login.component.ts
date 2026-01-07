import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslationService } from '../../core/services/translation.service';
import { LoginRequest } from '../../core/models';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  googleClientId = environment.googleClientId;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeGoogleSignIn();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      emailOrUserName: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private initializeGoogleSignIn(): void {
    // Load Google Sign-In script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => {
        this.renderGoogleSignInButton();
      };
    } else {
      this.renderGoogleSignInButton();
    }
  }

  private renderGoogleSignInButton(): void {
    // This will be called when Google Sign-In is ready
    // Initialization happens in the template with ng-gsi-callback
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: LoginRequest = this.loginForm.value;

    this.authService.login(request).subscribe({
      next: (response) => {
        if (response.role !== 'Trainer') {
          const currentLang = this.translationService.getLanguage();
          const errorTitle = currentLang === 'ar' ? 'تم الرفض' : 'Access Denied';
          const errorMessage = currentLang === 'ar'
            ? 'هذه المنصة للمدربين فقط. للمتابعة كعميل، يرجى زيارة بوابة العملاء.'
            : 'This platform is for trainers only. To continue as a client, please visit our client portal.';
          this.notificationService.error(errorTitle, errorMessage);
          this.authService.logout();
          this.isLoading = false;
          return;
        }

        this.notificationService.success('Success', 'Welcome back to Gymunity!');
        this.router.navigate(['/dashboard']);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        const currentLang = this.translationService.getLanguage();
        const errorKey = error?.error?.message || 'auth.login.errors.invalidCredentials';
        const errorMessage = currentLang === 'ar' 
          ? (error?.error?.message || 'البريد الإلكتروني/اسم المستخدم أو كلمة المرور غير صحيحة')
          : (error?.error?.message || 'Invalid email/username or password');
        const errorTitle = currentLang === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed';
        this.notificationService.error(errorTitle, errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Handle Google Sign-In Response
   * Called after user clicks Google Sign-In button
   */
  onGoogleSignInSuccess(response: any): void {
    if (!response.credential) {
      this.notificationService.error('Error', 'Failed to get Google credentials');
      return;
    }

    this.isLoading = true;
    const googleAuthRequest = {
      idToken: response.credential
    };

    // Send ID Token to backend
    this.authService.googleAuth(googleAuthRequest).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.role !== 'Trainer') {
          this.notificationService.error(
            'Access Denied',
            'This platform is for trainers only. Your Google account is registered as a client.'
          );
          this.authService.logout();
          return;
        }

        this.notificationService.success('Success', 'Signed in with Google');
        this.router.navigate(['/dashboard']);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Google Auth error:', error);
        const currentLang = this.translationService.getLanguage();
        const errorMessage = error?.error?.message || (currentLang === 'ar' ? 'فشل تسجيل الدخول عبر جوجل' : 'Google Sign-In failed');
        const errorTitle = currentLang === 'ar' ? 'خطأ في المصادقة' : 'Authentication Error';
        this.notificationService.error(errorTitle, errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  onGoogleSignInError(): void {
    this.notificationService.error('Error', 'Google Sign-In failed');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get emailOrUserName() {
    return this.loginForm.get('emailOrUserName');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
