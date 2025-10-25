#!/bin/bash

# Скрипт для постоянной работы Telegram бота
# Автоматически перезапускает бот при падении

BOT_DIR="/Users/nikolajmisin/Documents/WebApp/next-app"
LOG_FILE="$BOT_DIR/bot-forever.log"
BOT_SCRIPT="$BOT_DIR/bot-simple.py"

echo "🤖 Запуск системы постоянной работы бота..."
echo "📁 Директория: $BOT_DIR"
echo "📝 Лог файл: $LOG_FILE"

# Создаем лог файл если не существует
touch "$LOG_FILE"

# Функция для запуска бота
start_bot() {
    echo "▶️  Запуск бота в $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
    
    cd "$BOT_DIR"
    
    # Проверяем наличие Python и зависимостей
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python3 не найден!" | tee -a "$LOG_FILE"
        return 1
    fi
    
    # Устанавливаем зависимости если нужно
    if [ ! -f "requirements.txt" ] || [ ! -d "venv" ]; then
        echo "📦 Установка зависимостей..." | tee -a "$LOG_FILE"
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi
    
    # Запускаем бота
    echo "🚀 Запуск бота..." | tee -a "$LOG_FILE"
    python3 "$BOT_SCRIPT" 2>&1 | tee -a "$LOG_FILE"
    
    local exit_code=$?
    echo "⚠️  Бот остановлен с кодом $exit_code в $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
    
    return $exit_code
}

# Основной цикл
while true; do
    start_bot
    exit_code=$?
    
    # Если бот завершился с кодом 0 (нормально) или 1 (ошибка), перезапускаем
    if [ $exit_code -eq 0 ] || [ $exit_code -eq 1 ]; then
        echo "🔄 Перезапуск через 5 секунд..." | tee -a "$LOG_FILE"
        sleep 5
    else
        echo "❌ Критическая ошибка! Ожидание 30 секунд..." | tee -a "$LOG_FILE"
        sleep 30
    fi
done
