import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TG_BOT_TOKEN
    const webhookSecret = process.env.TG_WEBHOOK_SECRET
    
    if (!botToken) {
      return NextResponse.json({ ok: false, description: 'TG_BOT_TOKEN missing' }, { status: 500 })
    }

    // Check webhook secret if configured
    if (webhookSecret) {
      const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
      if (secretToken !== webhookSecret) {
        return NextResponse.json({ ok: false, description: 'Invalid secret' }, { status: 401 })
      }
    }

    const { chatId } = await req.json()
    
    if (!chatId) {
      return NextResponse.json({ ok: false, description: 'chatId required' }, { status: 400 })
    }

    // Compute WebApp URL
    const defaultOrigin = new URL(req.url).origin.replace(/\/api\/.+$/, '')
    const webAppUrl = `${process.env.WEBAPP_URL || defaultOrigin}/register`

    const messagePayload = {
      chat_id: chatId,
      text: '🧪 Тестовое сообщение! Нажмите кнопку ниже, чтобы открыть приложение:',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 Открыть приложение',
            web_app: { url: webAppUrl },
          },
        ]],
      },
    }
    
    console.log('Test endpoint - sending message payload:', JSON.stringify(messagePayload, null, 2))
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Telegram API error: ${response.status} ${errorText}`)
      return NextResponse.json({ ok: false, description: `Telegram API error: ${response.status}` }, { status: 500 })
    }

    const result = await response.json()
    console.log('Test endpoint - Telegram API response:', result)
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Test message sent successfully',
      telegramResponse: result,
      webAppUrl 
    })
  } catch (e) {
    console.error('Test endpoint error:', e)
    return NextResponse.json({ ok: false, description: (e as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const botToken = process.env.TG_BOT_TOKEN
  const webhookSecret = process.env.TG_WEBHOOK_SECRET
  
  // Compute WebApp URL
  const defaultOrigin = new URL(req.url).origin.replace(/\/api\/.+$/, '')
  const webAppUrl = `${process.env.WEBAPP_URL || defaultOrigin}/register`

  return NextResponse.json({
    botTokenExists: !!botToken,
    webhookSecretExists: !!webhookSecret,
    webAppUrl,
    endpoints: {
      webhook: `${defaultOrigin}/api/telegram/webhook`,
      test: `${defaultOrigin}/api/telegram/test`
    }
  })
}