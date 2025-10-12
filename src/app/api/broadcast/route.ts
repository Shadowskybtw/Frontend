import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { action, admin_key } = await request.json()

    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'get_users') {
      // Получаем всех пользователей с Telegram ID
      const users = await db.getAllUsers()
      const usersWithTgId = users.filter(user => user.tg_id && user.tg_id !== 0)
      
      return NextResponse.json({
        success: true,
        users: usersWithTgId.map(user => ({
          id: user.id,
          tg_id: user.tg_id,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          username: user.username
        }))
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in broadcast API:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
