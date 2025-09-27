import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('Fix Database API called')
    const { admin_key } = await request.json()

    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const results: string[] = []

    // 1. Добавляем поле stock_id в таблицу hookah_history
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='hookah_history' AND column_name='stock_id';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        results.push('✅ Column stock_id already exists in hookah_history table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE hookah_history
          ADD COLUMN stock_id INTEGER;
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        results.push('✅ Column stock_id added to hookah_history table successfully.')
      }
    } catch (error) {
      results.push(`❌ Error adding stock_id field: ${error}`)
      console.error('Error adding stock_id field:', error)
    }

    // 2. Добавляем поле admin_id в таблицу hookah_history
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='hookah_history' AND column_name='admin_id';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        results.push('✅ Column admin_id already exists in hookah_history table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE hookah_history
          ADD COLUMN admin_id INTEGER;
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        results.push('✅ Column admin_id added to hookah_history table successfully.')
      }
    } catch (error) {
      results.push(`❌ Error adding admin_id field: ${error}`)
      console.error('Error adding admin_id field:', error)
    }

    // 3. Добавляем поле scan_method в таблицу hookah_history
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='hookah_history' AND column_name='scan_method';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        results.push('✅ Column scan_method already exists in hookah_history table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE hookah_history
          ADD COLUMN scan_method VARCHAR(50);
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        results.push('✅ Column scan_method added to hookah_history table successfully.')
      }
    } catch (error) {
      results.push(`❌ Error adding scan_method field: ${error}`)
      console.error('Error adding scan_method field:', error)
    }

    // 4. Добавляем поле is_admin в таблицу users
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_admin';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        results.push('✅ Column is_admin already exists in users table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE users
          ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        results.push('✅ Column is_admin added to users table successfully.')
      }
    } catch (error) {
      results.push(`❌ Error adding is_admin field: ${error}`)
      console.error('Error adding is_admin field:', error)
    }

    return NextResponse.json({ success: true, message: 'Database fix complete', results })

  } catch (error) {
    console.error('Error in fix-database API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
