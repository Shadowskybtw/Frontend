#!/usr/bin/env python3
"""
Telegram Bot for DUNGEON WebApp
Supports both webhook and polling modes
"""

import os
import logging
import asyncio
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ParseMode
import requests
import json

# Configuration
BOT_TOKEN = "8242076298:AAGnHplpi7Ad4hOo9z4zTugjqcCEXLJt9to"
WEBAPP_URL = "https://next-5th7g9hii-shadowskys-projects.vercel.app"
WEBHOOK_URL = f"{WEBAPP_URL}/api/telegram/webhook"
WEBHOOK_SECRET = "78256ad5d219d6c4851b24d7c386bc05bbe2456d3e3b965557cb25294a6e49f9"

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class DUNGEONBot:
    def __init__(self):
        self.application = Application.builder().token(BOT_TOKEN).build()
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup bot command and message handlers"""
        # Command handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("register", self.register_command))
        self.application.add_handler(CommandHandler("stocks", self.stocks_command))
        self.application.add_handler(CommandHandler("hookahs", self.hookahs_command))
        
        # WebApp data handler
        self.application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, self.webapp_data_handler))
        
        # Error handler
        self.application.add_error_handler(self.error_handler)
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        logger.info(f"User {user.id} ({user.username}) started the bot in chat {chat_id}")
        
        # Create WebApp button
        keyboard = [
            [InlineKeyboardButton(
                "🚀 Открыть приложение", 
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
            )]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        welcome_text = f"""
🎉 Добро пожаловать в DUNGEON, {user.first_name}!

Здесь вы можете:
• 📊 Отслеживать прогресс акций
• 🎯 Получать бесплатные кальяны  
• 💎 Персональные предложения

Нажмите кнопку ниже, чтобы открыть приложение:
        """.strip()
        
        await update.message.reply_text(
            welcome_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.HTML
        )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = """
🤖 <b>DUNGEON Bot - Справка</b>

<b>Команды:</b>
/start - Открыть WebApp
/register - Регистрация
/stocks - Ваши акции
/hookahs - Бесплатные кальяны
/help - Эта справка

<b>WebApp функции:</b>
• Регистрация пользователя
• Отслеживание прогресса
• Управление кальянами
• Персональные предложения

<b>Поддержка:</b>
По всем вопросам обращайтесь к администрации.
        """.strip()
        
        await update.message.reply_text(help_text, parse_mode=ParseMode.HTML)
    
    async def register_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /register command"""
        keyboard = [
            [InlineKeyboardButton(
                "📝 Регистрация", 
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
            )]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "📝 Для регистрации нажмите кнопку ниже:",
            reply_markup=reply_markup
        )
    
    async def stocks_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /stocks command"""
        user = update.effective_user
        
        # Try to get user stocks from API
        try:
            response = requests.get(
                f"{WEBAPP_URL}/api/stocks/{user.id}",
                headers={'x-telegram-init-data': 'test'}  # Placeholder
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('stocks'):
                    stocks_text = "📊 <b>Ваши акции:</b>\n\n"
                    for stock in data['stocks']:
                        progress_bar = "█" * (stock['progress'] // 10) + "░" * (10 - stock['progress'] // 10)
                        stocks_text += f"• {stock['stock_name']}: {stock['progress']}%\n{progress_bar}\n\n"
                else:
                    stocks_text = "📊 У вас пока нет акций. Зарегистрируйтесь в WebApp!"
            else:
                stocks_text = "📊 Для просмотра акций зарегистрируйтесь в WebApp!"
                
        except Exception as e:
            logger.error(f"Error fetching stocks: {e}")
            stocks_text = "📊 Для просмотра акций зарегистрируйтесь в WebApp!"
        
        keyboard = [
            [InlineKeyboardButton(
                "📊 Открыть акции", 
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
            )]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            stocks_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.HTML
        )
    
    async def hookahs_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /hookahs command"""
        user = update.effective_user
        
        # Try to get user hookahs from API
        try:
            response = requests.get(
                f"{WEBAPP_URL}/api/free-hookahs/{user.id}",
                headers={'x-telegram-init-data': 'test'}  # Placeholder
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    hookahs_text = f"🎯 <b>Ваши кальяны:</b>\n\n"
                    hookahs_text += f"• Всего: {data.get('totalCount', 0)}\n"
                    hookahs_text += f"• Доступно: {data.get('unusedCount', 0)}\n"
                    hookahs_text += f"• Использовано: {data.get('totalCount', 0) - data.get('unusedCount', 0)}\n"
                else:
                    hookahs_text = "🎯 Для просмотра кальянов зарегистрируйтесь в WebApp!"
            else:
                hookahs_text = "🎯 Для просмотра кальянов зарегистрируйтесь в WebApp!"
                
        except Exception as e:
            logger.error(f"Error fetching hookahs: {e}")
            hookahs_text = "🎯 Для просмотра кальянов зарегистрируйтесь в WebApp!"
        
        keyboard = [
            [InlineKeyboardButton(
                "🎯 Открыть кальяны", 
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
            )]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            hookahs_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.HTML
        )
    
    async def webapp_data_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle WebApp data"""
        user = update.effective_user
        data = update.effective_message.web_app_data.data
        
        logger.info(f"Received WebApp data from user {user.id}: {data}")
        
        try:
            # Parse the data
            parsed_data = json.loads(data)
            
            # Send confirmation
            await update.message.reply_text(
                f"✅ Данные получены!\n\n"
                f"Имя: {parsed_data.get('firstName', 'N/A')}\n"
                f"Фамилия: {parsed_data.get('lastName', 'N/A')}\n"
                f"Телефон: {parsed_data.get('phone', 'N/A')}\n\n"
                f"Регистрация завершена успешно! 🎉",
                parse_mode=ParseMode.HTML
            )
            
        except json.JSONDecodeError:
            await update.message.reply_text(
                "❌ Ошибка при обработке данных. Попробуйте еще раз.",
                parse_mode=ParseMode.HTML
            )
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle errors"""
        logger.error(f"Exception while handling an update: {context.error}")
        
        if update and update.effective_message:
            await update.effective_message.reply_text(
                "❌ Произошла ошибка. Попробуйте позже или обратитесь к администрации."
            )
    
    def setup_webhook(self):
        """Setup webhook for production"""
        try:
            # Delete existing webhook
            requests.get(f"https://api.telegram.org/bot{BOT_TOKEN}/deleteWebhook")
            
            # Set new webhook with secret
            webhook_data = {
                'url': WEBHOOK_URL,
                'secret_token': WEBHOOK_SECRET
            }
            
            response = requests.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook",
                json=webhook_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('ok'):
                    logger.info("Webhook set successfully")
                    return True
                else:
                    logger.error(f"Failed to set webhook: {result}")
                    return False
            else:
                logger.error(f"HTTP error setting webhook: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error setting webhook: {e}")
            return False
    
    def run_polling(self):
        """Run bot in polling mode (for development/testing)"""
        logger.info("Starting bot in polling mode...")
        self.application.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=True
        )
    
    def run_webhook(self, host='0.0.0.0', port=8443):
        """Run bot in webhook mode (for production)"""
        logger.info(f"Starting bot in webhook mode on {host}:{port}")
        
        if self.setup_webhook():
            self.application.run_webhook(
                listen=host,
                port=port,
                webhook_url=WEBHOOK_URL,
                secret_token=WEBHOOK_SECRET
            )
        else:
            logger.error("Failed to setup webhook, falling back to polling")
            self.run_polling()

def main():
    """Main function"""
    bot = DUNGEONBot()
    
    # Check environment
    mode = os.getenv('BOT_MODE', 'polling').lower()
    
    if mode == 'webhook':
        bot.run_webhook()
    else:
        bot.run_polling()

if __name__ == '__main__':
    main()
