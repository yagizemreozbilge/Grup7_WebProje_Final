# Deployment Guide - Campus Management System

## 📦 Deployment Genel Bakış

Bu kılavuz, Campus Management System'in Docker Compose ile deployment'ını ve production ortamına geçişini açıklar.

---

## 🐳 Docker Compose ile Deployment

### Gereksinimler

- Docker 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM
- Minimum 10GB disk alanı

### Hızlı Başlangıç

```bash
# Proje klasörüne git
cd web_final

# Tüm servisleri başlat
docker-compose up --build

# Arka planda çalıştır
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

### Servisler

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/v1
- **PostgreSQL:** localhost:5432

---

## ⚙️ Environment Variables

### Backend Environment Variables

`Grup7_WebProje_Final/backend/.env` dosyası oluşturun:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://admin:password@postgres:5432/campus_db?schema=public

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Production için gerekli)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@campus.edu.tr

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

`Grup7_WebProje_Frontend/.env` dosyası oluşturun:

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=http://localhost:5000
```

### Production Environment Variables

Production ortamında aşağıdaki değişkenleri mutlaka değiştirin:

- `JWT_SECRET`: Güçlü, rastgele bir string
- `JWT_REFRESH_SECRET`: Güçlü, rastgele bir string
- `DATABASE_URL`: Production veritabanı URL'i
- `SMTP_*`: Gerçek email servisi bilgileri
- `CORS_ORIGIN`: Production frontend URL'i
- `NODE_ENV=production`

---

## 🗄️ Veritabanı Migration'ları

### Otomatik Migration (Docker Compose)

Docker Compose ile çalıştırıldığında migration'lar otomatik olarak çalışır:

```bash
# Backend container içinde migration çalışır
docker-compose up backend
```

### Manuel Migration

```bash
# Backend container'a gir
docker-compose exec backend sh

# Migration'ları çalıştır
npx prisma migrate deploy

# Prisma client'ı generate et
npx prisma generate

# Seed data'yı yükle (opsiyonel)
npm run prisma:seed
```

### Migration Komutları

```bash
# Yeni migration oluştur
npx prisma migrate dev --name migration_name

# Production migration
npx prisma migrate deploy

# Migration durumunu kontrol et
npx prisma migrate status

# Migration'ı geri al (development)
npx prisma migrate reset
```

---

## 🚀 Production Deployment

### 1. Sunucu Hazırlığı

```bash
# Docker ve Docker Compose kurulumu
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Docker servisini başlat
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Proje Dosyalarını Yükleme

```bash
# Git ile clone
git clone https://github.com/yagizemreozbilge/Grup7_WebProje_Final.git
cd Grup7_WebProje_Final

# Frontend'i clone et
git clone https://github.com/emrekorkmaz-ce/Grup7_WebProje_Frontend.git
```

### 3. Environment Variables Ayarlama

```bash
# Backend .env dosyasını oluştur
cd backend
cp .env.example .env
nano .env  # Production değerlerini girin

# Frontend .env dosyasını oluştur
cd ../Grup7_WebProje_Frontend
cp .env.example .env
nano .env  # Production API URL'ini girin
```

### 4. Docker Compose ile Başlatma

```bash
# Ana dizine dön
cd ../..

# Production modunda başlat
docker-compose -f docker-compose.yml up -d --build

# Logları kontrol et
docker-compose logs -f
```

### 5. Veritabanı Migration

```bash
# Migration'ları çalıştır
docker-compose exec backend npx prisma migrate deploy

# Seed data'yı yükle (opsiyonel)
docker-compose exec backend npm run prisma:seed
```

### 6. Nginx Reverse Proxy (Opsiyonel)

`/etc/nginx/sites-available/campus` dosyası:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Nginx'i aktif et
sudo ln -s /etc/nginx/sites-available/campus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ☁️ Cloud Deployment

### DigitalOcean Deployment

#### 1. Droplet Oluşturma

- Ubuntu 22.04 LTS
- Minimum 2GB RAM
- 50GB SSD

#### 2. Sunucu Kurulumu

```bash
# SSH ile bağlan
ssh root@your-droplet-ip

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose kurulumu
apt-get install docker-compose-plugin
```

#### 3. Proje Deployment

```bash
# Projeyi clone et
git clone [repository-url]
cd web_final

# Environment variables ayarla
# .env dosyalarını düzenle

# Servisleri başlat
docker-compose up -d --build
```

### AWS EC2 Deployment

#### 1. EC2 Instance Oluşturma

- Amazon Linux 2 veya Ubuntu
- t2.medium veya daha büyük
- Security Group: Port 80, 443, 3000, 5000 açık

#### 2. Kurulum

```bash
# Docker kurulumu (Ubuntu)
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Projeyi clone et ve deploy et
git clone [repository-url]
cd web_final
docker-compose up -d --build
```

### Heroku Deployment

#### Backend Deployment

```bash
# Heroku CLI kurulumu
npm install -g heroku

# Heroku'ya login
heroku login

# Heroku app oluştur
cd Grup7_WebProje_Final/backend
heroku create campus-backend

# PostgreSQL addon ekle
heroku addons:create heroku-postgresql:hobby-dev

# Environment variables ayarla
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
# ... diğer değişkenler

# Deploy
git push heroku main

# Migration çalıştır
heroku run npx prisma migrate deploy
```

#### Frontend Deployment

```bash
# Frontend için Heroku app
cd Grup7_WebProje_Frontend
heroku create campus-frontend

# Buildpack ekle
heroku buildpacks:set mars/create-react-app

# Environment variables
heroku config:set REACT_APP_API_URL=https://campus-backend.herokuapp.com/api/v1

# Deploy
git push heroku main
```

---

## 🔧 Troubleshooting

### Problem: Database Connection Error

**Çözüm:**
```bash
# PostgreSQL container'ın çalıştığını kontrol et
docker-compose ps

# Database URL'i kontrol et
docker-compose exec backend env | grep DATABASE_URL

# PostgreSQL loglarını kontrol et
docker-compose logs postgres
```

### Problem: Port Already in Use

**Çözüm:**
```bash
# Port'u kullanan process'i bul
sudo lsof -i :5000
sudo lsof -i :3000

# Process'i sonlandır veya docker-compose.yml'de port'u değiştir
```

### Problem: Migration Errors

**Çözüm:**
```bash
# Migration durumunu kontrol et
docker-compose exec backend npx prisma migrate status

# Migration'ı reset et (development only)
docker-compose exec backend npx prisma migrate reset

# Manuel migration
docker-compose exec backend npx prisma migrate deploy
```

### Problem: Frontend Build Errors

**Çözüm:**
```bash
# Node modules'ı temizle
cd Grup7_WebProje_Frontend
rm -rf node_modules package-lock.json
npm install

# Build'i tekrar dene
npm run build
```

### Problem: CORS Errors

**Çözüm:**
```bash
# Backend .env dosyasında CORS_ORIGIN'i kontrol et
CORS_ORIGIN=http://localhost:3000  # Frontend URL'i

# Production'da:
CORS_ORIGIN=https://your-domain.com
```

### Problem: Memory Issues

**Çözüm:**
```bash
# Docker memory limit'ini artır
# docker-compose.yml'de:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 📊 Health Checks

### Backend Health Check

```bash
# Health endpoint
curl http://localhost:5000/api/v1/health

# Beklenen yanıt:
{
  "status": "ok",
  "timestamp": "2025-12-28T10:00:00Z"
}
```

### Database Health Check

```bash
# PostgreSQL'e bağlan
docker-compose exec postgres psql -U admin -d campus_db

# Tabloları listele
\dt

# Bağlantıyı test et
SELECT 1;
```

### Frontend Health Check

```bash
# Frontend'i kontrol et
curl http://localhost:3000

# Build dosyalarını kontrol et
ls -la Grup7_WebProje_Frontend/build
```

---

## 🔄 Backup ve Restore

### Database Backup

```bash
# Backup oluştur
docker-compose exec postgres pg_dump -U admin campus_db > backup_$(date +%Y%m%d).sql

# Compressed backup
docker-compose exec postgres pg_dump -U admin campus_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Database Restore

```bash
# Backup'tan restore
docker-compose exec -T postgres psql -U admin campus_db < backup_20251228.sql

# Compressed backup'tan restore
gunzip < backup_20251228.sql.gz | docker-compose exec -T postgres psql -U admin campus_db
```

### Automated Backup (Cron Job)

```bash
# Crontab'a ekle
0 2 * * * cd /path/to/project && docker-compose exec -T postgres pg_dump -U admin campus_db | gzip > /backups/backup_$(date +\%Y\%m\%d).sql.gz
```

---

## 🔐 Security Checklist

- [ ] JWT secret'ları güçlü ve benzersiz
- [ ] Database şifreleri güçlü
- [ ] HTTPS aktif (production)
- [ ] CORS origin doğru ayarlanmış
- [ ] Rate limiting aktif
- [ ] Environment variables güvenli
- [ ] Database backup'ları düzenli
- [ ] Log dosyaları rotate ediliyor
- [ ] Firewall kuralları ayarlanmış
- [ ] SSH key authentication aktif

---

## 📈 Monitoring

### Log Monitoring

```bash
# Tüm servislerin logları
docker-compose logs -f

# Sadece backend logları
docker-compose logs -f backend

# Son 100 satır
docker-compose logs --tail=100 backend
```

### Resource Monitoring

```bash
# Container resource kullanımı
docker stats

# Disk kullanımı
docker system df
```

---

## 🚨 Production Best Practices

1. **Environment Variables:** Asla commit etmeyin
2. **Secrets Management:** AWS Secrets Manager veya benzeri kullanın
3. **Database Backups:** Günlük otomatik backup
4. **Monitoring:** Uptime monitoring kurun
5. **SSL/TLS:** HTTPS kullanın
6. **Rate Limiting:** Production'da aktif
7. **Error Tracking:** Sentry veya benzeri kullanın
8. **Logging:** Centralized logging (ELK stack)
9. **Scaling:** Load balancer kullanın
10. **Updates:** Düzenli güvenlik güncellemeleri

---

## 📞 Support

Sorun yaşarsanız:

1. Log dosyalarını kontrol edin
2. Health check endpoint'lerini test edin
3. Docker container durumunu kontrol edin
4. Environment variables'ı doğrulayın
5. GitHub Issues'da sorun bildirin

---

**Son Güncelleme:** 28 Aralık 2025




