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

    const results = []

    // 1. Создаем таблицу admin_list
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS admin_list (
          id SERIAL PRIMARY KEY,
          tg_id BIGINT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      results.push('✅ Admin list table created successfully')
      console.log('Admin list table created successfully')
    } catch (error) {
      results.push(`❌ Error creating admin list table: ${error}`)
      console.error('Error creating admin list table:', error)
    }

    // 2. Получаем всех пользователей
    let users = []
    try {
      users = await prisma.user.findMany()
      results.push(`✅ Found ${users.length} users`)
      console.log(`Found ${users.length} users`)
    } catch (error) {
      results.push(`❌ Error fetching users: ${error}`)
      console.error('Error fetching users:', error)
    }

    // 3. Выдаем админские права пользователю 1159515006 (Кирилл)
    const targetTgId = 1159515006
    try {
      const targetUser = users.find(u => Number(u.tg_id) === targetTgId)
      if (targetUser) {
        // Проверяем, не является ли уже админом
        const existingAdmin = await prisma.adminList.findUnique({
          where: { tg_id: BigInt(targetTgId) }
        })
        
        if (!existingAdmin) {
          await prisma.adminList.create({
            data: {
              tg_id: BigInt(targetTgId)
            }
          })
          results.push(`✅ Admin rights granted to user ${targetUser.first_name} ${targetUser.last_name} (TG ID: ${targetTgId})`)
          console.log(`Admin rights granted to user ${targetUser.first_name} ${targetUser.last_name}`)
        } else {
          results.push(`ℹ️ User ${targetUser.first_name} ${targetUser.last_name} is already an admin`)
        }
      } else {
        results.push(`❌ User with TG ID ${targetTgId} not found`)
      }
    } catch (error) {
      results.push(`❌ Error granting admin rights: ${error}`)
      console.error('Error granting admin rights:', error)
    }

    // 4. Проверяем всех админов
    try {
      const allAdmins = await prisma.adminList.findMany()
      results.push(`✅ Found ${allAdmins.length} admins in admin_list table`)
      allAdmins.forEach(admin => {
        results.push(`  - TG ID: ${admin.tg_id}`)
      })
    } catch (error) {
      results.push(`❌ Error checking admins: ${error}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin system setup completed',
      results: results
    })

  } catch (error) {
    console.error('Error setting up admin system:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
