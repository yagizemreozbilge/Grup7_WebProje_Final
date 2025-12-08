# Dosya Temizleme Rehberi

Aşağıdaki klasör ve dosyalar görseldeki yapıya göre gereksizdir ve silinmelidir:

## Backend - Silinmesi Gerekenler

### Klasörler:
1. `backend/models/` - Gereksiz (backend/src/models kullanılacak)
2. `backend/config/` - Gereksiz (backend/src/config kullanılacak)
3. `backend/src/views/` - Gereksiz (REST API için gerekli değil)
4. `backend/src/public/` - Gereksiz (uploads için backend/uploads kullanılacak)

### Dosyalar:
1. `backend/src/package.json` - Gereksiz
2. `backend/src/package-lock.json` - Gereksiz

## Silme Komutları (PowerShell)

```powershell
cd backend

# Klasörleri sil
Remove-Item -Recurse -Force "models" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "config" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src\views" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src\public" -ErrorAction SilentlyContinue

# Dosyaları sil
Remove-Item "src\package.json" -ErrorAction SilentlyContinue
Remove-Item "src\package-lock.json" -ErrorAction SilentlyContinue
```

## Sonuç Yapısı

Silme işleminden sonra backend yapısı şöyle olmalı:

```
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── app.js
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

