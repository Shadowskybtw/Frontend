import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const db = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()

    if (!tg_id) {
      return NextResponse.json(
        { success: false, message: 'Telegram ID не предоставлен' },
        { status: 400 }
      )
    }

    // Получаем историю покупок пользователя (пока используем моковые данные)
    // const history = await db`
    //   SELECT 
    //     fh.id,
    //     fh.created_at,
    //     fh.used as is_free,
    //     fh.used_at,
    //     fh.created_at as purchase_date
    //   FROM free_hookahs fh
    //   JOIN users u ON fh.user_id = u.id
    //   WHERE u.tg_id = ${tg_id}
    //   ORDER BY fh.created_at DESC
    //   LIMIT 100
    // `

    // Для демонстрации добавляем несколько тестовых записей
    const mockHistory = [
      {
        id: 1,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 день назад
        is_free: false,
        rating: 5,
        rating_comment: 'Отличный кальян!'
      },
      {
        id: 2,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 дня назад
        is_free: true,
        rating: 4,
        rating_comment: 'Бесплатный кальян - супер!'
      },
      {
        id: 3,
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 дня назад
        is_free: false,
        rating: 5,
        rating_comment: 'Очень понравилось'
      }
    ]

    return NextResponse.json({
      success: true,
      history: mockHistory,
      total: mockHistory.length
    })

  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
