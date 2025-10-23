import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/free-hookah-requests/approve
 * Подтверждение или отклонение запроса на бесплатный кальян
 */
export async function POST(request: NextRequest) {
  try {
    const { request_id, admin_tg_id, action } = await request.json()

    if (!request_id || !admin_tg_id || !action) {
      return NextResponse.json({
        success: false,
        message: 'Необходимы параметры: request_id, admin_tg_id, action'
      }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({
        success: false,
        message: 'action должен быть "approve" или "reject"'
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

    // Получаем запрос
    const hookahRequest = await prisma.freeHookahRequest.findUnique({
      where: { id: request_id },
      include: {
        user: true,
        stock: true
      }
    })

    if (!hookahRequest) {
      return NextResponse.json({
        success: false,
        message: 'Запрос не найден'
      }, { status: 404 })
    }

    if (hookahRequest.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `Запрос уже обработан (статус: ${hookahRequest.status})`
      }, { status: 400 })
    }

    // Получаем или создаем запись админа в таблице admins
    let adminRecord = await prisma.admin.findUnique({
      where: { user_id: admin.id }
    })

    if (!adminRecord) {
      // Создаем запись админа
      adminRecord = await prisma.admin.create({
        data: {
          user_id: admin.id,
          granted_by: admin.id // Сам себе выдал права
        }
      })
    }

    if (action === 'approve') {
      // Подтверждаем запрос
      await prisma.freeHookahRequest.update({
        where: { id: request_id },
        data: {
          status: 'approved',
          approved_by: adminRecord.id
        }
      })

      // Получаем неиспользованный бесплатный кальян
      const unusedFreeHookahs = await db.getUnusedFreeHookahs(hookahRequest.user_id)
      if (unusedFreeHookahs.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'У пользователя нет доступных бесплатных кальянов'
        }, { status: 400 })
      }

      // Используем бесплатный кальян
      const freeHookah = unusedFreeHookahs[0]
      await db.useFreeHookah(freeHookah.id)

      // Добавляем в историю
      await db.addHookahToHistory(
        hookahRequest.user_id,
        'free',
        undefined,
        hookahRequest.stock_id,
        adminRecord.user_id,
        'admin_approved'
      )

      // Сбрасываем флаг promotion_completed
      await db.updateStockPromotionCompleted(hookahRequest.stock_id, false)

      console.log('✅ Free hookah request APPROVED:', {
        request_id,
        user: `${hookahRequest.user.first_name} ${hookahRequest.user.last_name}`,
        admin: `${admin.first_name} ${admin.last_name}`
      })

      return NextResponse.json({
        success: true,
        message: '✅ Запрос подтвержден! Бесплатный кальян выдан пользователю.',
        request: {
          id: request_id,
          status: 'approved',
          user: {
            name: `${hookahRequest.user.first_name} ${hookahRequest.user.last_name}`,
            phone: hookahRequest.user.phone
          }
        }
      })
    } else {
      // Отклоняем запрос
      await prisma.freeHookahRequest.update({
        where: { id: request_id },
        data: {
          status: 'rejected',
          approved_by: adminRecord.id
        }
      })

      console.log('❌ Free hookah request REJECTED:', {
        request_id,
        user: `${hookahRequest.user.first_name} ${hookahRequest.user.last_name}`,
        admin: `${admin.first_name} ${admin.last_name}`
      })

      return NextResponse.json({
        success: true,
        message: '❌ Запрос отклонен.',
        request: {
          id: request_id,
          status: 'rejected',
          user: {
            name: `${hookahRequest.user.first_name} ${hookahRequest.user.last_name}`,
            phone: hookahRequest.user.phone
          }
        }
      })
    }

  } catch (error) {
    console.error('Error approving/rejecting free hookah request:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка сервера',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

