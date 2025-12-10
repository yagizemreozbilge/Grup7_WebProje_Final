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

## Teknoloji Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Sequelize
- **Frontend**: React, React Router, Axios
- **DevOps**: Docker, Docker Compose

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

- [Project Overview](PROJECT_OVERVIEW.md) - Proje genel bakışı
- [API Documentation](API_DOCUMENTATION.md) - API endpoint'leri
- [Database Schema](DATABASE_SCHEMA.md) - Veritabanı şeması
- [User Manual](USER_MANUAL_PART1.md) - Kullanım kılavuzu
- [Test Report](TEST_REPORT_PART1.md) - Test raporu

## Test Kullanıcıları

Seed data ile birlikte gelen test kullanıcıları:

- **Admin**: admin@campus.edu / Password123
- **Faculty**: prof.doe@campus.edu / Password123
- **Students**: student1@campus.edu - student5@campus.edu / Password123

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

