import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { db } from '@/lib/db'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * CLEANUP ENDPOINT: Remove unclaimed free hookahs from history
 * 
 * Проблема: При достижении 100% бесплатный кальян добавлялся в историю автоматически.
 * Решение: Удаляем из истории все бесплатные кальяны, которые не были "claimed" пользователем.
 * 
 * Критерий: scan_method = 'promotion_completed' (автоматическое добавление)
 *           Оставляем только: scan_method = 'user_claimed' (пользователь нажал кнопку)
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

    if (confirm !== 'CLEANUP_HISTORY') {
      return NextResponse.json(
        { success: false, message: 'Необходимо подтверждение: confirm="CLEANUP_HISTORY"' },
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

    console.log('🧹 CLEANUP: Starting to remove unclaimed free hookahs from history...')

    // Находим все записи бесплатных кальянов, которые были добавлены автоматически
    const autoAddedFreeHookahs = await prisma.$queryRaw<Array<{id: number, user_id: number, scan_method: string, created_at: Date}>>`
      SELECT id, user_id, scan_method, created_at
      FROM hookah_history
      WHERE hookah_type = 'free'
        AND scan_method = 'promotion_completed'
      ORDER BY created_at DESC
    `

    console.log(`📊 Found ${autoAddedFreeHookahs.length} auto-added free hookahs`)

    if (autoAddedFreeHookahs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unclaimed free hookahs found in history',
        deleted: 0
      })
    }

    // Удаляем связанные отзывы
    let deletedReviews = 0
    for (const hookah of autoAddedFreeHookahs) {
      try {
        const reviewsDeleted = await prisma.$executeRaw`
          DELETE FROM hookah_reviews
          WHERE hookah_id = ${hookah.id}
        `
        deletedReviews += Number(reviewsDeleted)
      } catch (error: any) {
        if (error.code !== '42P01') { // Ignore "table not found"
          console.error(`Failed to delete reviews for hookah ${hookah.id}:`, error)
        }
      }
    }

    // Удаляем записи из истории
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM hookah_history
      WHERE hookah_type = 'free'
        AND scan_method = 'promotion_completed'
    `

    console.log(`✅ Deleted ${deleteResult} unclaimed free hookahs from history`)
    console.log(`✅ Deleted ${deletedReviews} related reviews`)

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${deleteResult} unclaimed free hookahs removed from history`,
      deleted: Number(deleteResult),
      deletedReviews
    })

  } catch (error) {
    console.error('Error in cleanup-unclaimed-free-hookahs:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

