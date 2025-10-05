#!/usr/bin/env python3
"""
Final working Telegram Bot for DUNGEON WebApp
"""

import os
import logging
import asyncio
import time
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
from telegram.constants import ParseMode
import requests
import json

# Configuration
BOT_TOKEN = "7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE"
WEBAPP_URL = "https://next-5th7g9hii-shadowskys-projects.vercel.app"
ADMIN_ID = 937011437  # Ваш Telegram ID

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Global variable to store user states
user_states = {}

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    logger.info(f"Start command from user {user.id}")
    
    # Create keyboard with buttons
    keyboard = []
    
    # Add WebApp button
    keyboard.append([InlineKeyboardButton(
        "🚀 Открыть приложение", 
        web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
    )])
    
    # Add broadcast button for admin
    if user.id == ADMIN_ID:
        keyboard.append([InlineKeyboardButton(
            "📢 Рассылка (Админ)", 
            callback_data="broadcast_menu"
        )])
    
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

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    user = update.effective_user
    logger.info(f"Help command from user {user.id}")
    
    help_text = """
🤖 <b>DUNGEON Bot - Справка</b>

<b>Команды:</b>
/start - Открыть WebApp
/help - Эта справка
/register - Регистрация
/stocks - Ваши акции
/hookahs - Бесплатные кальяны
    """.strip()
    
    # Add broadcast command for admin
    if user.id == ADMIN_ID:
        help_text += "\n/broadcast - Рассылка (только для админа)"
    
    help_text += """

<b>WebApp функции:</b>
• Регистрация пользователя
• Отслеживание прогресса
• Управление кальянами
• Персональные предложения

<b>Поддержка:</b>
По всем вопросам обращайтесь к администрации.
    """.strip()
    
    await update.message.reply_text(help_text, parse_mode=ParseMode.HTML)

async def register_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /register command"""
    user = update.effective_user
    logger.info(f"Register command from user {user.id}")
    
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

async def stocks_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stocks command"""
    user = update.effective_user
    logger.info(f"Stocks command from user {user.id}")
    
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

async def hookahs_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /hookahs command"""
    user = update.effective_user
    logger.info(f"Hookahs command from user {user.id}")
    
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

async def broadcast_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /broadcast command - only for admin"""
    user = update.effective_user
    logger.info(f"Broadcast command from user {user.id}")
    
    # Проверяем, что команду использует админ
    if user.id != ADMIN_ID:
        await update.message.reply_text("❌ У тебя нет прав на рассылку 😎")
        return
    
    # Получаем текст сообщения из аргументов команды
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("❌ Используй: /broadcast <текст>")
        return
    
    await send_broadcast(update, context, text)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()
    
    user = update.effective_user
    logger.info(f"Button callback from user {user.id}: {query.data}")
    
    if query.data == "broadcast_menu":
        if user.id != ADMIN_ID:
            await query.edit_message_text("❌ У тебя нет прав на рассылку 😎")
            return
        
        # Show broadcast menu
        keyboard = [
            [InlineKeyboardButton("📝 Ввести текст", callback_data="broadcast_text")],
            [InlineKeyboardButton("❌ Отмена", callback_data="cancel")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            "📢 <b>Меню рассылки</b>\n\nВыберите действие:",
            reply_markup=reply_markup,
            parse_mode=ParseMode.HTML
        )
    
    elif query.data == "broadcast_text":
        if user.id != ADMIN_ID:
            await query.edit_message_text("❌ У тебя нет прав на рассылку 😎")
            return
        
        # Store user state for text input
        user_states[user.id] = 'waiting_for_broadcast_text'
        
        await query.edit_message_text(
            "📝 <b>Введите текст для рассылки:</b>\n\nПросто отправьте сообщение с текстом, который хотите разослать всем пользователям.",
            parse_mode=ParseMode.HTML
        )
    
    elif query.data == "cancel":
        await query.edit_message_text("❌ Отменено")

async def webapp_data_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle WebApp data"""
    user = update.effective_user
    data = update.effective_message.web_app_data.data
    logger.info(f"WebApp data from user {user.id}: {data}")
    
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

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle regular messages"""
    user = update.effective_user
    text = update.message.text
    logger.info(f"Message from user {user.id}: {text}")
    
    # Check if user is waiting for broadcast text
    if user_states.get(user.id) == 'waiting_for_broadcast_text' and user.id == ADMIN_ID:
        user_states[user.id] = None  # Clear state
        await send_broadcast(update, context, text)
        return
    
    # Default response for unknown messages
    await update.message.reply_text(
        "❓ Неизвестная команда. Используйте /help для получения справки."
    )

async def send_broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str):
    """Send broadcast to all users"""
    try:
        # Get users from API
        response = requests.post(
            f"{WEBAPP_URL}/api/broadcast",
            headers={'Content-Type': 'application/json'},
            json={
                'action': 'get_users',
                'admin_key': 'admin123'
            }
        )
        
        if response.status_code != 200:
            await update.message.reply_text("❌ Ошибка получения списка пользователей")
            return
        
        data = response.json()
        if not data.get('success'):
            await update.message.reply_text("❌ Ошибка: " + data.get('message', 'Неизвестная ошибка'))
            return
        
        users = data.get('users', [])
        if not users:
            await update.message.reply_text("❌ Пользователи не найдены в базе данных")
            return
        
        # Send message about starting broadcast
        await update.message.reply_text(f"📢 Начинаю рассылку для {len(users)} пользователей...")
        
        # Send messages with delay
        count = 0
        failed = 0
        
        for user_data in users:
            try:
                tg_id = user_data.get('tg_id')
                if not tg_id or tg_id == 0:
                    continue
                    
                await context.bot.send_message(chat_id=tg_id, text=text)
                count += 1
                
                # Delay 0.2 seconds between messages
                await asyncio.sleep(0.2)
                
            except Exception as e:
                failed += 1
                logger.error(f"Failed to send message to {tg_id}: {e}")
                continue
        
        # Send completion report
        await update.message.reply_text(
            f"✅ Рассылка завершена!\n"
            f"📊 Отправлено: {count}\n"
            f"❌ Ошибок: {failed}\n"
            f"👥 Всего пользователей: {len(users)}"
        )
        
    except Exception as e:
        logger.error(f"Broadcast error: {e}")
        await update.message.reply_text(f"❌ Ошибка рассылки: {e}")

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
    application.add_handler(CommandHandler("broadcast", broadcast_command))
    
    # Callback query handler for buttons
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # WebApp data handler
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data_handler))
    
    # Regular message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))
    
    # Error handler
    application.add_error_handler(error_handler)
    
    logger.info("Starting DUNGEON bot...")
    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True
    )

if __name__ == '__main__':
    main()
