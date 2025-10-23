import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Emergency endpoint to fix a specific user's progress
 * Synchronizes stock.progress with actual hookah_history records
 */
export async function POST(request: NextRequest) {
  try {
    const { user_tg_id, admin_tg_id } = await request.json()

    if (!user_tg_id || !admin_tg_id) {
      return NextResponse.json(
        { success: false, message: 'Необходимо указать TG ID пользователя и админа' },
        { status: 400 }
      )
    }

    // Verify admin rights
    const admin = await db.getUserByTgId(admin_tg_id)
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Админ не найден' },
        { status: 404 }
      )
    }

    const adminTgId = parseInt(process.env.ADMIN_TG_ID || '937011437')
    const isHardcodedAdmin = Number(admin_tg_id) === adminTgId
    const isDbAdmin = await db.isUserAdmin(admin.id)
    const isAdmin = isHardcodedAdmin || isDbAdmin
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    // Get user
    const user = await db.getUserByTgId(user_tg_id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    console.log('🔧 EMERGENCY FIX for user:', user.first_name, user.last_name)

    // Get stock
    const stocks = await db.getUserStocks(user.id)
    const stock = stocks.find(s => s.stock_name === '5+1 кальян')
    
    if (!stock) {
      return NextResponse.json(
        { success: false, message: 'У пользователя нет акции 5+1' },
        { status: 404 }
      )
    }

    // Get history
    const history = await db.getHookahHistory(user.id)
    const regularCount = history.filter(h => h.hookah_type === 'regular').length
    const freeCount = history.filter(h => h.hookah_type === 'free').length

    // Calculate correct progress (max 100%)
    const correctProgress = Math.min(100, regularCount * 20)
    const oldProgress = stock.progress

    console.log('📊 Analysis:')
    console.log(`   Old progress: ${oldProgress}%`)
    console.log(`   Regular hookahs in history: ${regularCount}`)
    console.log(`   Correct progress should be: ${correctProgress}%`)
    console.log(`   Difference: ${oldProgress - correctProgress}%`)

    // Fix the progress
    await db.updateStockProgress(stock.id, correctProgress)

    // Reset promotion_completed flag if progress < 100
    if (correctProgress < 100 && stock.promotion_completed) {
      await db.updateStockPromotionCompleted(stock.id, false)
      console.log('✅ Reset promotion_completed flag')
    }

    console.log('✅ FIXED!')

    return NextResponse.json({
      success: true,
      message: `Данные пользователя исправлены успешно!`,
      user: {
        name: `${user.first_name} ${user.last_name}`,
        phone: user.phone
      },
      fix: {
        oldProgress,
        newProgress: correctProgress,
        difference: oldProgress - correctProgress,
        regularInHistory: regularCount,
        freeInHistory: freeCount,
        wasOverflow: oldProgress > 100
      }
    })

  } catch (error) {
    console.error('Error fixing user progress:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

