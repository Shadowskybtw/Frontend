# 🚀 Инструкция по настройке Vercel

## ⚠️ КРИТИЧНО: Настройте DATABASE_URL на Vercel!

### 📋 Пошаговая инструкция:

1. **Откройте Vercel Dashboard**
   - Перейдите на https://vercel.com/dashboard
   - Найдите проект `frontend`

2. **Перейдите в настройки проекта**
   - Нажмите на название проекта `frontend`
   - Выберите вкладку `Settings`

3. **Добавьте переменную окружения**
   - В левом меню выберите `Environment Variables`
   - Нажмите кнопку `Add New`

4. **Заполните форму:**
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - **Environment**: Выберите все три:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Нажмите `Save`

5. **Передеплойте проект**
   - Перейдите во вкладку `Deployments`
   - Найдите последний деплой
   - Нажмите `Redeploy`

### ✅ Проверка после настройки:

После настройки переменной окружения и передеплоя проверьте:

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

### 🧪 Тестирование API:

```bash
# Тест истории (должен вернуть 5+ записей)
curl https://frontend-delta-sandy-58.vercel.app/api/history/937011437?withReviews=true&limit=5

# Тест поиска пользователя
curl https://frontend-delta-sandy-58.vercel.app/api/search-user?phone=6642
```

### 🎯 Ожидаемый результат:

После настройки `DATABASE_URL`:
- ✅ История кальянов будет отображаться в браузере
- ✅ Статистика будет показывать данные в панелях
- ✅ Поиск пользователей будет работать
- ✅ Все API будут возвращать корректные данные

### 📊 Данные в базе:

- 👥 **Пользователи**: 235 (включая Николай Шадовский)
- 📝 **История**: 175+ записей покупок кальянов
- 📦 **Акции**: 161 запись акций "5+1 кальян"
- 🔍 **Поиск**: Работает по номеру телефона

**После настройки DATABASE_URL все функции будут работать корректно!** 🎉
