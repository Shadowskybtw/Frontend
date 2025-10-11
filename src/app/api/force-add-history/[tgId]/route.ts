import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request, { params }: { params: Promise<{ tgId: string }> }) {
  try {
    const resolvedParams = await params
    const tgId = parseInt(resolvedParams.tgId)
    console.log(`🧪 Force add history API called for TG ID: ${tgId}`)
    
    if (!tgId || isNaN(tgId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Telegram ID'
      }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    console.log('Found user:', user)

    // Создаем несколько тестовых записей в истории
    const testRecords = []
    
    // Добавляем обычный кальян
    const regularHookah = await db.addHookahToHistory(
      user.id,
      'regular',
      1, // slot_number
      undefined, // stockId
      null, // adminId
      'force_test' // scanMethod
    )
    testRecords.push(regularHookah)

    // Добавляем бесплатный кальян
    const freeHookah = await db.addHookahToHistory(
      user.id,
      'free',
      undefined, // slot_number
      undefined, // stockId
      null, // adminId
      'force_test_free' // scanMethod
    )
    testRecords.push(freeHookah)

    console.log('Test records created:', testRecords)

    // Получаем обновленную историю
    const updatedHistory = await db.getHookahHistory(user.id)
    console.log('Updated history:', updatedHistory)

    // Получаем историю с отзывами
    const updatedHistoryWithReviews = await db.getHookahHistoryWithReviews(user.id, 1, 10)
    console.log('Updated history with reviews:', updatedHistoryWithReviews)

    return NextResponse.json({
      success: true,
      message: 'Test history records created successfully',
      testRecords: testRecords.map(r => ({
        id: r.id,
        hookah_type: r.hookah_type,
        slot_number: r.slot_number,
        created_at: r.created_at
      })),
      updatedHistory: {
        total: updatedHistory.length,
        records: updatedHistory.map(h => ({
          id: h.id,
          hookah_type: h.hookah_type,
          slot_number: h.slot_number,
          created_at: h.created_at
        }))
      },
      updatedHistoryWithReviews: {
        total: updatedHistoryWithReviews.history.length,
        records: updatedHistoryWithReviews.history.map(h => ({
          id: h.id,
          hookah_type: h.hookah_type,
          slot_number: h.slot_number,
          created_at: h.created_at,
          review: h.review
        }))
      }
    })

  } catch (error) {
    console.error('Error in force add history API:', error)
    return NextResponse.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
