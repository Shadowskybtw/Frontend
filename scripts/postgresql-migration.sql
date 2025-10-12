-- Migration for PostgreSQL
-- This migration creates all tables for the DungeonHookahBot application

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "tg_id" INTEGER NOT NULL UNIQUE,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "total_purchases" INTEGER NOT NULL DEFAULT 0,
    "total_regular_purchases" INTEGER NOT NULL DEFAULT 0,
    "total_free_purchases" INTEGER NOT NULL DEFAULT 0
);

-- Create stocks table
CREATE TABLE IF NOT EXISTS "stocks" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "stock_name" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "promotion_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create free_hookahs table
CREATE TABLE IF NOT EXISTS "free_hookahs" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "free_hookahs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create hookah_history table
CREATE TABLE IF NOT EXISTS "hookah_history" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "hookah_type" TEXT NOT NULL,
    "slot_number" INTEGER,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hookah_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create indexes for hookah_history
CREATE INDEX IF NOT EXISTS "hookah_history_created_at_idx" ON "hookah_history"("created_at");
CREATE INDEX IF NOT EXISTS "hookah_history_user_id_idx" ON "hookah_history"("user_id");

-- Create admins table
CREATE TABLE IF NOT EXISTS "admins" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL UNIQUE,
    "granted_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "admins_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create admin_list table
CREATE TABLE IF NOT EXISTS "admin_list" (
    "id" SERIAL PRIMARY KEY,
    "tg_id" INTEGER NOT NULL UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create free_hookah_requests table
CREATE TABLE IF NOT EXISTS "free_hookah_requests" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "free_hookah_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "free_hookah_requests_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "free_hookah_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create hookah_reviews table
CREATE TABLE IF NOT EXISTS "hookah_reviews" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "hookah_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hookah_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hookah_reviews_user_id_hookah_id_key" UNIQUE ("user_id", "hookah_id")
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON "stocks" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_free_hookah_requests_updated_at BEFORE UPDATE ON "free_hookah_requests" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
