#!/usr/bin/env python3
"""
Ultra simple bot for testing
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

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"START command from {update.effective_user.id}")
    await update.message.reply_text("🤖 Бот работает! Команда /start обработана.")

async def help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"HELP command from {update.effective_user.id}")
    await update.message.reply_text("📖 Справка: /start - начать, /help - помощь")

async def broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    logger.info(f"BROADCAST command from {user.id}")
    
    if user.id != 937011437:
        await update.message.reply_text("❌ Нет прав")
        return
    
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("❌ Используй: /broadcast <текст>")
        return
    
    await update.message.reply_text(f"✅ Рассылка: '{text}'")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"MESSAGE from {update.effective_user.id}: {update.message.text}")
    await update.message.reply_text("❓ Неизвестная команда. Используйте /help")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help))
    app.add_handler(CommandHandler("broadcast", broadcast))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("Starting simple bot...")
    app.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    main()
