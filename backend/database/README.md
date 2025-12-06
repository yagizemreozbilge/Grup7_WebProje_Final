# Veritabanı Şeması

## Özet

Bu veritabanı şeması, Campus Management System için tasarlanmış kapsamlı bir PostgreSQL şemasıdır.

### Özellikler

- **38+ Tablo** (Minimum 30 gereksinimi karşılanıyor)
- **3NF Normalization**
- **Foreign Keys**: CASCADE ve RESTRICT uygun kullanım
- **Indexes**: Performance için tüm gerekli alanlara index
- **Constraints**: CHECK, UNIQUE, NOT NULL
- **JSONB**: Flexible data (schedule, metadata, preferences)
- **Soft Delete**: `deleted_at` pattern
- **Triggers**: Otomatik updated_at, enrollment count, vb.
- **Views**: Yaygın sorgular için hazır view'lar

## Tablolar (38)

### Core Tables
1. `users` - Ana kullanıcı tablosu
2. `students` - Öğrenci bilgileri
3. `faculty` - Öğretim üyesi bilgileri
4. `admins` - Admin bilgileri
5. `departments` - Bölümler

### Academic Tables
6. `semesters` - Dönemler
7. `courses` - Dersler
8. `course_sections` - Ders şubeleri
9. `schedules` - Ders programı
10. `enrollments` - Ders kayıtları
11. `grades` - Notlar

### Attendance Tables
12. `attendance_sessions` - Yoklama oturumları
13. `attendance_records` - Yoklama kayıtları
14. `excuse_requests` - Mazeret talepleri

### Facility Tables
15. `classrooms` - Derslikler
16. `reservations` - Rezervasyonlar

### Dining Tables
17. `meal_menus` - Yemek menüleri
18. `meal_reservations` - Yemek rezervasyonları

### Finance Tables
19. `wallets` - Dijital cüzdanlar
20. `transactions` - İşlem geçmişi

### Event Tables
21. `events` - Etkinlikler
22. `event_registrations` - Etkinlik kayıtları

### Communication Tables
23. `notifications` - Bildirimler
24. `notification_preferences` - Bildirim tercihleri
25. `announcements` - Duyurular

### Club Tables
26. `clubs` - Kulüpler
27. `club_memberships` - Kulüp üyelikleri

### IoT Tables
28. `iot_sensors` - IoT sensörleri
29. `sensor_data` - Sensör verileri

### System Tables
30. `audit_logs` - Audit logları
31. `password_resets` - Şifre sıfırlama
32. `email_verifications` - Email doğrulama
33. `session_tokens` - Oturum token'ları

### Library Tables
34. `library_books` - Kütüphane kitapları
35. `library_loans` - Kitap ödünç alma

### Parking Tables
36. `parking_spots` - Otopark yerleri
37. `parking_reservations` - Otopark rezervasyonları

### Calendar Tables
38. `academic_calendar` - Akademik takvim

## Kurulum

### 1. PostgreSQL'de veritabanı oluşturun

```sql
CREATE DATABASE campus_db;
```

### 2. Schema'yı yükleyin

```bash
psql -U postgres -d campus_db -f schema.sql
```

### 3. Seed data'yı yükleyin (opsiyonel)

```bash
psql -U postgres -d campus_db -f seed.sql
```

## Tek Komutla Kurulum

```bash
# Windows PowerShell
psql -U postgres -c "CREATE DATABASE campus_db;"
psql -U postgres -d campus_db -f backend/database/schema.sql
psql -U postgres -d campus_db -f backend/database/seed.sql

# Linux/Mac
sudo -u postgres psql -c "CREATE DATABASE campus_db;"
sudo -u postgres psql -d campus_db -f backend/database/schema.sql
sudo -u postgres psql -d campus_db -f backend/database/seed.sql
```

## Test Kullanıcıları

| Email | Şifre | Rol |
|-------|-------|-----|
| admin@campus.edu | Password123 | Admin |
| prof.smith@campus.edu | Password123 | Faculty |
| prof.johnson@campus.edu | Password123 | Faculty |
| student1@campus.edu | Password123 | Student |
| student2@campus.edu | Password123 | Student |

## ER Diagram

Tablolar arası ilişkiler:

```
users ─────┬───> students ───> departments
           ├───> faculty ────> departments
           └───> admins

courses ───> departments
course_sections ───┬───> courses
                   ├───> faculty (instructor)
                   ├───> classrooms
                   └───> semesters

enrollments ───┬───> students
               └───> course_sections

attendance_sessions ───> course_sections
attendance_records ───┬───> attendance_sessions
                      └───> students

wallets ───> users
transactions ───> wallets

events ───> users (organizer)
event_registrations ───┬───> events
                       └───> users

notifications ───> users
clubs ───> faculty (advisor)
club_memberships ───┬───> clubs
                    └───> users
```

## Performans Notları

- Tüm foreign key'lere index eklenmiştir
- Sık sorgulanan alanlara (email, status, dates) index eklenmiştir
- `sensor_data` tablosu büyük veri için partition'lanabilir
- View'lar yaygın sorgular için optimize edilmiştir

