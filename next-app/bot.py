#!/usr/bin/env python3
"""
Telegram Bot for DUNGEON WebApp
Supports both webhook and polling modes
"""

import os
import logging
import asyncio
import schedule
import time
import psycopg2
from datetime import datetime, timezone
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ParseMode
import requests
import json

# Configuration
BOT_TOKEN = "8242076298:AAGnHplpi7Ad4hOo9z4zTugjqcCEXLJt9to"
WEBAPP_URL = "https://frontend-delta-sandy-58.vercel.app"
WEBHOOK_URL = f"{WEBAPP_URL}/api/telegram/webhook"
WEBHOOK_SECRET = "78256ad5d219d6c4851b24d7c386bc05bbe2456d3e3b965557cb25294a6e49f9"

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

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
        self.setup_daily_notifications()
    
    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(DATABASE_URL)
            return conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return None
    
    def get_user_by_tg_id(self, tg_id):
        """Get user by Telegram ID from database"""
        logger.info(f"🔍 Bot: Getting user by TG ID: {tg_id}")
        
        conn = self.get_db_connection()
        if not conn:
            logger.error("❌ Bot: Database connection failed")
            return None
        
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, tg_id, first_name, last_name, phone, username FROM users WHERE tg_id = %s",
                (tg_id,)
            )
            user = cursor.fetchone()
            cursor.close()
            conn.close()
            
            logger.info(f"🔍 Bot: Raw user from database: {user}")
            
            if user:
                user_data = {
                    'id': user[0],
                    'tg_id': user[1],
                    'first_name': user[2],
                    'last_name': user[3],
                    'phone': user[4],
                    'username': user[5]
                }
                logger.info(f"✅ Bot: Converted user data: {user_data}")
                return user_data
            else:
                logger.info(f"❌ Bot: No user found for tg_id: {tg_id}")
                return None
        except Exception as e:
            logger.error(f"Error getting user by tg_id {tg_id}: {e}")
            if conn:
                conn.close()
            return None
    
    def get_user_stocks(self, user_id):
        """Get user stocks from database"""
        conn = self.get_db_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, user_id, stock_name, progress FROM stocks WHERE user_id = %s",
                (user_id,)
            )
            stocks = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [{
                'id': stock[0],
                'user_id': stock[1],
                'stock_name': stock[2],
                'progress': stock[3]
            } for stock in stocks]
        except Exception as e:
            logger.error(f"Error getting user stocks for user {user_id}: {e}")
            if conn:
                conn.close()
            return []
    
    def get_user_free_hookahs(self, user_id):
        """Get user free hookahs from database"""
        conn = self.get_db_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, user_id, used, created_at FROM free_hookahs WHERE user_id = %s",
                (user_id,)
            )
            hookahs = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [{
                'id': hookah[0],
                'user_id': hookah[1],
                'used': hookah[2],
                'created_at': hookah[3]
            } for hookah in hookahs]
        except Exception as e:
            logger.error(f"Error getting user free hookahs for user {user_id}: {e}")
            if conn:
                conn.close()
            return []
    
    def get_all_users_from_db(self):
        """Get all users from database"""
        conn = self.get_db_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, tg_id, first_name, last_name, phone, username FROM users WHERE tg_id IS NOT NULL"
            )
            users = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [{
                'id': user[0],
                'tg_id': user[1],
                'first_name': user[2],
                'last_name': user[3],
                'phone': user[4],
                'username': user[5]
            } for user in users]
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            if conn:
                conn.close()
            return []
    
    def setup_handlers(self):
        """Setup bot command and message handlers"""
        # Command handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("progress", self.progress_command))
        self.application.add_handler(CommandHandler("register", self.register_command))
        self.application.add_handler(CommandHandler("stocks", self.stocks_command))
        self.application.add_handler(CommandHandler("hookahs", self.hookahs_command))
        
        # WebApp data handler
        self.application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, self.webapp_data_handler))
        
        # Error handler
        self.application.add_error_handler(self.error_handler)
    
    def setup_daily_notifications(self):
        """Setup daily notification scheduler"""
        # Schedule daily notifications at 18:00
        schedule.every().day.at("18:00").do(self.send_daily_notifications)
        logger.info("Daily notifications scheduled for 18:00")
    
    async def get_all_users(self):
        """Get all users from the database"""
        return self.get_all_users_from_db()
    
    async def get_user_progress(self, user_id):
        """Get user's progress from database"""
        try:
            # Get user's stocks from database
            stocks = self.get_user_stocks(user_id)
            main_stock = None
            
            for stock in stocks:
                if '5+1' in stock['stock_name'] or 'кальян' in stock['stock_name'].lower():
                    main_stock = stock
                    break
            
            if main_stock:
                progress = main_stock['progress']
                slots_filled = progress // 20
                slots_remaining = 5 - slots_filled
                
                # Check for free hookahs
                free_hookahs = self.get_user_free_hookahs(user_id)
                unused_free_hookahs = [h for h in free_hookahs if not h['used']]
                has_free_hookah = len(unused_free_hookahs) > 0
                
                return {
                    'progress': progress,
                    'slots_filled': slots_filled,
                    'slots_remaining': slots_remaining,
                    'has_free_hookah': has_free_hookah
                }
            return None
                
        except Exception as e:
            logger.error(f"Error getting user progress for {user_id}: {e}")
            return None
    
    async def send_daily_notifications(self):
        """Send daily notifications to all users"""
        logger.info("Starting daily notifications...")
        
        users = await self.get_all_users()
        if not users:
            logger.warning("No users found for notifications")
            return
        
        logger.info(f"Found {len(users)} users for notifications")
        
        for user_data in users:
            try:
                user_id = user_data.get('tg_id')
                if not user_id:
                    continue
                
                progress_data = await self.get_user_progress(user_id)
                if not progress_data:
                    continue
                
                # Create notification message
                if progress_data['has_free_hookah']:
                    message = "🎉 У вас есть бесплатный кальян! 🎁\n\nПриходите скорее забирать его!"
                elif progress_data['slots_remaining'] > 0:
                    message = f"📊 До бесплатного кальяна осталось: {progress_data['slots_remaining']} кальянов"
                else:
                    continue  # Skip if no progress
                
                # Send message
                await self.application.bot.send_message(
                    chat_id=user_id,
                    text=message
                )
                
                logger.info(f"Sent notification to user {user_id}")
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error sending notification to user {user_data.get('tg_id')}: {e}")
                continue
        
        logger.info("Daily notifications completed")
    
    def run_notification_scheduler(self):
        """Run the notification scheduler in a separate thread"""
        def scheduler_loop():
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        import threading
        scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
        scheduler_thread.start()
        logger.info("Notification scheduler started")
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        logger.info("🚀 START COMMAND CALLED!")
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        logger.info(f"User {user.id} ({user.username}) started the bot in chat {chat_id}")
        logger.info(f"🔍 Bot: Update object: {update}")
        
        # Create WebApp button
        keyboard = [
            [InlineKeyboardButton(
                "🚀 Открыть приложение", 
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
            )]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        welcome_text = f"""Добро пожаловать! Я буду напоминать вам о прогрессе в акции кальянов.

📊 Доступные команды:
/progress - узнать свой прогресс
/help - помощь

💡 Для подробной информации о прогрессе используйте мини-приложение!"""
        
        await update.message.reply_text(
            welcome_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.HTML
        )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = """SOS Помощь

📊 Команды:
/start - начать работу с ботом
/progress - узнать свой прогресс в акции
/help - показать эту справку

🔔 Уведомления:
Бот отправляет ежедневные уведомления в 18:00 о вашем прогрессе в акции кальянов.

🎯 Как работает акция:
• Каждые 5 покупок = 1 бесплатный кальян
• После получения бесплатного счетчик сбрасывается
• Прогресс отображается в процентах

Если у вас есть вопросы, обратитесь к администратору!"""
        
        await update.message.reply_text(help_text, parse_mode=ParseMode.HTML)
    
    async def progress_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /progress command"""
        logger.info("🚀 PROGRESS COMMAND CALLED!")
        user = update.effective_user
        
        logger.info(f"🔍 Bot: User {user.id} ({user.username}) requested /progress")
        logger.info(f"🔍 Bot: Telegram user data: {user}")
        logger.info(f"🔍 Bot: Update object: {update}")
        
        # Get user from database
        db_user = self.get_user_by_tg_id(user.id)
        logger.info(f"🔍 Bot: Database user lookup result: {db_user}")
        
        if not db_user:
            progress_message = "📊 Для просмотра прогресса зарегистрируйтесь в WebApp!"
            keyboard = [
                [InlineKeyboardButton(
                    "🚀 Открыть приложение", 
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
                )]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
        else:
            # Get user's stocks from database
            stocks = self.get_user_stocks(db_user['id'])
            main_stock = None
            
            for stock in stocks:
                if '5+1' in stock['stock_name'] or 'кальян' in stock['stock_name'].lower():
                    main_stock = stock
                    break
            
            if main_stock:
                progress = main_stock['progress']
                slots_filled = progress // 20  # Each slot is 20%
                slots_remaining = 5 - slots_filled
                
                # Check for free hookahs
                free_hookahs = self.get_user_free_hookahs(db_user['id'])
                unused_free_hookahs = [h for h in free_hookahs if not h['used']]
                
                if unused_free_hookahs:
                    progress_message = f"Привет, {db_user['first_name']}! 👋\n\n🎯 У вас есть бесплатный кальян! 🎁\n\nПриходите скорее забирать его!"
                elif progress >= 100:
                    progress_message = f"Привет, {db_user['first_name']}! 👋\n\n🎯 Поздравляем! У вас есть бесплатный кальян! 🎁\n\nПриходите скорее забирать его!"
                else:
                    progress_message = f"Привет, {db_user['first_name']}! 👋\n\n🎯 До бесплатного кальяна осталось: {slots_remaining} кальянов"
                
                keyboard = [
                    [InlineKeyboardButton(
                        "📱 Открыть приложение", 
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}/stocks")
                    )]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
            else:
                progress_message = f"Привет, {db_user['first_name']}! 👋\n\n📊 У вас пока нет акций. Зарегистрируйтесь в WebApp!"
                keyboard = [
                    [InlineKeyboardButton(
                        "🚀 Открыть приложение", 
                        web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
                    )]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            progress_message,
            reply_markup=reply_markup,
            parse_mode=ParseMode.HTML
        )
    
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
        logger.info("🚀 Starting bot in polling mode...")
        logger.info("🚀 Bot handlers registered:")
        logger.info("🚀 - start_command")
        logger.info("🚀 - help_command") 
        logger.info("🚀 - progress_command")
        logger.info("🚀 - register_command")
        logger.info("🚀 - stocks_command")
        logger.info("🚀 - hookahs_command")
        
        # Start notification scheduler
        self.run_notification_scheduler()
        self.application.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=False
        )
    
    def run_webhook(self, host='0.0.0.0', port=8443):
        """Run bot in webhook mode (for production)"""
        logger.info(f"Starting bot in webhook mode on {host}:{port}")
        
        # Start notification scheduler
        self.run_notification_scheduler()
        
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
