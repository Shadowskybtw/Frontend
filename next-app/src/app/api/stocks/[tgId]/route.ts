import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

function verifyTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash') || ''
    urlParams.delete('hash')
    const dataCheckArr = Array.from(urlParams.entries()).map(([k, v]) => `${k}=${v}`).sort()
    const dataCheckString = dataCheckArr.join('\n')
    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    const calcHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
    return calcHash === hash
  } catch {
    return false
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tgId: string }> }
) {
  const tgBotToken = process.env.TG_BOT_TOKEN || ''
  if (!tgBotToken) {
    return NextResponse.json({ success: false, message: 'Server misconfigured' }, { status: 500 })
  }

  const initData = req.headers.get('x-telegram-init-data') || ''
  if (!initData || !verifyTelegramInitData(initData, tgBotToken)) {
    return NextResponse.json({ success: false, message: 'Invalid Telegram initData' }, { status: 401 })
  }

  const resolvedParams = await params
  const tgId = parseInt(resolvedParams.tgId)
  if (isNaN(tgId)) {
    return NextResponse.json({ success: false, message: 'Invalid Telegram ID' }, { status: 400 })
  }

  if (!db.isConnected()) {
    return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const stocks = await db.getUserStocks(user.id)
    return NextResponse.json({ success: true, stocks })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 })
  }
}
