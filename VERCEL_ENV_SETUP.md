# Настройка переменных окружения на Vercel

## Обязательные переменные

Перейдите в настройки проекта на Vercel (Settings → Environment Variables) и добавьте:

```
TG_BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
NEXT_PUBLIC_TG_BOT_USERNAME=dungeon_bot
WEBAPP_URL=https://frontend-delta-sandy-58.vercel.app
TG_WEBHOOK_SECRET=78256ad5d219d6c4851b24d7c386bc05bbe2456d3e3b965557cb25294a6e49f9
```

## Опциональные переменные

```
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## После добавления переменных

1. **Пересоберите проект** - нажмите "Redeploy" в Vercel
2. **Проверьте webhook:**
   ```bash
   curl "https://api.telegram.org/bot7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE/getWebhookInfo"
   ```
3. **Протестируйте бота** - отправьте `/start`

## Диагностика

Если webhook возвращает 404:
- Убедитесь, что переменные окружения добавлены
- Проверьте, что проект пересобран после добавления переменных
- Проверьте логи в Vercel Functions

## Тестовый эндпоинт

После настройки переменных можно протестировать:
```bash
curl -X POST "https://frontend-delta-sandy-58.vercel.app/api/telegram/test" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "ВАШ_CHAT_ID"}'
```
