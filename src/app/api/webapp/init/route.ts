import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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

export async function GET(req: NextRequest) {
  const tgBotToken = process.env.TG_BOT_TOKEN || ''
  if (!tgBotToken) {
    return NextResponse.json({ success: false, message: 'Server misconfigured: TG_BOT_TOKEN missing' }, { status: 500 })
  }
  const initData = req.headers.get('x-telegram-init-data') || ''
  if (!initData || !verifyTelegramInitData(initData, tgBotToken)) {
    return NextResponse.json({ success: false, message: 'Invalid Telegram initData' }, { status: 401 })
  }
  // Optionally extract user from initData
  const params = new URLSearchParams(initData)
  const userStr = params.get('user')
  const user = userStr ? JSON.parse(userStr) : null
  return NextResponse.json({ success: true, user })
}


