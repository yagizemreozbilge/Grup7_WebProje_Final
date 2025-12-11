# API Documentation - Part 1

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

Tüm protected endpoint'ler için `Authorization` header'ında Bearer token gönderilmelidir:
```
Authorization: Bearer <access_token>
```

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Kullanıcı kaydı oluşturur.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123",
  "full_name": "John Doe",
  "role": "student",
  "student_number": "STU001",
  "department_id": "uuid-here"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully. Please check your email for verification.",
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "student",
    "full_name": "John Doe",
    "is_verified": false
  }
}
```

**Error Codes:**
- `400` - Validation error
- `409` - User already exists

---

### 2. Verify Email
**POST** `/auth/verify-email/:token`

Email doğrulama token'ını kullanarak kullanıcı hesabını aktifleştirir.

**Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Codes:**
- `400` - Invalid or expired token

---

### 3. Login
**POST** `/auth/login`

Kullanıcı girişi yapar ve JWT token'ları döner.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "student",
    "full_name": "John Doe",
    "is_verified": true
  },
  "accessToken": "jwt-access-token"
}
```

**Error Codes:**
- `400` - Invalid credentials
- `401` - Email not verified

---

### 4. Refresh Token
**POST** `/auth/refresh`

Access token'ı yeniler.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "new-jwt-access-token"
}
```

**Error Codes:**
- `401` - Invalid refresh token

---

### 5. Logout
**POST** `/auth/logout`

Kullanıcı çıkışı yapar ve refresh token'ı geçersiz kılar.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

---

### 6. Forgot Password
**POST** `/auth/forgot-password`

Şifre sıfırlama email'i gönderir.

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

---

### 7. Reset Password
**POST** `/auth/reset-password/:token`

Şifre sıfırlama token'ı ile yeni şifre belirler.

**Request Body:**
```json
{
  "password": "NewPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Codes:**
- `400` - Invalid or expired token
- `400` - Password validation failed

---

## User Management Endpoints

### 8. Get Current User
**GET** `/users/me`

Mevcut kullanıcının profil bilgilerini getirir.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "role": "student",
  "full_name": "John Doe",
  "phone": "+905551234567",
  "profile_picture_url": "/uploads/profile-123.jpg",
  "student": {
    "student_number": "STU001",
    "department": {
      "name": "Computer Engineering",
      "code": "CENG"
    }
  }
}
```

---

### 9. Update Profile
**PUT** `/users/me`

Kullanıcı profil bilgilerini günceller.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "John Updated",
  "phone": "+905551234568"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "full_name": "John Updated",
    "phone": "+905551234568"
  }
}
```

---

### 10. Upload Profile Picture
**POST** `/users/me/profile-picture`

Profil fotoğrafı yükler.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData with field: profilePicture (file, max 5MB, jpg/png)
```

**Response (200 OK):**
```json
{
  "message": "Profile picture uploaded successfully",
  "profilePictureUrl": "/uploads/profile-123.jpg"
}
```

**Error Codes:**
- `400` - File too large or invalid format

---

### 11. Get All Users (Admin Only)
**GET** `/users`

Tüm kullanıcıları listeler (sadece admin).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `role` (optional) - Filter by role (student/faculty/admin)
- `department_id` (optional) - Filter by department
- `search` (optional) - Search by name or email

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "student@example.com",
      "role": "student",
      "full_name": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

**Error Codes:**
- `403` - Insufficient permissions (not admin)

---

## Error Response Format

Tüm hatalar aşağıdaki formatta döner:

```json
{
  "error": "Error message here"
}
```

Veya validation hataları için:

```json
{
  "error": "Validation error",
  "details": ["Error detail 1", "Error detail 2"]
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

