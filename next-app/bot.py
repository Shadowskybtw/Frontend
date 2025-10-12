#!/usr/bin/env python3
"""
Simplified Telegram Bot for DUNGEON WebApp
Only handles WebApp button and admin approval system
"""

import os
import logging
import psycopg2
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram.constants import ParseMode
import requests

# Configuration
BOT_TOKEN = "8242076298:AAGnHplpi7Ad4hOo9z4zTugjqcCEXLJt9to"
WEBAPP_URL = "https://frontend-delta-sandy-58.vercel.app"

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
                "SELECT id, tg_id, first_name, last_name, phone, username FROM users WHERE tg_id = %s AND tg_id IS NOT NULL AND tg_id != 0",
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
    
    def get_all_admins(self):
        """Get all administrators from database"""
        conn = self.get_db_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, tg_id, first_name, last_name, username 
                FROM users 
                WHERE is_admin = true
            """)
            admins = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [{
                'id': admin[0],
                'tg_id': admin[1],
                'first_name': admin[2],
                'last_name': admin[3],
                'username': admin[4]
            } for admin in admins]
        except Exception as e:
            logger.error(f"Error getting admins: {e}")
            return []
    
    def setup_handlers(self):
        """Setup bot command and message handlers"""
        # Command handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        
        # Callback query handlers for free hookah requests
        self.application.add_handler(CallbackQueryHandler(self.handle_approve_free_hookah, pattern="^approve_free_hookah_"))
        self.application.add_handler(CallbackQueryHandler(self.handle_reject_free_hookah, pattern="^reject_free_hookah_"))
        
        # Error handler
        self.application.add_error_handler(self.error_handler)
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        logger.info("🚀 START COMMAND CALLED!")
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        logger.info(f"User {user.id} ({user.username}) started the bot in chat {chat_id}")
        
        # WebApp URL - всегда открываем главную страницу
        webapp_url = f"{WEBAPP_URL}?tg_id={user.id}&first_name={user.first_name}&last_name={user.last_name}&username={user.username or ''}"
        
        # Create WebApp button
        keyboard = [
            [InlineKeyboardButton(
                "🚀 Открыть приложение", 
                web_app=WebAppInfo(url=webapp_url)
            )]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        welcome_text = """Здравствуйте! 👋

Добро пожаловать в DUNGEON Hookah!

Откройте наше приложение по кнопке ниже:"""
        
        await update.message.reply_text(
            welcome_text,
            reply_markup=reply_markup
        )
    
    async def notify_admins_about_free_hookah_request(self, user, stock, request_id):
        """Send notification to all admins about free hookah request"""
        try:
            admins = self.get_all_admins()
            logger.info(f"📢 Notifying {len(admins)} admins about free hookah request {request_id}")
            
            for admin in admins:
                try:
                    message = f"""
🎁 <b>Запрос на бесплатный кальян</b>

👤 <b>Пользователь:</b> {user['first_name']} {user['last_name']}
🆔 <b>Telegram ID:</b> {user['tg_id']}
📱 <b>Username:</b> @{user.get('username', 'Не указан')}
📊 <b>Акция:</b> {stock['stock_name']}
🆔 <b>ID запроса:</b> {request_id}

Нажмите кнопку для подтверждения:
                    """
                    
                    keyboard = [
                        [InlineKeyboardButton(
                            "✅ Подтвердить бесплатный кальян",
                            callback_data=f"approve_free_hookah_{request_id}"
                        )],
                        [InlineKeyboardButton(
                            "❌ Отклонить",
                            callback_data=f"reject_free_hookah_{request_id}"
                        )]
                    ]
                    reply_markup = InlineKeyboardMarkup(keyboard)
                    
                    await self.application.bot.send_message(
                        chat_id=admin['tg_id'],
                        text=message,
                        reply_markup=reply_markup,
                        parse_mode=ParseMode.HTML
                    )
                    logger.info(f"📢 Notification sent to admin {admin['first_name']} {admin['last_name']} (TG ID: {admin['tg_id']})")
                    
                except Exception as e:
                    logger.error(f"Error sending notification to admin {admin['tg_id']}: {e}")
                    
        except Exception as e:
            logger.error(f"Error notifying admins: {e}")

    async def notify_user_about_approved_free_hookah(self, user_tg_id):
        """Send notification to user about approved free hookah"""
        try:
            message = """
🎉 <b>Ваш бесплатный кальян подтвержден!</b>

✅ Администратор подтвердил ваш запрос на бесплатный кальян.
🎁 Теперь вы можете использовать его в приложении!

Нажмите кнопку для открытия приложения:
            """
            
            keyboard = [
                [InlineKeyboardButton(
                    "📱 Открыть приложение",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}/stocks?tg_id={user_tg_id}")
                )]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await self.application.bot.send_message(
                chat_id=user_tg_id,
                text=message,
                reply_markup=reply_markup,
                parse_mode=ParseMode.HTML
            )
            logger.info(f"📢 Approval notification sent to user {user_tg_id}")
            
        except Exception as e:
            logger.error(f"Error notifying user about approved free hookah: {e}")

    async def handle_approve_free_hookah(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle approve free hookah callback"""
        query = update.callback_query
        await query.answer()
        
        request_id = int(query.data.split('_')[-1])
        admin_tg_id = update.effective_user.id
        
        logger.info(f"Admin {admin_tg_id} approving free hookah request {request_id}")
        
        try:
            # Call API to approve the request
            response = requests.post(f"{WEBAPP_URL}/api/approve-free-hookah", json={
                'request_id': request_id,
                'admin_tg_id': admin_tg_id
            })
            
            if response.status_code == 200:
                data = response.json()
                if data['success']:
                    await query.edit_message_text("✅ Запрос на бесплатный кальян подтвержден!")
                else:
                    await query.edit_message_text(f"❌ Ошибка: {data['message']}")
            else:
                await query.edit_message_text("❌ Ошибка сервера при подтверждении запроса")
                
        except Exception as e:
            logger.error(f"Error approving free hookah request: {e}")
            await query.edit_message_text("❌ Произошла ошибка при подтверждении запроса")

    async def handle_reject_free_hookah(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle reject free hookah callback"""
        query = update.callback_query
        await query.answer()
        
        request_id = int(query.data.split('_')[-1])
        admin_tg_id = update.effective_user.id
        
        logger.info(f"Admin {admin_tg_id} rejecting free hookah request {request_id}")
        
        await query.edit_message_text("❌ Запрос на бесплатный кальян отклонен")

    async def error_handler(self, update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle errors"""
        logger.error(f"Exception while handling an update: {context.error}")
    
    def run_polling(self):
        """Run bot in polling mode"""
        logger.info("🚀 Starting bot in polling mode...")
        self.application.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=False
        )

def main():
    """Main function"""
    bot = DUNGEONBot()
    bot.run_polling()

if __name__ == '__main__':
    main()