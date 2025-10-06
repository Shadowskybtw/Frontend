#!/usr/bin/env python3
"""
Basic working bot - minimal version
"""

import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ParseMode

# Configuration
BOT_TOKEN = "7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE"
WEBAPP_URL = "https://next-5th7g9hii-shadowskys-projects.vercel.app"

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"START from {update.effective_user.id}")
    
    keyboard = [
        [InlineKeyboardButton("🚀 Открыть приложение", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    text = f"""🎉 Добро пожаловать в DUNGEON, {update.effective_user.first_name}!

Здесь вы можете:
• 📊 Отслеживать прогресс акций
• 🎯 Получать бесплатные кальяны  
• 💎 Персональные предложения

Нажмите кнопку ниже, чтобы открыть приложение:"""
    
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode=ParseMode.HTML)

async def help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"HELP from {update.effective_user.id}")
    
    text = """🤖 <b>DUNGEON Bot - Справка</b>

<b>Команды:</b>
/start - Открыть WebApp
/help - Эта справка

<b>WebApp функции:</b>
• Регистрация пользователя
• Отслеживание прогресса
• Управление кальянами
• Персональные предложения

<b>Поддержка:</b>
По всем вопросам обращайтесь к администрации."""
    
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"MESSAGE from {update.effective_user.id}: {update.message.text}")
    await update.message.reply_text("❓ Неизвестная команда. Используйте /help для получения справки.")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("Starting basic bot...")
    app.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    main()
