# 🗄️ Campus Management System - Database

PostgreSQL 14+ veritabanı şeması ve seed verileri.

## 📊 Özellikler

- ✅ **38+ Tablo** - Kapsamlı kampüs yönetim sistemi
- ✅ **3NF Normalizasyon** - Veri bütünlüğü
- ✅ **Foreign Keys** - CASCADE ve RESTRICT
- ✅ **Indexes** - Performance optimizasyonu
- ✅ **Constraints** - CHECK, UNIQUE, NOT NULL
- ✅ **JSONB** - Esnek veri yapıları
- ✅ **Soft Delete** - deleted_at pattern
- ✅ **Triggers** - Otomatik sayaç ve timestamp
- ✅ **Views** - Hazır raporlama

## 📁 Dosya Yapısı

```
backend/database/
├── schema.sql          # Ana veritabanı şeması (38+ tablo)
├── seed.sql            # Test/demo verileri
├── init-db.sql         # Tam kurulum scripti
├── setup-database.ps1  # Windows PowerShell setup
└── README.md           # Bu dosya
```

## 🚀 Hızlı Kurulum

### Windows (PowerShell)

```powershell
# Proje kök dizininde çalıştır
cd backend/database
.\setup-database.ps1
```

### Docker Compose

```bash
# 1. PostgreSQL container başlat
docker-compose up -d postgres

# 2. Container hazır olana kadar bekle
docker exec campus_postgres pg_isready -U admin

# 3. Şema oluştur
docker exec -i campus_postgres psql -U admin -d campus_db < backend/database/schema.sql

# 4. Seed data yükle
docker exec -i campus_postgres psql -U admin -d campus_db < backend/database/seed.sql
```

### Windows PowerShell (Manuel)

```powershell
# PostgreSQL başlat
docker-compose up -d postgres

# 10 saniye bekle
Start-Sleep -Seconds 10

# Şema ve seed yükle
Get-Content backend/database/schema.sql | docker exec -i campus_postgres psql -U admin -d campus_db
Get-Content backend/database/seed.sql | docker exec -i campus_postgres psql -U admin -d campus_db
```

## 🔗 Bağlantı Bilgileri

| Parametre | Değer |
|-----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | campus_db |
| Username | admin |
| Password | password |

### Connection String

```
postgresql://admin:password@localhost:5432/campus_db
```

## 👤 Test Kullanıcıları

Tüm kullanıcıların şifresi: `Password123`

| Role | Email | Açıklama |
|------|-------|----------|
| Admin | admin@campus.edu | Sistem yöneticisi |
| Faculty | prof.smith@campus.edu | Profesör |
| Faculty | prof.johnson@campus.edu | Doçent |
| Faculty | dr.williams@campus.edu | Yrd. Doç. |
| Student | student1@campus.edu | Alice Brown |
| Student | student2@campus.edu | Bob Wilson |
| Student | student3@campus.edu | Carol Davis |
| Student | student4@campus.edu | David Miller |
| Student | student5@campus.edu | Eva Martinez |

## 📋 Tablo Listesi (38 Tablo)

### Kullanıcı & Kimlik Doğrulama
1. `users` - Ana kullanıcı tablosu
2. `students` - Öğrenci bilgileri
3. `faculty` - Akademik personel
4. `admins` - Yönetici bilgileri
5. `session_tokens` - Oturum yönetimi
6. `password_resets` - Şifre sıfırlama
7. `email_verifications` - E-posta doğrulama

### Akademik Yapı
8. `departments` - Bölümler
9. `semesters` - Dönemler
10. `courses` - Dersler
11. `course_sections` - Ders şubeleri
12. `schedules` - Ders programı
13. `academic_calendar` - Akademik takvim

### Kayıt & Notlar
14. `enrollments` - Ders kayıtları
15. `grades` - Detaylı notlar
16. `classrooms` - Derslikler

### Yoklama
17. `attendance_sessions` - Yoklama oturumları
18. `attendance_records` - Yoklama kayıtları
19. `excuse_requests` - Mazeret başvuruları

### Rezervasyonlar
20. `reservations` - Derslik rezervasyonları
21. `parking_spots` - Otopark yerleri
22. `parking_reservations` - Otopark rezervasyonları

### Yemek Sistemi
23. `meal_menus` - Yemek menüleri
24. `meal_reservations` - Yemek rezervasyonları

### Finans
25. `wallets` - Dijital cüzdanlar
26. `transactions` - Finansal işlemler

### Etkinlikler
27. `events` - Kampüs etkinlikleri
28. `event_registrations` - Etkinlik kayıtları

### Bildirimler
29. `notifications` - Bildirimler
30. `notification_preferences` - Bildirim tercihleri

### İletişim
31. `announcements` - Duyurular

### Kulüpler
32. `clubs` - Kulüpler
33. `club_memberships` - Kulüp üyelikleri

### Kütüphane
34. `library_books` - Kitaplar
35. `library_loans` - Ödünç işlemleri

### IoT
36. `iot_sensors` - Sensörler
37. `sensor_data` - Sensör verileri

### Denetim
38. `audit_logs` - Denetim kayıtları

## 🔍 Faydalı Sorgular

### Veritabanına Bağlan

```bash
docker exec -it campus_postgres psql -U admin -d campus_db
```

### Tüm Tabloları Listele

```sql
\dt
```

### Tablo Yapısını Gör

```sql
\d+ users
\d+ students
\d+ courses
```

### Aktif Öğrenciler

```sql
SELECT * FROM v_active_students;
```

### Mevcut Dönem Dersleri

```sql
SELECT * FROM v_current_sections;
```

### Yaklaşan Etkinlikler

```sql
SELECT * FROM v_upcoming_events;
```

## 🔄 Veritabanını Sıfırla

```bash
# Container'ı durdur ve sil
docker-compose down -v

# Yeniden başlat
docker-compose up -d postgres

# Şema ve seed yükle
docker exec -i campus_postgres psql -U admin -d campus_db < backend/database/schema.sql
docker exec -i campus_postgres psql -U admin -d campus_db < backend/database/seed.sql
```

## 📝 Notlar

- Şema PostgreSQL 14+ gerektirir
- UUID extension kullanılmaktadır
- Soft delete pattern bazı tablolarda uygulanmıştır
- JSONB alanları metadata ve esnek veri için kullanılmaktadır
- Tüm tablolar `created_at` ve `updated_at` timestamp'leri içerir
