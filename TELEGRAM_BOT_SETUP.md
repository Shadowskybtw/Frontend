# 🤖 Настройка Telegram бота для уведомлений

## 📋 Пошаговая инструкция

### 1. Создание Telegram бота

1. **Откройте Telegram** и найдите [@BotFather](https://t.me/BotFather)
2. **Отправьте команду** `/newbot`
3. **Введите имя бота:** `КальянБот Dungeon`
4. **Введите username бота:** `your_hookah_bot` (должен заканчиваться на `bot`)
5. **Скопируйте токен** который даст BotFather

### 2. Настройка переменных окружения

1. **Перейдите в папку бота:**
```bash
cd telegram-bot
```

2. **Создайте .env файл:**
```bash
cp env.example .env
```

3. **Отредактируйте .env файл:**
```env
# Telegram Bot Configuration
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz  # Токен от BotFather

# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Notification Settings
NOTIFICATION_TIME=18:00
TIMEZONE=Europe/Moscow

# Bot Settings
BOT_NAME=КальянБот Dungeon
BOT_USERNAME=your_hookah_bot
```

### 3. Установка и запуск

1. **Установите зависимости:**
```bash
npm install
```

2. **Протестируйте бота:**
```bash
node index.js test
```

3. **Запустите бота:**
```bash
node index.js start
```

### 4. Настройка команд бота (опционально)

1. **Откройте [@BotFather](https://t.me/BotFather)**
2. **Отправьте команду** `/setcommands`
3. **Выберите вашего бота**
4. **Отправьте список команд:**
```
start - Начать работу с ботом
progress - Узнать свой прогресс в акции
help - Показать справку
```

## 🚀 Деплой на сервер

### Вариант 1: VPS/Сервер

1. **Загрузите файлы на сервер**
2. **Установите Node.js 16+**
3. **Запустите скрипт деплоя:**
```bash
./deploy.sh
```

### Вариант 2: PM2 (рекомендуется для продакшена)

1. **Установите PM2:**
```bash
npm install -g pm2
```

2. **Создайте ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'hookah-bot',
    script: 'index.js',
    cwd: '/path/to/telegram-bot',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

3. **Запустите бота:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Вариант 3: Docker

1. **Создайте Dockerfile:**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
```

2. **Создайте docker-compose.yml:**
```yaml
version: '3.8'
services:
  hookah-bot:
    build: .
    environment:
      - BOT_TOKEN=${BOT_TOKEN}
      - DATABASE_URL=${DATABASE_URL}
      - NOTIFICATION_TIME=18:00
      - TIMEZONE=Europe/Moscow
    restart: unless-stopped
```

3. **Запустите:**
```bash
docker-compose up -d
```

## 📱 Тестирование

### 1. Проверка команд

1. **Найдите вашего бота в Telegram**
2. **Отправьте** `/start`
3. **Отправьте** `/progress` (если вы есть в базе данных)
4. **Отправьте** `/help`

### 2. Тест уведомлений

```bash
node index.js test
```

## ⚙️ Настройка расписания

### Изменение времени уведомлений:

В файле `.env`:
```env
NOTIFICATION_TIME=20:00  # 20:00 вместо 18:00
```

### Изменение часового пояса:

```env
TIMEZONE=Europe/Kiev  # Киевское время
```

## 🔧 Мониторинг

### Логи в консоли:
- ✅ Успешные операции
- ❌ Ошибки
- 📊 Статистика отправки
- ⏰ Время уведомлений

### PM2 мониторинг:
```bash
pm2 status
pm2 logs hookah-bot
pm2 monit
```

## 🚨 Устранение неполадок

### Бот не отвечает:
1. Проверьте токен в `.env`
2. Убедитесь что бот запущен
3. Проверьте логи на ошибки

### Ошибка базы данных:
1. Проверьте `DATABASE_URL` в `.env`
2. Убедитесь что база данных доступна
3. Проверьте права доступа

### Уведомления не отправляются:
1. Проверьте время в `NOTIFICATION_TIME`
2. Убедитесь что cron работает
3. Проверьте что пользователи есть в базе

### Пользователь не найден:
1. Убедитесь что `tg_id` заполнен в базе данных
2. Проверьте что пользователь зарегистрирован в webapp

## 📊 Статистика

Бот ведет статистику:
- Количество пользователей для уведомлений
- Успешные отправки
- Ошибки отправки
- Время последней отправки

## 🔄 Обновление

1. **Остановите бота:**
```bash
pm2 stop hookah-bot
# или
pkill -f "node index.js"
```

2. **Обновите код:**
```bash
git pull
npm install
```

3. **Запустите бота:**
```bash
pm2 start hookah-bot
# или
node index.js start
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи
2. Убедитесь в правильности настроек
3. Обратитесь к администратору

---

**Готово! Ваш бот будет отправлять ежедневные уведомления пользователям о прогрессе в акции кальянов!** 🎉
