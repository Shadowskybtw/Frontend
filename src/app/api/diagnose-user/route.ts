import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const tgId = searchParams.get('tg_id')

    let user
    
    if (phone && phone.length === 4) {
      // Find by phone
      const allUsers = await db.getAllUsers()
      user = allUsers.find(u => {
        const phoneDigits = u.phone.replace(/\D/g, '')
        const last4 = phoneDigits.slice(-4)
        return last4 === phone
      })
    } else if (tgId) {
      // Find by tg_id
      user = await db.getUserByTgId(parseInt(tgId))
    } else {
      return NextResponse.json(
        { success: false, message: 'Укажите phone (4 цифры) или tg_id' },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Get ALL data
    const stocks = await db.getUserStocks(user.id)
    const stock = stocks.find(s => s.stock_name === '5+1 кальян')
    const history = await db.getHookahHistory(user.id)
    const freeHookahs = await db.getFreeHookahs(user.id)

    // Analyze history types
    const historyByType = {
      regular: history.filter(h => h.hookah_type === 'regular'),
      free: history.filter(h => h.hookah_type === 'free'),
      other: history.filter(h => h.hookah_type !== 'regular' && h.hookah_type !== 'free')
    }

    // Calculate what progress should be
    const expectedProgress = Math.min(100, historyByType.regular.length * 20)
    const actualProgress = stock ? stock.progress : 0

    // If OTHER types exist, get them
    const otherTypes = historyByType.other.length > 0 
      ? [...new Set(historyByType.other.map(h => h.hookah_type))]
      : undefined

    const diagnosis = {
      user: {
        id: user.id,
        tg_id: user.tg_id.toString(),
        name: `${user.first_name} ${user.last_name}`,
        phone: user.phone
      },
      stock: stock ? {
        id: stock.id,
        progress: stock.progress,
        promotion_completed: stock.promotion_completed
      } : null,
      history: {
        total: history.length,
        regular: historyByType.regular.length,
        free: historyByType.free.length,
        other: historyByType.other.length
      },
      freeHookahs: {
        total: freeHookahs.length,
        unused: freeHookahs.filter(h => !h.used).length
      },
      analysis: {
        expectedProgress,
        actualProgress,
        mismatch: expectedProgress !== actualProgress,
        difference: actualProgress - expectedProgress,
        issue: historyByType.regular.length === 0 && actualProgress > 0 
          ? 'CRITICAL: No regular hookahs in history but progress > 0'
          : historyByType.regular.length > 0 && actualProgress === 0
          ? 'WARNING: Has regular hookahs but progress = 0'
          : expectedProgress !== actualProgress
          ? 'MISMATCH: Progress does not match history'
          : 'OK',
        otherTypesFound: otherTypes
      },
      lastRecords: history.slice(0, 10).map(h => ({
        id: h.id,
        type: h.hookah_type,
        slot: h.slot_number,
        created_at: h.created_at
      }))
    }

    return NextResponse.json({
      success: true,
      diagnosis
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error in diagnose-user:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

