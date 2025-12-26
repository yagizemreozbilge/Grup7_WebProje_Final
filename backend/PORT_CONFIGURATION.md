# Port Konfigürasyonu

## Port Ayarları

- **Frontend**: Port 3000
- **Backend**: Port 5000
- **Database**: Port 5432

## Frontend Port Ayarı

Frontend için `.env` dosyası oluşturuldu:
```
PORT=3000
REACT_APP_API_URL=http://localhost:5000
```

## Backend Port Ayarı

Backend portu `src/bin/www` dosyasında ayarlanmış:
```javascript
var port = normalizePort(process.env.PORT || '5000');
```

Environment variable ile değiştirilebilir:
```bash
PORT=5000 npm start
```

## Veritabanı Bağlantı Sorunu

Eğer veritabanına bağlanamıyorsanız:

1. **PostgreSQL servisinin çalıştığından emin olun:**
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Veritabanı bağlantı bilgilerini kontrol edin:**
   Backend `.env` dosyasında şu ayarlar olmalı:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/campus_db
   ```

3. **Veritabanının oluşturulduğundan emin olun:**
   ```sql
   CREATE DATABASE campus_db;
   ```

4. **Migration çalıştırma:**
   ```bash
   cd Grup7_WebProje_Final/backend
   npx prisma migrate dev --name add_part4_features
   npx prisma generate
   ```

## Test Etme

### Backend Test
```bash
cd Grup7_WebProje_Final/backend
npm start
# http://localhost:5000/api/v1/health adresine gidin
```

### Frontend Test
```bash
cd Grup7_WebProje_Frontend
npm start
# http://localhost:3000 adresine gidin
```

### Veritabanı Test
```bash
# PostgreSQL'e bağlan
psql -U postgres -d campus_db

# Tabloları kontrol et
\dt
```

