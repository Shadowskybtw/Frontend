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

    // Добавляем поле is_admin в таблицу users
    try {
      await prisma.$executeRaw`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
      `
      
      console.log('is_admin field added to users table successfully')
      
      return NextResponse.json({ 
        success: true, 
        message: 'is_admin field added to users table successfully' 
      })
    } catch (error) {
      console.error('Error adding is_admin field:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Error adding is_admin field',
        error: String(error)
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in add-admin-field API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
