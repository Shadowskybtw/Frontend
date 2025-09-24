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

    // Получаем акции пользователя
    const stocks = await db.getUserStocks(user.id)
    const hookahStocks = stocks.filter(s => s.stock_name === '5+1 кальян')
    const hookahStock = hookahStocks.length > 0 
      ? hookahStocks.reduce((latest, current) => current.id > latest.id ? current : latest)
      : null
    
    // Получаем бесплатные кальяны
    const freeHookahs = await db.getFreeHookahs(user.id)
    const usedFreeHookahs = freeHookahs.filter(h => h.used)

    // Получаем историю кальянов
    const hookahHistory = await db.getHookahHistory(user.id)

    // Считаем слоты как выкуренные кальяны (один слот = один кальян)
    const slotsFilled = hookahStock ? Math.floor(hookahStock.progress / 20) : 0
    // Считаем обычные кальяны из истории (не из прогресса акции)
    const regularHookahs = hookahHistory.filter(h => h.hookah_type === 'regular').length
    const totalSmokedHookahs = regularHookahs + usedFreeHookahs.length // Обычные + использованные бесплатные
    
    console.log('Profile stats calculation:', {
      hookahStock: hookahStock ? {
        id: hookahStock.id,
        progress: hookahStock.progress,
        slotsFilled: slotsFilled
      } : null,
      regularHookahs: regularHookahs,
      usedFreeHookahs: usedFreeHookahs.length,
      totalSmokedHookahs,
      hookahHistory: hookahHistory.length
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      stats: {
        totalSmokedHookahs, // Общее количество выкуренных кальянов
        freeHookahsReceived: freeHookahs.length, // Количество полученных бесплатных кальянов
        freeHookahsUsed: usedFreeHookahs.length, // Количество использованных бесплатных кальянов
        slotsFilled, // Количество заполненных слотов (выкуренных кальянов в акции)
        isPromotionCompleted: hookahStock ? hookahStock.progress >= 100 : false
      },
      usedFreeHookahs: usedFreeHookahs.map(h => ({
        id: h.id,
        used_at: h.used_at,
        created_at: h.created_at
      })),
      hookahHistory: hookahHistory.map(h => ({
        id: h.id,
        hookah_type: h.hookah_type,
        slot_number: h.slot_number,
        created_at: h.created_at
      }))
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 })
  }
}
