import os
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

BOT_TOKEN = os.getenv("TG_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://next-5th7g9hii-shadowskys-projects.vercel.app")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[
        InlineKeyboardButton(
            text="🚀 Открыть приложение",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}/register")
        )
    ]]
    await update.message.reply_text(
        "Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


def main():
    if not BOT_TOKEN:
        raise RuntimeError("TG_BOT_TOKEN is not set")

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling(close_loop=False)


if __name__ == "__main__":
    main()
