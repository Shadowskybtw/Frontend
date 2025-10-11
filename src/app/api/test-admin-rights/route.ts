import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Hardcoded список админов
const HARDCODED_ADMINS = [937011437, 1159515006]

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

    const results = {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        tg_id: Number(user.tg_id)
      },
      admin_checks: {
        hardcoded_list: HARDCODED_ADMINS.includes(targetTgId),
        main_admin: targetTgId === 937011437,
        env_admin: targetTgId === parseInt(process.env.ADMIN_TG_ID || '937011437'),
        env_list: (process.env.ADMIN_LIST || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)).includes(targetTgId)
      },
      database_checks: {
        admin_list: false,
        admins_table: false
      }
    }

    // Проверяем в admin_list
    try {
      const adminListRecord = await prisma.adminList.findUnique({
        where: { tg_id: targetTgId }
      })
      results.database_checks.admin_list = !!adminListRecord
    } catch (error) {
      console.log('AdminList table check failed:', error)
    }

    // Проверяем в admins
    try {
      const adminRecord = await prisma.admin.findUnique({
        where: { user_id: user.id }
      })
      results.database_checks.admins_table = !!adminRecord
    } catch (error) {
      console.log('Admins table check failed:', error)
    }

    // Определяем общий статус админа
    const isAdmin = results.admin_checks.hardcoded_list || 
                   results.admin_checks.main_admin || 
                   results.admin_checks.env_admin || 
                   results.admin_checks.env_list ||
                   results.database_checks.admin_list ||
                   results.database_checks.admins_table

    return NextResponse.json({ 
      success: true, 
      message: `Admin rights check for ${user.first_name} ${user.last_name}`,
      is_admin: isAdmin,
      results: results
    })

  } catch (error) {
    console.error('Error testing admin rights:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
