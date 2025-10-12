# 🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ИНИЦИАЛИЗАЦИЕЙ

## Проблема
API endpoint `/api/check-or-register` возвращает ошибку 500 на продакшн сервере (Vercel), хотя локально работает корректно.

## Причина
На Vercel используется PostgreSQL база данных, но схема Prisma была настроена только на SQLite.

## ✅ РЕШЕНИЕ (5 минут)

### 1. Настройте переменные окружения на Vercel
В панели управления Vercel добавьте:
```
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
TG_BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
```

### 2. Создайте таблицы в PostgreSQL
Выполните SQL скрипт `scripts/postgresql-migration.sql` в вашей PostgreSQL базе данных.

### 3. Разверните приложение
```bash
git push
```

## 🎯 РЕЗУЛЬТАТ
- ✅ API будет работать корректно
- ✅ Пользователи смогут регистрироваться
- ✅ Инициализация WebApp будет работать
- ✅ Пользователи будут перенаправляться в профиль, а не на регистрацию

## 📋 ДЕТАЛЬНАЯ ИНСТРУКЦИЯ
См. файл `VERCEL_DEPLOYMENT_GUIDE.md` для подробной инструкции.

## 🔧 ЛОКАЛЬНАЯ РАЗРАБОТКА
```bash
./scripts/switch-db.sh local
npx prisma generate
npx prisma db push
npm run dev
```
