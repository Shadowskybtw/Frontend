import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    console.log('Simple register API called')
    
    const payload = await req.json()
    console.log('Payload received:', payload)
    
    const { tg_id, firstName, lastName, phone, username } = payload

    if (!tg_id || !firstName || !lastName || !phone) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 })
    }

    console.log('Creating user with data:', { tg_id, firstName, lastName, phone, username })

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { tg_id: BigInt(tg_id) }
    })

    if (existingUser) {
      console.log('User already exists:', existingUser)
      return NextResponse.json({ 
        success: true, 
        message: 'User already registered',
        user: {
          id: existingUser.id,
          tg_id: Number(existingUser.tg_id),
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          phone: existingUser.phone,
          username: existingUser.username,
          created_at: existingUser.created_at,
          updated_at: existingUser.updated_at
        }
      })
    }

    // Создаем нового пользователя
    const newUser = await prisma.user.create({
      data: {
        tg_id: BigInt(tg_id),
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        username: username || null
      }
    })

    console.log('User created successfully:', newUser)

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        tg_id: Number(newUser.tg_id),
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone,
        username: newUser.username,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    })

  } catch (error) {
    console.error('Simple register error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed', 
        error: String(error),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
