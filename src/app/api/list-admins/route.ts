import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { admin_key } = await request.json()
    
    // Проверяем админский ключ
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const admins = []

    // Получаем админов из admin_list
    try {
      const adminListRecords = await prisma.adminList.findMany()
      for (const admin of adminListRecords) {
        const user = await prisma.user.findUnique({
          where: { tg_id: admin.tg_id }
        })
        if (user) {
          admins.push({
            source: 'admin_list',
            tg_id: Number(admin.tg_id),
            first_name: user.first_name,
            last_name: user.last_name,
            user_id: user.id
          })
        }
      }
    } catch (error) {
      console.log('AdminList table error:', error)
    }

    // Получаем админов из admins
    try {
      const adminRecords = await prisma.admin.findMany({
        include: {
          user: true
        }
      })
      for (const admin of adminRecords) {
        admins.push({
          source: 'admins',
          tg_id: Number(admin.user.tg_id),
          first_name: admin.user.first_name,
          last_name: admin.user.last_name,
          user_id: admin.user.id,
          granted_by: admin.granted_by
        })
      }
    } catch (error) {
      console.log('Admins table error:', error)
    }

    // Получаем админов из переменной окружения
    const adminList = process.env.ADMIN_LIST || '1159515006,937011437'
    const adminTgIds = adminList.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    for (const tgId of adminTgIds) {
      const user = await prisma.user.findUnique({
        where: { tg_id: BigInt(tgId) }
      })
      if (user) {
        admins.push({
          source: 'environment',
          tg_id: tgId,
          first_name: user.first_name,
          last_name: user.last_name,
          user_id: user.id
        })
      }
    }

    // Убираем дубликаты
    const uniqueAdmins = admins.filter((admin, index, self) => 
      index === self.findIndex(a => a.tg_id === admin.tg_id)
    )

    return NextResponse.json({ 
      success: true, 
      message: `Found ${uniqueAdmins.length} admins`,
      admins: uniqueAdmins,
      total: uniqueAdmins.length
    })

  } catch (error) {
    console.error('Error listing admins:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
