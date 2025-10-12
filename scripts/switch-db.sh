#!/bin/bash

# Скрипт для переключения между SQLite (локальная разработка) и PostgreSQL (продакшн)

if [ "$1" = "local" ]; then
    echo "🔧 Переключаемся на SQLite для локальной разработки..."
    
    # Создаем временную схему для SQLite
    cat > prisma/schema.sqlite.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./hookah.db"
}

model User {
  id                      Int             @id @default(autoincrement())
  tg_id                   Int             @unique
  first_name              String
  last_name               String
  phone                   String
  username                String?
  created_at              DateTime        @default(now())
  updated_at              DateTime        @default(now()) @updatedAt
  is_admin                Boolean         @default(false)
  total_purchases         Int             @default(0)
  total_regular_purchases Int             @default(0)
  total_free_purchases    Int             @default(0)
  free_hookahs            FreeHookah[]
  hookah_history          HookahHistory[]
  stocks                  Stock[]
  admin_rights            Admin? @relation("AdminUser")
  granted_admins          Admin[] @relation("AdminGranter")
  free_hookah_requests    FreeHookahRequest[]
  hookah_reviews          HookahReview[]

  @@map("users")
}

model Stock {
  id                   Int      @id @default(autoincrement())
  user_id              Int
  stock_name           String
  progress             Int      @default(0)
  promotion_completed  Boolean  @default(false)
  created_at           DateTime @default(now())
  updated_at           DateTime @default(now()) @updatedAt
  user                 User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  free_hookah_requests FreeHookahRequest[]

  @@map("stocks")
}

model FreeHookah {
  id         Int       @id @default(autoincrement())
  user_id    Int
  used       Boolean   @default(false)
  used_at    DateTime?
  created_at DateTime  @default(now())
  user       User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("free_hookahs")
}

model HookahHistory {
  id          Int       @id @default(autoincrement())
  user_id     Int
  hookah_type String
  slot_number Int?
  created_at  DateTime? @default(now())
  user        User      @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@index([created_at])
  @@index([user_id])
  @@map("hookah_history")
}

model Admin {
  id         Int      @id @default(autoincrement())
  user_id    Int      @unique
  granted_by Int      // ID админа, который выдал права
  created_at DateTime @default(now())

  // Relations
  user User @relation("AdminUser", fields: [user_id], references: [id], onDelete: Cascade)
  granter User @relation("AdminGranter", fields: [granted_by], references: [id], onDelete: Cascade)
  approved_requests FreeHookahRequest[]

  @@map("admins")
}

model AdminList {
  id         Int      @id @default(autoincrement())
  tg_id      Int      @unique
  created_at DateTime @default(now())

  @@map("admin_list")
}

model FreeHookahRequest {
  id         Int      @id @default(autoincrement())
  user_id    Int
  stock_id   Int
  status     String   @default("pending") // pending, approved, rejected
  approved_by Int?    // ID админа, который подтвердил
  created_at DateTime @default(now())
  updated_at DateTime @default(now()) @updatedAt

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  stock Stock @relation(fields: [stock_id], references: [id], onDelete: Cascade)
  approver Admin? @relation(fields: [approved_by], references: [id], onDelete: SetNull)

  @@map("free_hookah_requests")
}

model HookahReview {
  id            Int      @id @default(autoincrement())
  user_id       Int
  hookah_id     Int      // ID записи в hookah_history
  rating        Int      // 1-5 звезд
  review_text   String?  // Текст отзыва (опционально)
  created_at    DateTime @default(now())

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, hookah_id]) // Один отзыв на кальян от пользователя
  @@map("hookah_reviews")
}
EOF
    
    # Заменяем основную схему на SQLite
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    rm prisma/schema.sqlite.prisma
    
    echo "✅ Переключено на SQLite"
    echo "📝 Теперь используйте: npx prisma generate && npx prisma db push"
    
elif [ "$1" = "production" ]; then
    echo "🚀 Переключаемся на PostgreSQL для продакшна..."
    
    # Создаем временную схему для PostgreSQL
    cat > prisma/schema.postgres.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                      Int             @id @default(autoincrement())
  tg_id                   Int             @unique
  first_name              String
  last_name               String
  phone                   String
  username                String?
  created_at              DateTime        @default(now())
  updated_at              DateTime        @default(now()) @updatedAt
  is_admin                Boolean         @default(false)
  total_purchases         Int             @default(0)
  total_regular_purchases Int             @default(0)
  total_free_purchases    Int             @default(0)
  free_hookahs            FreeHookah[]
  hookah_history          HookahHistory[]
  stocks                  Stock[]
  admin_rights            Admin? @relation("AdminUser")
  granted_admins          Admin[] @relation("AdminGranter")
  free_hookah_requests    FreeHookahRequest[]
  hookah_reviews          HookahReview[]

  @@map("users")
}

model Stock {
  id                   Int      @id @default(autoincrement())
  user_id              Int
  stock_name           String
  progress             Int      @default(0)
  promotion_completed  Boolean  @default(false)
  created_at           DateTime @default(now())
  updated_at           DateTime @default(now()) @updatedAt
  user                 User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  free_hookah_requests FreeHookahRequest[]

  @@map("stocks")
}

model FreeHookah {
  id         Int       @id @default(autoincrement())
  user_id    Int
  used       Boolean   @default(false)
  used_at    DateTime?
  created_at DateTime  @default(now())
  user       User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("free_hookahs")
}

model HookahHistory {
  id          Int       @id @default(autoincrement())
  user_id     Int
  hookah_type String
  slot_number Int?
  created_at  DateTime? @default(now())
  user        User      @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@index([created_at])
  @@index([user_id])
  @@map("hookah_history")
}

model Admin {
  id         Int      @id @default(autoincrement())
  user_id    Int      @unique
  granted_by Int      // ID админа, который выдал права
  created_at DateTime @default(now())

  // Relations
  user User @relation("AdminUser", fields: [user_id], references: [id], onDelete: Cascade)
  granter User @relation("AdminGranter", fields: [granted_by], references: [id], onDelete: Cascade)
  approved_requests FreeHookahRequest[]

  @@map("admins")
}

model AdminList {
  id         Int      @id @default(autoincrement())
  tg_id      Int      @unique
  created_at DateTime @default(now())

  @@map("admin_list")
}

model FreeHookahRequest {
  id         Int      @id @default(autoincrement())
  user_id    Int
  stock_id   Int
  status     String   @default("pending") // pending, approved, rejected
  approved_by Int?    // ID админа, который подтвердил
  created_at DateTime @default(now())
  updated_at DateTime @default(now()) @updatedAt

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  stock Stock @relation(fields: [stock_id], references: [id], onDelete: Cascade)
  approver Admin? @relation(fields: [approved_by], references: [id], onDelete: SetNull)

  @@map("free_hookah_requests")
}

model HookahReview {
  id            Int      @id @default(autoincrement())
  user_id       Int
  hookah_id     Int      // ID записи в hookah_history
  rating        Int      // 1-5 звезд
  review_text   String?  // Текст отзыва (опционально)
  created_at    DateTime @default(now())

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, hookah_id]) // Один отзыв на кальян от пользователя
  @@map("hookah_reviews")
}
EOF
    
    # Заменяем основную схему на PostgreSQL
    cp prisma/schema.postgres.prisma prisma/schema.prisma
    rm prisma/schema.postgres.prisma
    
    echo "✅ Переключено на PostgreSQL"
    echo "📝 Теперь используйте: npx prisma generate && npx prisma db push"
    
else
    echo "❌ Неверный аргумент. Используйте:"
    echo "  ./switch-db.sh local      - для локальной разработки (SQLite)"
    echo "  ./switch-db.sh production - для продакшна (PostgreSQL)"
fi
