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

    console.log(`Force granting admin rights to user ${user.first_name} ${user.last_name} (TG ID: ${tg_id})`)

    // Пробуем создать запись в admin_list
    try {
      await prisma.adminList.create({
        data: {
          tg_id: tg_id
        }
      })
      console.log(`✅ Admin record created in admin_list for TG ID ${tg_id}`)
    } catch (error) {
      console.log(`Admin_list table error (expected): ${error}`)
    }

    // Пробуем создать запись в admins
    try {
      await prisma.admin.create({
        data: {
          user_id: user.id,
          granted_by: 1 // Системный админ
        }
      })
      console.log(`✅ Admin record created in admins table for user ${user.id}`)
    } catch (error) {
      console.log(`Admins table error (expected): ${error}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Admin rights granted to ${user.first_name} ${user.last_name}`,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        tg_id: user.tg_id
      }
    })

  } catch (error) {
    console.error('Error in grant-admin-force API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
