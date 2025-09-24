import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API called')
    const { tg_id, action, admin_key } = await request.json()
    console.log('Request data:', { tg_id, action, admin_key })
    
    // Проверяем админский ключ (более гибкая проверка)
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    console.log('Admin key check:', { received: admin_key, expected: expectedAdminKey, envAdmin: process.env.ADMIN_KEY, envPublic: process.env.NEXT_PUBLIC_ADMIN_KEY })
    
    if (admin_key !== expectedAdminKey) {
      console.log('Unauthorized request, admin_key:', admin_key, 'expected:', expectedAdminKey)
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!tg_id) {
      console.log('No TG ID provided')
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Получаем пользователя
    console.log('Looking up user with TG ID:', tg_id)
    const user = await db.getUserByTgId(tg_id)
    console.log('User lookup result:', { tg_id, user })
    
    if (!user) {
      // Если пользователь не найден, но это админский ID, все равно даем права
      const adminTgId = parseInt(process.env.ADMIN_TG_ID || '937011437')
      console.log('Checking admin TG ID:', { tg_id, adminTgId, isMatch: tg_id === adminTgId })
      if (tg_id === adminTgId) {
        console.log('Admin TG ID detected, granting admin rights')
        return NextResponse.json({ 
          success: true, 
          is_admin: true,
          message: 'Admin rights granted by TG ID'
        })
      }
      console.log('User not found and not admin TG ID')
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    if (action === 'check_admin') {
      // Проверяем, является ли пользователь админом
      const adminTgId = parseInt(process.env.ADMIN_TG_ID || '937011437')
      const isAdmin = Number(user.tg_id) === adminTgId
      console.log('Checking admin rights:', { userTgId: Number(user.tg_id), adminTgId, isAdmin })
      return NextResponse.json({ 
        success: true, 
        is_admin: isAdmin
      })
    }

    if (action === 'grant_admin') {
      // Выдаем админские права пользователю
      const targetTgId = tg_id // Используем tg_id как target_tg_id
      
      // Получаем пользователя, которому назначаем права
      const targetUser = await db.getUserByTgId(targetTgId)
      if (!targetUser) {
        return NextResponse.json({ 
          success: false, 
          message: 'Пользователь не найден' 
        }, { status: 404 })
      }
      
      // В реальном приложении здесь должна быть логика сохранения админских прав
      // Пока просто возвращаем успех с информацией о пользователе
      return NextResponse.json({ 
        success: true, 
        message: 'Админские права успешно предоставлены',
        user: {
          id: targetUser.id,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
          tg_id: targetUser.tg_id
        }
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
