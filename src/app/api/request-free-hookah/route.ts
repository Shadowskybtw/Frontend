import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()

    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'Telegram ID не предоставлен' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tg_id)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Пользователь не найден' }, { status: 404 })
    }

    // Проверяем, есть ли доступный бесплатный кальян (слоты заполнены на 100%)
    const userStocks = await db.getUserStocks(user.id)
    const stock = userStocks.find(s => s.stock_name === '5+1 кальян')
    
    if (!stock) {
      return NextResponse.json({ success: false, message: 'У пользователя нет активных акций' }, { status: 404 })
    }

    // Проверяем, что акция завершена (флаг promotion_completed)
    if (!stock.promotion_completed) {
      return NextResponse.json({ success: false, message: 'Слоты не заполнены. Нужно 5 кальянов для получения бесплатного.' }, { status: 400 })
    }

    // Проверяем, нет ли уже активного запроса
    const existingRequest = await db.getPendingFreeHookahRequest(user.id)
    if (existingRequest) {
      return NextResponse.json({ success: false, message: 'У вас уже есть активный запрос на бесплатный кальян. Ожидайте подтверждения администратора.' }, { status: 400 })
    }

    // Создаем запрос на бесплатный кальян
    const requestId = await db.createFreeHookahRequest(user.id, stock.id)
    
    // Отправляем уведомление всем администраторам
    await db.notifyAdminsAboutFreeHookahRequest(user, stock, requestId)

    return NextResponse.json({ 
      success: true, 
      message: '⏳ Запрос на бесплатный кальян отправлен администраторам. Ожидайте подтверждения.',
      requestId: requestId
    })

  } catch (error) {
    console.error('Error requesting free hookah:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
