import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  console.log('🚀 POST /api/add-review called')
  try {
    const body = await req.json()
    console.log('📝 Request body:', body)
    
    const { tgId, hookahId, rating, reviewText } = body
    console.log('📝 Parsed data:', { tgId, hookahId, rating, reviewText })
    
    if (!tgId || !hookahId || !rating) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: tgId, hookahId, rating' 
      }, { status: 400 })
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      }, { status: 400 })
    }
    
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
    
    console.log('👤 Found user:', { id: user.id, tg_id: user.tg_id, name: `${user.first_name} ${user.last_name}` })
    
    // Проверяем, существует ли запись истории кальяна
    const hookahHistory = await db.getHookahHistoryById(hookahId)
    if (!hookahHistory) {
      return NextResponse.json({ 
        success: false, 
        message: 'Hookah history record not found' 
      }, { status: 404 })
    }
    
    console.log('📝 Found history record:', { id: hookahHistory.id, user_id: hookahHistory.user_id, hookah_type: hookahHistory.hookah_type })
    
    // Проверяем, что пользователь является владельцем этой записи
    if (hookahHistory.user_id !== user.id) {
      console.log('❌ Authorization failed:', { 
        historyUserId: hookahHistory.user_id, 
        requestUserId: user.id,
        tgId: tgId
      })
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized: You can only review your own purchases' 
      }, { status: 403 })
    }
    
    // Добавляем отзыв
    const success = await db.addHookahReview(user.id, hookahId, rating, reviewText)
    
    if (success) {
      // Обновляем оценку в Google Sheets (не блокируем ответ)
      try {
        const sheetsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/update-review-in-sheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hookah_id: hookahId,
            hookah_type: hookahHistory.hookah_type,
            rating,
            comment: reviewText || ''
          })
        })
        
        if (sheetsResponse.ok) {
          console.log('✅ Review updated in Google Sheets')
        } else {
          console.log('⚠️ Failed to update Google Sheets, but review was saved')
        }
      } catch (sheetsError) {
        console.error('⚠️ Error updating Google Sheets:', sheetsError)
        // Не возвращаем ошибку пользователю, так как отзыв уже сохранен
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Review added successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to add review' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error adding review:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code || 'No code'
    })
    
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        name: error instanceof Error ? error.name : 'Unknown',
        code: (error as any)?.code || 'No code'
      }
    }, { status: 500 })
  }
}