import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id, action, target_tg_id, admin_key } = await request.json()
    
    // Проверяем админский ключ
    if (admin_key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tg_id)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    if (action === 'check_admin') {
      // Проверяем, является ли пользователь админом
      const isAdmin = user.tg_id === parseInt(process.env.ADMIN_TG_ID || '0')
      return NextResponse.json({ 
        success: true, 
        is_admin: isAdmin
      })
    }

    if (action === 'grant_admin' && target_tg_id) {
      // Выдаем админские права (в реальном приложении это должно быть более сложно)
      // Пока просто возвращаем успех
      return NextResponse.json({ 
        success: true, 
        message: 'Admin rights granted'
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in admin API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
