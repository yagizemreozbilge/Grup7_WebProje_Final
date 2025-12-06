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
npm test
```

## Proje Yapısı

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # React components
│   ├── context/     # React context (Auth)
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── utils/       # Utility functions
│   ├── App.js       # Main app component
│   └── index.js     # Entry point
└── package.json
```

## Özellikler

- ✅ Login/Register sayfaları
- ✅ Email doğrulama
- ✅ Şifre sıfırlama
- ✅ Dashboard
- ✅ Profil yönetimi
- ✅ Profil fotoğrafı yükleme
- ✅ Protected routes
- ✅ Role-based navigation

## Kullanım

Detaylı kullanım kılavuzu için `USER_MANUAL_PART1.md` dosyasına bakın.
