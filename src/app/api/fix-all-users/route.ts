import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Mass fix for all users with data inconsistencies
 * Synchronizes stock.progress with hookah_history
 */
export async function POST(request: NextRequest) {
  try {
    const { admin_tg_id, dry_run = true } = await request.json()

    if (!admin_tg_id) {
      return NextResponse.json(
        { success: false, message: 'Необходимо указать admin_tg_id' },
        { status: 400 }
      )
    }

    // Verify admin
    const admin = await db.getUserByTgId(admin_tg_id)
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Админ не найден' }, { status: 404 })
    }
    
    const isAdmin = await db.isUserAdmin(admin.id) || Number(admin_tg_id) === parseInt(process.env.ADMIN_TG_ID || '937011437')
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав' }, { status: 403 })
    }

    console.log(`🔧 Starting mass fix (dry_run: ${dry_run})...`)

    const allStocks = await db.getAllStocks()
    const stocksWith5plus1 = allStocks.filter(s => s.stock_name === '5+1 кальян')

    const results = {
      total: stocksWith5plus1.length,
      fixed: 0,
      alreadyCorrect: 0,
      errors: 0,
      fixes: [] as any[]
    }

    for (const stock of stocksWith5plus1) {
      try {
        const user = await db.getUserById(stock.user_id)
        if (!user) continue

        const history = await db.getHookahHistory(stock.user_id)
        const regularCount = history.filter(h => h.hookah_type === 'regular').length
        
        const expectedProgress = Math.min(100, regularCount * 20)
        const actualProgress = stock.progress

        if (actualProgress !== expectedProgress) {
          console.log(`⚠️ User ${user.first_name} ${user.last_name}: ${actualProgress}% -> ${expectedProgress}%`)
          
          if (!dry_run) {
            await db.updateStockProgress(stock.id, expectedProgress)
            
            // Reset promotion_completed if progress < 100
            if (expectedProgress < 100 && stock.promotion_completed) {
              await db.updateStockPromotionCompleted(stock.id, false)
            }
          }

          results.fixed++
          results.fixes.push({
            user: {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              phone: user.phone
            },
            oldProgress: actualProgress,
            newProgress: expectedProgress,
            regularCount,
            action: dry_run ? 'would_fix' : 'fixed'
          })
        } else {
          results.alreadyCorrect++
        }
      } catch (error) {
        console.error(`❌ Error fixing user ${stock.user_id}:`, error)
        results.errors++
      }
    }

    const message = dry_run
      ? `DRY RUN: Найдено ${results.fixed} пользователей с проблемами. Запустите с dry_run=false для исправления.`
      : `Исправлено ${results.fixed} пользователей из ${results.total}`

    return NextResponse.json({
      success: true,
      message,
      dry_run,
      results
    })

  } catch (error) {
    console.error('Error in fix-all-users:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

