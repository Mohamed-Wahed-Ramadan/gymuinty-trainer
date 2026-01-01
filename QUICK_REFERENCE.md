# Quick Reference Guide - Trainer Endpoints

## 🎯 Quick Access

### Endpoint 1: Get Trainer Profile
```typescript
// Service Method
this.trainerService.getProfileByUserId(userId: string)

// Response Type
TrainerProfileResponse

// Key Fields
{
  id, userId, userName, handle, bio,
  statusImageUrl, statusDescription,
  ratingAverage, totalClients, yearsExperience
}
```

### Endpoint 2: Get Subscribers List
```typescript
// Service Method
this.trainerService.getSubscribersByTrainerId(trainerId: number)

// Response Type
SubscriberResponse[]

// Key Fields Per Item
{
  clientId, clientName, clientEmail,
  packageName, subscriptionStartDate,
  subscriptionEndDate, status
}

// Status Enum Values
Active | Unpaid | Canceled | Expired
```

### Endpoint 3: Update Status
```typescript
// Service Method
this.trainerService.updateStatus(profileId: number, formData: FormData)

// FormData Content
formData.append('StatusImage', file);           // Optional
formData.append('StatusDescription', text);    // Optional, max 200 chars

// Response Type
TrainerProfileResponse (updated)
```

---

## 📍 Component Usage Examples

### Example 1: Display Trainer Profile
**In trainer-profile.component.ts**:
```typescript
ngOnInit() {
  const userId = this.auth.getUserIdFromToken?.();
  this.trainerService.getProfileByUserId(userId).subscribe({
    next: (profile) => {
      this.profile = profile;
      this.loading = false;
    },
    error: (err) => {
      this.errorMessage = err.message;
    }
  });
}
```

**In template**:
```html
<div *ngIf="profile" class="profile-card">
  <h2>{{ profile.userName }}</h2>
  <p>@{{ profile.handle }}</p>
  <p>{{ profile.bio }}</p>
  
  <!-- Status Display -->
  <div class="status-section">
    <img *ngIf="profile.statusImageUrl" [src]="profile.statusImageUrl" />
    <p>{{ profile.statusDescription }}</p>
    <button (click)="openStatusModal()">Update Status</button>
  </div>
</div>
```

### Example 2: Update Status with Modal
**In Component TypeScript**:
```typescript
// Form
statusForm = this.fb.group({
  statusDescription: ['', [Validators.maxLength(200)]]
});

// Methods
openStatusModal() {
  this.showStatusModal = true;
}

onStatusImageSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  // Validate: size <= 5MB, type = image/*
  this.selectedStatusFile = file;
  // Show preview...
}

updateStatus() {
  const fd = new FormData();
  if (this.selectedStatusFile) {
    fd.append('StatusImage', this.selectedStatusFile);
  }
  fd.append('StatusDescription', this.statusForm.value.statusDescription);
  
  this.trainerService.updateStatus(this.profile.id, fd).subscribe({
    next: (updated) => {
      this.profile = updated;
      this.closeStatusModal();
    }
  });
}

clearStatus() {
  const fd = new FormData();
  fd.append('StatusDescription', '');
  this.trainerService.updateStatus(this.profile.id, fd).subscribe(/* ... */);
}
```

**In Template (Modal)**:
```html
<div *ngIf="showStatusModal" class="modal">
  <form [formGroup]="statusForm" (ngSubmit)="updateStatus()">
    <input 
      type="file" 
      (change)="onStatusImageSelect($event)"
      accept="image/*"
    />
    <img *ngIf="statusImagePreview" [src]="statusImagePreview" />
    
    <textarea
      formControlName="statusDescription"
      maxlength="200"
      placeholder="Status text..."
    ></textarea>
    <span>{{ statusForm.get('statusDescription')?.value?.length || 0 }}/200</span>
    
    <button type="submit" [disabled]="isUpdatingStatus">
      {{ isUpdatingStatus ? 'Updating...' : 'Update Status' }}
    </button>
    <button type="button" (click)="clearStatus()">Clear Status</button>
    <button type="button" (click)="closeStatusModal()">Cancel</button>
  </form>
</div>
```

### Example 3: Display Subscribers List
**In new-chat-modal.component.ts**:
```typescript
ngOnInit() {
  this.loadSubscribers();
}

private loadSubscribers() {
  this.isLoading = true;
  const userId = this.authService.getUserIdFromToken?.();
  
  // Get trainer profile first
  this.trainerService.getProfileByUserId(userId).subscribe({
    next: (profile) => {
      // Get subscribers for this trainer
      this.trainerService.getSubscribersByTrainerId(profile.id).subscribe({
        next: (subscribers) => {
          this.subscribers = subscribers;
          this.isLoading = false;
        }
      });
    }
  });
}

getStatusBadgeClass(status: string): string {
  switch(status?.toLowerCase()) {
    case 'active': return 'badge-active';
    case 'unpaid': return 'badge-unpaid';
    case 'canceled': return 'badge-canceled';
    default: return 'badge-expired';
  }
}

selectSubscriber(subscriber: SubscriberResponse) {
  this.onSelectTrainer.emit({
    clientId: subscriber.clientId,
    clientName: subscriber.clientName,
    clientEmail: subscriber.clientEmail
  });
}
```

**In Template**:
```html
<div *ngIf="isLoading">Loading clients...</div>

<ul *ngIf="!isLoading && subscribers.length">
  <li *ngFor="let sub of subscribers">
    <div>
      <strong>{{ sub.clientName }}</strong>
      <div class="text-muted">{{ sub.clientEmail }}</div>
      <div class="text-sm">Package: {{ sub.packageName }}</div>
      <span class="badge" [ngClass]="getStatusBadgeClass(sub.status)">
        {{ sub.status }}
      </span>
    </div>
    <button (click)="selectSubscriber(sub)">Contact</button>
  </li>
</ul>

<div *ngIf="!isLoading && !subscribers.length">No clients available</div>
```

---

## 🎨 Styling Classes

```css
/* Status Section */
.status-section { margin-top: 20px; border-top: 1px solid #ddd; }
.status-icon { color: #667eea; }
.status-image { width: 80px; height: 80px; border-radius: 8px; }
.status-placeholder { width: 80px; height: 80px; background: #ddd; }

/* Status Badges */
.badge-active { background: #d4edda; color: #155724; }
.badge-unpaid { background: #fff3cd; color: #856404; }
.badge-canceled { background: #f8d7da; color: #721c24; }
.badge-expired { background: #e2e3e5; color: #383d41; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); }
.modal-panel { background: white; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.25); }

/* Forms */
.form-control { padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; }
.form-control:focus { border-color: #4A90E2; box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1); }

/* Avatars */
.avatar-placeholder { width: 40px; height: 40px; background: #e0e0e0; border-radius: 50%; }
```

---

## 🔒 Security & Validation

### File Upload Validation
```typescript
const maxSize = 5 * 1024 * 1024; // 5MB
const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (file.size > maxSize) {
  error = 'File exceeds 5MB limit';
}
if (!validTypes.includes(file.type)) {
  error = 'Invalid file type';
}
```

### Description Validation
```typescript
const maxChars = 200;
if (description.length > maxChars) {
  error = 'Description exceeds 200 characters';
}
```

### Form Validation
```typescript
statusForm = this.fb.group({
  statusDescription: ['', [Validators.maxLength(200)]]
});
```

---

## 🚨 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired JWT | Check token validity, re-authenticate |
| 404 Not Found | Profile doesn't exist | Create profile first |
| 400 Bad Request | File too large or wrong type | Check file size and MIME type |
| Profile shows empty | null/undefined response | Handle null response in component |
| Subscribers not loading | Wrong trainer ID | Get trainer ID from profile first |
| Image not showing | URL not resolved | Check URL resolution in service |

---

## 🔄 Data Flow Diagram

```
USER LOGIN
    ↓
GET JWT TOKEN
    ↓
GET PROFILE BY USER ID
    ↓
DISPLAY PROFILE WITH STATUS
    ↓
┌─────────────────────┬──────────────────────┐
│                     │                      │
UPDATE STATUS       GET SUBSCRIBERS
│                     │
PUT /Status/{id}   GET /subscribers/{id}
│                     │
UPDATE UI          DISPLAY CLIENT LIST
└─────────────────────┴──────────────────────┘
```

---

## ✅ Testing Checklist

```
[ ] Load profile successfully
[ ] Profile displays status image and description
[ ] Update status with description only
[ ] Update status with image only
[ ] Update status with both image and description
[ ] Clear status works correctly
[ ] File validation works (size, type)
[ ] Character counter works
[ ] Modal opens and closes properly
[ ] Subscribers load successfully
[ ] Status badges display correct colors
[ ] Contact button works
[ ] Error messages display properly
[ ] Loading spinners show during requests
[ ] Buttons disable during loading
```

---

## 📞 Support Reference

**Service Class**: `TrainerService` (src/app/core/services/)
**Components Using**:
- `trainer-profile.component.ts` - Profile display & status update
- `new-chat-modal.component.ts` - Subscribers list

**Documentation**: 
- `API_ENDPOINTS_DOCUMENTATION.md` - Full endpoint docs
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## 🎓 Key Concepts

1. **Reactive Forms**: Used for form management with validation
2. **FormData API**: For multipart/form-data file uploads
3. **RxJS Observables**: For async HTTP requests
4. **Change Detection**: Manual with `ChangeDetectorRef` when needed
5. **Template Driven**: HTML-based conditional rendering
6. **Error Handling**: Proper error propagation with user feedback

---

## 🚀 Quick Start Commands

```bash
# View API endpoints documentation
cat API_ENDPOINTS_DOCUMENTATION.md

# View implementation summary
cat IMPLEMENTATION_SUMMARY.md

# Run the application
npm start

# Run tests
npm test
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
