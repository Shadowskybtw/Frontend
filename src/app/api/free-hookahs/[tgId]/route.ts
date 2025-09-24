import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tgId: string }> }
) {
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

    // Добавляем запись в историю кальянов
    await db.addHookahToHistory(user.id, 'free')
    console.log('Added free hookah to history')

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
