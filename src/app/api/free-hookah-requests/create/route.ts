import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/free-hookah-requests/create
 * Создание запроса на получение бесплатного кальяна
 */
export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()

    if (!tg_id) {
      return NextResponse.json({
        success: false,
        message: 'Telegram ID не предоставлен'
      }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tg_id)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Пользователь не найден'
      }, { status: 404 })
    }

    // Проверяем наличие доступных бесплатных кальянов
    const unusedFreeHookahs = await db.getUnusedFreeHookahs(user.id)
    if (unusedFreeHookahs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'У вас нет доступных бесплатных кальянов'
      }, { status: 400 })
    }

    // Проверяем, нет ли уже pending запроса от этого пользователя
    const existingPendingRequest = await prisma.freeHookahRequest.findFirst({
      where: {
        user_id: user.id,
        status: 'pending'
      }
    })

    if (existingPendingRequest) {
      return NextResponse.json({
        success: false,
        message: 'У вас уже есть ожидающий подтверждения запрос. Дождитесь ответа администратора.',
        requestId: existingPendingRequest.id
      }, { status: 400 })
    }

    // Получаем актуальную акцию пользователя
    const stocks = await db.getUserStocks(user.id)
    const stock = stocks.find(s => s.stock_name === '5+1 кальян')

    if (!stock) {
      return NextResponse.json({
        success: false,
        message: 'Активная акция не найдена'
      }, { status: 404 })
    }

    // Создаем запрос на подтверждение
    const request_record = await prisma.freeHookahRequest.create({
      data: {
        user_id: user.id,
        stock_id: stock.id,
        status: 'pending'
      }
    })

    console.log('🎁 Free hookah request created:', {
      id: request_record.id,
      user: `${user.first_name} ${user.last_name}`,
      phone: user.phone
    })

    return NextResponse.json({
      success: true,
      message: '✅ Запрос отправлен! Ожидайте подтверждения от администратора.',
      request: {
        id: request_record.id,
        status: request_record.status,
        created_at: request_record.created_at
      }
    })

  } catch (error) {
    console.error('Error creating free hookah request:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка сервера',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

