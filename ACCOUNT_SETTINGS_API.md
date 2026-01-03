# Account Settings API Documentation

## 📋 Overview

وثائق شاملة لـ Account Settings API endpoints مع أمثلة واستخدام حقيقي.

---

## 🔐 Authentication

جميع الطلبات (ما عدا Reset Password) تحتاج على Authorization Header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Update Profile

### Endpoint

```
PUT /api/account/update-profile
```

### Authentication

✅ **Required** - JWT Token

### Request Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

### Request Body

```json
{
  "userName": "new_username",
  "email": "new@email.com",
  "fullName": "John Doe",
  "profilePhoto": <File>  // Optional
}
```

### Field Validation

| Field          | Type   | Rules                 | Example               |
| -------------- | ------ | --------------------- | --------------------- |
| `userName`     | string | Required, Min 3 chars | `trainer_john`        |
| `email`        | string | Required, Valid email | `trainer@example.com` |
| `fullName`     | string | Required, Min 3 chars | `John Doe`            |
| `profilePhoto` | file   | Optional, Max 5MB     | JPG, PNG, GIF         |

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "userName": "new_username",
  "email": "new@email.com",
  "role": "Trainer",
  "profilePhotoUrl": "https://api.example.com/uploads/photo.jpg",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Email already taken",
  "errors": {
    "email": ["Email is already in use by another account"]
  }
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid or expired token"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

### TypeScript Usage

```typescript
const updateProfileRequest: UpdateProfileRequest = {
  userName: 'new_username',
  email: 'new@example.com',
  fullName: 'John Doe',
  profilePhoto: fileInput.files[0], // From file input
};

this.accountService.updateProfile(updateProfileRequest).subscribe({
  next: (response: AuthResponse) => {
    console.log('Profile updated:', response);
    // Update local user data
    this.updateLocalStorage(response);
  },
  error: (error) => {
    console.error('Update failed:', error.error.message);
  },
});
```

### cURL Example

```bash
curl -X PUT http://localhost:4200/api/account/update-profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "userName=new_username" \
  -F "email=new@example.com" \
  -F "fullName=John Doe" \
  -F "profilePhoto=@/path/to/photo.jpg"
```

---

## 2. Change Password

### Endpoint

```
PUT /api/account/change-password
```

### Authentication

✅ **Required** - JWT Token

### Request Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body

```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456",
  "confirmNewPassword": "NewPass@456"
}
```

### Field Validation

| Field                | Rules                                               |
| -------------------- | --------------------------------------------------- |
| `currentPassword`    | Required, Must match current password               |
| `newPassword`        | Required, Min 8 chars, Upper, Lower, Digit, Special |
| `confirmNewPassword` | Required, Must match newPassword                    |

### Password Strength Requirements

```
✓ Minimum 8 characters
✓ At least one uppercase letter (A-Z)
✓ At least one lowercase letter (a-z)
✓ At least one digit (0-9)
✓ At least one special character (!@#$%^&*)
✓ Must match confirmation field
```

### Valid Password Examples

```
✅ SecurePass@123
✅ MyPassword#456
✅ Training2024!
❌ password123  (no uppercase, no special char)
❌ Pass@1      (less than 8 chars)
```

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "userName": "john_trainer",
  "email": "john@example.com",
  "role": "Trainer",
  "profilePhotoUrl": "https://api.example.com/uploads/photo.jpg",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

#### 400 Bad Request - Invalid Current Password

```json
{
  "statusCode": 400,
  "message": "Current password is incorrect"
}
```

#### 400 Bad Request - Passwords Don't Match

```json
{
  "statusCode": 400,
  "message": "New password and confirmation password do not match"
}
```

#### 400 Bad Request - Weak Password

```json
{
  "statusCode": 400,
  "message": "Password does not meet strength requirements",
  "errors": {
    "newPassword": [
      "Password must contain at least one uppercase letter",
      "Password must contain at least one special character"
    ]
  }
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid or expired token"
}
```

### TypeScript Usage

```typescript
const changePasswordRequest: ChangePasswordRequest = {
  currentPassword: 'OldPass@123',
  newPassword: 'NewSecurePass@456',
  confirmNewPassword: 'NewSecurePass@456',
};

this.accountService.changePassword(changePasswordRequest).subscribe({
  next: (response: AuthResponse) => {
    console.log('Password changed successfully');
    // Update token
    localStorage.setItem('gymunity_trainer_token', response.token);
  },
  error: (error) => {
    console.error('Password change failed:', error.error.message);
  },
});
```

### cURL Example

```bash
curl -X PUT http://localhost:4200/api/account/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass@123",
    "newPassword": "NewPass@456",
    "confirmNewPassword": "NewPass@456"
  }'
```

---

## 3. Reset Password

### Endpoint

```
POST /api/account/reset-password
```

### Authentication

❌ **NOT Required** - Publicly accessible

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "newPassword": "NewPass@456",
  "confirmNewPassword": "NewPass@456"
}
```

### Field Validation

| Field                | Rules                                               |
| -------------------- | --------------------------------------------------- |
| `email`              | Required, Valid email                               |
| `token`              | Required, Valid reset token                         |
| `newPassword`        | Required, Min 8 chars, Upper, Lower, Digit, Special |
| `confirmNewPassword` | Required, Must match newPassword                    |

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "userName": "john_trainer",
  "email": "john@example.com",
  "role": "Trainer",
  "profilePhotoUrl": "https://api.example.com/uploads/photo.jpg",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

#### 400 Bad Request - Invalid Token

```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token"
}
```

#### 400 Bad Request - Passwords Don't Match

```json
{
  "statusCode": 400,
  "message": "New password and confirmation password do not match"
}
```

#### 400 Bad Request - User Not Found

```json
{
  "statusCode": 400,
  "message": "No user found with the provided email"
}
```

#### 400 Bad Request - Weak Password

```json
{
  "statusCode": 400,
  "message": "Password does not meet strength requirements"
}
```

### Workflow

1. User receives email with reset link containing token
2. User visits reset page and enters new password
3. System validates token and password strength
4. Password is updated and user receives new token

### TypeScript Usage

```typescript
const resetPasswordRequest: ResetPasswordRequest = {
  email: 'user@example.com',
  token: 'token-from-email',
  newPassword: 'NewSecurePass@456',
  confirmNewPassword: 'NewSecurePass@456',
};

this.accountService.resetPassword(resetPasswordRequest).subscribe({
  next: (response: AuthResponse) => {
    console.log('Password reset successfully');
    // Update token and redirect to login
    localStorage.setItem('gymunity_trainer_token', response.token);
    this.router.navigate(['/dashboard']);
  },
  error: (error) => {
    console.error('Password reset failed:', error.error.message);
  },
});
```

### cURL Example

```bash
curl -X POST http://localhost:4200/api/account/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "token": "reset-token-from-email",
    "newPassword": "NewPass@456",
    "confirmNewPassword": "NewPass@456"
  }'
```

---

## 4. Delete Trainer Profile

### Endpoint

```
DELETE /api/trainer/trainerprofile/{id}
```

### Authentication

✅ **Required** - JWT Token

### Request Headers

```
Authorization: Bearer <JWT_TOKEN>
```

### Path Parameters

| Parameter | Type    | Description        |
| --------- | ------- | ------------------ |
| `id`      | integer | Trainer profile ID |

### Success Response (204 No Content)

No response body - just status code 204

### Error Responses

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid or expired token"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "You do not have permission to delete this profile"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Profile not found"
}
```

### Notes

- This is a **soft delete** - the profile is marked as deleted
- Original data is not permanently removed from database
- User will be logged out after deletion
- Cannot be undone

### TypeScript Usage

```typescript
const trainerId = 12345;

this.accountService.deleteTrainerProfile(trainerId).subscribe({
  next: () => {
    console.log('Profile deleted successfully');
    // Clear storage and logout
    this.authService.logout();
    this.router.navigate(['/home']);
  },
  error: (error) => {
    console.error('Deletion failed:', error.error.message);
  },
});
```

### cURL Example

```bash
curl -X DELETE http://localhost:4200/api/trainer/trainerprofile/12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Common Response Codes

| Code | Meaning      | Action                    |
| ---- | ------------ | ------------------------- |
| 200  | OK           | Success                   |
| 204  | No Content   | Success (Delete)          |
| 400  | Bad Request  | Check validation errors   |
| 401  | Unauthorized | Get new token or re-login |
| 403  | Forbidden    | Check permissions         |
| 404  | Not Found    | Resource doesn't exist    |
| 500  | Server Error | Contact support           |

---

## 🔄 Token Management

After successful `Update Profile`, `Change Password`, or `Reset Password`:

1. New JWT token is provided in response
2. Update localStorage with new token:

```typescript
localStorage.setItem('gymunity_trainer_token', response.token);
```

3. Include new token in subsequent requests

---

## ⏱️ Rate Limiting

No rate limiting specified in current implementation.
Consider implementing if needed:

- Max 5 password change attempts per hour
- Max 3 reset password attempts per hour

---

## 🛡️ Security Considerations

1. **Always use HTTPS** in production
2. **Validate inputs** on both client and server
3. **Never log passwords** or sensitive data
4. **Use secure password requirements** (as specified)
5. **Implement CSRF protection** for state-changing operations
6. **Monitor failed attempts** for suspicious activity
7. **Set token expiration** appropriately
8. **Use secure password hashing** on server (bcrypt/Argon2)

---

**Version**: 1.0.0  
**Last Updated**: 3 January 2026
