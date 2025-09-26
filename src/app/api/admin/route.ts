import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API called')
    const body = await request.json()
    const { tg_id, action, admin_key, target_tg_id } = body
    console.log('Request data:', { tg_id, action, admin_key, target_tg_id })
    
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
    const user = await db.getUserByTgId(Number(tg_id))
    console.log('User lookup result:', { tg_id, user })
    
    if (!user) {
      // Если пользователь не найден, но это админский ID, все равно даем права
      const adminTgId = parseInt(process.env.ADMIN_TG_ID || '937011437')
      console.log('Checking admin TG ID:', { tg_id, adminTgId, isMatch: Number(tg_id) === adminTgId })
      if (Number(tg_id) === adminTgId) {
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
      const isHardcodedAdmin = Number(user.tg_id) === adminTgId
      const isDbAdmin = await db.isUserAdmin(user.id)
      const isAdmin = isHardcodedAdmin || isDbAdmin
      console.log('Checking admin rights:', { userTgId: Number(user.tg_id), adminTgId, isHardcodedAdmin, isDbAdmin, isAdmin })
      return NextResponse.json({ 
        success: true, 
        is_admin: isAdmin
      })
    }

    if (action === 'grant_admin') {
      // Выдаем админские права пользователю
      if (!target_tg_id) {
        return NextResponse.json({ 
          success: false, 
          message: 'Target TG ID is required' 
        }, { status: 400 })
      }
      
      // Получаем пользователя, которому назначаем права
      const targetUser = await db.getUserByTgId(Number(target_tg_id))
      if (!targetUser) {
        return NextResponse.json({ 
          success: false, 
          message: 'Пользователь не найден' 
        }, { status: 404 })
      }
      
      // Проверяем, не является ли пользователь уже админом
      const isAlreadyAdmin = await db.isUserAdmin(targetUser.id)
      if (isAlreadyAdmin) {
        return NextResponse.json({ 
          success: false, 
          message: 'Пользователь уже является админом' 
        }, { status: 400 })
      }
      
      // Выдаем админские права (используем ID текущего пользователя как того, кто выдает права)
      const granted = await db.grantAdminRights(targetUser.id, user.id)
      if (!granted) {
        return NextResponse.json({ 
          success: false, 
          message: 'Ошибка при выдаче админских прав' 
        }, { status: 500 })
      }
      
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
