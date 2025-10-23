import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60 // Allow 60 seconds for this operation

/**
 * CRITICAL: Database rebuild endpoint
 * Syncs ALL users' progress with their actual history
 * Adds constraints to prevent future corruption
 */
export async function POST(request: NextRequest) {
  try {
    const { admin_tg_id, confirm } = await request.json()

    if (!admin_tg_id) {
      return NextResponse.json(
        { success: false, message: 'Необходимо указать admin_tg_id' },
        { status: 400 }
      )
    }

    if (confirm !== 'REBUILD_DATABASE') {
      return NextResponse.json(
        { success: false, message: 'Необходимо подтверждение: confirm="REBUILD_DATABASE"' },
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

    console.log('🔧 CRITICAL: Starting database rebuild...')

    const results = {
      constraints_added: 0,
      users_fixed: 0,
      invalid_types_deleted: 0,
      errors: [] as string[]
    }

    // Step 0: Delete invalid hookah_type records (e.g. "removed")
    try {
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM hookah_history WHERE hookah_type NOT IN ('regular', 'free')
      `
      results.invalid_types_deleted = Number(deleteResult)
      console.log(`🗑️ Deleted ${deleteResult} records with invalid hookah_type`)
    } catch (error: any) {
      results.errors.push(`Delete invalid types: ${error.message}`)
    }

    // Step 1: Add progress constraint (0-100)
    try {
      await prisma.$executeRaw`
        ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_progress_check
      `
      await prisma.$executeRaw`
        ALTER TABLE stocks ADD CONSTRAINT stocks_progress_check CHECK (progress >= 0 AND progress <= 100)
      `
      results.constraints_added++
      console.log('✅ Added progress constraint (0-100)')
    } catch (error: any) {
      results.errors.push(`Progress constraint: ${error.message}`)
    }

    // Step 2: Add hookah_type constraint
    try {
      await prisma.$executeRaw`
        ALTER TABLE hookah_history DROP CONSTRAINT IF EXISTS hookah_history_type_check
      `
      await prisma.$executeRaw`
        ALTER TABLE hookah_history ADD CONSTRAINT hookah_history_type_check CHECK (hookah_type IN ('regular', 'free'))
      `
      results.constraints_added++
      console.log('✅ Added hookah_type constraint')
    } catch (error: any) {
      results.errors.push(`Type constraint: ${error.message}`)
    }

    // Step 3: Fix ALL users
    const allStocks = await db.getAllStocks()
    const stocksWith5plus1 = allStocks.filter(s => s.stock_name === '5+1 кальян')

    console.log(`📊 Processing ${stocksWith5plus1.length} users...`)

    for (const stock of stocksWith5plus1) {
      try {
        const history = await db.getHookahHistory(stock.user_id)
        const regularCount = history.filter(h => h.hookah_type === 'regular').length
        
        // CYCLIC PROGRESS: (count % 5) * 20
        const currentCycleCount = regularCount % 5
        const correctProgress = currentCycleCount * 20
        const completedCycles = Math.floor(regularCount / 5)

        if (stock.progress !== correctProgress) {
          await db.updateStockProgress(stock.id, correctProgress)
          
          // Reset promotion_completed if needed
          if (correctProgress < 100 && stock.promotion_completed) {
            await db.updateStockPromotionCompleted(stock.id, false)
          }
          
          results.users_fixed++
          console.log(`✅ Fixed user ${stock.user_id}: ${stock.progress}% -> ${correctProgress}% (${regularCount} hookahs = ${completedCycles} cycles + ${currentCycleCount})`)
        }
      } catch (error: any) {
        results.errors.push(`User ${stock.user_id}: ${error.message}`)
      }
    }

    console.log('✅ Database rebuild complete!')

    return NextResponse.json({
      success: true,
      message: `Rebuild complete: ${results.users_fixed} users fixed, ${results.constraints_added} constraints added, ${results.invalid_types_deleted} invalid records deleted`,
      results
    })

  } catch (error) {
    console.error('Error in rebuild-db:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

