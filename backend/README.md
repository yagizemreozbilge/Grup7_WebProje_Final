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
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_db
DB_USER=admin
DB_PASSWORD=password
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

3. **Veritabanını oluşturun:**
```bash
createdb campus_db
```

4. **Migration'ları çalıştırın:**
```bash
npm run migrate
```

5. **Seed data'yı yükleyin:**
```bash
npm run seed
```

6. **Sunucuyu başlatın:**
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
npm test
```

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
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Custom middleware
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── utils/        # Utility functions
│   └── app.js        # Express app
└── tests/           # Test files
```

## Seed Users

Test için hazır kullanıcılar:

- **Admin**: admin@campus.edu / Password123
- **Faculty**: prof.doe@campus.edu / Password123
- **Students**: student1@campus.edu through student5@campus.edu / Password123

