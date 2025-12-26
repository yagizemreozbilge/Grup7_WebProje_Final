# Manuel Migration - Verileri Koruyarak

Eğer veritabanında önemli veriler varsa, migration'ı manuel olarak uygulayabilirsiniz.

## Adım 1: Migration SQL Dosyasını Kontrol Edin

Migration dosyası: `prisma/migrations/add_part4_features/migration.sql`

## Adım 2: PostgreSQL'e Bağlanın

```powershell
docker exec -it campus_postgres psql -U postgres -d campus_db
```

## Adım 3: SQL Komutlarını Çalıştırın

Migration SQL dosyasındaki komutları tek tek çalıştırın veya dosyayı import edin:

```sql
-- Enum'ları oluştur
CREATE TYPE "NotificationCategory" AS ENUM ('academic', 'attendance', 'meal', 'event', 'payment', 'system');
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'push', 'sms');

-- Tabloları oluştur
CREATE TABLE "notifications" (...);
CREATE TABLE "notification_preferences" (...);
CREATE TABLE "sensors" (...);
CREATE TABLE "sensor_data" (...);

-- Index'leri oluştur
CREATE INDEX "notifications_user_read" ON "notifications"("user_id", "is_read");
-- ... diğer index'ler

-- Foreign key'leri ekle
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
-- ... diğer foreign key'ler
```

## Adım 4: Prisma Migration Tablosunu Güncelleyin

```sql
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  'checksum_here',
  NOW(),
  'add_part4_features',
  NULL,
  NULL,
  NOW(),
  1
);
```

## Alternatif: Sadece Prisma Generate

Eğer tablolar zaten varsa, sadece Prisma Client'ı generate edin:

```powershell
npx prisma generate
```

