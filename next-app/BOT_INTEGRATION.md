# Интеграция с Telegram Bot

## Проблема с Vercel Deployment Protection

**ВАЖНО:** Прод-деплой защищён Vercel Deployment Protection, что блокирует вебхуки Telegram (401 Unauthorized).

### Решения:

#### 1. Отключить защиту деплоя (рекомендуется)
- Vercel → Project → Settings → Deployment Protection
- Для Production выключи Protection

#### 2. Использовать Protection Bypass Token
- Vercel → Project → Settings → Deployment Protection → Generate Bypass Token
- Добавить в вебхук URL: `?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=<TOKEN>`

#### 3. Тестирование через polling (временно)
```bash
# Запустить тестовый бот
node scripts/test-bot.js
```

## Настройка бота

После решения проблемы с защитой, добавьте следующий код в вашего бота:

### Python (python-telegram-bot)

```python
from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# Прод-URL WebApp
WEBAPP_URL = "https://next-5th7g9hii-shadowskys-projects.vercel.app"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(
            "🚀 Открыть приложение", 
            web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=reply_markup
    )

async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка данных от WebApp"""
    data = update.effective_message.web_app_data.data
    await update.message.reply_text(f"Получены данные: {data}")

def main():
    application = Application.builder().token("YOUR_BOT_TOKEN").build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data))
    
    application.run_polling()

if __name__ == "__main__":
    main()
```

### JavaScript (node-telegram-bot-api)

```javascript
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot('YOUR_BOT_TOKEN', {polling: true});

// Прод-URL WebApp
const WEBAPP_URL = "https://next-5th7g9hii-shadowskys-projects.vercel.app";

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
        inline_keyboard: [[
            {
                text: "🚀 Открыть приложение",
                web_app: { url: `${WEBAPP_URL}/register` }
            }
        ]]
    };
    
    bot.sendMessage(chatId, 
        "Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение:", 
        { reply_markup: keyboard }
    );
});

bot.on('web_app_data', (msg) => {
    const chatId = msg.chat.id;
    const data = msg.web_app_data.data;
    
    bot.sendMessage(chatId, `Получены данные: ${data}`);
});
```

## Переменные окружения для Vercel

В настройках проекта Vercel добавьте:

```
TG_BOT_TOKEN=7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
WEBAPP_URL=https://next-5th7g9hii-shadowskys-projects.vercel.app
TG_WEBHOOK_SECRET=78256ad5d219d6c4851b24d7c386bc05bbe2456d3e3b965557cb25294a6e49f9
```

## Проверка работы

1. Отправьте `/start` боту
2. Нажмите кнопку "Открыть приложение"
3. Заполните форму регистрации
4. Данные сохранятся в базе данных

## URL для WebApp

Используйте URL:
`https://next-5th7g9hii-shadowskys-projects.vercel.app/register`

## Тестирование

### Проверить бота:
```bash
curl "https://api.telegram.org/bot7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE/getMe"
```

### Запустить тестовый polling бот:
```bash
node scripts/test-bot.js
```

### Проверить вебхук (после отключения защиты):
```bash
curl "https://api.telegram.org/bot7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE/getWebhookInfo"
```
