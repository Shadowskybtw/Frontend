import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { admin_tg_id } = await request.json()

    if (!admin_tg_id) {
      return NextResponse.json(
        { success: false, message: 'Необходимо указать TG ID админа' },
        { status: 400 }
      )
    }

    // Проверяем админские права
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
        { success: false, message: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      )
    }

    console.log('🔄 Starting stock progress synchronization for all users...')

    // Get all stocks
    const allStocks = await db.getAllStocks()
    const stocks = allStocks.filter(s => s.stock_name === '5+1 кальян')
    
    console.log(`📊 Found ${stocks.length} stocks to check`)
    
    let fixed = 0
    let alreadyCorrect = 0
    const fixedUsers = []
    
    for (const stock of stocks) {
      // Get history for this user
      const history = await db.getHookahHistory(stock.user_id)
      const regularCount = history.filter(h => h.hookah_type === 'regular').length
      
      const expectedProgress = regularCount * 20
      const actualProgress = stock.progress
      
      if (expectedProgress !== actualProgress) {
        const user = await db.getUserById(stock.user_id)
        console.log(`⚠️  Mismatch for user ${stock.user_id}: ${actualProgress}% -> ${expectedProgress}%`)
        
        // Update the stock
        await db.updateStockProgress(stock.id, expectedProgress)
        
        fixed++
        fixedUsers.push({
          id: user?.id,
          name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          oldProgress: actualProgress,
          newProgress: expectedProgress,
          regularCount
        })
      } else {
        alreadyCorrect++
      }
    }
    
    console.log(`✅ Sync complete: ${fixed} fixed, ${alreadyCorrect} already correct`)

    return NextResponse.json({
      success: true,
      message: `Синхронизация завершена: исправлено ${fixed}, корректно ${alreadyCorrect}`,
      stats: {
        total: stocks.length,
        fixed,
        alreadyCorrect
      },
      fixedUsers: fixedUsers.slice(0, 10) // Показываем первые 10 исправленных
    })

  } catch (error) {
    console.error('Error syncing progress:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

