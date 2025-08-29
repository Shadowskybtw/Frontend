import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const botToken = process.env.TG_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: 'TG_BOT_TOKEN missing' }, { status: 500 })
    }

    // Test bot token by getting bot info
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const botInfo = await response.json()

    if (!botInfo.ok) {
      return NextResponse.json({ error: 'Invalid bot token', details: botInfo }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      bot: botInfo.result,
      webhook_url: `${new URL(req.url).origin}/api/telegram/webhook`,
      webhook_secret: process.env.TG_WEBHOOK_SECRET ? 'configured' : 'not configured'
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TG_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: 'TG_BOT_TOKEN missing' }, { status: 500 })
    }

    const { chat_id, message } = await req.json()
    
    if (!chat_id || !message) {
      return NextResponse.json({ error: 'chat_id and message required' }, { status: 400 })
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: message,
      }),
    })

    const result = await response.json()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
