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
    
    // Конвертируем BigInt в number для JSON сериализации
    const serializedSampleUser = sampleUser ? {
      id: sampleUser.id,
      tg_id: Number(sampleUser.tg_id),
      first_name: sampleUser.first_name,
      last_name: sampleUser.last_name,
      phone: sampleUser.phone,
      username: sampleUser.username,
      created_at: sampleUser.created_at,
      updated_at: sampleUser.updated_at
    } : null
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      userCount: userCount,
      sampleUser: serializedSampleUser
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
