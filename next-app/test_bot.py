#!/usr/bin/env python3
"""
Test bot to verify broadcast command works
"""

import os
import logging
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

# Configuration
BOT_TOKEN = "7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE"
ADMIN_ID = 937011437  # Ваш Telegram ID

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    await update.message.reply_text("🤖 Тестовый бот запущен! Используйте /broadcast для тестирования.")

async def broadcast_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /broadcast command - only for admin"""
    user = update.effective_user
    
    logger.info(f"Broadcast command from user {user.id} (admin: {ADMIN_ID})")
    
    # Проверяем, что команду использует админ
    if user.id != ADMIN_ID:
        await update.message.reply_text("❌ У тебя нет прав на рассылку 😎")
        return
    
    # Получаем текст сообщения из аргументов команды
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("❌ Используй: /broadcast <текст>")
        return
    
    # Тестовая рассылка
    await update.message.reply_text(f"✅ Тестовая рассылка: '{text}' - команда работает!")

def main():
    """Main function"""
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("broadcast", broadcast_command))
    
    logger.info("Starting test bot...")
    application.run_polling()

if __name__ == '__main__':
    main()
