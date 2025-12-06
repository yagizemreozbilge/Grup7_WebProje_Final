# Campus Management System - Project Overview

## Proje Tanımı

Campus Management System, modern ve güvenli bir kullanıcı kimlik doğrulama ve yönetim sistemi içeren bir web uygulamasıdır. Sistem, öğrenciler, öğretim üyeleri ve yöneticiler için farklı rollerde kullanıcı yönetimi sağlar.

## Teknoloji Stack'i

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - İlişkisel veritabanı
- **Sequelize** - ORM (Object-Relational Mapping)
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **NodeMailer** - Email servisi
- **Multer** - File upload middleware

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Axios** - HTTP client
- **Formik & Yup** - Form validation (hazırlanmış)

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Proje Yapısı

```
Grup7_WebProje_Final/
├── backend/
│   ├── config/
│   │   └── config.json          # Sequelize configuration
│   ├── migrations/               # Database migrations
│   ├── models/                   # Sequelize models
│   ├── seeders/                  # Database seeders
│   ├── src/
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Custom middleware
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── utils/                # Utility functions
│   │   └── app.js                # Express app
│   ├── tests/                    # Test files
│   ├── uploads/                  # Uploaded files
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── context/              # React context
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   ├── utils/                # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── docker-compose.yml
└── README.md
```

## Grup Üyeleri ve Görev Dağılımı

### Grup Üyesi: [İsim]
- **Görevler:**
  - Backend API geliştirme
  - Authentication & Authorization
  - Database design & migrations
  - Frontend development
  - Testing
  - Documentation

## Özellikler

### Authentication & User Management
- ✅ Kullanıcı kaydı (öğrenci, öğretim üyesi, admin)
- ✅ Email doğrulama sistemi
- ✅ JWT tabanlı login/logout
- ✅ Refresh token mekanizması
- ✅ Şifre sıfırlama (forgot password)
- ✅ Profil yönetimi (CRUD)
- ✅ Profil fotoğrafı yükleme
- ⏳ 2FA (Two-Factor Authentication) - İsteğe bağlı

### Güvenlik Özellikleri
- Password hashing: bcrypt (10 salt rounds)
- JWT token expiry: Access token 15 dakika, Refresh token 7 gün
- Email servis: NodeMailer + Gmail SMTP
- Dosya upload: Multer middleware (max 5MB, jpg/png)
- CORS protection
- Input validation

## Kurulum ve Çalıştırma

Detaylı kurulum talimatları için `README.md` dosyasına bakınız.

### Hızlı Başlangıç

```bash
# Docker Compose ile
docker-compose up

# Manuel kurulum
cd backend
npm install
npm run migrate
npm run seed
npm start

cd ../frontend
npm install
npm start
```

## API Endpoints

Detaylı API dokümantasyonu için `API_DOCUMENTATION.md` dosyasına bakınız.

## Veritabanı Şeması

Detaylı veritabanı şeması için `DATABASE_SCHEMA.md` dosyasına bakınız.

## Test Raporu

Test sonuçları için `TEST_REPORT_PART1.md` dosyasına bakınız.

