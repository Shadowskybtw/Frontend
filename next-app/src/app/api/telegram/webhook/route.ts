import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TG_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ ok: false, description: 'TG_BOT_TOKEN missing' }, { status: 500 })
    }

    const update = await req.json()
    const message = update?.message
    const chatId = message?.chat?.id
    const text: string | undefined = message?.text

    if (!chatId) return NextResponse.json({ ok: true })

    // Compute WebApp URL
    const defaultOrigin = new URL(req.url).origin.replace(/\/api\/.+$/, '')
    const webAppUrl = `${process.env.WEBAPP_URL || defaultOrigin}/register`

    if (text && text.startsWith('/start')) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение:',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🚀 Открыть приложение',
                web_app: { url: webAppUrl },
              },
            ]],
          },
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, description: (e as Error).message }, { status: 200 })
  }
}
