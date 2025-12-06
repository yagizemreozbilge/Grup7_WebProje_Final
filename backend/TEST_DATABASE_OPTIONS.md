# Test Veritabanı Seçenekleri

## Seçenek 1: Ayrı Test Veritabanı (ÖNERİLEN) ✅

### Avantajları:
- ✅ Production verileriniz güvende
- ✅ Testler birbirini etkilemez
- ✅ Her test çalıştırmada temiz başlangıç
- ✅ Production'da çalışan uygulama etkilenmez

### Nasıl Yapılır:
```sql
CREATE DATABASE campus_db_test;
```

## Seçenek 2: Development Veritabanını Kullan (Hızlı Test İçin)

Eğer sadece hızlıca test etmek istiyorsanız, test veritabanı yerine development veritabanını kullanabilirsiniz.

### config.json'u değiştirin:
```json
"test": {
  "username": "admin",
  "password": "password",
  "database": "campus_db",  // campus_db_test yerine campus_db
  "host": "localhost",
  "port": "5432",
  "dialect": "postgres"
}
```

⚠️ **UYARI**: Bu durumda testler development veritabanınızı temizleyecektir!

## Seçenek 3: SQLite Kullan (En Kolay)

Test için SQLite kullanabilirsiniz, PostgreSQL'e gerek kalmaz.

### config.json:
```json
"test": {
  "dialect": "sqlite",
  "storage": ":memory:"  // Bellekte çalışır, dosya gerekmez
}
```

### package.json'a sqlite3 ekleyin:
```json
"devDependencies": {
  "sqlite3": "^5.1.6"
}
```

## Öneri

**En kolay yol**: Seçenek 2'yi kullanın (development DB), ama sadece test için. Production'a geçmeden önce mutlaka ayrı test veritabanı oluşturun.

