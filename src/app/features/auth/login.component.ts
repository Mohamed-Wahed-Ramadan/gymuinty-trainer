import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
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
    handleCredentialResponse: (response: any) => void;
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
    private translationService: TranslationService,
    private ngZone: NgZone
  ) {
    // Set up global callback for Google Sign-In
    console.log('[GoogleAuth] Setting up global handleCredentialResponse callback');
    window.handleCredentialResponse = (response: any) => {
      console.log('[GoogleAuth] Global callback triggered');
      this.ngZone.run(() => {
        this.onGoogleSignInSuccess(response);
      });
    };
  }

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
    console.log('[GoogleAuth] Initializing Google Sign-In');
    // Load Google Sign-In script
    if (!window.google) {
      console.log('[GoogleAuth] Google script not loaded, loading now');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => {
        console.log('[GoogleAuth] Google script loaded successfully');
        this.renderGoogleSignInButton();
      };
      script.onerror = () => {
        console.error('[GoogleAuth] Failed to load Google script');
      };
    } else {
      console.log('[GoogleAuth] Google script already loaded');
      this.renderGoogleSignInButton();
    }
  }

  private renderGoogleSignInButton(): void {
    console.log('[GoogleAuth] Rendering Google Sign-In button');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (response: any) => {
          console.log('[GoogleAuth] Direct callback from google.accounts.id.initialize');
          this.onGoogleSignInSuccess(response);
        }
      });

      // Render the button
      const buttonDiv = document.querySelector('.g_id_signin');
      if (buttonDiv) {
        console.log('[GoogleAuth] Rendering button in .g_id_signin element');
        window.google.accounts.id.renderButton(
          buttonDiv,
          { theme: 'outline', size: 'large', width: '100%' }
        );
      } else {
        console.warn('[GoogleAuth] .g_id_signin element not found');
      }
    } else {
      console.warn('[GoogleAuth] window.google.accounts.id not available');
    }
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
        // Check user role and navigate accordingly
        if (response.role === 'Client') {
          console.log(response);
          
          // Navigate Client users to the client application
          const clientUrl = environment.clientUrl;
          if (clientUrl) {
            this.notificationService.success('Success', 'Welcome back to Gymunity!');
            console.log("role client");
            
            window.location.href = clientUrl; // Redirect to client application
          } else {
            this.notificationService.error(
              'Configuration Error',
              'Client application URL is not configured.'
            );
            console.log("client url null");
            
            this.authService.logout();
          }
          this.isLoading = false;
          return;
        }

        if (response.role === 'Trainer') {
          this.notificationService.success('Success', 'Welcome back to Gymunity!');
          this.router.navigate(['/dashboard']);
          this.cdr.detectChanges();
          this.isLoading = false;
          return;
        }

        // Handle unexpected roles
        const currentLang = this.translationService.getLanguage();
        const errorTitle = currentLang === 'ar' ? 'تم الرفض' : 'Access Denied';
        const errorMessage = currentLang === 'ar'
          ? 'دور حسابك غير معروف. يرجى التواصل مع الدعم.'
          : 'Your account role is not recognized. Please contact support.';
        this.notificationService.error(errorTitle, errorMessage);
        this.authService.logout();
        this.isLoading = false;
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
    console.log('[GoogleAuth] onGoogleSignInSuccess called', { hasCredential: !!response.credential });
    
    if (!response.credential) {
      console.error('[GoogleAuth] No credentials in response');
      this.notificationService.error('Error', 'Failed to get Google credentials');
      return;
    }

    this.isLoading = true;
    console.log('[GoogleAuth] Starting auth process with ID token');
    
    const googleAuthRequest = {
      idToken: response.credential
    };

    // Send ID Token to backend
    this.authService.googleAuth(googleAuthRequest).subscribe({
      next: (authResponse) => {
        this.isLoading = false;
        console.log('[GoogleAuth] Auth response received:', {
          id: authResponse.id,
          name: authResponse.name,
          email: authResponse.email,
          role: authResponse.role,
          hasToken: !!authResponse.token
        });

        // Check user role and navigate accordingly
        if (authResponse.role === 'Client') {
          console.log('[GoogleAuth] User role is Client - preparing redirect');
          // Navigate Client users to the client application
          const clientUrl = environment.clientUrl;
          console.log('[GoogleAuth] Client URL from environment:', clientUrl);
          
          if (clientUrl) {
            console.log('[GoogleAuth] Client URL is configured - showing success notification');
            this.notificationService.success('Success', 'Signed in with Google');
            console.log('[GoogleAuth] Redirecting to client URL:', clientUrl);
            setTimeout(() => {
              console.log('[GoogleAuth] Executing window.location.href redirect');
              window.location.href = clientUrl; // Redirect to client application
            }, 500); // Small delay to ensure notification is shown
          } else {
            console.error('[GoogleAuth] Client URL is not configured');
            this.notificationService.error(
              'Configuration Error',
              'Client application URL is not configured.'
            );
            this.authService.logout();
          }
          return;
        }

        if (authResponse.role === 'Trainer') {
          console.log('[GoogleAuth] User role is Trainer - navigating to dashboard');
          this.notificationService.success('Success', 'Signed in with Google');
          console.log('[GoogleAuth] Executing router.navigate to /dashboard');
          this.router.navigate(['/dashboard']);
          this.cdr.detectChanges();
          return;
        }

        // Handle unexpected roles
        console.error('[GoogleAuth] Unexpected role received:', authResponse.role);
        this.notificationService.error(
          'Access Denied',
          'Your account role is not recognized. Please contact support.'
        );
        this.authService.logout();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('[GoogleAuth] Auth service error:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message,
          fullError: error
        });
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
