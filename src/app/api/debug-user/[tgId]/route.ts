import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { tgId: string } }) {
  try {
    const tgId = parseInt(params.tgId)
    console.log(`🔍 Debug user API called for TG ID: ${tgId}`)
    
    if (!tgId || isNaN(tgId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Telegram ID'
      }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        tgId
      })
    }

    console.log('Found user:', user)

    // Получаем историю пользователя
    const history = await db.getHookahHistory(user.id)
    console.log('User history:', history)

    // Получаем историю с отзывами
    const historyWithReviews = await db.getHookahHistoryWithReviews(user.id, 1, 10)
    console.log('User history with reviews:', historyWithReviews)

    // Получаем акции пользователя
    const stocks = await db.getUserStocks(user.id)
    console.log('User stocks:', stocks)

    // Получаем бесплатные кальяны пользователя
    const freeHookahs = await db.getFreeHookahs(user.id)
    console.log('User free hookahs:', freeHookahs)

    // Получаем неиспользованные бесплатные кальяны
    const unusedFreeHookahs = await db.getUnusedFreeHookahs(user.id)
    console.log('User unused free hookahs:', unusedFreeHookahs)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        created_at: user.created_at
      },
      history: {
        total: history.length,
        records: history.map(h => ({
          id: h.id,
          hookah_type: h.hookah_type,
          slot_number: h.slot_number,
          created_at: h.created_at
        }))
      },
      historyWithReviews: {
        total: historyWithReviews.history.length,
        records: historyWithReviews.history.map(h => ({
          id: h.id,
          hookah_type: h.hookah_type,
          slot_number: h.slot_number,
          created_at: h.created_at,
          review: h.review
        }))
      },
      stocks: stocks.map(s => ({
        id: s.id,
        stock_name: s.stock_name,
        progress: s.progress,
        promotion_completed: s.promotion_completed,
        created_at: s.created_at
      })),
      freeHookahs: {
        total: freeHookahs.length,
        unused: unusedFreeHookahs.length,
        records: freeHookahs.map(f => ({
          id: f.id,
          used: f.used,
          used_at: f.used_at,
          created_at: f.created_at
        }))
      }
    })

  } catch (error) {
    console.error('Error in debug user API:', error)
    return NextResponse.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
