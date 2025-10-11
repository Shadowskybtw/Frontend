import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test add history API called')
    
    const { tg_id } = await request.json()
    
    if (!tg_id) {
      return NextResponse.json({
        success: false,
        message: 'TG ID is required'
      }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tg_id)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    console.log('Found user:', user)

    // Создаем тестовую запись в истории
    const testHistory = await db.addHookahToHistory(
      user.id,
      'regular',
      1, // slot_number
      null, // stockId
      null, // adminId
      'test' // scanMethod
    )

    console.log('Test history created:', testHistory)

    // Получаем историю пользователя после добавления
    const userHistory = await db.getHookahHistory(user.id)
    console.log('User history after test:', userHistory)

    return NextResponse.json({
      success: true,
      message: 'Test history record created',
      testRecord: testHistory,
      userHistory: userHistory
    })

  } catch (error) {
    console.error('Error in test add history API:', error)
    return NextResponse.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
