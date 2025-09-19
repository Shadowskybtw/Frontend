# Настройка Vercel для Telegram Bot

## Переменные окружения на Vercel

Перейдите в настройки проекта на Vercel и добавьте следующие переменные:

### Обязательные переменные:
```
TG_BOT_TOKEN=ваш_токен_от_BotFather
NEXT_PUBLIC_TG_BOT_USERNAME=ваш_бот_без_@
WEBAPP_URL=https://frontend-delta-sandy-58.vercel.app
```

### Опциональные переменные:
```
TG_WEBHOOK_SECRET=случайная_строка_для_безопасности
DATABASE_URL=postgresql://username:password@host:5432/database
```

## Настройка webhook

После деплоя выполните:

```bash
cd next-app
npm run setup-webhook
```

Или вручную:
```bash
curl -X POST "https://api.telegram.org/bot$TG_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://frontend-delta-sandy-58.vercel.app/api/telegram/webhook","secret_token":"'"$TG_WEBHOOK_SECRET"'"}'
```

## Проверка работы

1. Отправьте `/start` боту
2. Проверьте логи в Vercel Functions
3. Используйте тестовый эндпоинт:
```bash
curl -X POST "https://frontend-delta-sandy-58.vercel.app/api/telegram/test" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "ВАШ_CHAT_ID"}'
```

## Структура проекта

- **Корневой vercel.json** - указывает Vercel собирать проект из папки `next-app`
- **next-app/** - основной Next.js проект с ботом
- **API routes** - `/api/telegram/webhook` и `/api/telegram/test`
