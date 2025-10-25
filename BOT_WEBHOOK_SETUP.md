# 🤖 Настройка Telegram Bot Webhook

## Проблема
Бот работает только когда твоя система включена. Нужно сделать так, чтобы бот работал 24/7 в облаке.

## Решение
Переводим бота с polling на webhook и разворачиваем на Vercel.

## 🚀 Шаги настройки

### 1. Добавить переменные окружения на Vercel

Зайди в настройки проекта на Vercel и добавь:

```bash
BOT_TOKEN=8242076298:AAGnHplpi7Ad4hOo9z4zTugjqcCEXLJt9to
```

### 2. Настроить webhook

После деплоя на Vercel, выполни:

```bash
# Настроить webhook
curl -X POST https://frontend-delta-sandy-58.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"action": "setup"}'

# Проверить статус webhook
curl -X POST https://frontend-delta-sandy-58.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"action": "info"}'
```

### 3. Остановить локальный бот

```bash
# Остановить все процессы бота
pkill -f "bot-simple.py"
pkill -f "start-bot-forever"
```

## 📁 Созданные файлы

- `src/app/api/telegram/webhook/route.ts` - обработчик webhook
- `src/app/api/telegram/setup/route.ts` - API для настройки webhook
- `scripts/setup-webhook.js` - скрипт для настройки webhook

## ✅ Результат

После настройки:
- ✅ Бот работает 24/7 в облаке Vercel
- ✅ Не зависит от твоей системы
- ✅ Автоматически перезапускается при сбоях
- ✅ Обрабатывает команду /start с WebApp кнопкой

## 🔧 Тестирование

1. Отправь `/start` боту в Telegram
2. Должна появиться кнопка "🚀 Открыть WebApp"
3. Кнопка должна открывать твое приложение

## 🛠️ Управление webhook

```bash
# Настроить webhook
curl -X POST https://frontend-delta-sandy-58.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"action": "setup"}'

# Удалить webhook (вернуться к polling)
curl -X POST https://frontend-delta-sandy-58.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"action": "delete"}'

# Проверить статус
curl -X POST https://frontend-delta-sandy-58.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"action": "info"}'
```
