import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id, stock_name, progress } = await request.json()
    
    if (!tg_id || !stock_name) {
      return NextResponse.json({ success: false, message: 'TG ID and stock name are required' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tg_id)
    console.log('Stocks user lookup:', { tg_id, user })
    
    if (!user) {
      // Если пользователь не найден, возвращаем пустой массив акций
      console.log('User not found, returning empty stocks')
      return NextResponse.json({ success: true, stocks: [] })
    }

    // Создаем акцию
    const stock = await db.createStock({
      user_id: user.id,
      stock_name,
      progress: progress || 0
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Stock created successfully',
      stock
    })

  } catch (error) {
    console.error('Error creating stock:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tg_id = searchParams.get('tg_id')
    
    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(parseInt(tg_id))
    console.log('GET stocks user lookup:', { tg_id, user })
    
    if (!user) {
      // Если пользователь не найден, возвращаем пустой массив акций
      console.log('User not found, returning empty stocks')
      return NextResponse.json({ success: true, stocks: [] })
    }

    // Получаем акции пользователя
    const stocks = await db.getUserStocks(user.id)

    return NextResponse.json({ 
      success: true, 
      stocks
    })

  } catch (error) {
    console.error('Error getting stocks:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
