#!/bin/bash

# Скрипт для деплоя бота на сервер

echo "🚀 Деплой КальянБота Dungeon..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📝 Создайте .env файл на основе env.example"
    exit 1
fi

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm install

# Проверяем подключение к базе данных
echo "🔍 Проверка подключения к базе данных..."
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const db = neon(process.env.DATABASE_URL);
db\`SELECT 1\`.then(() => {
    console.log('✅ Подключение к базе данных успешно');
    process.exit(0);
}).catch(err => {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
    process.exit(1);
});
"

if [ $? -ne 0 ]; then
    echo "❌ Не удалось подключиться к базе данных"
    exit 1
fi

# Тестируем отправку уведомлений
echo "🧪 Тестирование отправки уведомлений..."
node index.js test

if [ $? -ne 0 ]; then
    echo "❌ Тест отправки уведомлений не прошел"
    exit 1
fi

echo "✅ Тест прошел успешно!"

# Запускаем бота
echo "🚀 Запуск бота..."
node index.js start
