# Campus Management System

Web programlama dersi için geliştirilmiş modern bir kampüs yönetim sistemi.

## Özellikler

### Part 1 - Authentication & User Management ✅

- ✅ Kullanıcı kaydı (öğrenci, öğretim üyesi, admin)
- ✅ Email doğrulama sistemi
- ✅ JWT tabanlı login/logout
- ✅ Refresh token mekanizması
- ✅ Şifre sıfırlama (forgot password)
- ✅ Profil yönetimi (CRUD)
- ✅ Profil fotoğrafı yükleme
- ✅ Two-Factor Authentication (2FA) - Bonus

### Part 2 - Academic Management & GPS Attendance ✅

- ✅ Ders kataloğu ve kayıt sistemi
- ✅ GPS tabanlı yoklama sistemi
- ✅ Not girişi ve transkript
- ✅ Mazeret yönetimi

### Part 3 - Meal Reservation, Event Management & Scheduling ✅

- ✅ Yemek rezervasyonu ve QR kod
- ✅ Cüzdan sistemi
- ✅ Etkinlik yönetimi
- ✅ Ders programı oluşturma

### Part 4 - Analytics, Notifications & Admin Dashboard ✅

- ✅ Admin dashboard
- ✅ Analytics ve raporlama
- ✅ Bildirim sistemi
- ✅ IoT Dashboard (Bonus)
- ✅ WebSocket real-time updates (Bonus)
- ✅ Background cron jobs (Bonus)

## Teknoloji Stack

- **Backend**: Node.js 18, Express.js 5.2, PostgreSQL 14, Prisma 5.22
- **Frontend**: React 19.2, React Router DOM 6.30, Axios 1.6
- **DevOps**: Docker, Docker Compose, Nginx
- **Testing**: Jest, Supertest, React Testing Library
- **Real-time**: Socket.IO
- **Security**: JWT, bcrypt, Helmet, express-rate-limit

## Hızlı Başlangıç

### Docker Compose ile (Önerilen)

```bash
# Tüm servisleri başlat
docker-compose up

# Arka planda çalıştır
docker-compose up -d

# Servisleri durdur
docker-compose down
```

Backend: `http://localhost:5000`
Frontend: `http://localhost:3000`
PostgreSQL: `localhost:5432`

### Manuel Kurulum

#### Backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## Dokümantasyon

### Ana Dokümantasyon

- [Project Overview](PROJECT_OVERVIEW.md) - Proje genel bakışı ve teknoloji stack'i
- [Architecture](ARCHITECTURE.md) - Sistem mimarisi, teknoloji seçimleri, design patterns
- [API Documentation](API_DOCUMENTATION.md) - Tüm API endpoint'leri (60+ endpoints)
- [Database Schema](DATABASE_SCHEMA.md) - Veritabanı şeması ve ER diagram (30+ tables)
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Docker setup, environment variables, production deployment
- [User Manual](USER_MANUAL.md) - Kullanıcı kılavuzu (Öğrenci, Akademisyen, Admin)
- [Developer Guide](DEVELOPER_GUIDE.md) - Proje yapısı, coding conventions, testing guide
- [Test Report](TEST_REPORT.md) - Test coverage, test results, performance benchmarks
- [Analytics Guide](ANALYTICS_GUIDE.md) - Mevcut raporlar, veri yorumlama, export seçenekleri
- [Project Retrospective](PROJECT_RETROSPECTIVE.md) - Başarılar, zorluklar, gelecek geliştirmeler

### Ek Dokümantasyon

- [Requirements Compliance Report](REQUIREMENTS_COMPLIANCE_REPORT.md) - Gereksinimler uyumluluk raporu

## Test Kullanıcıları (Seed Verileri)

Sisteme giriş için aşağıdaki test hesapları kullanılabilir:

- **Yönetici (Admin)**: admin@campus.edu.tr / Password123
- **Öğretim Üyesi**: faculty1@campus.edu.tr / Password123
- **Öğrenci**: student1@campus.edu.tr / Password123

## Proje Yapısı

```
Grup7_WebProje_Final/
├── backend/          # Backend API
├── frontend/         # React frontend
├── docker-compose.yml # Docker configuration
└── docs/             # Documentation files
```

## Geliştirme

### Backend Scripts

```bash
npm start          # Production mode
npm run dev        # Development mode (nodemon)
npm run migrate    # Run migrations
npm run seed       # Seed database
npm test           # Run tests
```

### Frontend Scripts

```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

## Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## İletişim

Sorularınız için: mehmetsevri@gmail.com

