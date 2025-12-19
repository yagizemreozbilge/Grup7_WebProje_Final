# API Documentation - Part 3

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
Tüm protected endpoint'ler için `Authorization` header'ında Bearer token gönderilmelidir:
```
Authorization: Bearer <access_token>
```

---

## Meal Service Endpoints

### 1. Get Menus
**GET** `/meals/menus`

Menü listesini getirir. Tarih, yemekhane ve öğün tipine göre filtreleme yapılabilir.

**Query Parameters:**
- `date` (optional): Tarih filtresi (YYYY-MM-DD formatında)
- `cafeteria_id` (optional): Yemekhane ID'si
- `meal_type` (optional): Öğün tipi (`lunch` veya `dinner`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cafeteria_id": "uuid",
      "date": "2025-12-20T00:00:00.000Z",
      "meal_type": "lunch",
      "items_json": {
        "main": "Tavuk Izgara",
        "side": "Pilav",
        "salad": "Çoban Salata",
        "dessert": "Sütlaç"
      },
      "nutrition_json": {
        "calories": 650,
        "protein": 45,
        "carbs": 60,
        "fat": 20
      },
      "is_published": true,
      "cafeteria": {
        "id": "uuid",
        "name": "Merkez Yemekhane",
        "location": "A Blok"
      }
    }
  ]
}
```

---

### 2. Get Menu by ID
**GET** `/meals/menus/:id`

Belirli bir menünün detaylarını getirir.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cafeteria_id": "uuid",
    "date": "2025-12-20T00:00:00.000Z",
    "meal_type": "lunch",
    "items_json": {...},
    "nutrition_json": {...},
    "cafeteria": {...}
  }
}
```

**Error Codes:**
- `404` - Menu not found

---

### 3. Create Menu (Admin Only)
**POST** `/meals/menus`

Yeni bir menü oluşturur.

**Request Body:**
```json
{
  "cafeteria_id": "uuid",
  "date": "2025-12-20",
  "meal_type": "lunch",
  "items_json": {
    "main": "Tavuk Izgara",
    "side": "Pilav",
    "salad": "Çoban Salata"
  },
  "nutrition_json": {
    "calories": 650,
    "protein": 45,
    "carbs": 60,
    "fat": 20
  },
  "is_published": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cafeteria_id": "uuid",
    "date": "2025-12-20T00:00:00.000Z",
    "meal_type": "lunch",
    "items_json": {...},
    "nutrition_json": {...},
    "is_published": false
  }
}
```

**Authorization:** Admin only

---

### 4. Update Menu (Admin Only)
**PUT** `/meals/menus/:id`

Mevcut bir menüyü günceller.

**Request Body:** (Tüm alanlar opsiyonel)
```json
{
  "items_json": {...},
  "nutrition_json": {...},
  "is_published": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Authorization:** Admin only

---

### 5. Delete Menu (Admin Only)
**DELETE** `/meals/menus/:id`

Bir menüyü siler.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Menu deleted successfully"
}
```

**Authorization:** Admin only

---

### 6. Create Reservation
**POST** `/meals/reservations`

Yemek rezervasyonu oluşturur. Burslu öğrenciler için günlük kota kontrolü yapılır (max 2 öğün/gün).

**Request Body:**
```json
{
  "menu_id": "uuid"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "menu_id": "uuid",
    "cafeteria_id": "uuid",
    "meal_type": "lunch",
    "date": "2025-12-20T00:00:00.000Z",
    "amount": 0,
    "qr_code": "unique-qr-code-string",
    "status": "reserved",
    "created_at": "2025-12-19T10:30:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Daily quota exceeded (burslu öğrenciler için)
- `400` - Insufficient wallet balance (ücretli öğrenciler için)
- `404` - Menu not found

---

### 7. Cancel Reservation
**DELETE** `/meals/reservations/:id`

Yemek rezervasyonunu iptal eder. En az 2 saat önceden iptal edilmelidir.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation cancelled successfully"
}
```

**Error Codes:**
- `400` - Cannot cancel less than 2 hours before meal time
- `404` - Reservation not found

---

### 8. Get My Reservations
**GET** `/meals/reservations/my-reservations`

Kullanıcının tüm rezervasyonlarını getirir.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "menu_id": "uuid",
      "cafeteria_id": "uuid",
      "meal_type": "lunch",
      "date": "2025-12-20T00:00:00.000Z",
      "qr_code": "unique-qr-code-string",
      "status": "reserved",
      "used_at": null,
      "menu": {
        "items_json": {...},
        "nutrition_json": {...}
      }
    }
  ]
}
```

---

### 9. Use Reservation (Admin/Faculty Only)
**POST** `/meals/reservations/:id/use`

QR kod ile yemek kullanımını işaretler. Yemekhane personeli tarafından kullanılır.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation used successfully",
  "data": {
    "id": "uuid",
    "status": "used",
    "used_at": "2025-12-20T12:30:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Reservation already used
- `400` - Invalid QR code or date mismatch
- `404` - Reservation not found

**Authorization:** Admin, Faculty only

---

## Wallet Endpoints

### 10. Get Balance
**GET** `/wallet/balance`

Kullanıcının cüzdan bakiyesini getirir. Eğer cüzdan yoksa otomatik oluşturulur.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "balance": 150.50,
    "currency": "TRY",
    "is_active": true
  }
}
```

---

### 11. Top Up Wallet
**POST** `/wallet/topup`

Cüzdana para yüklemek için ödeme oturumu oluşturur. Minimum tutar 50 TRY'dir.

**Request Body:**
```json
{
  "amount": 100
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "payment_1234567890_uuid",
    "paymentUrl": "http://localhost:5000/payment/payment_1234567890_uuid",
    "amount": 100,
    "expiresAt": "2025-12-19T10:45:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Minimum top-up amount is 50 TRY

**Not:** Production'da bu endpoint gerçek ödeme gateway'i (Stripe/PayTR) ile entegre edilmelidir.

---

### 12. Payment Webhook
**POST** `/wallet/topup/webhook`

Ödeme gateway'inden gelen webhook'u işler. Ödeme başarılı olduğunda cüzdan bakiyesi güncellenir.

**Request Headers:**
```
X-Payment-Signature: <signature>
```

**Request Body:**
```json
{
  "sessionId": "payment_1234567890_uuid",
  "status": "success",
  "amount": 100,
  "userId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment processed successfully"
}
```

**Not:** Production'da signature doğrulaması yapılmalıdır.

---

### 13. Get Transactions
**GET** `/wallet/transactions`

Cüzdan işlem geçmişini getirir.

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt sayısı (default: 20)
- `type` (optional): İşlem tipi (`credit` veya `debit`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "wallet_id": "uuid",
      "type": "credit",
      "amount": 100,
      "balance_after": 150.50,
      "reference_type": "topup",
      "reference_id": "payment_1234567890_uuid",
      "description": "Wallet top-up - 100 TRY",
      "created_at": "2025-12-19T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## Event Management Endpoints

### 14. Get Events
**GET** `/events`

Etkinlik listesini getirir.

**Query Parameters:**
- `category` (optional): Etkinlik kategorisi
- `date` (optional): Tarih filtresi
- `status` (optional): Durum (`upcoming`, `ongoing`, `past`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Teknoloji Konferansı",
      "description": "Yapay zeka ve gelecek teknolojileri",
      "category": "conference",
      "date": "2025-12-25T00:00:00.000Z",
      "start_time": "10:00",
      "end_time": "17:00",
      "location": "Konferans Salonu",
      "capacity": 200,
      "registered_count": 45,
      "registration_deadline": "2025-12-24T23:59:59.000Z",
      "is_paid": false,
      "price": null,
      "status": "upcoming"
    }
  ]
}
```

---

### 15. Get Event by ID
**GET** `/events/:id`

Belirli bir etkinliğin detaylarını getirir.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Teknoloji Konferansı",
    "description": "...",
    "category": "conference",
    "date": "2025-12-25T00:00:00.000Z",
    "start_time": "10:00",
    "end_time": "17:00",
    "location": "Konferans Salonu",
    "capacity": 200,
    "registered_count": 45,
    "registration_deadline": "2025-12-24T23:59:59.000Z",
    "is_paid": false,
    "price": null,
    "status": "upcoming"
  }
}
```

**Error Codes:**
- `404` - Event not found

---

### 16. Create Event (Admin Only)
**POST** `/events`

Yeni bir etkinlik oluşturur.

**Request Body:**
```json
{
  "title": "Teknoloji Konferansı",
  "description": "Yapay zeka ve gelecek teknolojileri",
  "category": "conference",
  "date": "2025-12-25",
  "start_time": "10:00",
  "end_time": "17:00",
  "location": "Konferans Salonu",
  "capacity": 200,
  "registration_deadline": "2025-12-24T23:59:59.000Z",
  "is_paid": false,
  "price": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Teknoloji Konferansı",
    ...
  }
}
```

**Authorization:** Admin only

---

### 17. Update Event (Admin Only)
**PUT** `/events/:id`

Mevcut bir etkinliği günceller.

**Request Body:** (Tüm alanlar opsiyonel)
```json
{
  "title": "Güncellenmiş Başlık",
  "capacity": 250
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Authorization:** Admin only

---

### 18. Delete Event (Admin Only)
**DELETE** `/events/:id`

Bir etkinliği siler.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Authorization:** Admin only

---

### 19. Register for Event
**POST** `/events/:id/register`

Etkinliğe kayıt olur. Kapasite kontrolü yapılır.

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_id": "uuid",
    "user_id": "uuid",
    "registration_date": "2025-12-19T10:30:00.000Z",
    "qr_code": "unique-qr-code-string",
    "checked_in": false,
    "checked_in_at": null
  }
}
```

**Error Codes:**
- `400` - Event is full
- `400` - Registration deadline passed
- `400` - Already registered
- `404` - Event not found

---

### 20. Cancel Registration
**DELETE** `/events/:eventId/registrations/:regId`

Etkinlik kaydını iptal eder.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registration cancelled successfully"
}
```

**Error Codes:**
- `404` - Registration not found

---

### 21. Get Event Registrations (Admin Only)
**GET** `/events/:id/registrations`

Etkinliğe kayıtlı kullanıcıları getirir.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "user_id": "uuid",
      "registration_date": "2025-12-19T10:30:00.000Z",
      "qr_code": "unique-qr-code-string",
      "checked_in": false,
      "user": {
        "id": "uuid",
        "email": "student@example.com",
        "full_name": "John Doe"
      }
    }
  ]
}
```

**Authorization:** Admin only

---

### 22. Check In (Admin Only)
**POST** `/events/:eventId/registrations/:regId/checkin`

QR kod ile etkinlik girişini işaretler.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": "uuid",
    "checked_in": true,
    "checked_in_at": "2025-12-25T10:00:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Already checked in
- `404` - Registration not found

**Authorization:** Admin only

---

## Course Scheduling Endpoints

### 23. Generate Schedule (Admin Only)
**POST** `/scheduling/generate`

Otomatik ders programı oluşturur. Constraint Satisfaction Problem (CSP) algoritması kullanılır.

**Request Body:**
```json
{
  "semester": "Fall",
  "year": 2025,
  "section_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scheduleId": "uuid",
    "sections": [
      {
        "section_id": "uuid",
        "course_code": "CENG101",
        "instructor_name": "Dr. Ahmet Yılmaz",
        "day_of_week": "Monday",
        "start_time": "09:00",
        "end_time": "11:00",
        "classroom": "A-101",
        "capacity": 50
      }
    ],
    "conflicts": [],
    "warnings": []
  }
}
```

**Authorization:** Admin only

**Not:** Algoritma detayları için `SCHEDULING_ALGORITHM.md` dosyasına bakın.

---

### 24. Get Schedule
**GET** `/scheduling/:scheduleId`

Oluşturulmuş bir programı getirir.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scheduleId": "uuid",
    "semester": "Fall",
    "year": 2025,
    "sections": [...],
    "created_at": "2025-12-19T10:30:00.000Z"
  }
}
```

---

### 25. Get My Schedule
**GET** `/scheduling/my-schedule`

Kullanıcının (öğrenci/öğretim üyesi) kişisel ders programını getirir.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "monday": [
      {
        "section_id": "uuid",
        "course_code": "CENG101",
        "course_name": "Programlama",
        "instructor_name": "Dr. Ahmet Yılmaz",
        "start_time": "09:00",
        "end_time": "11:00",
        "classroom": "A-101"
      }
    ],
    "tuesday": [...],
    "wednesday": [...],
    "thursday": [...],
    "friday": [...]
  }
}
```

---

### 26. Export Schedule to iCal
**GET** `/scheduling/my-schedule/ical`

Kişisel ders programını iCal formatında (.ics dosyası) indirir.

**Response (200 OK):**
```
Content-Type: text/calendar
Content-Disposition: attachment; filename="schedule.ics"

BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Campus Management System//EN
BEGIN:VEVENT
UID:uuid@campus.edu.tr
DTSTART:20251220T090000
DTEND:20251220T110000
SUMMARY:CENG101 - Programlama
LOCATION:A-101
END:VEVENT
END:VCALENDAR
```

---

## Classroom Reservation Endpoints

### 27. Create Reservation
**POST** `/reservations`

Derslik rezervasyonu oluşturur.

**Request Body:**
```json
{
  "classroom_id": "uuid",
  "date": "2025-12-25",
  "start_time": "14:00",
  "end_time": "16:00",
  "purpose": "Toplantı"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "classroom_id": "uuid",
    "user_id": "uuid",
    "date": "2025-12-25T00:00:00.000Z",
    "start_time": "14:00",
    "end_time": "16:00",
    "purpose": "Toplantı",
    "status": "pending",
    "created_at": "2025-12-19T10:30:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Classroom not available at requested time
- `400` - Time conflict detected

---

### 28. Get Reservations
**GET** `/reservations`

Rezervasyon listesini getirir.

**Query Parameters:**
- `date` (optional): Tarih filtresi
- `classroom_id` (optional): Derslik ID'si
- `status` (optional): Durum (`pending`, `approved`, `rejected`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "classroom_id": "uuid",
      "user_id": "uuid",
      "date": "2025-12-25T00:00:00.000Z",
      "start_time": "14:00",
      "end_time": "16:00",
      "purpose": "Toplantı",
      "status": "pending",
      "classroom": {
        "id": "uuid",
        "building": "A Blok",
        "room_number": "101",
        "capacity": 50
      }
    }
  ]
}
```

---

### 29. Approve Reservation (Admin Only)
**PUT** `/reservations/:id/approve`

Rezervasyonu onaylar.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation approved",
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "admin-uuid"
  }
}
```

**Authorization:** Admin only

---

### 30. Reject Reservation (Admin Only)
**PUT** `/reservations/:id/reject`

Rezervasyonu reddeder.

**Request Body:**
```json
{
  "reason": "Kapasite yetersiz"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation rejected",
  "data": {
    "id": "uuid",
    "status": "rejected"
  }
}
```

**Authorization:** Admin only

---

## Error Responses

Tüm endpoint'ler için standart hata formatı:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes:
- `400` - Bad Request (validation error, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate entry, conflict)
- `500` - Internal Server Error

---

## Rate Limiting

API rate limiting uygulanmaktadır:
- **Window:** 15 dakika
- **Max Requests:** 100 istek
- Rate limit aşıldığında `429 Too Many Requests` hatası döner.

---

## Notes

1. **QR Code Format:** QR kodlar benzersiz UUID'lerdir ve her rezervasyon/kayıt için otomatik oluşturulur.

2. **Payment Integration:** Şu anda mock payment service kullanılmaktadır. Production'da Stripe veya PayTR entegrasyonu yapılmalıdır.

3. **Scheduling Algorithm:** CSP (Constraint Satisfaction Problem) algoritması kullanılmaktadır. Detaylar için `SCHEDULING_ALGORITHM.md` dosyasına bakın.

4. **Time Zones:** Tüm tarih/saat değerleri UTC formatındadır. Frontend'de kullanıcının zaman dilimine göre dönüştürülmelidir.

