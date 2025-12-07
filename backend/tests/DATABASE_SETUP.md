# Test Veritabanı Kurulumu

Testlerin çalışması için ayrı bir test veritabanı oluşturulmalıdır.

## PostgreSQL'de Test Veritabanı Oluşturma

```sql
-- PostgreSQL'de test veritabanı oluştur
CREATE DATABASE campus_db_test;

-- Veya psql komut satırından:
-- createdb -U postgres campus_db_test
```

## Test Veritabanı Yapılandırması

Test veritabanı `backend/src/config/config.json` dosyasında yapılandırılmıştır:

```json
"test": {
  "username": "postgres",
  "password": "postgres",
  "database": "campus_db_test",
  "host": "localhost",
  "port": "5432",
  "dialect": "postgres",
  "logging": false
}
```

## Testleri Çalıştırma

Testler otomatik olarak veritabanını oluşturur ve temizler:

```bash
cd backend
npm run test:coverage
```

## Sorun Giderme

Eğer testler çalışmıyorsa:

1. PostgreSQL'in çalıştığından emin olun
2. Test veritabanının oluşturulduğundan emin olun
3. Kullanıcı adı ve şifrenin doğru olduğundan emin olun
4. `.env` dosyasında test veritabanı ayarlarını kontrol edin
