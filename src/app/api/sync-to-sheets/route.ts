import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { batchUpdateSheet, SHEETS } from '@/lib/googleSheets'
import { db } from '@/lib/db'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/sync-to-sheets
 * Синхронизация всех данных с Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const { admin_tg_id } = await request.json()

    if (!admin_tg_id) {
      return NextResponse.json({
        success: false,
        message: 'Admin Telegram ID не предоставлен'
      }, { status: 400 })
    }

    // Проверяем права админа
    const admin = await db.getUserByTgId(parseInt(admin_tg_id))
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Администратор не найден'
      }, { status: 404 })
    }

    const isAdmin = await db.isUserAdmin(admin.id) || Number(admin_tg_id) === parseInt(process.env.ADMIN_TG_ID || '937011437')
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Недостаточно прав'
      }, { status: 403 })
    }

    console.log('🔄 Starting Google Sheets sync...')

    // 1. Синхронизация пользователей
    const users = await prisma.user.findMany({
      include: {
        stocks: true,
        hookah_history: {
          where: { hookah_type: 'regular' }
        }
      },
      orderBy: { id: 'asc' }
    })

    const usersData = users.map(user => [
      user.id,
      user.tg_id.toString(),
      user.first_name,
      user.last_name,
      user.username || '',
      user.phone || '',
      new Date(user.created_at).toLocaleString('ru-RU'),
      user.hookah_history.length,
      user.stocks[0]?.progress || 0
    ])

    await batchUpdateSheet(SHEETS.USERS, usersData)
    console.log(`✅ Synced ${usersData.length} users`)

    // 2. Синхронизация админов
    const admins = await prisma.admin.findMany({
      include: {
        user: true
      },
      orderBy: { id: 'asc' }
    })

    const adminsData = admins.map(admin => [
      admin.id,
      admin.user.tg_id.toString(),
      admin.user.first_name,
      admin.user.last_name,
      new Date(admin.created_at).toLocaleString('ru-RU')
    ])

    await batchUpdateSheet(SHEETS.ADMINS, adminsData)
    console.log(`✅ Synced ${adminsData.length} admins`)

    // 3. Синхронизация платных кальянов
    const regularHookahs = await prisma.hookahHistory.findMany({
      where: { hookah_type: 'regular' },
      include: {
        user: true
      },
      orderBy: { created_at: 'desc' }
    })

    // Получаем информацию об админах и отзывах для каждого кальяна
    const regularHookahsWithDetails = await Promise.all(
      regularHookahs.map(async (hookah) => {
        // Получаем отзыв
        const review = await prisma.hookahReview.findFirst({
          where: { hookah_id: hookah.id },
          orderBy: { created_at: 'desc' }
        })

        return { hookah, review }
      })
    )

    const regularHookahsData = regularHookahsWithDetails.map(({ hookah, review }) => {
      return [
        hookah.id,
        `${hookah.user.first_name} ${hookah.user.last_name}`,
        hookah.user.phone || '',
        hookah.created_at ? new Date(hookah.created_at).toLocaleString('ru-RU') : '',
        hookah.slot_number || '',
        review?.rating || '',
        review?.review_text || ''
      ]
    })

    await batchUpdateSheet(SHEETS.REGULAR_HOOKAHS, regularHookahsData)
    console.log(`✅ Synced ${regularHookahsData.length} regular hookahs`)

    // 4. Синхронизация бесплатных кальянов
    const freeHookahs = await prisma.hookahHistory.findMany({
      where: { hookah_type: 'free' },
      include: {
        user: true
      },
      orderBy: { created_at: 'desc' }
    })

    // Получаем информацию о запросах и отзывах для каждого бесплатного кальяна
    const freeHookahsWithDetails = await Promise.all(
      freeHookahs.map(async (hookah) => {
        // Ищем запрос на бесплатный кальян (только если есть created_at)
        const request = hookah.created_at ? await prisma.freeHookahRequest.findFirst({
          where: {
            user_id: hookah.user_id,
            status: 'approved',
            updated_at: {
              lte: hookah.created_at
            }
          },
          orderBy: { updated_at: 'desc' }
        }) : null

        // Получаем отзыв
        const review = await prisma.hookahReview.findFirst({
          where: { hookah_id: hookah.id },
          orderBy: { created_at: 'desc' }
        })

        return {
          hookah,
          request,
          review
        }
      })
    )

    const freeHookahsData = freeHookahsWithDetails.map(({ hookah, request, review }) => {
      return [
        hookah.id,
        `${hookah.user.first_name} ${hookah.user.last_name}`,
        hookah.user.phone || '',
        hookah.created_at ? new Date(hookah.created_at).toLocaleString('ru-RU') : '',
        request ? new Date(request.created_at).toLocaleString('ru-RU') : '',
        review?.rating || '',
        review?.review_text || ''
      ]
    })

    await batchUpdateSheet(SHEETS.FREE_HOOKAHS, freeHookahsData)
    console.log(`✅ Synced ${freeHookahsData.length} free hookahs`)

    return NextResponse.json({
      success: true,
      message: '✅ Синхронизация завершена успешно!',
      stats: {
        users: usersData.length,
        admins: adminsData.length,
        regularHookahs: regularHookahsData.length,
        freeHookahs: freeHookahsData.length
      }
    })

  } catch (error) {
    console.error('❌ Error syncing to Google Sheets:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка при синхронизации с Google Sheets',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

