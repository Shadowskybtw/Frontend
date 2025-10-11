import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ tgId: string }> }) {
  try {
    const resolvedParams = await params
    const tgId = parseInt(resolvedParams.tgId)

    if (!tgId || isNaN(tgId)) {
      return NextResponse.json(
        { success: false, message: 'Неверный Telegram ID' },
        { status: 400 }
      )
    }

    // Получаем пользователя по tg_id
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Получаем историю кальянов
    const history = await db.getHookahHistory(user.id)
    
    // Подсчитываем статистику
    const regularHookahs = history.filter(item => item.hookah_type === 'regular').length
    const freeHookahs = history.filter(item => item.hookah_type === 'free').length
    const totalHookahs = history.length

    return NextResponse.json({
      success: true,
      stats: {
        regularHookahs,
        freeHookahs,
        totalHookahs
      },
      history
    })

  } catch (error) {
    console.error('Error fetching hookah stats:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
