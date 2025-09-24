import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('Test DB API called')
    
    // Тестируем подключение к базе данных
    const isConnected = db.isConnected()
    console.log('Database connected:', isConnected)
    
    // Тестируем получение пользователя
    const testTgId = 937011437
    console.log('Testing user lookup for TG ID:', testTgId)
    const user = await db.getUserByTgId(testTgId)
    console.log('User lookup result:', user)
    
    // Тестируем создание пользователя если его нет
    if (!user) {
      console.log('Creating test user')
      const newUser = await db.createUser({
        tg_id: testTgId,
        first_name: 'Тест',
        last_name: 'Пользователь',
        phone: '+1234567890',
        username: 'test_user'
      })
      console.log('Test user created:', newUser)
    }
    
    return NextResponse.json({ 
      success: true, 
      isConnected,
      user: user || 'User not found',
      message: 'Database test completed'
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}