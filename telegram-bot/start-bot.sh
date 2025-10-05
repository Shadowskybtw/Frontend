#!/bin/bash
# Скрипт для запуска Telegram бота

# Переходим в директорию бота
cd "$(dirname "$0")"

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📝 Создайте файл .env на основе env.example"
    echo "   cp env.example .env"
    echo "   # Затем отредактируйте .env файл"
    exit 1
fi

# Загружаем переменные окружения
source .env

# Проверяем наличие обязательных переменных
if [ -z "$BOT_TOKEN" ]; then
    echo "❌ BOT_TOKEN не настроен в .env файле"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL не настроен в .env файле"
    exit 1
fi

echo "🚀 Запуск DUNGEONHOOKAH_BOT..."
echo "📅 Время: $(date)"
echo "🕐 Уведомления в: ${NOTIFICATION_TIME:-18:00}"
echo "🌍 Часовой пояс: ${TIMEZONE:-Europe/Moscow}"
echo ""

# Запускаем бота
node index.js start
