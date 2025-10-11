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

    // Проверяем, есть ли неиспользованный бесплатный кальян
    const existingFreeHookahs = await db.getUnusedFreeHookahs(user.id)
    if (existingFreeHookahs.length === 0) {
      return NextResponse.json({ success: false, message: 'У вас нет доступных бесплатных кальянов. Заполните все 5 слотов акции.' }, { status: 400 })
    }

    // Используем первый доступный бесплатный кальян
    const freeHookah = existingFreeHookahs[0]
    const usedHookah = await db.useFreeHookah(freeHookah.id)
    
    if (!usedHookah) {
      return NextResponse.json({ success: false, message: 'Ошибка при получении бесплатного кальяна' }, { status: 500 })
    }
    
    // Сбрасываем флаг promotion_completed, так как бесплатный кальян получен
    await db.updateStockPromotionCompleted(stock.id, false)
    
    // Добавляем запись в историю о получении бесплатного кальяна
    try {
      await db.addHookahToHistory(
        user.id, 
        'free', 
        undefined, // slot_number
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
      freeHookah: usedHookah
    })

  } catch (error) {
    console.error('Error claiming free hookah:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
