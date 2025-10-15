#!/bin/bash

# Скрипт для постоянной работы бота с автоматическим перезапуском

BOT_DIR="/Users/nikolajmisin/Documents/WebApp/next-app"
BOT_SCRIPT="bot.py"
LOG_FILE="$BOT_DIR/bot.log"

cd "$BOT_DIR"

echo "🤖 Запуск бота DUNGEON Hookah..."
echo "📁 Директория: $BOT_DIR"
echo "📝 Лог файл: $LOG_FILE"
echo ""

# Бесконечный цикл для автоматического перезапуска
while true; do
    echo "▶️  Запуск бота в $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
    
    # Запускаем бота
    python3 "$BOT_SCRIPT" 2>&1 | tee -a "$LOG_FILE"
    
    EXIT_CODE=$?
    echo "⚠️  Бот остановлен с кодом $EXIT_CODE в $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
    
    # Если бот упал, ждем 5 секунд перед перезапуском
    if [ $EXIT_CODE -ne 0 ]; then
        echo "🔄 Перезапуск через 5 секунд..." | tee -a "$LOG_FILE"
        sleep 5
    else
        # Если бот завершился нормально, ждем 2 секунды
        echo "🔄 Перезапуск через 2 секунды..." | tee -a "$LOG_FILE"
        sleep 2
    fi
    
    echo "" | tee -a "$LOG_FILE"
done

