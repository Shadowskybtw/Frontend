import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Disable caching for this route to ensure statistics update immediately
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tgId: string }> }
) {
  try {
    const resolvedParams = await params
    const tgId = parseInt(resolvedParams.tgId)
    
    if (isNaN(tgId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid Telegram ID' 
      }, { status: 400 })
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const withReviews = searchParams.get('withReviews') === 'true'

    console.log('🔍 Getting hookah history for tg_id:', tgId, 'limit:', limit, 'offset:', offset, 'withReviews:', withReviews)

    if (!db.isConnected()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 500 })
    }

    // Находим пользователя по tg_id
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }

    console.log('✅ User found:', user.first_name, user.last_name)

    // Получаем историю кальянов
    let history
    if (withReviews) {
      // Используем функцию с отзывами
      const page = Math.floor(offset / limit) + 1
      console.log('📊 Using withReviews, page:', page, 'limit:', limit, 'offset:', offset)
      console.log('📊 User ID for withReviews:', user.id)
      
      try {
        const historyWithReviews = await db.getHookahHistoryWithReviews(user.id, page, limit)
        history = historyWithReviews.history
        console.log('📊 History with reviews found:', history.length, 'records')
        console.log('📊 History with reviews details:', history)
      } catch (error) {
        console.error('❌ Error in getHookahHistoryWithReviews:', error)
        // Fallback to regular history if withReviews fails
        history = await db.getHookahHistory(user.id)
        history = history.slice(offset, offset + limit)
        console.log('📊 Fallback to regular history:', history.length, 'records')
      }
    } else {
      // Используем обычную функцию
      history = await db.getHookahHistory(user.id)
      // Применяем пагинацию
      history = history.slice(offset, offset + limit)
      console.log('📊 History without reviews found:', history.length, 'records')
    }
    
    console.log('📊 History found:', history.length, 'total records')
    console.log('📊 History details:', history)

    const responseData = { 
      success: true, 
      items: history,
      history: history, // Добавляем поле history для совместимости с фронтендом
      total: history.length,
      limit,
      offset,
      hasMore: withReviews ? false : offset + limit < history.length
    }

    const res = NextResponse.json(responseData)
    // Extra safety: explicit no-store headers
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res

  } catch (error) {
    console.error('❌ Error getting hookah history:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tgId: string }> }
) {
  try {
    const resolvedParams = await params
    const tgId = parseInt(resolvedParams.tgId)
    
    if (isNaN(tgId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid Telegram ID' 
      }, { status: 400 })
    }

    // Получаем данные из запроса
    const body = await req.json()
    const { hookah_type, slot_number } = body

    console.log('📝 Adding hookah to history for tg_id:', tgId, 'type:', hookah_type, 'slot:', slot_number)

    if (!db.isConnected()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 500 })
    }

    // Находим пользователя по tg_id
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }

    console.log('✅ User found:', user.first_name, user.last_name)

    // Добавляем запись в историю
    const historyRecord = await db.addHookahToHistory(
      user.id, 
      hookah_type || 'regular', 
      slot_number
    )

    console.log('✅ Hookah added to history:', historyRecord)

    return NextResponse.json({ 
      success: true, 
      message: 'Hookah added to history successfully',
      history: historyRecord
    })

  } catch (error) {
    console.error('❌ Error adding hookah to history:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}