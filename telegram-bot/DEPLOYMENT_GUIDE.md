# 🚀 Руководство по развертыванию DUNGEONHOOKAH_BOT

## 📋 Предварительные требования

1. **Node.js** версии 18 или выше
2. **npm** или **yarn**
3. **PostgreSQL** база данных (уже настроена)
4. **Telegram Bot Token** (уже получен)

## 🔧 Настройка

### 1. Установка зависимостей
```bash
cd telegram-bot
npm install
```

### 2. Настройка переменных окружения
```bash
cp env.example .env
# Отредактируйте .env файл с вашими настройками
```

## 🚀 Способы запуска

### Способ 1: Простой запуск (для тестирования)
```bash
# Запуск в фоновом режиме
./start-bot.sh

# Или напрямую
DATABASE_URL="ваш_url" BOT_TOKEN="ваш_токен" node index.js start
```

### Способ 2: PM2 (рекомендуется для продакшена)
```bash
# Установка PM2
npm install -g pm2

# Запуск бота
pm2 start ecosystem.config.js

# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs dungeonhookah-bot

# Перезапуск
pm2 restart dungeonhookah-bot

# Остановка
pm2 stop dungeonhookah-bot

# Автозапуск при перезагрузке системы
pm2 startup
pm2 save
```

### Способ 3: Docker
```bash
# Сборка образа
docker build -t dungeonhookah-bot .

# Запуск контейнера
docker run -d --name dungeonhookah-bot --env-file .env dungeonhookah-bot

# Или с docker-compose
docker-compose up -d
```

### Способ 4: Systemd (для Linux серверов)
```bash
# Копирование сервиса
sudo cp dungeonhookah-bot.service /etc/systemd/system/

# Редактирование путей в файле сервиса
sudo nano /etc/systemd/system/dungeonhookah-bot.service

# Перезагрузка systemd
sudo systemctl daemon-reload

# Включение автозапуска
sudo systemctl enable dungeonhookah-bot

# Запуск сервиса
sudo systemctl start dungeonhookah-bot

# Проверка статуса
sudo systemctl status dungeonhookah-bot
```

## 📊 Мониторинг

### PM2 команды
```bash
# Статус всех процессов
pm2 status

# Детальная информация
pm2 show dungeonhookah-bot

# Мониторинг в реальном времени
pm2 monit

# Перезапуск при изменении файлов
pm2 start ecosystem.config.js --watch
```

### Логи
```bash
# PM2 логи
pm2 logs dungeonhookah-bot

# Systemd логи
sudo journalctl -u dungeonhookah-bot -f

# Docker логи
docker logs -f dungeonhookah-bot
```

## 🔄 Обновление бота

### PM2
```bash
# Остановка
pm2 stop dungeonhookah-bot

# Обновление кода
git pull

# Установка новых зависимостей
npm install

# Запуск
pm2 start dungeonhookah-bot
```

### Docker
```bash
# Остановка
docker-compose down

# Обновление кода
git pull

# Пересборка и запуск
docker-compose up -d --build
```

## 🛠️ Устранение неполадок

### Проверка подключения к базе данных
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
const db = neon(process.env.DATABASE_URL);
db\`SELECT 1\`.then(() => console.log('✅ База данных доступна')).catch(e => console.log('❌ Ошибка:', e.message));
"
```

### Проверка бота
```bash
# Тестовый запуск
node index.js test
```

### Проверка переменных окружения
```bash
# Проверка .env файла
cat .env

# Проверка переменных в системе
env | grep -E "(BOT_TOKEN|DATABASE_URL)"
```

## 📱 Тестирование бота

1. **Найдите бота в Telegram:** `@DUNGEONHOOKAH_BOT`
2. **Отправьте команду:** `/start`
3. **Проверьте ответ:** Бот должен отправить приветственное сообщение
4. **Проверьте команды:** `/progress`, `/help`

## ⚙️ Настройка уведомлений

По умолчанию уведомления отправляются в **18:00** по московскому времени.

Для изменения времени отредактируйте переменную `NOTIFICATION_TIME` в `.env` файле:
```env
NOTIFICATION_TIME=20:00
TIMEZONE=Europe/Moscow
```

## 🔒 Безопасность

1. **Никогда не коммитьте .env файл**
2. **Используйте сильные пароли для базы данных**
3. **Регулярно обновляйте зависимости**
4. **Мониторьте логи на предмет ошибок**

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи
2. Убедитесь, что все переменные окружения настроены
3. Проверьте подключение к базе данных
4. Убедитесь, что бот токен действителен
