import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Debug All API called')
    
    // Проверяем подключение к базе данных
    const isConnected = db.isConnected()
    console.log('Database connected:', isConnected)
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Database not connected'
      }, { status: 500 })
    }

    // Получаем все данные из базы
    const allUsers = await db.getAllUsers()
    const allHistory = await db.getAllHookahHistory()
    const allStocks = await db.getAllStocks()
    const allFreeHookahs = await db.getAllFreeHookahs()

    // Проверяем конкретного пользователя (замените на ваш TG ID)
    const testTgId = 937011437 // Замените на ваш TG ID
    const testUser = await db.getUserByTgId(testTgId)
    let testUserData = null
    
    if (testUser) {
      const testUserHistory = await db.getHookahHistory(testUser.id)
      const testUserStocks = await db.getUserStocks(testUser.id)
      const testUserFreeHookahs = await db.getFreeHookahs(testUser.id)
      
      testUserData = {
        user: testUser,
        history: testUserHistory,
        stocks: testUserStocks,
        freeHookahs: testUserFreeHookahs
      }
    }

    return NextResponse.json({
      success: true,
      database: {
        connected: isConnected,
        totalUsers: allUsers.length,
        totalHistory: allHistory.length,
        totalStocks: allStocks.length,
        totalFreeHookahs: allFreeHookahs.length
      },
      sampleData: {
        users: allUsers.slice(0, 3).map(u => ({
          id: u.id,
          tg_id: u.tg_id,
          first_name: u.first_name,
          last_name: u.last_name
        })),
        history: allHistory.slice(0, 5).map(h => ({
          id: h.id,
          user_id: h.user_id,
          hookah_type: h.hookah_type,
          created_at: h.created_at
        })),
        stocks: allStocks.slice(0, 3).map(s => ({
          id: s.id,
          user_id: s.user_id,
          stock_name: s.stock_name,
          progress: s.progress
        }))
      },
      testUser: testUserData,
      fullData: {
        allUsers,
        allHistory,
        allStocks,
        allFreeHookahs
      }
    })

  } catch (error) {
    console.error('Error in debug all API:', error)
    return NextResponse.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
