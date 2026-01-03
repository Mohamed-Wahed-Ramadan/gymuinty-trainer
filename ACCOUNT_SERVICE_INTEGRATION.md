# Account Service Integration Guide

## 📌 Overview

دليل سريع لاستخدام `AccountService` في مكونات Angular الأخرى.

---

## 🔧 Injection

```typescript
import { AccountService } from '@core/services';

constructor(private accountService: AccountService) { }
```

---

## 📝 Update Profile

### TypeScript

```typescript
import { UpdateProfileRequest } from '@core/services/account.service';

submitUpdateProfile(): void {
  const request: UpdateProfileRequest = {
    userName: this.form.get('userName')?.value,
    email: this.form.get('email')?.value,
    fullName: this.form.get('fullName')?.value,
    profilePhoto: this.selectedFile  // optional
  };

  this.accountService.updateProfile(request).subscribe({
    next: (response) => {
      console.log('Profile updated:', response);
      // Update user in auth service
      this.authService.handleAuthResponse(response);
    },
    error: (error) => {
      console.error('Error:', error.error?.message);
    }
  });
}
```

### HTML

```html
<form [formGroup]="updateProfileForm" (ngSubmit)="submitUpdateProfile()">
  <input formControlName="fullName" placeholder="Full Name" />
  <input formControlName="userName" placeholder="Username" />
  <input formControlName="email" type="email" placeholder="Email" />
  <input type="file" (change)="onFileSelected($event)" />
  <button type="submit">Update</button>
</form>
```

---

## 🔐 Change Password

### TypeScript

```typescript
import { ChangePasswordRequest } from '@core/services/account.service';

submitChangePassword(): void {
  const request: ChangePasswordRequest = {
    currentPassword: this.form.get('currentPassword')?.value,
    newPassword: this.form.get('newPassword')?.value,
    confirmNewPassword: this.form.get('confirmNewPassword')?.value
  };

  this.accountService.changePassword(request).subscribe({
    next: (response) => {
      console.log('Password changed');
      // Update token if provided
      localStorage.setItem('gymunity_trainer_token', response.token);
    },
    error: (error) => {
      console.error('Error:', error.error?.message);
    }
  });
}
```

### Form Validation

```typescript
this.form = this.fb.group({
  currentPassword: ['', Validators.required],
  newPassword: ['', [
    Validators.required,
    Validators.minLength(8),
    this.passwordStrengthValidator
  ]],
  confirmNewPassword: ['', Validators.required]
}, {
  validators: this.passwordMatchValidator
});

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
```

---

## 🔄 Reset Password

### TypeScript

```typescript
import { ResetPasswordRequest } from '@core/services/account.service';

submitResetPassword(): void {
  const request: ResetPasswordRequest = {
    email: this.form.get('email')?.value,
    token: this.form.get('token')?.value,
    newPassword: this.form.get('newPassword')?.value,
    confirmNewPassword: this.form.get('confirmNewPassword')?.value
  };

  this.accountService.resetPassword(request).subscribe({
    next: (response) => {
      console.log('Password reset successfully');
      // Auto-login with new token
      this.authService.handleAuthResponse(response);
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      console.error('Error:', error.error?.message);
    }
  });
}
```

### Note

- لا يحتاج Token في Headers (Public endpoint)
- الرمز يأتي من بريد إعادة تعيين كلمة المرور

---

## 🗑️ Delete Trainer Profile

### TypeScript

```typescript
deleteTrainerProfile(): void {
  // Get current user ID
  const userId = this.authService.getUserIdFromToken();

  if (!userId) {
    console.error('User ID not found');
    return;
  }

  // Convert to number if needed
  const id = parseInt(userId, 10);

  this.accountService.deleteTrainerProfile(id).subscribe({
    next: () => {
      console.log('Profile deleted');
      // Logout and redirect
      this.authService.logout();
      this.router.navigate(['/home']);
    },
    error: (error) => {
      console.error('Error:', error.error?.message);
    }
  });
}
```

### Confirmation Dialog

```html
<div *ngIf="showDeleteConfirmation" class="confirmation">
  <p>This action cannot be undone!</p>
  <button (click)="deleteTrainerProfile()">Delete</button>
  <button (click)="cancel()">Cancel</button>
</div>
```

---

## 🔔 Error Handling

### Common Errors

```typescript
this.accountService.updateProfile(request).subscribe({
  next: (response) => {
    /* success */
  },
  error: (error) => {
    // HTTP Error
    if (error.status === 400) {
      // Bad request - validation error
      const message = error.error?.message;
      const errors = error.error?.errors;
      console.error('Validation error:', errors);
    } else if (error.status === 401) {
      // Unauthorized - token expired
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    } else if (error.status === 404) {
      // Not found
      console.error('Resource not found');
    } else {
      // Server error
      console.error('Server error:', error.statusText);
    }
  },
});
```

### Error Types

| Status | Type         | Action                     |
| ------ | ------------ | -------------------------- |
| 400    | Bad Request  | Show validation errors     |
| 401    | Unauthorized | Refresh token or re-login  |
| 403    | Forbidden    | Check permissions          |
| 404    | Not Found    | Resource doesn't exist     |
| 500    | Server Error | Show generic error message |

---

## 💾 Local Storage Updates

### After Successful Update

```typescript
updateProfile(response: AuthResponse): void {
  // Update token
  localStorage.setItem('gymunity_trainer_token', response.token);

  // Update user data
  const user = {
    id: response.id,
    name: response.name,
    userName: response.userName,
    email: response.email,
    role: response.role,
    profilePhotoUrl: response.profilePhotoUrl
  };
  localStorage.setItem('gymunity_trainer_user', JSON.stringify(user));

  // Update auth service subject
  this.authService.currentUserSubject.next(user);
}
```

---

## 🔐 Token Management

### Getting Current Token

```typescript
const token = this.authService.getToken();
// or
const token = localStorage.getItem('gymunity_trainer_token');
```

### Updating Token

```typescript
localStorage.setItem('gymunity_trainer_token', response.token);
```

### Checking Token Validity

```typescript
const hasToken = this.authService.hasToken();
const isAuthenticated = this.authService.isAuthenticated$.value;
```

---

## 🎯 Integration Example

### Complete Component

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService, UpdateProfileRequest } from '@core/services';
import { AuthService } from '@core/services';

@Component({
  selector: 'app-profile-settings',
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="fullName" />
      <input formControlName="email" />
      <button type="submit" [disabled]="!form.valid || isLoading">
        {{ isLoading ? 'Loading...' : 'Save' }}
      </button>
    </form>
    <div *ngIf="successMessage" class="success">
      {{ successMessage }}
    </div>
    <div *ngIf="errorMessage" class="error">
      {{ errorMessage }}
    </div>
  `,
})
export class ProfileSettingsComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const user = this.authService.getCurrentUser();
    this.form = this.fb.group({
      fullName: [user?.name || '', [Validators.required, Validators.minLength(3)]],
      userName: [user?.userName || '', [Validators.required, Validators.minLength(3)]],
      email: [user?.email || '', [Validators.required, Validators.email]],
    });
  }

  submit(): void {
    if (!this.form.valid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: UpdateProfileRequest = {
      fullName: this.form.get('fullName')?.value,
      userName: this.form.get('userName')?.value,
      email: this.form.get('email')?.value,
    };

    this.accountService.updateProfile(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully!';
        this.updateLocalStorage(response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Update failed';
      },
    });
  }

  private updateLocalStorage(response: any): void {
    localStorage.setItem('gymunity_trainer_token', response.token);
    const user = {
      id: response.id,
      name: response.name,
      userName: response.userName,
      email: response.email,
      role: response.role,
      profilePhotoUrl: response.profilePhotoUrl,
    };
    localStorage.setItem('gymunity_trainer_user', JSON.stringify(user));
  }
}
```

---

## 📚 Service Methods Reference

```typescript
// Update Profile
updateProfile(request: UpdateProfileRequest): Observable<AuthResponse>

// Change Password
changePassword(request: ChangePasswordRequest): Observable<AuthResponse>

// Reset Password
resetPassword(request: ResetPasswordRequest): Observable<AuthResponse>

// Delete Trainer Profile
deleteTrainerProfile(id: number): Observable<any>
```

---

## 🚀 Best Practices

1. ✅ Always validate form before submit
2. ✅ Show loading state during request
3. ✅ Handle errors gracefully
4. ✅ Update local storage with new token
5. ✅ Show success/error messages
6. ✅ Disable buttons while loading
7. ✅ Clear sensitive data on logout
8. ✅ Use strong passwords

---

## 🔗 Related Services

- `AuthService` - User authentication
- `NotificationService` - User notifications
- `TranslationService` - Multi-language support

---

**Version**: 1.0.0  
**Last Updated**: January 3, 2026
