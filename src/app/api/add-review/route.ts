import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId, hookahId, rating, reviewText } = await req.json()

    if (!userId || !hookahId || !rating) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID, hookah ID и рейтинг обязательны' 
      }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false, 
        message: 'Рейтинг должен быть от 1 до 5' 
      }, { status: 400 })
    }

    const success = await db.addHookahReview(userId, hookahId, rating, reviewText)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Отзыв успешно добавлен'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Ошибка при добавлении отзыва'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error adding review:', error)
    return NextResponse.json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    }, { status: 500 })
  }
}
