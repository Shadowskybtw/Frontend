import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()
    
    console.log('Testing admin rights for TG ID:', tg_id)
    
    // Получаем пользователя
    const user = await db.getUserByTgId(Number(tg_id))
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Пользователь не найден' 
      }, { status: 404 })
    }
    
    console.log('Found user:', user)
    
    // Проверяем админские права
    const isAdmin = await db.isUserAdmin(user.id)
    console.log('Is admin:', isAdmin)
    
    // Пробуем выдать админские права
    const granted = await db.grantAdminRights(user.id, 1) // Используем ID 1 как системного админа
    console.log('Grant result:', granted)
    
    // Проверяем админские права снова
    const isAdminAfter = await db.isUserAdmin(user.id)
    console.log('Is admin after grant:', isAdminAfter)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Тест завершен',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        tg_id: user.tg_id
      },
      isAdminBefore: isAdmin,
      granted: granted,
      isAdminAfter: isAdminAfter
    })

  } catch (error) {
    console.error('Error testing admin rights:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}
