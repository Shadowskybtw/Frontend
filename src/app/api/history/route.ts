import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const db = neon(process.env.DATABASE_URL!)

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

    // Для демонстрации создаем больше тестовых записей с пагинацией
    const allMockHistory = []
    const totalItems = 25 // Общее количество записей для демонстрации
    
    for (let i = 1; i <= totalItems; i++) {
      const daysAgo = i * 2
      const isFree = i % 5 === 0 // Каждый 5-й кальян бесплатный
      
      allMockHistory.push({
        id: i,
        created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        is_free: isFree,
        rating: Math.floor(Math.random() * 3) + 3, // Рейтинг от 3 до 5
        rating_comment: isFree 
          ? 'Бесплатный кальян - отлично!' 
          : ['Отличный кальян!', 'Очень понравилось', 'Супер!', 'Классно!', 'Замечательно!'][Math.floor(Math.random() * 5)]
      })
    }

    // Применяем пагинацию
    const paginatedHistory = allMockHistory.slice(offset, offset + itemsPerPage)

    return NextResponse.json({
      success: true,
      history: paginatedHistory,
      total: totalItems,
      page: page,
      totalPages: Math.ceil(totalItems / itemsPerPage)
    })

  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
