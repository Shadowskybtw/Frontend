#!/usr/bin/env python3
"""
Working simple bot as it was before
"""

import logging
import requests
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

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    logger.info(f"START command from user {user.id}")
    
    keyboard = [
        [InlineKeyboardButton("🚀 Открыть приложение", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_text = f"""🎉 Добро пожаловать в DUNGEON, {user.first_name}!

Здесь вы можете:
• 📊 Отслеживать прогресс акций
• 🎯 Получать бесплатные кальяны  
• 💎 Персональные предложения

Нажмите кнопку ниже, чтобы открыть приложение:"""
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=reply_markup,
        parse_mode=ParseMode.HTML
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    user = update.effective_user
    logger.info(f"HELP command from user {user.id}")
    
    help_text = """🤖 <b>DUNGEON Bot - Справка</b>

<b>Команды:</b>
/start - Открыть WebApp
/help - Эта справка
/register - Регистрация
/stocks - Ваши акции
/hookahs - Бесплатные кальяны

<b>WebApp функции:</b>
• Регистрация пользователя
• Отслеживание прогресса
• Управление кальянами
• Персональные предложения

<b>Поддержка:</b>
По всем вопросам обращайтесь к администрации."""
    
    await update.message.reply_text(help_text, parse_mode=ParseMode.HTML)

async def register_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /register command"""
    user = update.effective_user
    logger.info(f"REGISTER command from user {user.id}")
    
    keyboard = [
        [InlineKeyboardButton("📝 Регистрация", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "📝 Для регистрации нажмите кнопку ниже:",
        reply_markup=reply_markup
    )

async def stocks_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stocks command"""
    user = update.effective_user
    logger.info(f"STOCKS command from user {user.id}")
    
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
        [InlineKeyboardButton("📊 Открыть акции", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        stocks_text,
        reply_markup=reply_markup,
        parse_mode=ParseMode.HTML
    )

async def hookahs_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /hookahs command"""
    user = update.effective_user
    logger.info(f"HOOKAHS command from user {user.id}")
    
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
        [InlineKeyboardButton("🎯 Открыть кальяны", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        hookahs_text,
        reply_markup=reply_markup,
        parse_mode=ParseMode.HTML
    )

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle regular messages"""
    user = update.effective_user
    text = update.message.text
    logger.info(f"MESSAGE from user {user.id}: {text}")
    
    await update.message.reply_text(
        "❓ Неизвестная команда. Используйте /help для получения справки."
    )

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle errors"""
    logger.error(f"Exception while handling an update: {context.error}")

def main():
    """Main function"""
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("register", register_command))
    application.add_handler(CommandHandler("stocks", stocks_command))
    application.add_handler(CommandHandler("hookahs", hookahs_command))
    
    # Regular message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))
    
    # Error handler
    application.add_error_handler(error_handler)
    
    logger.info("Starting working simple bot...")
    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True
    )

if __name__ == '__main__':
    main()
