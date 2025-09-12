#!/bin/bash

echo "🚀 Запуск DUNGEON Telegram Bot..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не установлен. Установите Python 3.8+"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Активация виртуального окружения..."
source venv/bin/activate

# Install dependencies
echo "📚 Установка зависимостей..."
pip install -r requirements.txt

# Run the bot
echo "🤖 Запуск бота в режиме polling..."
echo "💡 Отправьте /start боту @pop_222_bot для тестирования"
echo "🛑 Нажмите Ctrl+C для остановки"
echo ""

python3 bot.py
