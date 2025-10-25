import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
    console.log('📋 NODE_ENV:', process.env.NODE_ENV)
    
    const prisma = new PrismaClient()
    
    // Тестируем подключение
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Получаем количество пользователей
    const userCount = await prisma.user.count()
    console.log('👥 Users count:', userCount)
    
    // Получаем количество записей истории
    const historyCount = await prisma.hookahHistory.count()
    console.log('📝 History count:', historyCount)
    
    // Получаем первые 3 записи истории
    const firstHistory = await prisma.hookahHistory.findMany({
      take: 3,
      orderBy: { created_at: 'desc' }
    })
    console.log('📝 First 3 history records:', firstHistory)
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Database test completed',
      data: {
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV,
        userCount,
        historyCount,
        firstHistory
      }
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}