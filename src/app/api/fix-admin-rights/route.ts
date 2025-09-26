import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { admin_key } = await request.json()
    
    // Проверяем админский ключ
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Список TG ID пользователей, которым нужно выдать админские права
    const adminTgIds = [
      1159515006, // Пользователь из скриншота
      // Добавьте сюда другие TG ID пользователей, которым нужно выдать права
    ]

    const results = []

    for (const tgId of adminTgIds) {
      try {
        const user = await db.getUserByTgId(tgId)
        if (user) {
          // Проверяем, не является ли пользователь уже админом
          const isAlreadyAdmin = await db.isUserAdmin(user.id)
          
          if (!isAlreadyAdmin) {
            // Выдаем админские права (используем ID 1 как системного админа)
            const granted = await db.grantAdminRights(user.id, 1)
            
            results.push({
              tg_id: tgId,
              user: `${user.first_name} ${user.last_name}`,
              granted: granted,
              message: granted ? 'Права выданы' : 'Ошибка при выдаче прав'
            })
          } else {
            results.push({
              tg_id: tgId,
              user: `${user.first_name} ${user.last_name}`,
              granted: true,
              message: 'Уже является админом'
            })
          }
        } else {
          results.push({
            tg_id: tgId,
            user: 'Не найден',
            granted: false,
            message: 'Пользователь не найден'
          })
        }
      } catch (error) {
        results.push({
          tg_id: tgId,
          user: 'Ошибка',
          granted: false,
          message: `Ошибка: ${error}`
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Проверка админских прав завершена',
      results: results
    })

  } catch (error) {
    console.error('Error fixing admin rights:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
