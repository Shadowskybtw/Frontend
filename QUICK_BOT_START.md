# 🚀 Быстрый запуск Telegram бота

## 1. Создайте бота в Telegram

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot`
3. Введите имя: `КальянБот Dungeon`
4. Введите username: `your_hookah_bot`
5. **Скопируйте токен!**

## 2. Настройте бота

```bash
# Перейдите в папку бота
cd telegram-bot

# Установите зависимости
npm install

# Создайте .env файл
cp env.example .env

# Отредактируйте .env файл
nano .env
```

**Вставьте в .env:**
```env
BOT_TOKEN=ваш_токен_от_BotFather
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NOTIFICATION_TIME=18:00
TIMEZONE=Europe/Moscow
```

## 3. Протестируйте бота

```bash
# Тест подключения и данных
node test.js

# Тест отправки уведомлений
node index.js test
```

## 4. Запустите бота

```bash
# Запуск бота
node index.js start
```

**Или из корня проекта:**
```bash
npm run bot:start
```

## 5. Проверьте работу

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Отправьте `/progress`
4. Дождитесь 18:00 для получения уведомления

## 📱 Команды бота

- `/start` - начать работу
- `/progress` - узнать прогресс
- `/help` - справка

## ⏰ Уведомления

- **Время:** 18:00 ежедневно
- **Кому:** всем пользователям из базы данных
- **Что показывает:** сколько кальянов осталось до бесплатного

## 🔧 Настройка времени

В файле `.env`:
```env
NOTIFICATION_TIME=20:00  # Изменить время
TIMEZONE=Europe/Kiev     # Изменить часовой пояс
```

## 🚨 Если что-то не работает

1. **Проверьте токен** в `.env`
2. **Проверьте подключение к базе** - запустите `node test.js`
3. **Проверьте логи** в консоли
4. **Убедитесь что пользователи есть в базе** - запустите `node scripts/check-users.js stats`

---

**Готово! Бот будет отправлять ежедневные уведомления о прогрессе в акции кальянов!** 🎉
