import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TG_BOT_TOKEN
    const webhookSecret = process.env.TG_WEBHOOK_SECRET
    
    console.log('=== WEBHOOK DEBUG START ===')
    console.log('Bot token exists:', !!botToken)
    console.log('Webhook secret exists:', !!webhookSecret)
    
    if (!botToken) {
      console.error('TG_BOT_TOKEN missing')
      return NextResponse.json({ ok: false, description: 'TG_BOT_TOKEN missing' }, { status: 500 })
    }

    // Check webhook secret if configured
    if (webhookSecret) {
      const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
      console.log('Secret token from header:', !!secretToken)
      if (secretToken !== webhookSecret) {
        console.error('Invalid webhook secret')
        return NextResponse.json({ ok: false, description: 'Invalid secret' }, { status: 401 })
      }
    }

    const update = await req.json()
    console.log('Full update received:', JSON.stringify(update, null, 2))
    
    const message = update?.message
    const chatId = message?.chat?.id
    const text: string | undefined = message?.text

    console.log('Message object:', message)
    console.log('Chat ID:', chatId)
    console.log('Text:', text)

    if (!chatId) {
      console.log('No chat ID in update')
      return NextResponse.json({ ok: true })
    }

    // Compute WebApp URL
    const defaultOrigin = new URL(req.url).origin.replace(/\/api\/.+$/, '')
    const webAppUrl = `${process.env.WEBAPP_URL || defaultOrigin}/register`
    console.log('WebApp URL:', webAppUrl)

    console.log(`Received message: ${text} from chat ${chatId}`)

    if (text && text.startsWith('/start')) {
      console.log(`Sending WebApp button to chat ${chatId}`)
      
      const messagePayload = {
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
      }
      
      console.log('Sending message payload:', JSON.stringify(messagePayload, null, 2))
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
      })

      console.log('Telegram API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Telegram API error: ${response.status} ${errorText}`)
        return NextResponse.json({ ok: false, description: `Telegram API error: ${response.status}` }, { status: 500 })
      }

      const result = await response.json()
      console.log('Telegram API response:', result)
      console.log(`Message sent successfully: ${result.ok}`)
    } else {
      console.log('Message does not start with /start, ignoring')
    }

    console.log('=== WEBHOOK DEBUG END ===')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return NextResponse.json({ ok: false, description: (e as Error).message }, { status: 200 })
  }
}
