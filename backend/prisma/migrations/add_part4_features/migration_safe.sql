-- Safe migration script - Only creates if not exists

-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "NotificationCategory" AS ENUM ('academic', 'attendance', 'meal', 'event', 'payment', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationChannel" AS ENUM ('email', 'push', 'sms');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sensors" (
    "id" UUID NOT NULL,
    "sensor_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "location" VARCHAR(255),
    "unit" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sensor_data" (
    "id" UUID NOT NULL,
    "sensor_id" UUID NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "sensor_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "notifications_user_read" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "notifications_category" ON "notifications"("category");
CREATE INDEX IF NOT EXISTS "notifications_created_at" ON "notifications"("created_at");

-- Unique index (only if not exists)
DO $$ BEGIN
    CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX "sensors_sensor_id_key" ON "sensors"("sensor_id");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "sensors_sensor_id" ON "sensors"("sensor_id");
CREATE INDEX IF NOT EXISTS "sensors_type" ON "sensors"("type");
CREATE INDEX IF NOT EXISTS "sensor_data_sensor_timestamp" ON "sensor_data"("sensor_id", "timestamp");
CREATE INDEX IF NOT EXISTS "sensor_data_timestamp" ON "sensor_data"("timestamp");

-- AddForeignKey (only if not exists)
DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sensor_data" ADD CONSTRAINT "sensor_data_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

