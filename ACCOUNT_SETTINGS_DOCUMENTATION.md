# Account Settings Implementation

## 📋 Overview

تم تنفيذ نظام إعدادات الحساب الكامل مع أيقونة ترس في الـ sidebar تحتوي على قائمة إعدادات متكاملة.

## ✨ الميزات المنفذة

### 1. **Delete Trainer Profile (Soft Delete)**

- **Endpoint**: `DELETE /api/trainer/trainerprofile/{id}`
- **Authentication**: ✅ مطلوب Token
- **الوصف**: حذف البروفايل بشكل دائم (Soft Delete)
- **Response**: `204 No Content`
- **Errors**: `404: Profile not found`

### 2. **Update Profile (لكل المستخدمين)**

- **Endpoint**: `PUT /api/account/update-profile`
- **Authentication**: ✅ مطلوب Token
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```json
  {
    "userName": "new_username", // Required, Min 3 chars
    "email": "new@email.com", // Required, Valid email
    "fullName": "John Doe", // Required, Min 3 chars
    "profilePhoto": "file" // IFormFile (optional)
  }
  ```
- **Response**: `AuthResponse` مع Token جديد
- **Errors**: `400: Email/Username already taken`

### 3. **Change Password**

- **Endpoint**: `PUT /api/account/change-password`
- **Authentication**: ✅ مطلوب Token
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPass@123",
    "newPassword": "NewPass@456", // 8+ chars, uppercase, lowercase, digit, special char
    "confirmNewPassword": "NewPass@456"
  }
  ```
- **Response**: `AuthResponse` مع Token جديد
- **Errors**: `400: Current password incorrect / Passwords don't match`

### 4. **Reset Password**

- **Endpoint**: `POST /api/account/reset-password`
- **Authentication**: ❌ لا يحتاج Token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "token": "reset-token-from-email",
    "newPassword": "NewPass@456",
    "confirmNewPassword": "NewPass@456"
  }
  ```
- **Response**: `AuthResponse` مع Token جديد
- **Errors**: `400: Invalid token / Passwords don't match`

## 🎨 واجهة المستخدم

### Settings Icon في Sidebar

- تم إضافة أيقونة ترس (⚙️) في شريط التبويبات الجانبي
- عند الضغط عليها، تظهر قائمة منسدلة بسيطة وأنيقة
- القائمة تحتوي على:
  - 👤 **Update Profile** - تعديل بيانات المستخدم
  - 🔒 **Change Password** - تغيير كلمة المرور
  - 🔄 **Reset Password** - استعادة كلمة المرور بـ Token
  - 🗑️ **Delete Account** - حذف الحساب (خطر!)

### Account Settings Page

عند الضغط على أي عنصر من القائمة، يتم الانتقال إلى صفحة `/dashboard/settings` مع Tab معين:

- Tab يتم تحديده تلقائياً بناءً على `query parameter` (tab)

## 📁 الملفات المُنشأة/المعدلة

### ملفات جديدة:

1. **`src/app/core/services/account.service.ts`**

   - Service يحتوي على جميع methods الـ API المتعلقة بإعدادات الحساب

2. **`src/app/features/dashboard/account-settings/`**
   - `account-settings.component.ts` - Component رئيسي
   - `account-settings.component.html` - Template مع 4 tabs
   - `account-settings.component.css` - Styling احترافي

### ملفات معدلة:

1. **`src/app/features/dashboard/dashboard-sidebar/dashboard-sidebar.component.ts`**

   - إضافة `settingsMenuOpen` property
   - إضافة `toggleSettingsMenu()` method
   - إضافة `navigateToSettings()` method

2. **`src/app/features/dashboard/dashboard-sidebar/dashboard-sidebar.component.html`**

   - إضافة زر الترس في الـ tabs
   - إضافة Settings Menu منسدل

3. **`src/app/features/dashboard/dashboard-sidebar/dashboard-sidebar.component.css`**

   - Styling لأيقونة الترس
   - Styling لقائمة الإعدادات المنسدلة

4. **`src/app/app.routes.ts`**

   - إضافة route جديد: `/dashboard/settings`

5. **`src/app/core/services/index.ts`**
   - Export للـ `AccountService`

## 🔐 Security Features

### Validation

- ✅ **Email Validation**: تحقق من صيغة البريد الإلكتروني
- ✅ **Password Strength**: كلمات مرور قوية مع validation معقد
  - 8 أحرف على الأقل
  - يجب أن تحتوي على أحرف كبيرة وصغيرة
  - يجب أن تحتوي على رقم
  - يجب أن تحتوي على رمز خاص (!@#$%^&\*)
- ✅ **Password Match**: تأكيد تطابق كلمات المرور
- ✅ **Username Length**: اسم المستخدم لا يقل عن 3 أحرف

### Confirmation Dialogs

- ✅ تأكيد قبل حذف الحساب
- ✅ رسائل خطأ واضحة وآمنة

## 📱 Responsive Design

- ✅ Design متجاوب للهواتف الذكية
- ✅ Layout يتكيف مع جميع أحجام الشاشات
- ✅ Accessibility محسّن

## 🎯 الاستخدام

### 1. الانتقال للإعدادات

```typescript
// من أي مكان في التطبيق
this.router.navigate(['/dashboard/settings'], {
  queryParams: { tab: 'update-profile' },
});
```

### 2. تحديث الملف الشخصي

```typescript
this.accountService.updateProfile({
  userName: 'new_username',
  email: 'new@email.com',
  fullName: 'John Doe',
  profilePhoto: fileObject  // optional
}).subscribe(...);
```

### 3. تغيير كلمة المرور

```typescript
this.accountService.changePassword({
  currentPassword: 'old_password',
  newPassword: 'NewPass@123',
  confirmNewPassword: 'NewPass@123'
}).subscribe(...);
```

### 4. استعادة كلمة المرور

```typescript
this.accountService.resetPassword({
  email: 'user@example.com',
  token: 'reset_token_from_email',
  newPassword: 'NewPass@123',
  confirmNewPassword: 'NewPass@123'
}).subscribe(...);
```

### 5. حذف حساب التدريب

```typescript
this.accountService.deleteTrainerProfile(userId).subscribe(...);
```

## 🎨 UI/UX Features

### Success Messages

- ✅ رسائل نجاح واضحة باللون الأخضر
- ✅ Animation سلسة للرسائل

### Error Handling

- ✅ رسائل خطأ مفصلة من الـ Server
- ✅ رسائل Fallback محلية للحالات الاستثنائية

### Loading States

- ✅ زر يتغير حالته عند التحميل
- ✅ تعطيل الأزرار أثناء الطلب

### Tab Navigation

- ✅ 4 tabs منفصلة
- ✅ Visual indicator للـ Tab النشط
- ✅ سلس transitions بين الـ Tabs

## 🚀 Performance

- ✅ Lazy loading للـ settings component (عند الحاجة فقط)
- ✅ Form validation سريع في العميل
- ✅ Cache للـ user data
- ✅ Minimal re-renders مع `ChangeDetectionStrategy.OnPush` (يمكن إضافته لاحقاً)

## 🔍 Testing Checklist

- [ ] تحديث بيانات المستخدم
- [ ] تحميل صورة شخصية جديدة
- [ ] تغيير كلمة المرور برسالة صحيحة
- [ ] محاولة تغيير كلمة مرور بكلمة مرور ضعيفة
- [ ] استعادة كلمة المرور بـ Token
- [ ] محاولة حذف الحساب مع التأكيد
- [ ] التحقق من ظهور رسائل النجاح والخطأ بشكل صحيح
- [ ] اختبار الـ Responsive Design على أحجام شاشات مختلفة

---

**Version**: 1.0.0  
**Last Updated**: 3 January 2026
