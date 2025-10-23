import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Comprehensive database health check
 * Identifies all data inconsistencies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminTgId = searchParams.get('admin_tg_id')

    // Verify admin
    if (adminTgId) {
      const admin = await db.getUserByTgId(parseInt(adminTgId))
      if (!admin) {
        return NextResponse.json({ success: false, message: 'Админ не найден' }, { status: 404 })
      }
      
      const isAdmin = await db.isUserAdmin(admin.id) || Number(adminTgId) === parseInt(process.env.ADMIN_TG_ID || '937011437')
      if (!isAdmin) {
        return NextResponse.json({ success: false, message: 'Недостаточно прав' }, { status: 403 })
      }
    }

    console.log('🏥 Starting database health check...')

    // Get all users with stocks
    const allStocks = await db.getAllStocks()
    const stocksWith5plus1 = allStocks.filter(s => s.stock_name === '5+1 кальян')

    console.log(`📊 Found ${stocksWith5plus1.length} users with 5+1 campaign`)

    const issues = []
    const users = []

    for (const stock of stocksWith5plus1) {
      const user = await db.getUserById(stock.user_id)
      if (!user) continue

      const history = await db.getHookahHistory(stock.user_id)
      const regularCount = history.filter(h => h.hookah_type === 'regular').length
      const freeCount = history.filter(h => h.hookah_type === 'free').length
      const otherCount = history.filter(h => h.hookah_type !== 'regular' && h.hookah_type !== 'free').length

      const expectedProgress = Math.min(100, regularCount * 20)
      const actualProgress = stock.progress

      const userInfo = {
        id: user.id,
        tg_id: user.tg_id.toString(),
        name: `${user.first_name} ${user.last_name}`,
        phone: user.phone,
        stock: {
          progress: actualProgress,
          promotion_completed: stock.promotion_completed
        },
        history: {
          regular: regularCount,
          free: freeCount,
          other: otherCount,
          total: history.length
        },
        expected: {
          progress: expectedProgress
        },
        issue: null as string | null
      }

      // Identify issues
      if (actualProgress !== expectedProgress) {
        userInfo.issue = `Progress mismatch: ${actualProgress}% vs expected ${expectedProgress}%`
        issues.push(userInfo)
      } else if (actualProgress > 100) {
        userInfo.issue = `Progress overflow: ${actualProgress}%`
        issues.push(userInfo)
      } else if (regularCount === 0 && actualProgress > 0) {
        userInfo.issue = `No regular hookahs but progress = ${actualProgress}%`
        issues.push(userInfo)
      } else if (otherCount > 0) {
        userInfo.issue = `Has ${otherCount} records with invalid types`
        issues.push(userInfo)
      }

      users.push(userInfo)
    }

    const summary = {
      totalUsers: stocksWith5plus1.length,
      usersWithIssues: issues.length,
      healthyUsers: stocksWith5plus1.length - issues.length,
      issueTypes: {
        progressMismatch: issues.filter(i => i.issue?.includes('mismatch')).length,
        progressOverflow: issues.filter(i => i.issue?.includes('overflow')).length,
        noRegularHookahs: issues.filter(i => i.issue?.includes('No regular')).length,
        invalidTypes: issues.filter(i => i.issue?.includes('invalid types')).length
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      issues,
      healthyUsers: users.filter(u => !u.issue).slice(0, 10), // First 10 healthy users
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error in db-health-check:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

