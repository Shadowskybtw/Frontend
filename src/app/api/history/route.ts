import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id, page = 1 } = await request.json()

    if (!tg_id) {
      return NextResponse.json(
        { success: false, message: 'Telegram ID не предоставлен' },
        { status: 400 }
      )
    }

    const itemsPerPage = 10
    const offset = (page - 1) * itemsPerPage

    // Получаем пользователя по tg_id
    const user = await db.getUserByTgId(tg_id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Получаем историю кальянов пользователя
    const history = await db.getHookahHistory(user.id)
    
    // Применяем пагинацию
    const paginatedHistory = history.slice(offset, offset + itemsPerPage)

    return NextResponse.json({
      success: true,
      history: paginatedHistory,
      total: history.length,
      page: page,
      totalPages: Math.ceil(history.length / itemsPerPage)
    })

  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
