# Backend - Campus Management System

## Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Environment değişkenlerini ayarlayın:**
`.env` dosyası oluşturun (`.env.example` dosyasına bakın):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://admin:password@localhost:5432/campus_db?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Smart Campus <noreply@campus.edu.tr>"
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

3. **Veritabanını oluşturun:**
```bash
npx prisma migrate dev
npx prisma db seed
```

4. **(Opsiyonel) Prisma Client üretimi:**
```bash
npx prisma generate
```

5. **Sunucuyu başlatın:**
```bash
# Development mode (nodemon ile)
npm run dev

# Production mode
npm start
```

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

Detaylı API dokümantasyonu için `API_DOCUMENTATION.md` dosyasına bakın.

## Test

```bash
npm test              # Tüm testler
npm run test:watch    # Watch mod
npm run test:coverage # Coverage
```

### Test Coverage

Coverage raporunu görüntülemek için:

1. **Coverage raporu oluştur:**
   ```bash
   npm run test:coverage
   ```

2. **HTML raporunu aç:**
   - Windows: `start coverage/lcov-report/index.html`
   - Mac/Linux: `open coverage/lcov-report/index.html`

3. **Coverage detayları:**
   - Terminal'de özet bilgi görünür
   - HTML raporunda detaylı bilgi var
   - Her dosya için satır satır coverage gösterilir

**Test Coverage:**
- Unit Tests: Auth service, User service
- Integration Tests: Auth endpoints (10+ tests), User endpoints (5+ tests)
- Minimum coverage: 85% (backend)
- Detaylı rehber için `COVERAGE_GUIDE.md` dosyasına bakın

## Scripts

- `npm start` - Production mode'da sunucuyu başlatır
- `npm run dev` - Development mode'da sunucuyu başlatır (nodemon)
- `npm run migrate` - Database migration'larını çalıştırır
- `npm run migrate:undo` - Son migration'ı geri alır
- `npm run seed` - Seed data'yı yükler
- `npm run seed:undo` - Seed data'yı temizler

## Proje Yapısı

```
backend/
├── config/          # Sequelize configuration
├── migrations/      # Database migrations
├── models/          # Sequelize models
├── seeders/         # Database seeders
├── src/
│   ├── bin/         # Server entry point (www.js)
│   ├── config/      # Configuration files
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Custom middleware (auth, authorization, validation, upload, errorHandler)
│   ├── routes/      # API routes
│   ├── services/    # Business logic (authService, userService, emailService)
│   ├── utils/       # Utility functions (jwt, validation)
│   └── app.js       # Express app
└── tests/           # Test files (unit, integration)
```

## Teknolojiler

- Node.js 18+ LTS
- Express.js 4+
- PostgreSQL 14+
- Sequelize (ORM)
- JWT (Authentication)
- bcrypt (Password Hashing)
- Multer (File Upload)
- NodeMailer (Email)
- Joi (Validation)
- Jest + Supertest (Testing)

## Seed Users

Test için hazır kullanıcılar:

- **Admin**: admin@campus.edu / Password123
- **Faculty**: prof.doe@campus.edu / Password123
- **Students**: student1@campus.edu through student5@campus.edu / Password123

