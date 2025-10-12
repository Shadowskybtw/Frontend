import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId, hookahId, rating, reviewText } = await req.json()
    
    console.log('📝 Adding review:', { userId, hookahId, rating, reviewText })
    
    if (!userId || !hookahId || !rating) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: userId, hookahId, rating' 
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
    
    // Проверяем, существует ли запись истории кальяна
    const hookahHistory = await db.getHookahHistoryById(hookahId)
    if (!hookahHistory) {
      return NextResponse.json({ 
        success: false, 
        message: 'Hookah history record not found' 
      }, { status: 404 })
    }
    
    // Проверяем, что пользователь является владельцем этой записи
    if (hookahHistory.user_id !== userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized: You can only review your own purchases' 
      }, { status: 403 })
    }
    
    // Добавляем отзыв
    const success = await db.addHookahReview(userId, hookahId, rating, reviewText)
    
    if (success) {
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
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}