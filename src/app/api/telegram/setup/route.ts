import { NextRequest, NextResponse } from 'next/server'

// API endpoint для настройки webhook
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'setup') {
      return await setupWebhook()
    } else if (action === 'delete') {
      return await deleteWebhook()
    } else if (action === 'info') {
      return await getWebhookInfo()
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: setup, delete, or info' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function setupWebhook() {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    return NextResponse.json(
      { error: 'BOT_TOKEN not found in environment variables' },
      { status: 500 }
    )
  }
  
  const webhookUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://frontend-delta-sandy-58.vercel.app'}/api/telegram/webhook`
  
  try {
    // Удаляем старый webhook
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST'
    })
    
    // Устанавливаем новый webhook
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    })
    
    const result = await response.json()
    
    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: 'Webhook настроен успешно!',
        webhook_url: webhookUrl,
        result: result.result
      })
    } else {
      return NextResponse.json(
        { error: `Telegram API error: ${result.description}` },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('❌ Webhook setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup webhook' },
      { status: 500 }
    )
  }
}

async function deleteWebhook() {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    return NextResponse.json(
      { error: 'BOT_TOKEN not found in environment variables' },
      { status: 500 }
    )
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST'
    })
    
    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Webhook удален',
      result: result
    })
    
  } catch (error) {
    console.error('❌ Webhook delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}

async function getWebhookInfo() {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    return NextResponse.json(
      { error: 'BOT_TOKEN not found in environment variables' },
      { status: 500 }
    )
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, {
      method: 'POST'
    })
    
    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      webhook_info: result.result
    })
    
  } catch (error) {
    console.error('❌ Webhook info error:', error)
    return NextResponse.json(
      { error: 'Failed to get webhook info' },
      { status: 500 }
    )
  }
}
