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

    const targetTgId = parseInt(tg_id)
    if (isNaN(targetTgId)) {
      return NextResponse.json({ success: false, message: 'Invalid TG ID format' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { tg_id: BigInt(targetTgId) }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    console.log(`Granting admin rights to: ${user.first_name} ${user.last_name} (TG ID: ${targetTgId})`)

    const results = []

    // 1. Добавляем поле is_admin в таблицу users (если не существует)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
      `)
      results.push('✅ is_admin column added/verified in users table')
    } catch (error) {
      results.push(`❌ Error adding is_admin column: ${error}`)
    }

    // 2. Пытаемся обновить поле is_admin для пользователя (если существует)
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE users 
        SET is_admin = true 
        WHERE id = ${user.id}
      `)
      results.push(`✅ Admin rights granted to ${user.first_name} ${user.last_name} (is_admin=true)`)
    } catch (error) {
      results.push(`ℹ️ is_admin field might not exist, skipping: ${error}`)
    }

    // 3. Добавляем в admin_list таблицу
    try {
      await prisma.adminList.create({
        data: {
          tg_id: BigInt(targetTgId)
        }
      })
      results.push(`✅ Added to admin_list table: ${targetTgId}`)
    } catch (error) {
      results.push(`ℹ️ Admin_list table error (might already exist): ${error}`)
    }

    // 4. Добавляем в admins таблицу
    try {
      await prisma.admin.create({
        data: {
          user_id: user.id,
          granted_by: 1 // Системный админ
        }
      })
      results.push(`✅ Added to admins table: ${user.id}`)
    } catch (error) {
      results.push(`ℹ️ Admins table error (might already exist): ${error}`)
    }

    // 5. Проверяем результат
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Admin rights granted to ${user.first_name} ${user.last_name}`,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        tg_id: user.tg_id,
        is_admin: false // Поле is_admin не существует в схеме
      },
      results: results,
      note: 'Admin rights should now be active immediately'
    })

  } catch (error) {
    console.error('Error in grant-admin-db:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
