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

    const hookahs = await db.getFreeHookahs(user.id)
    const unusedCount = hookahs.filter(h => !h.used).length

    return NextResponse.json({ 
      success: true, 
      hookahs,
      unusedCount,
      totalCount: hookahs.length
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 })
  }
}

export async function POST(
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

    // Get unused hookahs
    const unusedHookahs = await db.getUnusedFreeHookahs(user.id)
    if (unusedHookahs.length === 0) {
      return NextResponse.json({ success: false, message: 'No free hookahs available' }, { status: 400 })
    }

    // Use the first available hookah
    const usedHookah = await db.useFreeHookah(unusedHookahs[0].id)
    if (!usedHookah) {
      return NextResponse.json({ success: false, message: 'Failed to use hookah' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Hookah used successfully',
      hookah: usedHookah
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 })
  }
}
