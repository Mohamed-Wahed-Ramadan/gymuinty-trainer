# Gymunity Trainer - API Endpoints Documentation

## Endpoint Overview

This document provides detailed documentation for three key endpoints used in the Trainer Dashboard:

1. **GET /api/trainer/TrainerProfile/UserId/{userId}** - Get trainer profile by user ID
2. **GET /api/trainer/TrainerProfile/subscribers/{id}** - Get subscribers/clients list
3. **PUT /api/trainer/TrainerProfile/Status/{id}** - Update trainer status

---

## 1. GET /api/trainer/TrainerProfile/UserId/{userId}

### 📋 Signature
```
GET /api/trainer/TrainerProfile/UserId/{userId}
```

### 🔐 Authentication
- **Required**: Yes (JWT Token)
- **Header**: `Authorization: Bearer {JWT_TOKEN}`
- **Token Content**: Must contain `ClaimTypes.NameIdentifier` with the user ID (AppUser.Id)

### 📥 Parameters
| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| userId | string | Path | Yes | User ID (typically a GUID) that identifies the trainer user |

**Request Body**: None

### 📤 Response
**Status Code**: `200 OK`

**Response Body**:
```json
{
  "id": 1,
  "userId": "abc-user-guid-12345",
  "userName": "John Doe",
  "handle": "johndoe_fitness",
  "bio": "Professional fitness trainer with 5 years of experience",
  "coverImageUrl": "https://api.example.com/images/cover-123.jpg",
  "videoIntroUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "brandingColors": "#4A90E2,#8B5FBF",
  "isVerified": true,
  "verifiedAt": "2025-01-15T10:30:00Z",
  "ratingAverage": 4.8,
  "totalClients": 23,
  "yearsExperience": 5,
  "statusImageUrl": "https://api.example.com/images/status-456.jpg",
  "statusDescription": "Currently taking new clients",
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-20T14:30:00Z"
}
```

### ❌ Error Responses

**401 Unauthorized**:
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**404 Not Found**:
```json
{
  "message": "Trainer profile not found",
  "statusCode": 404
}
```

**400 Bad Request**:
```json
{
  "message": "Invalid user ID format",
  "statusCode": 400
}
```

### 📝 Example Requests

**cURL**:
```bash
curl -X GET "https://api.gymunity.com/api/trainer/TrainerProfile/UserId/abc-user-guid-12345" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json"
```

**JavaScript (Fetch)**:
```javascript
const userId = getUserIdFromToken(); // From JWT token
const response = await fetch(
  `https://api.gymunity.com/api/trainer/TrainerProfile/UserId/${userId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }
);
const profile = await response.json();
```

**JavaScript (Axios)**:
```javascript
import axios from 'axios';

const userId = getUserIdFromToken();
const config = {
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const response = await axios.get(
  `https://api.gymunity.com/api/trainer/TrainerProfile/UserId/${userId}`,
  config
);
const profile = response.data;
```

### ✅ Validations
- User ID must be a valid GUID string
- JWT token must be valid and not expired
- User must have proper authorization claims

### 🎯 Frontend Usage

**Angular Service Method**:
```typescript
// In TrainerService
getProfileByUserId(userId: string): Observable<TrainerProfileResponse> {
  return this.http.get<TrainerProfileResponse>(
    `${this.baseUrl}/UserId/${userId}`
  ).pipe(
    map(profile => this.resolveImageUrls(profile)),
    catchError(this.handleError)
  );
}
```

**Component Usage** (trainer-profile.component.ts):
```typescript
ngOnInit(): void {
  const userId = this.auth.getUserIdFromToken?.();
  if (userId) {
    this.trainerService.getProfileByUserId(userId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load profile';
      }
    });
  }
}
```

**UI Display**:
```html
<div *ngIf="profile" class="profile-display">
  <h2>{{ profile.userName }}</h2>
  <p><strong>Handle:</strong> @{{ profile.handle }}</p>
  <p><strong>Bio:</strong> {{ profile.bio }}</p>
  <p><strong>Rating:</strong> {{ profile.ratingAverage }}/5.0</p>
  <img *ngIf="profile.coverImageUrl" [src]="profile.coverImageUrl" />
  
  <!-- Status Section -->
  <div class="status-section">
    <img *ngIf="profile.statusImageUrl" [src]="profile.statusImageUrl" />
    <p>{{ profile.statusDescription }}</p>
  </div>
</div>
```

### 📊 Response Fields Description
| Field | Type | Description |
|-------|------|-------------|
| id | int | Unique trainer profile ID |
| userId | string | Associated user ID (GUID) |
| userName | string | User's full name |
| handle | string | Public handle/username (unique identifier) |
| bio | string | Profile biography/description |
| coverImageUrl | string/null | URL to cover/banner image |
| videoIntroUrl | string/null | URL to introduction video |
| brandingColors | string/null | Comma-separated hex color codes for branding |
| isVerified | bool | Whether trainer is verified/certified |
| verifiedAt | datetime/null | Timestamp of verification |
| ratingAverage | decimal | Average rating (0-5) from clients |
| totalClients | int | Total number of active clients |
| yearsExperience | int | Years of professional experience |
| statusImageUrl | string/null | URL to current status image |
| statusDescription | string/null | Current status text |
| createdAt | datetime | Profile creation timestamp |
| updatedAt | datetime | Last update timestamp |

---

## 2. GET /api/trainer/TrainerProfile/subscribers/{id}

### 📋 Signature
```
GET /api/trainer/TrainerProfile/subscribers/{id}
```

### 🔐 Authentication
- **Required**: Yes (Recommended)
- **Header**: `Authorization: Bearer {JWT_TOKEN}`
- **Note**: Endpoint should be secured to ensure only the trainer can view their own subscribers

### 📥 Parameters
| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| id | int | Path | Yes | Trainer Profile ID (not User ID) |

**Request Body**: None

### 📤 Response
**Status Code**: `200 OK`

**Response Body** (Array of Subscribers):
```json
[
  {
    "clientId": "b8f4c7e9-1c1f-4c5c-a12d-9a8f12345678",
    "clientName": "Mohamed Ali",
    "clientEmail": "m.ali@example.com",
    "packageName": "Monthly Pro",
    "subscriptionStartDate": "2025-12-01T00:00:00Z",
    "subscriptionEndDate": "2026-01-01T00:00:00Z",
    "status": "Active"
  },
  {
    "clientId": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
    "clientName": "Fatima Hassan",
    "clientEmail": "fatima.hassan@example.com",
    "packageName": "6-Month Premium",
    "subscriptionStartDate": "2025-07-15T00:00:00Z",
    "subscriptionEndDate": "2026-01-15T00:00:00Z",
    "status": "Active"
  },
  {
    "clientId": "x9y8z7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k",
    "clientName": "Ahmed Saleh",
    "clientEmail": "ahmed.saleh@example.com",
    "packageName": "3-Month Basic",
    "subscriptionStartDate": "2025-10-01T00:00:00Z",
    "subscriptionEndDate": "2026-01-01T00:00:00Z",
    "status": "Unpaid"
  }
]
```

### ❌ Error Responses

**200 OK (Empty Array)**:
```json
[]
```
Returns empty array if no subscribers found (or trainer profile doesn't exist)

**400 Bad Request**:
```json
{
  "message": "Invalid trainer profile ID",
  "statusCode": 400
}
```

**404 Not Found**:
```json
{
  "message": "Trainer profile not found",
  "statusCode": 404
}
```

**500 Internal Server Error**:
```json
{
  "message": "An error occurred while retrieving subscribers",
  "statusCode": 500
}
```

### 📝 Example Requests

**cURL**:
```bash
curl -X GET "https://api.gymunity.com/api/trainer/TrainerProfile/subscribers/5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json"
```

**JavaScript (Fetch)**:
```javascript
const trainerId = 5; // Or from profile.id
const response = await fetch(
  `https://api.gymunity.com/api/trainer/TrainerProfile/subscribers/${trainerId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }
);
const subscribers = await response.json();
```

**JavaScript (Axios)**:
```javascript
const trainerId = 5;
const response = await axios.get(
  `https://api.gymunity.com/api/trainer/TrainerProfile/subscribers/${trainerId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const subscribers = response.data;
```

### ✅ Validations
- Trainer profile ID must be a valid positive integer
- Trainer profile must exist in the system
- (Recommended) Verify that requesting user owns this trainer profile or is admin

### 🎯 Frontend Usage

**Angular Service Method**:
```typescript
// In TrainerService
getSubscribersByTrainerId(trainerId: number): Observable<SubscriberResponse[]> {
  return this.http.get<SubscriberResponse[]>(
    `${this.baseUrl}/subscribers/${trainerId}`
  ).pipe(
    catchError(this.handleError)
  );
}
```

**Component Usage** (new-chat-modal.component.ts):
```typescript
private loadSubscribers(): void {
  const userId = this.authService.getUserIdFromToken?.();
  
  this.trainerService.getProfileByUserId(userId)
    .subscribe({
      next: (profile) => {
        // Get subscribers for this trainer profile
        this.trainerService.getSubscribersByTrainerId(profile.id)
          .subscribe({
            next: (subscribers) => {
              this.subscribers = subscribers;
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Failed to load subscribers:', err);
            }
          });
      }
    });
}
```

**UI Display**:
```html
<div class="subscribers-list">
  <div *ngFor="let subscriber of subscribers" class="subscriber-card">
    <div class="subscriber-info">
      <div class="subscriber-name">{{ subscriber.clientName }}</div>
      <div class="subscriber-email">{{ subscriber.clientEmail }}</div>
      <div class="subscriber-package">{{ subscriber.packageName }}</div>
    </div>
    <div class="subscriber-status" [ngClass]="'status-' + subscriber.status.toLowerCase()">
      {{ subscriber.status }}
    </div>
    <button (click)="contactSubscriber(subscriber)">Contact</button>
  </div>
</div>
```

### 📊 Response Fields Description
| Field | Type | Description |
|-------|------|-------------|
| clientId | string | Unique client ID (GUID) |
| clientName | string | Full name of the client |
| clientEmail | string | Email address of the client |
| packageName | string | Name of the subscription package |
| subscriptionStartDate | datetime | When the subscription started |
| subscriptionEndDate | datetime | When the subscription expires |
| status | enum | Subscription status: `Active`, `Unpaid`, `Canceled`, `Expired` |

### 🎨 Status Badge Styling
```typescript
getStatusBadgeClass(status: string): string {
  switch(status.toLowerCase()) {
    case 'active': return 'badge-active';      // Green
    case 'unpaid': return 'badge-unpaid';      // Yellow/Orange
    case 'canceled': return 'badge-canceled';  // Red
    case 'expired': return 'badge-expired';    // Gray
    default: return 'badge-expired';
  }
}
```

---

## 3. PUT /api/trainer/TrainerProfile/Status/{id}

### 📋 Signature
```
PUT /api/trainer/TrainerProfile/Status/{id}
Content-Type: multipart/form-data
```

### 🔐 Authentication
- **Required**: Yes (JWT Token)
- **Header**: `Authorization: Bearer {JWT_TOKEN}`
- **Verification**: System should verify that the requesting user owns this trainer profile (id must belong to the user)

### 📥 Parameters
| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| id | int | Path | Yes | Trainer Profile ID to update |
| StatusImage | file | Body | No | Image file (JPG, PNG, GIF, WebP) |
| StatusDescription | string | Body | No | Status text description (max 200 chars) |

**Request Content-Type**: `multipart/form-data`

### 📤 Response
**Status Code**: `200 OK`

**Response Body** (Updated TrainerProfileDetailResponse):
```json
{
  "id": 1,
  "userId": "abc-user-guid-12345",
  "userName": "John Doe",
  "handle": "johndoe_fitness",
  "bio": "Professional fitness trainer with 5 years of experience",
  "coverImageUrl": "https://api.example.com/images/cover-123.jpg",
  "videoIntroUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "brandingColors": "#4A90E2,#8B5FBF",
  "isVerified": true,
  "verifiedAt": "2025-01-15T10:30:00Z",
  "ratingAverage": 4.8,
  "totalClients": 23,
  "yearsExperience": 5,
  "statusImageUrl": "https://api.example.com/images/status-new-789.jpg",
  "statusDescription": "Taking new online coaching clients",
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-20T15:45:00Z"
}
```

### ❌ Error Responses

**400 Bad Request**:
```json
{
  "message": "Image file size exceeds 5MB limit",
  "statusCode": 400,
  "errors": ["StatusImage: File size too large"]
}
```

**401 Unauthorized**:
```json
{
  "message": "Unauthorized - You do not have permission to update this profile",
  "statusCode": 401
}
```

**404 Not Found**:
```json
{
  "message": "Trainer profile not found",
  "statusCode": 404
}
```

**422 Unprocessable Entity**:
```json
{
  "message": "Validation failed",
  "statusCode": 422,
  "errors": ["StatusDescription must not exceed 200 characters"]
}
```

### 📝 Example Requests

**cURL (with image and description)**:
```bash
curl -X PUT "https://api.gymunity.com/api/trainer/TrainerProfile/Status/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json" \
  -F "StatusImage=@/path/to/status.jpg" \
  -F "StatusDescription=Now taking new clients for 1-on-1 coaching"
```

**cURL (description only)**:
```bash
curl -X PUT "https://api.gymunity.com/api/trainer/TrainerProfile/Status/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json" \
  -F "StatusDescription=Taking new clients"
```

**cURL (image only)**:
```bash
curl -X PUT "https://api.gymunity.com/api/trainer/TrainerProfile/Status/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json" \
  -F "StatusImage=@/path/to/status.jpg"
```

**JavaScript (Fetch)**:
```javascript
const formData = new FormData();

// Add image if selected
if (imageFile) {
  formData.append('StatusImage', imageFile);
}

// Add description
formData.append('StatusDescription', 'Now accepting new clients!');

const response = await fetch(
  `https://api.gymunity.com/api/trainer/TrainerProfile/Status/1`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    body: formData
  }
);

const updatedProfile = await response.json();
```

**JavaScript (Axios)**:
```javascript
const formData = new FormData();

if (imageFile) {
  formData.append('StatusImage', imageFile);
}
formData.append('StatusDescription', description);

const response = await axios.put(
  `https://api.gymunity.com/api/trainer/TrainerProfile/Status/1`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);

const updatedProfile = response.data;
```

### ✅ Validations

**File Validations**:
- Maximum file size: 5 MB
- Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- Image dimensions recommended: 800x600px to 2400x1800px

**Description Validations**:
- Maximum length: 200 characters
- Allows alphanumeric characters, spaces, and basic punctuation

**Request Validations**:
- Trainer Profile ID must exist
- User must be authenticated (valid JWT)
- User must own the trainer profile or be an admin
- At least one field (StatusImage or StatusDescription) should be provided

### 🎯 Frontend Usage

**Angular Service Method**:
```typescript
// In TrainerService
updateStatus(profileId: number, formData: FormData): Observable<TrainerProfileResponse> {
  return this.http.put<TrainerProfileResponse>(
    `${this.baseUrl}/Status/${profileId}`,
    formData
  ).pipe(
    map(profile => this.resolveImageUrls(profile)),
    catchError(this.handleError)
  );
}
```

**Component Usage** (trainer-profile.component.ts):
```typescript
updateStatus(): void {
  if (!this.profile) return;

  this.isUpdatingStatus = true;

  const formData = new FormData();
  
  // Add image if selected
  if (this.selectedStatusFile) {
    formData.append('StatusImage', this.selectedStatusFile);
  }

  // Add description
  const description = this.statusForm.get('statusDescription')?.value || '';
  if (description) {
    formData.append('StatusDescription', description);
  }

  this.trainerService.updateStatus(this.profile.id, formData).subscribe({
    next: (updatedProfile) => {
      this.isUpdatingStatus = false;
      this.profile = updatedProfile;
      this.closeStatusModal();
    },
    error: (error) => {
      this.isUpdatingStatus = false;
      this.errorMessage = 'Failed to update status';
    }
  });
}

clearStatus(): void {
  // Send empty description to clear status
  const formData = new FormData();
  formData.append('StatusDescription', '');
  
  this.trainerService.updateStatus(this.profile.id, formData).subscribe({
    next: (updatedProfile) => {
      this.profile = updatedProfile;
    }
  });
}
```

**Form Implementation**:
```html
<div class="status-modal">
  <form [formGroup]="statusForm" (ngSubmit)="updateStatus()">
    <!-- Image Upload -->
    <div class="form-group">
      <label>Status Image</label>
      <input 
        type="file" 
        class="form-control"
        (change)="onStatusImageSelect($event)"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
      />
      <small>Max 5MB. JPG, PNG, GIF, WebP</small>
      
      <div *ngIf="statusImagePreview" class="image-preview">
        <img [src]="statusImagePreview" />
      </div>
    </div>

    <!-- Description -->
    <div class="form-group">
      <label>Status Description</label>
      <textarea 
        class="form-control"
        rows="3"
        formControlName="statusDescription"
        maxlength="200"
        placeholder="What are you up to?"
      ></textarea>
      <small>{{ statusForm.get('statusDescription')?.value?.length || 0 }}/200</small>
    </div>

    <!-- Buttons -->
    <div class="button-group">
      <button type="submit" class="btn btn-primary" [disabled]="isUpdatingStatus">
        <span *ngIf="!isUpdatingStatus">Update Status</span>
        <span *ngIf="isUpdatingStatus">
          <span class="spinner"></span> Updating...
        </span>
      </button>
      <button type="button" class="btn btn-secondary" (click)="clearStatus()">
        Clear Status
      </button>
    </div>
  </form>
</div>
```

### 📋 Request Validation Best Practices

**Frontend Validation** (Before sending):
```typescript
onStatusImageSelect(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Check size
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    this.errorMessage = 'File size exceeds 5MB limit';
    return;
  }

  // Check type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    this.errorMessage = 'Invalid file type';
    return;
  }

  this.selectedStatusFile = file;
}
```

### 🎨 Status Update UI Features

- **Image Preview**: Show preview before upload
- **Character Counter**: Display remaining characters (200 max)
- **Loading State**: Disable button and show spinner during upload
- **Two Buttons**:
  - "Update Status" - Send filled data
  - "Clear Status" - Send empty data to clear
- **Error Handling**: Display specific validation errors
- **Success Feedback**: Update profile display after successful update

---

## Summary Table

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/trainer/TrainerProfile/UserId/{userId}` | GET | Required | Get trainer profile info including status |
| `/api/trainer/TrainerProfile/subscribers/{id}` | GET | Recommended | Get list of current clients/subscribers |
| `/api/trainer/TrainerProfile/Status/{id}` | PUT | Required | Update trainer status (image + description) |

---

## Implementation Checklist

- [x] Add `SubscriberResponse` interface to TrainerService
- [x] Add `getSubscribersByTrainerId()` method to TrainerService
- [x] Add status display section to trainer-profile component
- [x] Add "Update Status" and "Clear Status" buttons
- [x] Create status update modal with image and description fields
- [x] Update new-chat-modal to use subscribers endpoint
- [x] Add status badge styling and display
- [x] Add client contact information display
- [x] Implement error handling and validation
- [x] Add loading states and spinners
- [x] Add confirmation dialogs for destructive actions

---

## Environment Configuration

Ensure your `environment.ts` has the correct API base URL:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.gymunity.com'  // Update with your API URL
};
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC/Z timezone)
- Images are automatically resolved from relative paths if needed
- Old status images are automatically deleted on the server when updated
- All responses include proper CORS headers
- Rate limiting: 100 requests per minute per user
- JWT tokens expire after 24 hours
