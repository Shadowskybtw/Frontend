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

    console.log('Setting up is_admin field in database...')

    const results = []

    // 1. Добавляем поле is_admin в таблицу users
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
      `)
      results.push('✅ is_admin column added to users table')
      console.log('is_admin column added successfully')
    } catch (error) {
      results.push(`❌ Error adding is_admin column: ${error}`)
      console.error('Error adding is_admin column:', error)
    }

    // 2. Создаем таблицу admin_list если не существует
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS admin_list (
          id SERIAL PRIMARY KEY,
          tg_id BIGINT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.push('✅ admin_list table created/verified')
      console.log('admin_list table created successfully')
    } catch (error) {
      results.push(`❌ Error creating admin_list table: ${error}`)
      console.error('Error creating admin_list table:', error)
    }

    // 3. Создаем таблицу admins если не существует
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL,
          granted_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.push('✅ admins table created/verified')
      console.log('admins table created successfully')
    } catch (error) {
      results.push(`❌ Error creating admins table: ${error}`)
      console.error('Error creating admins table:', error)
    }

    // 4. Добавляем основных админов
    const mainAdmins = [937011437, 1159515006] // Ваш ID и Кирилл
    
    for (const tgId of mainAdmins) {
      try {
        // Находим пользователя по TG ID
        const user = await prisma.user.findUnique({
          where: { tg_id: BigInt(tgId) }
        })

        if (user) {
          // Обновляем is_admin = true
          await prisma.user.update({
            where: { id: user.id },
            data: { is_admin: true }
          })
          results.push(`✅ Set is_admin=true for user ${user.first_name} ${user.last_name} (TG ID: ${tgId})`)

          // Добавляем в admin_list
          try {
            await prisma.adminList.create({
              data: {
                tg_id: BigInt(tgId)
              }
            })
            results.push(`✅ Added to admin_list: ${tgId}`)
          } catch (error) {
            results.push(`ℹ️ Already in admin_list: ${tgId} - ${error}`)
          }

          // Добавляем в admins
          try {
            await prisma.admin.create({
              data: {
                user_id: user.id,
                granted_by: 1 // Системный админ
              }
            })
            results.push(`✅ Added to admins table: ${user.id}`)
          } catch (error) {
            results.push(`ℹ️ Already in admins table: ${user.id} - ${error}`)
          }
        } else {
          results.push(`ℹ️ User with TG ID ${tgId} not found in database`)
        }
      } catch (error) {
        results.push(`❌ Error processing admin ${tgId}: ${error}`)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin system setup completed',
      results: results
    })

  } catch (error) {
    console.error('Error setting up admin field:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
