import os
from fastapi import FastAPI, Request, Header, HTTPException
from pydantic import BaseModel
import httpx

BOT_TOKEN = os.getenv("TG_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://next-5th7g9hii-shadowskys-projects.vercel.app")
TG_WEBHOOK_SECRET = os.getenv("TG_WEBHOOK_SECRET")

app = FastAPI()

class Chat(BaseModel):
    id: int

class Message(BaseModel):
    chat: Chat
    text: str | None = None

class Update(BaseModel):
    message: Message | None = None

@app.post("/telegram/webhook")
async def telegram_webhook(request: Request, x_telegram_bot_api_secret_token: str | None = Header(None)):
    if TG_WEBHOOK_SECRET and x_telegram_bot_api_secret_token != TG_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")

    data = await request.json()
    update = Update(**data)

    if not update.message:
        return {"ok": True}

    chat_id = update.message.chat.id
    text = update.message.text or ""

    if text.startswith("/start"):
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": "Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение:",
                    "reply_markup": {
                        "inline_keyboard": [[
                            {"text": "🚀 Открыть приложение", "web_app": {"url": f"{WEBAPP_URL}/register"}}
                        ]]
                    }
                }
            )
            resp.raise_for_status()

    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
