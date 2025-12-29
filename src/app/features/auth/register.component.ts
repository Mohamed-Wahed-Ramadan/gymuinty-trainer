import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  , private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+{}[\]|;:'"",.<>\/\\]).{8,}$/)
        ]
      ],
      confirmPassword: ['', [Validators.required]],
      profilePhoto: [null, Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
      this.registerForm.patchValue({ profilePhoto: this.selectedFile });
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('userName', this.registerForm.get('userName')?.value);
    formData.append('email', this.registerForm.get('email')?.value);
    formData.append('fullName', this.registerForm.get('fullName')?.value);
    formData.append('password', this.registerForm.get('password')?.value);
    formData.append('confirmPassword', this.registerForm.get('confirmPassword')?.value);
    formData.append('profilePhoto', this.selectedFile as File);
    formData.append('role', '2'); // 2 for Trainer

    // Step 1: Register
    this.authService.register(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Step 2: Show success message
        this.notificationService.success(
          'Registration Success',
          'Welcome to Gymunity! Your account has been created. Setting up your profile...'
        );
        // Step 3: Redirect to create profile
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        // Show specific error messages based on backend response
        const errorMessage = error?.error?.message || error?.message || 'Registration failed. Please try again.';
        this.notificationService.error('Registration Failed', errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  get userName() {
    return this.registerForm.get('userName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get fullName() {
    return this.registerForm.get('fullName');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get profilePhoto() {
    return this.registerForm.get('profilePhoto');
  }
}
