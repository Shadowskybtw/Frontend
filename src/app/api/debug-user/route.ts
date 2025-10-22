import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tgId = searchParams.get('tg_id')

    if (!tgId) {
      return NextResponse.json(
        { success: false, message: 'TG ID is required' },
        { status: 400 }
      )
    }

    const user = await db.getUserByTgId(parseInt(tgId))
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get all user data
    const stocks = await db.getUserStocks(user.id)
    const history = await db.getHookahHistory(user.id)
    const freeHookahs = await db.getFreeHookahs(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone
      },
      stocks,
      history: history.map(h => ({
        id: h.id,
        hookah_type: h.hookah_type,
        slot_number: h.slot_number,
        created_at: h.created_at
      })),
      freeHookahs,
      stats: {
        totalHookahs: history.length,
        regularHookahs: history.filter(h => h.hookah_type === 'regular').length,
        freeHookahs: history.filter(h => h.hookah_type === 'free').length,
        unusedFreeHookahs: freeHookahs.filter(h => !h.used).length
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

  } catch (error) {
    console.error('Error in debug-user:', error)
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    )
  }
}
