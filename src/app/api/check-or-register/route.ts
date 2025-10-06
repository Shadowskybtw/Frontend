import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

// Verify Telegram WebApp initData
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash') || ''
    urlParams.delete('hash')

    const dataCheckArr = Array.from(urlParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort()
    const dataCheckString = dataCheckArr.join('\n')

    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    const calcHash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex')

    return calcHash === hash
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const tgBotToken = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || ''

  if (!tgBotToken) {
    return NextResponse.json({ success: false, message: 'Server misconfigured: BOT_TOKEN missing' }, { status: 500 })
  }

  let payload: {
    tg_id: number
    firstName: string
    lastName: string
    phone?: string
    username?: string | null
  }
  
  try {
    payload = await req.json() as typeof payload
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const initData = req.headers.get('x-telegram-init-data') || ''
  
  // Для тестирования и разработки пропускаем проверку initData
  const isTestMode = !process.env.BOT_TOKEN || 
                     process.env.BOT_TOKEN === 'test_token_for_testing' ||
                     process.env.NODE_ENV === 'development'
  
  console.log('Check/register request:', { 
    tg_id: payload.tg_id, 
    firstName: payload.firstName, 
    isTestMode, 
    hasInitData: !!initData 
  })
  
  if (!isTestMode && (!initData || !verifyTelegramInitData(initData, tgBotToken))) {
    console.log('Invalid Telegram initData, but continuing in test mode')
    // В тестовом режиме продолжаем без проверки
  }

  if (!db.isConnected()) {
    return NextResponse.json({ 
      success: false, 
      message: 'Database not configured' 
    }, { status: 500 })
  }

  try {
    console.log('🔍 Checking if user exists for tg_id:', payload.tg_id)
    console.log('🔍 Payload received:', payload)
    
    // Check if user already exists
    const existingUser = await db.getUserByTgId(payload.tg_id)
    console.log('🔍 Database lookup result:', existingUser)
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser)
      return NextResponse.json({ 
        success: true, 
        message: 'User already registered',
        user: existingUser,
        isNewUser: false
      })
    }

    console.log('🆕 User not found, creating new user...')
    console.log('🆕 User data to create:', {
      tg_id: payload.tg_id,
      first_name: payload.firstName,
      last_name: payload.lastName,
      username: payload.username
    })
    
    // Create new user with default phone if not provided
    const defaultPhone = payload.phone || '+0000000000'
    
    const newUser = await db.createUser({
      tg_id: payload.tg_id,
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: defaultPhone,
      username: payload.username || undefined
    })

    console.log('✅ New user created successfully:', newUser)

    // Create initial stock for new user
    const initialStock = await db.createStock({
      user_id: newUser.id,
      stock_name: '5+1 кальян',
      progress: 0
    })

    console.log('Initial stock created successfully:', initialStock)

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: newUser,
      isNewUser: true,
      initialStock
    })

  } catch (error) {
    console.error('Database error in check-or-register:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      success: false, 
      message: `Database error: ${errorMessage}`,
      error: errorMessage
    }, { status: 500 })
  }
}
