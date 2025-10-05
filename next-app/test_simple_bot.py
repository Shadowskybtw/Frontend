#!/usr/bin/env python3
"""
Simple test bot to verify command handling works
"""

import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Configuration
BOT_TOKEN = "7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE"

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    logger.info(f"Start command received from user {update.effective_user.id}")
    await update.message.reply_text("🤖 Тестовый бот работает! Команда /start обработана.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    logger.info(f"Help command received from user {update.effective_user.id}")
    await update.message.reply_text("📖 Справка: /start - начать, /help - помощь")

async def broadcast_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /broadcast command"""
    user = update.effective_user
    logger.info(f"Broadcast command received from user {user.id}")
    
    if user.id != 937011437:
        await update.message.reply_text("❌ У тебя нет прав на рассылку 😎")
        return
    
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("❌ Используй: /broadcast <текст>")
        return
    
    await update.message.reply_text(f"✅ Тестовая рассылка: '{text}' - команда работает!")

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle regular messages"""
    logger.info(f"Message received from user {update.effective_user.id}: {update.message.text}")
    await update.message.reply_text("❓ Неизвестная команда. Используйте /help для получения справки.")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle errors"""
    logger.error(f"Exception while handling an update: {context.error}")

def main():
    """Main function"""
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("broadcast", broadcast_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))
    application.add_error_handler(error_handler)
    
    logger.info("Starting simple test bot...")
    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True
    )

if __name__ == '__main__':
    main()
