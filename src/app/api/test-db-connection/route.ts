import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Простая проверка подключения
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Проверяем, можем ли мы выполнить простой запрос
    const userCount = await prisma.user.count()
    console.log(`Found ${userCount} users in database`)
    
    // Проверяем структуру таблицы users
    const sampleUser = await prisma.user.findFirst()
    console.log('Sample user:', sampleUser)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      userCount: userCount,
      sampleUser: sampleUser
    })

  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database connection failed', 
        error: String(error),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
