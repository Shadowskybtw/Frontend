import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Проверяем подключение к базе данных
    if (!db.isConnected()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not connected',
        error: 'Database connection failed'
      }, { status: 500 })
    }

    console.log('Database is connected')

    // Получаем пользователя с TG ID 6922083035
    const user = await db.getUserByTgId(6922083035)
    console.log('User found:', user)

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found',
        tgId: 6922083035
      }, { status: 404 })
    }

    // Получаем акции пользователя
    const stocks = await db.getUserStocks(user.id)
    console.log('User stocks:', stocks)

    const hookahStock = stocks.find(s => s.stock_name === '5+1 кальян')
    console.log('Hookah stock:', hookahStock)

    // Получаем историю кальянов
    const history = await db.getHookahHistory(user.id)
    console.log('Hookah history:', history)

    // Получаем бесплатные кальяны
    const freeHookahs = await db.getFreeHookahs(user.id)
    console.log('Free hookahs:', freeHookahs)

    return NextResponse.json({ 
      success: true, 
      message: 'Database test successful',
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      stocks: stocks,
      hookahStock: hookahStock,
      history: history,
      freeHookahs: freeHookahs
    })

  } catch (error) {
    console.error('Database test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database test failed',
        error: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    )
  }
}
