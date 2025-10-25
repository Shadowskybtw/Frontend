import { NextRequest, NextResponse } from 'next/server'
import { Update } from '@/types/telegram'

// Обработчик webhook от Telegram
export async function POST(request: NextRequest) {
  try {
    const update: Update = await request.json()
    
    console.log('📨 Received Telegram update:', JSON.stringify(update, null, 2))
    
    // Обрабатываем только команду /start
    if (update.message?.text === '/start') {
      const user = update.message.from
      console.log(`👤 User ${user?.first_name} (${user?.id}) started the bot`)
      
      // Создаем ответ с WebApp кнопкой
      const response = {
        method: 'sendMessage',
        chat_id: update.message.chat.id,
        text: `👋 Привет, ${user?.first_name}!\n\nДобро пожаловать в DUNGEON Hookah!\nНажми кнопку ниже, чтобы открыть приложение:`,
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🚀 Открыть WebApp',
              web_app: {
                url: 'https://frontend-delta-sandy-58.vercel.app'
              }
            }
          ]]
        }
      }
      
      // Отправляем ответ через Telegram Bot API
      const botToken = process.env.BOT_TOKEN
      if (!botToken) {
        throw new Error('BOT_TOKEN not found in environment variables')
      }
      
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response)
      })
      
      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text()
        console.error('❌ Telegram API error:', errorText)
        throw new Error(`Telegram API error: ${telegramResponse.status}`)
      }
      
      console.log('✅ Response sent successfully')
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Обработчик GET запросов (для проверки)
export async function GET() {
  return NextResponse.json({ 
    message: 'Telegram webhook endpoint is working!',
    timestamp: new Date().toISOString()
  })
}