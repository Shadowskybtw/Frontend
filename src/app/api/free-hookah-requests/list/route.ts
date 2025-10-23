import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/free-hookah-requests/list
 * Получение списка запросов на бесплатные кальяны (только для админов)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const admin_tg_id = searchParams.get('admin_tg_id')
    const status = searchParams.get('status') // pending, approved, rejected, all

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

    // Получаем запросы
    const whereClause: any = {}
    if (status && status !== 'all') {
      whereClause.status = status
    }

    const requests = await prisma.freeHookahRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            tg_id: true,
            first_name: true,
            last_name: true,
            phone: true,
            username: true
          }
        },
        approver: {
          select: {
            id: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Подсчитываем статистику
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    }

    return NextResponse.json({
      success: true,
      requests: requests.map(r => ({
        id: r.id,
        user: {
          id: r.user.id,
          tg_id: r.user.tg_id.toString(),
          name: `${r.user.first_name} ${r.user.last_name}`,
          phone: r.user.phone,
          username: r.user.username
        },
        status: r.status,
        approver: r.approver ? {
          name: `${r.approver.user.first_name} ${r.approver.user.last_name}`
        } : null,
        created_at: r.created_at,
        updated_at: r.updated_at
      })),
      stats
    })

  } catch (error) {
    console.error('Error getting free hookah requests:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка сервера',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

