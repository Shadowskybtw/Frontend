import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { admin_key, tg_id } = await request.json()
    
    // Проверяем админский ключ
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { tg_id: tg_id }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    console.log(`Adding admin to list: ${user.first_name} ${user.last_name} (TG ID: ${tg_id})`)

    // Добавляем в admin_list таблицу
    try {
      await prisma.adminList.create({
        data: {
          tg_id: tg_id
        }
      })
      console.log(`✅ Admin added to admin_list table: ${tg_id}`)
    } catch (error) {
      console.log(`Admin_list table error (might already exist): ${error}`)
    }

    // Добавляем в admins таблицу
    try {
      await prisma.admin.create({
        data: {
          user_id: user.id,
          granted_by: 1 // Системный админ
        }
      })
      console.log(`✅ Admin added to admins table: ${user.id}`)
    } catch (error) {
      console.log(`Admins table error (might already exist): ${error}`)
    }

    // Обновляем переменную окружения (для демонстрации)
    const currentAdminList = process.env.ADMIN_LIST || '1159515006' // Кирилл по умолчанию
    const adminTgIds = currentAdminList.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    if (!adminTgIds.includes(Number(tg_id))) {
      const newAdminList = `${currentAdminList},${tg_id}`
      console.log(`Would update ADMIN_LIST to: ${newAdminList}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Admin ${user.first_name} ${user.last_name} added to admin list`,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        tg_id: user.tg_id
      },
      note: 'Admin rights will be effective immediately'
    })

  } catch (error) {
    console.error('Error adding admin to list:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
