# 🔧 Настройка переменных окружения на Vercel

## ⚠️ КРИТИЧНО: Настройте DATABASE_URL на Vercel!

Для работы приложения на Vercel необходимо настроить переменную окружения `DATABASE_URL`.

### 📋 Инструкция:

1. **Зайдите в Vercel Dashboard**
   - Откройте https://vercel.com/dashboard
   - Найдите проект `frontend`

2. **Перейдите в настройки**
   - Нажмите на проект `frontend`
   - Перейдите в раздел `Settings`
   - Выберите `Environment Variables`

3. **Добавьте переменную DATABASE_URL**
   - Нажмите `Add New`
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - **Environment**: Выберите `Production`, `Preview`, `Development`
   - Нажмите `Save`

4. **Передеплойте приложение**
   - После добавления переменной окружения
   - Перейдите в раздел `Deployments`
   - Нажмите `Redeploy` на последнем деплое

### ✅ Проверка:

После настройки переменной окружения и передеплоя:

```bash
curl https://frontend-delta-sandy-58.vercel.app/api/health
```

Должен вернуть:
```json
{
  "success": true,
  "message": "Database is healthy",
  "connected": true,
  "userCount": 235
}
```

### 🔍 Текущий статус:

- ✅ **PostgreSQL база данных**: Настроена и содержит 235 пользователей
- ✅ **Prisma схема**: Переключена на PostgreSQL
- ✅ **Код**: Обновлен для работы с PostgreSQL
- ⚠️ **Vercel переменные**: Требуют настройки DATABASE_URL

### 📊 Данные в базе:

- 👥 **Пользователи**: 235 (включая Николай Шадовский)
- 📝 **История**: 175 записей
- 📦 **Акции**: 161 запись
- 🔍 **Поиск**: Работает по номеру телефона

После настройки DATABASE_URL на Vercel все функции будут работать корректно!
