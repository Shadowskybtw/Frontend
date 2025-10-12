# Инструкция по развертыванию на Vercel

## Проблема
API endpoint `/api/check-or-register` возвращает ошибку 500 на продакшн сервере (Vercel), хотя локально работает корректно.

## Причина
На Vercel используется PostgreSQL база данных, но схема Prisma была настроена только на SQLite.

## Решение

### 1. Настройка переменных окружения на Vercel

В панели управления Vercel добавьте следующие переменные окружения:

```
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
TG_BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
TG_WEBHOOK_SECRET=78256ad5d219d6c4851b24d7c386bc05bbe2456d3e3b965557cb25294a6e49f9
NEXT_PUBLIC_TG_BOT_USERNAME=pop_222_bot
WEBAPP_URL=https://frontend-delta-sandy-58.vercel.app
BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
```

### 2. Создание таблиц в PostgreSQL

Выполните SQL скрипт `scripts/postgresql-migration.sql` в вашей PostgreSQL базе данных:

```bash
# Подключитесь к PostgreSQL и выполните:
psql "postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -f scripts/postgresql-migration.sql
```

### 3. Миграция данных

Если у вас есть данные в SQLite, выполните миграцию:

```bash
# Переключитесь на PostgreSQL схему
./scripts/switch-db.sh production

# Выполните миграцию данных
node scripts/migrate-to-postgresql.js

# Переключитесь обратно на SQLite для локальной разработки
./scripts/switch-db.sh local
```

### 4. Развертывание

После настройки переменных окружения и создания таблиц:

```bash
# Зафиксируйте изменения
git add .
git commit -m "Fix PostgreSQL configuration for production"
git push

# Vercel автоматически развернет обновления
```

### 5. Проверка

После развертывания проверьте:

1. API endpoint: `https://frontend-delta-sandy-58.vercel.app/api/check-or-register`
2. WebApp: `https://frontend-delta-sandy-58.vercel.app/`
3. Prisma Studio: `npx prisma studio` (локально)

## Альтернативное решение

Если миграция данных не нужна, можно просто:

1. Настроить переменные окружения на Vercel
2. Выполнить SQL скрипт для создания таблиц
3. Развернуть приложение

Пользователи смогут зарегистрироваться заново, и все будет работать корректно.

## Отладка

Если проблемы продолжаются:

1. Проверьте логи Vercel в панели управления
2. Убедитесь, что все переменные окружения настроены
3. Проверьте подключение к базе данных
4. Проверьте, что таблицы созданы корректно

## Локальная разработка

Для локальной разработки используйте SQLite:

```bash
# Переключитесь на SQLite
./scripts/switch-db.sh local

# Сгенерируйте Prisma Client
npx prisma generate

# Создайте/обновите базу данных
npx prisma db push

# Запустите приложение
npm run dev
```
