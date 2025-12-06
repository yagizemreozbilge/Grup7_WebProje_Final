# Backend Tests

Bu klasör backend için unit ve integration testlerini içerir.

## Test Yapısı

```
tests/
├── unit/              # Unit testler (service layer)
│   ├── authService.test.js
│   └── userService.test.js
├── integration/       # Integration testler (API endpoints)
│   ├── auth.test.js
│   └── users.test.js
├── utils/             # Test helper fonksiyonları
│   └── testHelpers.js
├── setup.js           # Test setup ve teardown
└── README.md
```

## Testleri Çalıştırma

### Tüm testleri çalıştır:
```bash
npm test
```

### Watch mode (değişiklikleri izle):
```bash
npm run test:watch
```

### Coverage raporu:
```bash
npm run test:coverage
```

## Test Gereksinimleri

1. **Test Database**: Testler için ayrı bir veritabanı kullanılır (`campus_db_test`)
2. **Environment**: `NODE_ENV=test` olarak ayarlanmalı
3. **Database Setup**: Testler çalışmadan önce migration'lar otomatik çalıştırılır

## Test Kategorileri

### Unit Tests
- **authService.test.js**: Authentication servis fonksiyonlarını test eder
  - User registration
  - Email verification
  - Login
  - Token refresh
  - Password reset

- **userService.test.js**: User management servis fonksiyonlarını test eder
  - Get current user
  - Update profile
  - Profile picture upload
  - Get all users (with pagination, filtering, search)

### Integration Tests
- **auth.test.js**: Authentication endpoint'lerini test eder
  - POST /api/v1/auth/register
  - POST /api/v1/auth/verify-email/:token
  - POST /api/v1/auth/login
  - POST /api/v1/auth/refresh
  - POST /api/v1/auth/logout
  - POST /api/v1/auth/forgot-password
  - POST /api/v1/auth/reset-password/:token

- **users.test.js**: User management endpoint'lerini test eder
  - GET /api/v1/users/me
  - PUT /api/v1/users/me
  - POST /api/v1/users/me/profile-picture
  - GET /api/v1/users (admin only)

## Test Coverage

Test coverage raporu için:
```bash
npm run test:coverage
```

Coverage raporu `coverage/` klasöründe oluşturulur.

## Notlar

- Testler her çalıştırmada veritabanını temizler (truncate)
- Test veritabanı production veritabanından ayrıdır
- Email servisleri mock'lanmıştır (gerçek email gönderilmez)
- File upload testleri için gerçek dosya veya buffer kullanılabilir

