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

    console.log('Adding is_admin field to users table...')

    // Проверяем, существует ли столбец is_admin
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='is_admin';
    `
    const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

    if (Array.isArray(columnExists) && columnExists.length > 0) {
      console.log('Column is_admin already exists in users table.')
      return NextResponse.json({ success: true, message: 'Column is_admin already exists.' })
    }

    // Добавляем столбец is_admin, если его нет
    const addColumnQuery = `
      ALTER TABLE users
      ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    `
    await prisma.$executeRawUnsafe(addColumnQuery)
    console.log('Column is_admin added to users table successfully.')

    return NextResponse.json({ success: true, message: 'Column is_admin added to users table.' })
  } catch (error) {
    console.error('Error adding is_admin field to users table:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add is_admin field to users table.', error: (error as Error).message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
