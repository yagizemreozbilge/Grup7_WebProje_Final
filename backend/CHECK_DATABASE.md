# Veritabanı Bağlantı Kontrolü

## Sorun: Can't reach database server at `localhost:5432`

Bu hata, PostgreSQL veritabanı sunucusuna bağlanılamadığını gösterir.

## Çözüm Adımları

### 1. PostgreSQL Servisinin Çalıştığını Kontrol Edin

**Windows:**
```powershell
# PowerShell'de çalıştırın
Get-Service postgresql*

# Eğer durdurulmuşsa başlatın
Start-Service postgresql-x64-XX  # XX PostgreSQL versiyon numarası
```

**Linux/Mac:**
```bash
sudo systemctl status postgresql
# veya
sudo service postgresql status

# Eğer durdurulmuşsa başlatın
sudo systemctl start postgresql
# veya
sudo service postgresql start
```

### 2. .env Dosyasını Kontrol Edin

Backend klasöründe `.env` dosyası olmalı ve şu formatta olmalı:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/campus_db
JWT_SECRET=your-secret-key-here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Örnek:**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/campus_db
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Veritabanını Oluşturun

PostgreSQL'e bağlanın ve veritabanını oluşturun:

```bash
# PostgreSQL'e bağlan
psql -U postgres

# Veritabanını oluştur
CREATE DATABASE campus_db;

# Çıkış
\q
```

### 4. Prisma Client'ı Generate Edin

```bash
cd Grup7_WebProje_Final/backend
npx prisma generate
```

### 5. Migration'ı Çalıştırın

```bash
npx prisma migrate dev --name add_part4_features
```

### 6. Bağlantıyı Test Edin

```bash
# Prisma Studio ile test edin
npx prisma studio

# Veya basit bir test scripti çalıştırın
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Connected!')).catch(e => console.error(e)).finally(() => prisma.$disconnect())"
```

## Alternatif: Docker ile PostgreSQL

Eğer PostgreSQL yüklü değilse, Docker ile çalıştırabilirsiniz:

```bash
docker run --name campus-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=campus_db \
  -p 5432:5432 \
  -d postgres:15

# .env dosyasını güncelleyin
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/campus_db
```

## Hala Sorun Varsa

1. **Firewall kontrolü:** Port 5432'nin açık olduğundan emin olun
2. **PostgreSQL config:** `postgresql.conf` dosyasında `listen_addresses = '*'` olmalı
3. **pg_hba.conf:** `host all all 127.0.0.1/32 md5` satırı olmalı
4. **Port çakışması:** Başka bir servis 5432 portunu kullanıyor olabilir

```bash
# Windows'ta port kullanımını kontrol edin
netstat -ano | findstr :5432

# Linux/Mac'te
lsof -i :5432
```

