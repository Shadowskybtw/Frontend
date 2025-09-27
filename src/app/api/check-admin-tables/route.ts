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

    const results = {
      adminListTable: false,
      adminsTable: false,
      usersTable: false,
      adminListRecords: 0,
      adminsRecords: 0,
      usersRecords: 0
    }

    // Проверяем таблицу admin_list
    try {
      const adminListCount = await prisma.adminList.count()
      results.adminListTable = true
      results.adminListRecords = adminListCount
      console.log('AdminList table exists, records:', adminListCount)
    } catch (error) {
      console.log('AdminList table does not exist or error:', error)
    }

    // Проверяем таблицу admins
    try {
      const adminsCount = await prisma.admin.count()
      results.adminsTable = true
      results.adminsRecords = adminsCount
      console.log('Admins table exists, records:', adminsCount)
    } catch (error) {
      console.log('Admins table does not exist or error:', error)
    }

    // Проверяем таблицу users
    try {
      const usersCount = await prisma.user.count()
      results.usersTable = true
      results.usersRecords = usersCount
      console.log('Users table exists, records:', usersCount)
    } catch (error) {
      console.log('Users table error:', error)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Table check completed',
      results: results
    })

  } catch (error) {
    console.error('Error checking admin tables:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
