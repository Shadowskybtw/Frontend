import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ tgId: string }> }) {
  try {
    const resolvedParams = await params
    const tgId = parseInt(resolvedParams.tgId)
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const withReviews = url.searchParams.get('withReviews') === 'true'

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

    // Получаем историю кальянов с отзывами или без
    let historyData
    if (withReviews) {
      console.log(`Fetching history with reviews for user ${user.id}`)
      historyData = await db.getHookahHistoryWithReviews(user.id, page, 10)
      console.log('History with reviews:', historyData)
    } else {
      console.log(`Fetching history without reviews for user ${user.id}`)
      const history = await db.getHookahHistory(user.id)
      console.log('Raw history:', history)
      const itemsPerPage = 10
      const offset = (page - 1) * itemsPerPage
      const paginatedHistory = history.slice(offset, offset + itemsPerPage)
      
      historyData = {
        history: paginatedHistory,
        totalPages: Math.ceil(history.length / itemsPerPage),
        currentPage: page
      }
    }

    return NextResponse.json({
      success: true,
      history: historyData.history,
      totalPages: historyData.totalPages,
      currentPage: historyData.currentPage
    })

  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
