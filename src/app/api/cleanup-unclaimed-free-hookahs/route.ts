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

    console.log('🧹 CLEANUP: Starting to remove excess free hookahs from history...')

    // Получаем всех пользователей
    const allUsers = await prisma.user.findMany()
    
    let totalDeleted = 0
    let totalReviewsDeleted = 0
    const fixes = []

    for (const user of allUsers) {
      // Получаем количество ИСПОЛЬЗОВАННЫХ бесплатных кальянов
      const usedFreeHookahs = await prisma.freeHookah.count({
        where: {
          user_id: user.id,
          used: true
        }
      })

      // Получаем все бесплатные кальяны в истории
      const freeInHistory = await prisma.hookahHistory.findMany({
        where: {
          user_id: user.id,
          hookah_type: 'free'
        },
        orderBy: { created_at: 'desc' }
      })

      const excessCount = freeInHistory.length - usedFreeHookahs

      if (excessCount > 0) {
        console.log(`User ${user.id}: ${freeInHistory.length} in history, ${usedFreeHookahs} used → remove ${excessCount}`)

        // Удаляем СТАРЫЕ записи (оставляем последние usedFreeHookahs)
        const toDelete = freeInHistory.slice(usedFreeHookahs)

        for (const hookah of toDelete) {
          // Удаляем отзывы
          try {
            const reviewsDeleted = await prisma.$executeRaw`
              DELETE FROM hookah_reviews WHERE hookah_id = ${hookah.id}
            `
            totalReviewsDeleted += Number(reviewsDeleted)
          } catch (error: any) {
            if (error.code !== '42P01') {
              console.error(`Failed to delete reviews for hookah ${hookah.id}:`, error)
            }
          }

          // Удаляем запись из истории
          await prisma.hookahHistory.delete({ where: { id: hookah.id } })
          totalDeleted++
        }

        fixes.push({
          user_id: user.id,
          removed: excessCount,
          kept: usedFreeHookahs
        })
      }
    }

    console.log(`✅ Deleted ${totalDeleted} excess free hookahs from history`)
    console.log(`✅ Deleted ${totalReviewsDeleted} related reviews`)
    console.log(`✅ Fixed ${fixes.length} users`)

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${totalDeleted} excess free hookahs removed from ${fixes.length} users`,
      deleted: totalDeleted,
      deletedReviews: totalReviewsDeleted,
      usersFixed: fixes.length,
      fixes: fixes.slice(0, 10) // First 10 for debugging
    })

  } catch (error) {
    console.error('Error in cleanup-unclaimed-free-hookahs:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера', error: String(error) },
      { status: 500 }
    )
  }
}

