import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()

    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'Telegram ID не предоставлен' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tg_id)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Пользователь не найден' }, { status: 404 })
    }

    // Проверяем, есть ли доступный бесплатный кальян (слоты заполнены на 100%)
    const userStocks = await db.getUserStocks(user.id)
    const stock = userStocks.find(s => s.stock_name === '5+1 кальян')
    
    if (!stock) {
      return NextResponse.json({ success: false, message: 'У пользователя нет активных акций' }, { status: 404 })
    }

    // Проверяем, что акция завершена (флаг promotion_completed)
    if (!stock.promotion_completed) {
      return NextResponse.json({ success: false, message: 'Слоты не заполнены. Нужно 5 кальянов для получения бесплатного.' }, { status: 400 })
    }

    // Проверяем, что у пользователя еще нет неиспользованного бесплатного кальяна
    const existingFreeHookahs = await db.getUnusedFreeHookahs(user.id)
    if (existingFreeHookahs.length > 0) {
      return NextResponse.json({ success: false, message: 'У вас уже есть неиспользованный бесплатный кальян' }, { status: 400 })
    }

    // Создаем бесплатный кальян
    const freeHookah = await db.createFreeHookah(user.id)
    
    // Сбрасываем флаг promotion_completed, так как бесплатный кальян получен
    await db.updateStockPromotionCompleted(stock.id, false)
    
    // Добавляем запись в историю о получении бесплатного кальяна
    try {
      await db.addHookahToHistory(
        user.id, 
        'free', 
        5, // 5-й слот завершил акцию
        stock.id,
        null, // adminId
        'user_claimed' // scanMethod
      )
      console.log('✅ Free hookah claimed and added to history successfully')
    } catch (historyError) {
      console.error('❌ Error adding free hookah to history:', historyError)
      // Продолжаем выполнение, даже если не удалось добавить в историю
    }

    return NextResponse.json({ 
      success: true, 
      message: '🎉 Бесплатный кальян получен! Приходите забирать!',
      freeHookah: freeHookah
    })

  } catch (error) {
    console.error('Error claiming free hookah:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
