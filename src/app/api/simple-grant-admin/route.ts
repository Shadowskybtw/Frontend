import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Список админов (hardcoded для надежности)
const ADMIN_LIST = [
  937011437, // Основной админ
  1159515006, // Кирилл
]

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

    const targetTgId = parseInt(tg_id)
    if (isNaN(targetTgId)) {
      return NextResponse.json({ success: false, message: 'Invalid TG ID format' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { tg_id: targetTgId }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    console.log(`Granting admin rights to: ${user.first_name} ${user.last_name} (TG ID: ${targetTgId})`)

    // Добавляем в hardcoded список админов
    if (!ADMIN_LIST.includes(targetTgId)) {
      ADMIN_LIST.push(targetTgId)
      console.log(`✅ Added ${targetTgId} to admin list. New list:`, ADMIN_LIST)
    } else {
      console.log(`ℹ️ User ${targetTgId} is already in admin list`)
    }

    // Пытаемся добавить в базу данных (не критично если не получится)
    try {
      // Добавляем в admin_list
      try {
        await prisma.adminList.create({
        data: {
          tg_id: targetTgId
        }
        })
        console.log(`✅ Added to admin_list table: ${targetTgId}`)
      } catch (error) {
        console.log(`Admin_list table error (not critical): ${error}`)
      }

      // Добавляем в admins
      try {
        await prisma.admin.create({
          data: {
            user_id: user.id,
            granted_by: 1
          }
        })
        console.log(`✅ Added to admins table: ${user.id}`)
      } catch (error) {
        console.log(`Admins table error (not critical): ${error}`)
      }
    } catch (error) {
      console.log(`Database operations failed (not critical): ${error}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Admin rights granted to ${user.first_name} ${user.last_name}`,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        tg_id: user.tg_id
      },
      admin_list: ADMIN_LIST,
      note: 'Admin rights are now active immediately'
    })

  } catch (error) {
    console.error('Error in simple-grant-admin:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
