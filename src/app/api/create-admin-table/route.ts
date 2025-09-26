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

    // Создаем таблицу admin_list
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS admin_list (
          id SERIAL PRIMARY KEY,
          tg_id BIGINT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      console.log('Admin list table created successfully')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Admin list table created successfully' 
      })
    } catch (error) {
      console.error('Error creating admin list table:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Error creating admin list table',
        error: String(error)
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in create-admin-table API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
