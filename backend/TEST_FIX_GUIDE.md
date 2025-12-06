# Test Hatalarını Düzeltme Kılavuzu

## Yapılması Gerekenler

### 1. Bağımlılıkları Yükle

```powershell
cd backend
npm install
```

Bu komut tüm bağımlılıkları (jest, supertest, cross-env) yükleyecektir.

### 2. Test Veritabanını Oluştur

PostgreSQL'de test veritabanını oluşturun:

```sql
CREATE DATABASE campus_db_test;
```

Veya psql komut satırından:
```bash
psql -U admin -c "CREATE DATABASE campus_db_test;"
```

### 3. Testleri Çalıştır

```powershell
npm run test:coverage
```

## Düzeltilen Sorunlar

### ✅ 1. Windows NODE_ENV Sorunu
- `cross-env` paketi eklendi
- Script'ler Windows'ta da çalışacak şekilde güncellendi

### ✅ 2. Sequelize Naming Collision
- Department model'inde `as: 'faculty'` → `as: 'facultyMembers'` olarak değiştirildi
- Bu, Department tablosundaki `faculty` attribute'u ile çakışmayı önler

### ✅ 3. Eksik Bağımlılıklar
- `npm install` komutu ile tüm bağımlılıklar yüklenecek

## Hala Sorun Varsa

### Supertest Bulunamıyor Hatası
```powershell
npm install supertest --save-dev
```

### Jest Bulunamıyor Hatası
```powershell
npm install jest --save-dev
```

### Database Connection Hatası
`.env` dosyasında test veritabanı ayarlarını kontrol edin veya `config/config.json` dosyasındaki test ayarlarını kontrol edin.

