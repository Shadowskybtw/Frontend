#!/usr/bin/env python3
"""
Simple Telegram Bot for DUNGEON WebApp
Minimal version to avoid compatibility issues
"""

import logging
import asyncio
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

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    logger.info(f"User {user.first_name} ({user.id}) started the bot")
    
    # Create WebApp button
    keyboard = [
        [InlineKeyboardButton(
            "🚀 Открыть WebApp", 
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"👋 Привет, {user.first_name}!\n\n"
        "Добро пожаловать в DUNGEON Hookah!\n"
        "Нажми кнопку ниже, чтобы открыть приложение:",
        reply_markup=reply_markup
    )

def main():
    """Main function"""
    logger.info("🚀 Starting DUNGEON Bot...")
    
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    
    # Start polling
    logger.info("🔄 Starting polling...")
    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True
    )

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user")
    except Exception as e:
        logger.error(f"❌ Bot error: {e}")
