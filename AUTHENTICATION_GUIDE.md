# Gymunity Trainer - Authentication Flow Guide

## 📋 مقدمة عن Authentication System

هذا المستند يوضح كيفية عمل نظام المصادقة (Authentication) في تطبيق Gymunity Trainer، يشمل:
1. ✅ التسجيل العادي (Registration) 
2. ✅ التسجيل بحساب Google (Google OAuth)
3. ✅ نسيان كلمة المرور (Forgot Password / Reset Password)

---

## 1️⃣ التسجيل العادي (Registration)

### 📍 Flow الكامل:
```
Frontend (register.component.ts)
    ↓
AuthService.register(FormData)
    ↓
Backend: AccountController.Register()
    ↓
Database: Create AppUser + Role
    ↓
Response: AuthResponse (token + user data)
    ↓
Frontend: handleAuthResponse() → localStorage + Navigate to /profile
```

### 🔹 Frontend Implementation:

#### 1. Form Validation (register.component.ts)
```typescript
// Password Pattern: Min 8 chars + Uppercase + Lowercase + Number + Special Char
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+{}[\]|;:'"",.<>\/\\]).{8,}$/;

this.registerForm = this.fb.group({
  userName: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
  fullName: ['', [Validators.required, Validators.minLength(3)]],
  password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(passwordPattern)]],
  confirmPassword: ['', [Validators.required]],
  profilePhoto: [null, Validators.required]
}, { validators: this.passwordMatchValidator });
```

#### 2. API Call (register.component.ts)
```typescript
onSubmit(): void {
  const formData = new FormData();
  formData.append('userName', this.registerForm.get('userName')?.value);
  formData.append('email', this.registerForm.get('email')?.value);
  formData.append('fullName', this.registerForm.get('fullName')?.value);
  formData.append('password', this.registerForm.get('password')?.value);
  formData.append('confirmPassword', this.registerForm.get('confirmPassword')?.value);
  formData.append('profilePhoto', this.selectedFile as File);
  formData.append('role', '2'); // 2 for Trainer

  this.authService.register(formData).subscribe({
    next: (response) => {
      // Auto-login user
      // Navigate to /profile to create trainer profile
    },
    error: (error) => {
      // Show specific error message
    }
  });
}
```

#### 3. AuthService Method
```typescript
register(request: FormData): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.API_URL}/Account/register`, request)
    .pipe(
      tap(response => this.handleAuthResponse(response))
    );
}
```

### ✅ Backend Expectations:

**Endpoint:** `POST /api/Account/register`

**Request:** FormData with:
- userName (string, 3+ chars)
- email (string, valid email)
- fullName (string, 3+ chars)
- password (string, 8+ chars with uppercase, lowercase, number, special char)
- confirmPassword (string, must match password)
- profilePhoto (IFormFile, required)
- role (byte, 1 or 2) - 1=Client, 2=Trainer

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "userName": "johndoe",
  "email": "john@example.com",
  "role": "Trainer",
  "profilePhotoUrl": "/uploads/photos/...",
  "token": "eyJhbGciOi..."
}
```

---

## 2️⃣ التسجيل بحساب Google (Google OAuth)

### 📍 Flow الكامل:
```
Frontend: User clicks Google Sign-In
    ↓
Google SDK: Opens consent screen
    ↓
Frontend: Receives ID Token (JWT)
    ↓
AuthService.googleAuth({ idToken })
    ↓
Backend: AccountController.GoogleAuth()
    ↓
GoogleAuthService.ValidateGoogleToken()
    ↓
AccountService.GoogleAuthAsync()
    ↓
Database: Create/Login AppUser
    ↓
Response: AuthResponse (token + user data)
    ↓
Frontend: handleAuthResponse() → localStorage + Navigate to /dashboard
```

### 🔹 Frontend Implementation:

#### 1. Google Sign-In Script (login.component.ts)
```typescript
ngOnInit(): void {
  this.initializeForm();
  this.initializeGoogleSignIn();
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
  }
}
```

#### 2. Handle Google Response (login.component.ts)
```typescript
onGoogleSignInSuccess(response: any): void {
  if (!response.credential) {
    this.notificationService.error('Error', 'Failed to get Google credentials');
    return;
  }

  this.isLoading = true;
  const googleAuthRequest = {
    idToken: response.credential // ID Token from Google
  };

  this.authService.googleAuth(googleAuthRequest).subscribe({
    next: (response) => {
      if (response.role !== 'Trainer') {
        this.notificationService.error('Access Denied', 'Your Google account is registered as a client');
        this.authService.logout();
        return;
      }
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      this.notificationService.error('Authentication Error', error?.message);
    }
  });
}
```

#### 3. AuthService Method
```typescript
googleAuth(request: GoogleAuthRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.API_URL}/Account/google-auth`, request)
    .pipe(
      tap(response => this.handleAuthResponse(response))
    );
}
```

#### 4. Template (login.component.html)
```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>
```

### ✅ Backend Expectations:

**Endpoint:** `POST /api/Account/google-auth`

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6I..."
}
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "userName": "john.doe@gmail.com",
  "email": "john.doe@gmail.com",
  "role": "Client", // or "Trainer"
  "profilePhotoUrl": "https://lh3.googleusercontent.com/...",
  "token": "eyJhbGciOi..."
}
```

**Backend Logic:**
1. ✅ Validate Google ID Token
2. ✅ Check if email verified
3. ✅ Search for user in database
4. ✅ If exists: Login + Link Google account
5. ✅ If not exists: Create new user (default role: Client) + Link Google account
6. ✅ Generate JWT token
7. ✅ Return user data + token

---

## 3️⃣ نسيان كلمة المرور (Forgot Password)

### 📍 Two-Step Flow:

#### Step 1: Request Reset Link
```
Frontend: User enters email
    ↓
AuthService.sendResetPasswordLink({ email })
    ↓
Backend: AccountController.SendResetPasswordLink()
    ↓
AccountService.SendResetPasswordLinkAsync()
    ↓
Generate Reset Token + Build Reset Link
    ↓
Send Email with Reset Link
    ↓
Response: Success message
```

#### Step 2: Reset Password
```
Frontend: User clicks link in email + Enters new password
    ↓
AuthService.resetPassword({ email, token, newPassword, confirmNewPassword })
    ↓
Backend: AccountController.ResetPassword()
    ↓
AccountService.ResetPasswordAsync()
    ↓
Validate Token + Reset Password
    ↓
Generate New JWT Token
    ↓
Response: AuthResponse (token + user data)
    ↓
Frontend: handleAuthResponse() → Auto-login + Navigate to /dashboard
```

### 🔹 Frontend Implementation:

#### 1. Component State (forgot-password.component.ts)
```typescript
export class ForgotPasswordComponent implements OnInit {
  step: 'email' | 'reset' = 'email'; // Two-step form
  emailForm!: FormGroup;
  resetForm!: FormGroup;
  resetToken: string | null = null;
  resetEmail: string | null = null;
  
  ngOnInit(): void {
    this.initializeForms();
    this.checkResetLink(); // Check for reset link from email
  }

  private checkResetLink(): void {
    // Parse query params: ?token=xxx&email=yyy
    this.route.queryParams.subscribe(params => {
      if (params['token'] && params['email']) {
        this.resetToken = params['token'];
        this.resetEmail = decodeURIComponent(params['email']);
        this.step = 'reset'; // Skip to step 2
      }
    });
  }
}
```

#### 2. Step 1: Send Reset Link
```typescript
onSendResetLink(): void {
  if (this.emailForm.invalid) {
    this.emailForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  const email = this.emailForm.get('email')?.value;

  this.authService.sendResetPasswordLink({ email }).subscribe({
    next: () => {
      this.notificationService.success(
        'Success',
        'Reset password link has been sent to your email'
      );
      // Auto-redirect to login
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    },
    error: (error) => {
      this.notificationService.error('Error', error?.message);
    }
  });
}
```

#### 3. Step 2: Reset Password
```typescript
onResetPassword(): void {
  if (this.resetForm.invalid) {
    this.resetForm.markAllAsTouched();
    return;
  }

  if (!this.resetToken || !this.resetEmail) {
    this.notificationService.error('Error', 'Invalid reset link');
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
      this.notificationService.success('Success', 'Password has been reset');
      // Auto-login user
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    },
    error: (error) => {
      this.notificationService.error('Error', 'Failed to reset password');
    }
  });
}
```

#### 4. AuthService Methods
```typescript
sendResetPasswordLink(request: { email: string }): Observable<any> {
  return this.http.post<any>(
    `${this.API_URL}/Account/send-reset-password-link`, 
    request
  );
}

resetPassword(request: any): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.API_URL}/Account/reset-password`, 
    request
  ).pipe(
    tap(response => this.handleAuthResponse(response))
  );
}
```

### ✅ Backend Expectations:

#### Step 1: Send Reset Link

**Endpoint:** `POST /api/Account/send-reset-password-link`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Reset Password Email was sent to your email."
}
```

**Backend Logic:**
1. ✅ Find user by email
2. ✅ Generate reset token (secure, time-limited)
3. ✅ Build reset link: `frontend-url/reset-password?email=xxx&token=yyy`
4. ✅ Send email with link
5. ✅ Return success message

#### Step 2: Reset Password

**Endpoint:** `POST /api/Account/reset-password`

**Request:**
```json
{
  "email": "john@example.com",
  "token": "token-from-email-link",
  "newPassword": "NewP@ssw0rd123",
  "confirmNewPassword": "NewP@ssw0rd123"
}
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "userName": "johndoe",
  "email": "john@example.com",
  "role": "Trainer",
  "profilePhotoUrl": "/uploads/photos/...",
  "token": "eyJhbGciOi..."
}
```

**Backend Logic:**
1. ✅ Find user by email
2. ✅ Validate reset token (check validity + expiration)
3. ✅ Reset password using UserManager.ResetPasswordAsync()
4. ✅ Generate new JWT token
5. ✅ Send confirmation email
6. ✅ Return user data + token

---

## 🔐 AuthService Common Methods

### handleAuthResponse()
يتم استدعاؤها تلقائياً بعد أي عملية auth ناجحة:
```typescript
private handleAuthResponse(response: AuthResponse): void {
  // 1. حفظ token في localStorage
  localStorage.setItem(this.TOKEN_KEY, response.token);
  
  // 2. استخراج و حفظ userId
  const userId = response.id || this.extractUserIdFromToken(response.token);
  localStorage.setItem(this.USER_ID_KEY, userId);
  
  // 3. حفظ بيانات المستخدم
  const user: User = {
    id: userId,
    name: response.name,
    userName: response.userName,
    email: response.email,
    role: response.role,
    profilePhotoUrl: response.profilePhotoUrl
  };
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  
  // 4. تحديث observables
  this.currentUserSubject.next(user);
  this.isAuthenticatedSubject.next(true);
}
```

### logout()
```typescript
logout(): void {
  // حذف كل بيانات المستخدم
  localStorage.removeItem(this.TOKEN_KEY);
  localStorage.removeItem(this.USER_KEY);
  localStorage.removeItem(this.USER_ID_KEY);
  
  // تحديث state
  this.currentUserSubject.next(null);
  this.isAuthenticatedSubject.next(false);
}
```

### getUserIdFromToken()
```typescript
getUserIdFromToken(): string | null {
  // 1. حاول من localStorage أولاً (الأسرع)
  const storedUserId = localStorage.getItem(this.USER_ID_KEY);
  if (storedUserId) return storedUserId;

  // 2. fallback: استخرج من JWT token
  const token = this.getToken();
  if (!token) return null;
  
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.userId || decoded.sub || null;
  } catch (e) {
    return null;
  }
}
```

---

## 📊 localStorage Keys Used

| Key | Purpose | Example Value |
|-----|---------|----------------|
| `gymunity_trainer_token` | JWT Token | `eyJhbGciOi...` |
| `gymunity_trainer_user` | User JSON | `{"id":"123","name":"John"...}` |
| `gymunity_trainer_userId` | User ID | `"user-123-uuid"` |

---

## 🎯 Validation Rules Summary

### Password Requirements
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (@$!%*?&#^()...)

### Username/Handle
- ✅ Minimum 3 characters
- ✅ Maximum 50 characters
- ✅ Must be unique in database

### Email
- ✅ Valid email format
- ✅ Must be unique in database

### Profile Photo
- ✅ Required during registration
- ✅ Formats: JPG, PNG, GIF, WebP
- ✅ Max size: 5MB

---

## 🔗 Related Routes

| Route | Component | Guards | Purpose |
|-------|-----------|--------|---------|
| `/auth/login` | LoginComponent | None | Login page |
| `/auth/register` | RegisterComponent | None | Registration page |
| `/auth/forgot-password` | ForgotPasswordComponent | None | Forgot password page |
| `/dashboard` | DashboardComponent | authGuard, roleGuard | Protected dashboard |
| `/profile` | ProfileComponent | authGuard | Profile management |

---

## ⚙️ Environment Configuration

**Required in backend:**
- JWT Secret Key
- JWT Valid Issuer
- JWT Valid Audience
- JWT Duration (days)
- Google Client ID
- Email service configuration (SMTP)
- Frontend URL (for reset links)

**Required in frontend:**
- Google Client ID
- Backend API URL
- Frontend URL (for reset links)

---

## 🧪 Testing Scenarios

### Test Registration Flow
1. Navigate to `/auth/register`
2. Fill form with valid data
3. Upload profile photo
4. Click "Create Account"
5. Should redirect to `/profile`

### Test Login Flow
1. Navigate to `/auth/login`
2. Enter email/username and password
3. Click "Sign In"
4. Should redirect to `/dashboard`

### Test Google Sign-In
1. Click "Sign in with Google" button
2. Complete Google consent flow
3. Should auto-login if trainer account
4. Should show error if client account

### Test Forgot Password
1. Navigate to `/auth/forgot-password`
2. Enter email address
3. Click "Send Reset Link"
4. Check email for reset link
5. Click link in email (should redirect to step 2)
6. Enter new password
7. Should auto-login and redirect to `/dashboard`

---

## 📝 Notes

- ✅ All tokens stored in localStorage
- ✅ All HTTP errors handled with NotificationService
- ✅ All forms have proper validation
- ✅ All API calls use HttpClient with interceptors
- ✅ Auth state managed with BehaviorSubjects
- ✅ Guards protect routes based on auth status and role

