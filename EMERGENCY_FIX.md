# 🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ - ОШИБКА 500

## Проблема
API возвращает ошибку 500: `Error code 14: Unable to open the database file`

## Причина
На Vercel приложение пытается использовать SQLite файл, который недоступен в облачной среде.

## ✅ СРОЧНОЕ РЕШЕНИЕ (2 минуты)

### 1. Настройте переменные окружения на Vercel

В панели управления Vercel (vercel.com) добавьте:

```
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
TG_BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
```

### 2. Создайте таблицы в PostgreSQL

Выполните этот скрипт локально (он подключится к продакшн базе):

```bash
node scripts/setup-production-db.js
```

### 3. Разверните приложение

```bash
git add .
git commit -m "Fix production database configuration"
git push
```

## 🎯 РЕЗУЛЬТАТ
- ✅ API будет работать корректно
- ✅ Пользователи смогут регистрироваться
- ✅ Инициализация WebApp будет работать
- ✅ Пользователи будут перенаправляться в профиль

## 📋 ПРОВЕРКА

После развертывания протестируйте:

```bash
node scripts/test-production-api.js
```

## 🔧 ЛОКАЛЬНАЯ РАЗРАБОТКА

Для локальной разработки создайте `.env.local`:

```
DATABASE_URL="file:./hookah.db"
TG_BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
```

И переключите схему на SQLite:

```bash
# В prisma/schema.prisma измените:
datasource db {
  provider = "sqlite"
  url      = "file:./hookah.db"
}
```
