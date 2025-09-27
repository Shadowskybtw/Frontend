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
  const tgBotToken = process.env.TG_BOT_TOKEN || ''

  if (!tgBotToken) {
    return NextResponse.json({ success: false, message: 'Server misconfigured: TG_BOT_TOKEN missing' }, { status: 500 })
  }

  let payload: {
    tg_id: number
    firstName: string
    lastName: string
    phone: string
    username?: string | null
  }
  
  try {
    payload = await req.json() as typeof payload
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const initData = req.headers.get('x-telegram-init-data') || ''
  if (!initData || !verifyTelegramInitData(initData, tgBotToken)) {
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
      return NextResponse.json({ 
        success: false, 
        message: 'User already registered',
        user: existingUser 
      }, { status: 409 })
    }

    // Create new user
    const newUser = await db.createUser({
      tg_id: payload.tg_id,
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: payload.phone,
      username: payload.username || undefined
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: newUser 
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Database error occurred' 
    }, { status: 500 })
  }
}


