#!/usr/bin/env python3
"""
Ultra simple working bot with all features
"""

import logging
import asyncio
import requests
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
from telegram.constants import ParseMode

# Configuration
BOT_TOKEN = "7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE"
WEBAPP_URL = "https://next-5th7g9hii-shadowskys-projects.vercel.app"
ADMIN_ID = 937011437

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Global state
user_states = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    logger.info(f"START from {user.id}")
    
    keyboard = []
    keyboard.append([InlineKeyboardButton("🚀 Открыть приложение", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))])
    
    if user.id == ADMIN_ID:
        keyboard.append([InlineKeyboardButton("📢 Рассылка (Админ)", callback_data="broadcast_menu")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    text = f"""🎉 Добро пожаловать в DUNGEON, {user.first_name}!

Здесь вы можете:
• 📊 Отслеживать прогресс акций
• 🎯 Получать бесплатные кальяны  
• 💎 Персональные предложения

Нажмите кнопку ниже, чтобы открыть приложение:"""
    
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode=ParseMode.HTML)

async def help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    logger.info(f"HELP from {user.id}")
    
    text = """🤖 <b>DUNGEON Bot - Справка</b>

<b>Команды:</b>
/start - Открыть WebApp
/help - Эта справка
/register - Регистрация
/stocks - Ваши акции
/hookahs - Бесплатные кальяны"""
    
    if user.id == ADMIN_ID:
        text += "\n/broadcast - Рассылка (только для админа)"
    
    text += """

<b>WebApp функции:</b>
• Регистрация пользователя
• Отслеживание прогресса
• Управление кальянами
• Персональные предложения

<b>Поддержка:</b>
По всем вопросам обращайтесь к администрации."""
    
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)

async def register(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"REGISTER from {update.effective_user.id}")
    
    keyboard = [[InlineKeyboardButton("📝 Регистрация", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text("📝 Для регистрации нажмите кнопку ниже:", reply_markup=reply_markup)

async def stocks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"STOCKS from {update.effective_user.id}")
    
    text = "📊 Для просмотра акций зарегистрируйтесь в WebApp!"
    keyboard = [[InlineKeyboardButton("📊 Открыть акции", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode=ParseMode.HTML)

async def hookahs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.info(f"HOOKAHS from {update.effective_user.id}")
    
    text = "🎯 Для просмотра кальянов зарегистрируйтесь в WebApp!"
    keyboard = [[InlineKeyboardButton("🎯 Открыть кальяны", web_app=WebAppInfo(url=f"{WEBAPP_URL}/register"))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode=ParseMode.HTML)

async def broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    logger.info(f"BROADCAST from {user.id}")
    
    if user.id != ADMIN_ID:
        await update.message.reply_text("❌ У тебя нет прав на рассылку 😎")
        return
    
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("❌ Используй: /broadcast <текст>")
        return
    
    await send_broadcast(update, context, text)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user = update.effective_user
    logger.info(f"BUTTON from {user.id}: {query.data}")
    
    if query.data == "broadcast_menu":
        if user.id != ADMIN_ID:
            await query.edit_message_text("❌ У тебя нет прав на рассылку 😎")
            return
        
        keyboard = [
            [InlineKeyboardButton("📝 Ввести текст", callback_data="broadcast_text")],
            [InlineKeyboardButton("❌ Отмена", callback_data="cancel")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text("📢 <b>Меню рассылки</b>\n\nВыберите действие:", reply_markup=reply_markup, parse_mode=ParseMode.HTML)
    
    elif query.data == "broadcast_text":
        if user.id != ADMIN_ID:
            await query.edit_message_text("❌ У тебя нет прав на рассылку 😎")
            return
        
        user_states[user.id] = 'waiting_for_broadcast_text'
        
        await query.edit_message_text("📝 <b>Введите текст для рассылки:</b>\n\nПросто отправьте сообщение с текстом, который хотите разослать всем пользователям.", parse_mode=ParseMode.HTML)
    
    elif query.data == "cancel":
        await query.edit_message_text("❌ Отменено")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = update.message.text
    logger.info(f"MESSAGE from {user.id}: {text}")
    
    if user_states.get(user.id) == 'waiting_for_broadcast_text' and user.id == ADMIN_ID:
        user_states[user.id] = None
        await send_broadcast(update, context, text)
        return
    
    await update.message.reply_text("❓ Неизвестная команда. Используйте /help для получения справки.")

async def send_broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str):
    try:
        response = requests.post(
            f"{WEBAPP_URL}/api/broadcast",
            headers={'Content-Type': 'application/json'},
            json={'action': 'get_users', 'admin_key': 'admin123'}
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
        
        await update.message.reply_text(f"📢 Начинаю рассылку для {len(users)} пользователей...")
        
        count = 0
        failed = 0
        
        for user_data in users:
            try:
                tg_id = user_data.get('tg_id')
                if not tg_id or tg_id == 0:
                    continue
                    
                await context.bot.send_message(chat_id=tg_id, text=text)
                count += 1
                await asyncio.sleep(0.2)
                
            except Exception as e:
                failed += 1
                logger.error(f"Failed to send message to {tg_id}: {e}")
                continue
        
        await update.message.reply_text(
            f"✅ Рассылка завершена!\n"
            f"📊 Отправлено: {count}\n"
            f"❌ Ошибок: {failed}\n"
            f"👥 Всего пользователей: {len(users)}"
        )
        
    except Exception as e:
        logger.error(f"Broadcast error: {e}")
        await update.message.reply_text(f"❌ Ошибка рассылки: {e}")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help))
    app.add_handler(CommandHandler("register", register))
    app.add_handler(CommandHandler("stocks", stocks))
    app.add_handler(CommandHandler("hookahs", hookahs))
    app.add_handler(CommandHandler("broadcast", broadcast))
    
    app.add_handler(CallbackQueryHandler(button_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("Starting ultra simple bot...")
    app.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    main()
