import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Debug DB API called')
    
    // Проверяем подключение к базе данных
    const isConnected = db.isConnected()
    console.log('Database connected:', isConnected)
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Database not connected'
      }, { status: 500 })
    }

    // Получаем всех пользователей
    const allUsers = await db.getAllUsers()
    console.log('All users:', allUsers.length)
    
    // Получаем все записи истории
    const allHistory = await db.getAllHookahHistory()
    console.log('All history records:', allHistory.length)
    
    // Получаем все акции
    const allStocks = await db.getAllStocks()
    console.log('All stocks:', allStocks.length)
    
    // Получаем все бесплатные кальяны
    const allFreeHookahs = await db.getAllFreeHookahs()
    console.log('All free hookahs:', allFreeHookahs.length)

    return NextResponse.json({
      success: true,
      database: {
        connected: isConnected,
        users: allUsers.length,
        history: allHistory.length,
        stocks: allStocks.length,
        freeHookahs: allFreeHookahs.length
      },
      data: {
        users: allUsers.map(u => ({
          id: u.id,
          tg_id: u.tg_id,
          first_name: u.first_name,
          last_name: u.last_name,
          phone: u.phone
        })),
        history: allHistory.map(h => ({
          id: h.id,
          user_id: h.user_id,
          hookah_type: h.hookah_type,
          slot_number: h.slot_number,
          created_at: h.created_at
        })),
        stocks: allStocks.map(s => ({
          id: s.id,
          user_id: s.user_id,
          stock_name: s.stock_name,
          progress: s.progress,
          promotion_completed: s.promotion_completed
        })),
        freeHookahs: allFreeHookahs.map(f => ({
          id: f.id,
          user_id: f.user_id,
          used: f.used,
          created_at: f.created_at
        }))
      }
    })

  } catch (error) {
    console.error('Error in debug DB API:', error)
    return NextResponse.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
