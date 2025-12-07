# Frontend - Campus Management System

## Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Environment değişkenlerini ayarlayın:**
`.env` dosyası oluşturun:
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

3. **Development sunucusunu başlatın:**
```bash
npm start
```

Uygulama `http://localhost:3000` adresinde açılacaktır.

## Build

Production build oluşturmak için:

```bash
npm run build
```

Build dosyaları `build/` klasörüne oluşturulacaktır.

## Test

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage (HTML raporu oluşturur)
npm run test:coverage
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
- Component Tests: Login form, Register form
- Minimum coverage: 75% (frontend)
- Detaylı rehber için `COVERAGE_GUIDE.md` dosyasına bakın

## Proje Yapısı

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # React components (Navbar, Sidebar, ProtectedRoute, Form components)
│   ├── context/     # React context (Auth)
│   ├── pages/      # Page components (Login, Register, Dashboard, Profile, etc.)
│   ├── services/   # API services
│   ├── utils/      # Utility functions
│   ├── App.js      # Main app component
│   └── index.js    # Entry point
└── package.json
```

## Teknolojiler

- React 18+ (Hooks)
- React Router v6
- Context API (State Management)
- Axios (HTTP Client)
- React Hook Form (Form Handling)
- Yup (Validation)
- CSS Modules (Styling)

## Özellikler

- ✅ Login/Register sayfaları (React Hook Form + Yup validation)
- ✅ Email doğrulama
- ✅ Şifre sıfırlama
- ✅ Dashboard
- ✅ Profil yönetimi
- ✅ Profil fotoğrafı yükleme
- ✅ Protected routes
- ✅ Role-based navigation
- ✅ Remember me functionality
- ✅ 404 Not Found page
- ✅ Form components (TextInput, Select, Checkbox)

## Kullanım

Detaylı kullanım kılavuzu için `USER_MANUAL_PART1.md` dosyasına bakın.
