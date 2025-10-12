#!/usr/bin/env python3
"""
Simple Telegram Bot for DUNGEON WebApp
Only handles /start command with WebApp button
"""

import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# Configuration
BOT_TOKEN = "8242076298:AAGnHplpi7Ad4hOo9z4zTugjqcCEXLJt9to"
WEBAPP_URL = "https://frontend-delta-sandy-58.vercel.app"

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
        """Setup bot command handlers"""
        self.application.add_handler(CommandHandler("start", self.start_command))
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        logger.info("🚀 START COMMAND CALLED!")
        user = update.effective_user
        
        logger.info(f"User {user.id} ({user.username}) started the bot")
        
        # WebApp URL with user data
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