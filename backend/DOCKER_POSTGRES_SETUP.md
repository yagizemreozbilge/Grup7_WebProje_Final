# Docker ile PostgreSQL Kurulumu

PostgreSQL servisi bulunamadığı için Docker ile PostgreSQL çalıştırabilirsiniz.

## Hızlı Başlangıç

### 1. Docker Container'ı Başlatın

```powershell
docker run --name campus-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=campus_db `
  -p 5432:5432 `
  -d postgres:15
```

### 2. Container'ın Çalıştığını Kontrol Edin

```powershell
docker ps
```

### 3. Backend .env Dosyasını Güncelleyin

Backend klasöründeki `.env` dosyasında şu satır olmalı:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campus_db
```

### 4. Migration'ı Çalıştırın

```powershell
cd Grup7_WebProje_Final/backend
npx prisma migrate dev --name add_part4_features
npx prisma generate
```

## Container Yönetimi

### Container'ı Durdurma
```powershell
docker stop campus-postgres
```

### Container'ı Başlatma
```powershell
docker start campus-postgres
```

### Container'ı Silme (Dikkat: Veriler silinir!)
```powershell
docker stop campus-postgres
docker rm campus-postgres
```

### Container Loglarını Görüntüleme
```powershell
docker logs campus-postgres
```

## Veritabanına Bağlanma

### psql ile Bağlanma
```powershell
docker exec -it campus-postgres psql -U postgres -d campus_db
```

### SQL Komutları
```sql
-- Tabloları listele
\dt

-- Veritabanını kontrol et
SELECT current_database();

-- Çıkış
\q
```

## Veri Kalıcılığı (Volume Kullanımı)

Verilerin kalıcı olması için volume kullanın:

```powershell
docker run --name campus-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=campus_db `
  -p 5432:5432 `
  -v campus-postgres-data:/var/lib/postgresql/data `
  -d postgres:15
```

Bu şekilde container silinse bile veriler korunur.

## Sorun Giderme

### Port Zaten Kullanılıyor Hatası
Eğer port 5432 zaten kullanılıyorsa, farklı bir port kullanın:

```powershell
docker run --name campus-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=campus_db `
  -p 5433:5432 `
  -d postgres:15
```

Ve `.env` dosyasını güncelleyin:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/campus_db
```

### Container Başlamıyor
Logları kontrol edin:
```powershell
docker logs campus-postgres
```

### Veritabanı Bağlantı Hatası
1. Container'ın çalıştığını kontrol edin: `docker ps`
2. Port'un açık olduğunu kontrol edin: `Test-NetConnection -ComputerName localhost -Port 5432`
3. `.env` dosyasındaki `DATABASE_URL`'i kontrol edin

