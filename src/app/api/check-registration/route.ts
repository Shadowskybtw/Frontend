import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()
    
    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Проверяем, зарегистрирован ли пользователь
    const result = await db.query(
      'SELECT id, first_name, last_name, phone, username FROM users WHERE tg_id = $1',
      [tg_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        registered: false,
        message: 'User not registered' 
      })
    }

    const user = result.rows[0]
    return NextResponse.json({ 
      success: true, 
      registered: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username
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
