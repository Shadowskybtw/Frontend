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
  
  // Для тестирования пропускаем проверку initData если токен не настроен
  const isTestMode = !process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'test_token_for_testing'
  
  if (!isTestMode && (!initData || !verifyTelegramInitData(initData, tgBotToken))) {
    return NextResponse.json({ success: false, message: 'Invalid Telegram initData' }, { status: 401 })
  }

  if (!db.isConnected()) {
    return NextResponse.json({ 
      success: false, 
      message: 'Database not configured' 
    }, { status: 500 })
  }

  try {
    // Check if user already exists
    const existingUser = await db.getUserByTgId(payload.tg_id)
    if (existingUser) {
      console.log('User already exists:', existingUser)
      return NextResponse.json({ 
        success: true, 
        message: 'User already registered',
        user: existingUser,
        isNewUser: false
      })
    }

    // Create new user with default phone if not provided
    const defaultPhone = payload.phone || '+0000000000'
    
    const newUser = await db.createUser({
      tg_id: payload.tg_id,
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: defaultPhone,
      username: payload.username || undefined
    })

    console.log('New user created:', newUser)

    // Create initial stock for new user
    const initialStock = await db.createStock({
      user_id: newUser.id,
      stock_name: '5+1 кальян',
      progress: 0
    })

    console.log('Initial stock created:', initialStock)

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: newUser,
      isNewUser: true,
      initialStock
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Database error occurred' 
    }, { status: 500 })
  }
}
