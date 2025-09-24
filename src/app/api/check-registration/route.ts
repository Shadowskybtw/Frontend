import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()
    
    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Проверяем, зарегистрирован ли пользователь
    const user = await db.getUserByTgId(tg_id)

    if (!user) {
      return NextResponse.json({ 
        success: true, 
        registered: false,
        message: 'User not registered' 
      })
    }

    return NextResponse.json({ 
      success: true, 
      registered: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Error checking registration:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
