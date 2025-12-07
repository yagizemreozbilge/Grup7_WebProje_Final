# Campus Management System - Database Schema Documentation

## 📊 Veritabanı Genel Bakış

**PostgreSQL 14+** kullanarak tasarlanmış kapsamlı bir kampüs yönetim sistemi veritabanı şeması.

### Özellikler

- ✅ **38+ Tablo** (Minimum 30+ gereksinim karşılandı)
- ✅ **3NF Normalization** 
- ✅ **Foreign Keys** (CASCADE ve RESTRICT uygun kullanımı)
- ✅ **Indexes** (Performance optimizasyonu)
- ✅ **Constraints** (CHECK, UNIQUE, NOT NULL)
- ✅ **JSONB** (Flexible data - schedule, metadata, preferences)
- ✅ **Soft Delete** (deleted_at timestamp pattern)
- ✅ **UUID Primary Keys**
- ✅ **Audit Logging**
- ✅ **Triggers** (Auto-update timestamps, count management)

---

## 📋 Tablo Listesi (38 Tablo)

### 🔐 Authentication & Users (5 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 1 | `users` | Ana kullanıcı tablosu (email, password, role, status) |
| 2 | `students` | Öğrenci bilgileri (student_number, gpa, cgpa, semester) |
| 3 | `faculty` | Akademik personel (employee_number, title, office) |
| 4 | `admins` | Yönetici bilgileri (permissions, access_level) |
| 5 | `session_tokens` | Oturum token yönetimi (JWT, refresh tokens) |

### 🔑 Security & Verification (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 6 | `password_resets` | Şifre sıfırlama token'ları |
| 7 | `email_verifications` | E-posta doğrulama token'ları |

### 🏛️ Academic Structure (6 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 8 | `departments` | Bölümler (code, faculty, head) |
| 9 | `semesters` | Akademik dönemler (fall, spring, summer) |
| 10 | `courses` | Ders kataloğu (credits, prerequisites) |
| 11 | `course_sections` | Dönemlik ders şubeleri |
| 12 | `schedules` | Haftalık ders programı |
| 13 | `academic_calendar` | Akademik takvim etkinlikleri |

### 📚 Enrollment & Grades (3 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 14 | `enrollments` | Ders kayıtları (status, grades) |
| 15 | `grades` | Detaylı not geçmişi (quiz, midterm, final) |
| 16 | `classrooms` | Derslik/Laboratuvar bilgileri |

### ✅ Attendance System (3 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 17 | `attendance_sessions` | Ders oturumları (QR code, topic) |
| 18 | `attendance_records` | Yoklama kayıtları (present, absent, late) |
| 19 | `excuse_requests` | Mazeret başvuruları (medical, official) |

### 🏠 Reservations (3 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 20 | `reservations` | Derslik/Oda rezervasyonları |
| 21 | `parking_spots` | Otopark yerleri |
| 22 | `parking_reservations` | Otopark rezervasyonları |

### 🍽️ Meal System (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 23 | `meal_menus` | Yemek menüleri (items, calories, allergens) |
| 24 | `meal_reservations` | Yemek rezervasyonları |

### 💰 Financial System (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 25 | `wallets` | Dijital cüzdanlar (balance, limits) |
| 26 | `transactions` | Finansal işlemler (deposit, payment, transfer) |

### 🎉 Events System (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 27 | `events` | Kampüs etkinlikleri (conference, workshop) |
| 28 | `event_registrations` | Etkinlik kayıtları |

### 🔔 Notifications (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 29 | `notifications` | Bildirimler (info, warning, success) |
| 30 | `notification_preferences` | Bildirim tercihleri |

### 📢 Communication (1 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 31 | `announcements` | Duyurular (pinned, target roles) |

### 👥 Clubs & Organizations (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 32 | `clubs` | Kulüpler (category, advisor) |
| 33 | `club_memberships` | Kulüp üyelikleri |

### 📚 Library System (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 34 | `library_books` | Kütüphane kitapları (ISBN, copies) |
| 35 | `library_loans` | Kitap ödünç işlemleri |

### 🌡️ IoT & Sensors (2 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 36 | `iot_sensors` | IoT sensör cihazları |
| 37 | `sensor_data` | Sensör verileri (time-series) |

### 📋 Audit & Logging (1 Tablo)

| # | Tablo | Açıklama |
|---|-------|----------|
| 38 | `audit_logs` | Sistem denetim kayıtları |

---

## 🔗 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USERS & AUTHENTICATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐    1:1    ┌──────────┐    1:1    ┌──────────┐            │
│   │ students │◄─────────►│  users   │◄─────────►│ faculty  │            │
│   └──────────┘           └──────────┘           └──────────┘            │
│        │                      │  │                   │                   │
│        │                      │  │                   │                   │
│        │                 1:N  │  │ 1:N               │                   │
│        │                      ▼  ▼                   │                   │
│        │               ┌──────────────┐              │                   │
│        │               │session_tokens│              │                   │
│        │               └──────────────┘              │                   │
│        │                                             │                   │
└────────┼─────────────────────────────────────────────┼───────────────────┘
         │                                             │
┌────────┼─────────────────────────────────────────────┼───────────────────┐
│        │              ACADEMIC STRUCTURE             │                   │
├────────┼─────────────────────────────────────────────┼───────────────────┤
│        │                                             │                   │
│        │  N:1   ┌─────────────┐   1:N                │  N:1              │
│        ├───────►│ departments │◄─────────────────────┤                   │
│        │        └─────────────┘                      │                   │
│        │               │                             │                   │
│        │          1:N  │                             │                   │
│        │               ▼                             │                   │
│        │        ┌──────────┐                         │                   │
│        │        │ courses  │                         │                   │
│        │        └──────────┘                         │                   │
│        │               │                             │                   │
│        │          1:N  │                             │                   │
│        │               ▼                             │                   │
│        │      ┌────────────────┐   N:1    ┌──────────┴──┐               │
│        │      │ course_sections │◄────────│  semesters  │               │
│        │      └────────────────┘          └─────────────┘               │
│        │               │                                                 │
│        │          1:N  │                                                 │
│        │               ▼                                                 │
│        │        ┌───────────┐                                           │
│        │        │ schedules │                                           │
│        │        └───────────┘                                           │
│        │                                                                 │
└────────┼─────────────────────────────────────────────────────────────────┘
         │
┌────────┼─────────────────────────────────────────────────────────────────┐
│        │              ENROLLMENT & ATTENDANCE                            │
├────────┼─────────────────────────────────────────────────────────────────┤
│        │                                                                 │
│        │        ┌─────────────┐                                         │
│        ├───────►│ enrollments │◄─────────────────────────┐              │
│        │  1:N   └─────────────┘   N:1                    │              │
│        │               │                                  │              │
│        │          1:N  │                      ┌───────────┴───┐          │
│        │               ▼                      │course_sections│          │
│        │         ┌────────┐                   └───────────────┘          │
│        │         │ grades │                          │                   │
│        │         └────────┘                     1:N  │                   │
│        │                                             ▼                   │
│        │        ┌───────────────────┐    ┌────────────────────┐          │
│        ├───────►│ attendance_records │◄──│ attendance_sessions│          │
│        │  1:N   └───────────────────┘    └────────────────────┘          │
│        │                                                                 │
└────────┼─────────────────────────────────────────────────────────────────┘
         │
┌────────┼─────────────────────────────────────────────────────────────────┐
│        │              CAMPUS SERVICES                                    │
├────────┼─────────────────────────────────────────────────────────────────┤
│        │                                                                 │
│  users │     ┌─────────┐   1:N   ┌──────────────┐                       │
│    │   │     │ wallets │◄───────►│ transactions │                       │
│    │   │     └─────────┘         └──────────────┘                       │
│    │   │                                                                 │
│    │   │     ┌────────────┐  N:N  ┌──────────┐                          │
│    ├───┼────►│meal_reserv.│◄─────►│meal_menus│                          │
│    │   │     └────────────┘       └──────────┘                          │
│    │   │                                                                 │
│    │   │     ┌────────────────────┐  N:1  ┌────────────┐                │
│    └───┼────►│event_registrations │◄─────►│   events   │                │
│        │     └────────────────────┘       └────────────┘                │
│        │                                                                 │
└────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 📊 ENUM Types

```sql
-- User & Status Enums
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin', 'staff');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- Academic Enums
CREATE TYPE semester_type AS ENUM ('fall', 'spring', 'summer');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'dropped', 'completed', 'failed', 'withdrawn');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Attendance Enums
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE excuse_status AS ENUM ('pending', 'approved', 'rejected');

-- Reservation & Transaction Enums
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'payment', 'refund', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Notification & Event Enums
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error', 'reminder');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

-- IoT Enums
CREATE TYPE sensor_type AS ENUM ('temperature', 'humidity', 'occupancy', 'air_quality', 'noise', 'light');
```

---

## 🔧 Database Setup

### Gereksinimler

- PostgreSQL 14+
- Docker (opsiyonel)

### Docker ile Kurulum (Önerilen)

```bash
# 1. Docker container'ı başlat
docker-compose up -d postgres

# 2. Şemayı oluştur
docker exec -i campus_postgres psql -U admin -d campus_db < backend/database/schema.sql

# 3. Seed data ekle
docker exec -i campus_postgres psql -U admin -d campus_db < backend/database/seed.sql
```

### Manuel Kurulum

```bash
# 1. PostgreSQL'e bağlan
psql -U postgres

# 2. Veritabanı oluştur
CREATE DATABASE campus_db;
CREATE USER admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE campus_db TO admin;

# 3. Veritabanına bağlan
\c campus_db

# 4. Şema ve seed dosyalarını çalıştır
\i backend/database/schema.sql
\i backend/database/seed.sql
```

### Windows PowerShell ile Kurulum

```powershell
# Docker ile
docker-compose up -d postgres
Start-Sleep -Seconds 10
Get-Content backend/database/schema.sql | docker exec -i campus_postgres psql -U admin -d campus_db
Get-Content backend/database/seed.sql | docker exec -i campus_postgres psql -U admin -d campus_db
```

---

## 📐 Design Patterns

### 1. Soft Delete Pattern

Belirli tablolarda `deleted_at` timestamp kullanılarak silinen kayıtlar korunur:

```sql
-- Soft deleted records
SELECT * FROM users WHERE deleted_at IS NULL;

-- All records including deleted
SELECT * FROM users;

-- Only deleted records
SELECT * FROM users WHERE deleted_at IS NOT NULL;
```

**Tablolar:** users, students, faculty, admins, departments, courses, course_sections, classrooms, events, announcements, clubs, library_books, iot_sensors

### 2. JSONB for Flexible Data

```sql
-- Örnek JSONB alanları
metadata JSONB DEFAULT '{}'
schedule_info JSONB DEFAULT '{}'
office_hours JSONB DEFAULT '{}'
preferences JSONB DEFAULT '{}'
equipment JSONB DEFAULT '{}'
```

### 3. Auto-updating Timestamps

```sql
-- Trigger ile otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 4. Count Triggers

```sql
-- Enrollment count otomatik güncelleme
CREATE TRIGGER enrollment_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_enrollment_count();

-- Club member count otomatik güncelleme
CREATE TRIGGER club_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON club_memberships
FOR EACH ROW EXECUTE FUNCTION update_club_member_count();
```

---

## 📊 Performance Indexes

### Primary Indexes

| Tablo | Index | Tip |
|-------|-------|-----|
| users | idx_users_email | UNIQUE |
| users | idx_users_role | B-TREE |
| students | idx_students_number | UNIQUE |
| courses | idx_courses_code | UNIQUE |
| classrooms | idx_classrooms_code | UNIQUE |

### Composite Indexes

| Tablo | Index | Columns |
|-------|-------|---------|
| schedules | idx_schedules_time | start_time, end_time |
| transactions | idx_transactions_reference | reference_type, reference_id |
| audit_logs | idx_audit_logs_entity | entity_type, entity_id |

### Partial Indexes (WHERE)

```sql
-- Sadece aktif kayıtlar için index
CREATE INDEX idx_users_verified ON users(is_verified) WHERE is_verified = true;
CREATE INDEX idx_courses_active ON courses(is_active) WHERE is_active = true;
CREATE INDEX idx_notifications_read ON notifications(is_read) WHERE is_read = false;
```

### Full-Text Search

```sql
-- Kitap başlığı araması için
CREATE INDEX idx_library_books_title ON library_books 
    USING gin(to_tsvector('english', title));
```

---

## 🔒 Constraints

### CHECK Constraints

```sql
-- GPA limitleri
CHECK (gpa >= 0 AND gpa <= 4.00)
CHECK (cgpa >= 0 AND cgpa <= 4.00)

-- Semester limiti
CHECK (current_semester >= 1 AND current_semester <= 12)

-- Kapasite kontrolü
CHECK (capacity > 0)
CHECK (enrolled_count >= 0)
CHECK (enrolled_count <= capacity)

-- Miktar kontrolü
CHECK (quantity > 0)
CHECK (amount > 0)

-- Tarih/zaman kontrolü
CHECK (end_date > start_date)
CHECK (end_time > start_time)
CHECK (end_datetime > start_datetime)
```

### UNIQUE Constraints

```sql
-- Email benzersizliği
UNIQUE (email)

-- Öğrenci/çalışan numarası
UNIQUE (student_number)
UNIQUE (employee_number)

-- Ders şubesi benzersizliği
UNIQUE (course_id, semester_id, section_number)

-- Kayıt benzersizliği
UNIQUE (student_id, section_id)
UNIQUE (event_id, user_id)
```

---

## 📊 Database Views

### v_active_students

```sql
-- Aktif öğrenci listesi
SELECT * FROM v_active_students;
-- Columns: id, student_number, full_name, email, department_name, gpa, cgpa, current_semester
```

### v_current_sections

```sql
-- Mevcut dönem ders şubeleri
SELECT * FROM v_current_sections;
-- Columns: id, course_code, course_name, section_number, instructor_name, classroom_name, capacity, enrolled_count, available_seats
```

### v_upcoming_events

```sql
-- Yaklaşan etkinlikler
SELECT * FROM v_upcoming_events;
-- Columns: id, title, event_type, start_datetime, end_datetime, location, capacity, registered_count, is_free, price, organizer_name
```

---

## 🔐 Security

### Password Hashing

```javascript
// bcrypt ile şifre hash'leme
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
```

### Token Management

- **Access Token:** 15 dakika geçerlilik
- **Refresh Token:** 7 gün geçerlilik
- **Token Hash:** Veritabanında hash olarak saklanır

### Audit Logging

Tüm önemli işlemler `audit_logs` tablosuna kaydedilir:
- User actions (login, logout, update)
- Data changes (old_values, new_values)
- IP address ve user agent
- Request details (method, endpoint, status_code)

---

## 📈 Sample Queries

### Öğrenci Not Ortalaması

```sql
SELECT 
    s.student_number,
    u.full_name,
    AVG(e.grade_points) as semester_gpa,
    s.cgpa
FROM students s
JOIN users u ON s.user_id = u.id
JOIN enrollments e ON s.id = e.student_id
WHERE e.status = 'completed'
GROUP BY s.id, s.student_number, u.full_name, s.cgpa;
```

### Ders Doluluk Oranı

```sql
SELECT 
    c.code,
    c.name,
    cs.section_number,
    cs.enrolled_count,
    cs.capacity,
    ROUND((cs.enrolled_count::decimal / cs.capacity) * 100, 1) as fill_rate
FROM course_sections cs
JOIN courses c ON cs.course_id = c.id
JOIN semesters sem ON cs.semester_id = sem.id
WHERE sem.is_current = true
ORDER BY fill_rate DESC;
```

### Yoklama Raporu

```sql
SELECT 
    u.full_name,
    s.student_number,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    ROUND(COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::decimal / COUNT(*) * 100, 1) as attendance_rate
FROM students s
JOIN users u ON s.user_id = u.id
JOIN attendance_records ar ON s.id = ar.student_id
JOIN attendance_sessions asess ON ar.session_id = asess.id
WHERE asess.section_id = 'section-uuid-here'
GROUP BY s.id, u.full_name, s.student_number;
```

---

## 📝 Version History

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| 1.0.0 | 2024-01 | İlk sürüm - 38 tablo |
| 1.0.1 | 2024-02 | Trigger ve view eklendi |
| 1.0.2 | 2024-03 | Performance index optimizasyonu |

---

## 📞 Support

Sorularınız için:
- GitHub Issues
- Email: support@campus.edu
