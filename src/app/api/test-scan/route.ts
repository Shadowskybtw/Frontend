import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()
    
    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    console.log('Testing scan for TG ID:', tg_id)

    // Получаем пользователя
    const user = await db.getUserByTgId(tg_id)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    console.log('User found:', user)

    // Получаем акции пользователя
    const stocks = await db.getUserStocks(user.id)
    console.log('User stocks:', stocks)

    const hookahStock = stocks.find(s => s.stock_name === '5+1 кальян')
    console.log('Hookah stock:', hookahStock)

    if (!hookahStock) {
      return NextResponse.json({ success: false, message: 'Hookah stock not found' }, { status: 404 })
    }

    // Проверяем текущий прогресс
    const currentSlots = Math.floor(hookahStock.progress / 20)
    console.log('Current slots:', currentSlots)

    if (currentSlots >= 5) {
      return NextResponse.json({ 
        success: false, 
        message: 'All slots already filled',
        currentSlots,
        progress: hookahStock.progress
      })
    }

    // Увеличиваем прогресс
    const newProgress = Math.min(hookahStock.progress + 20, 100)
    const newSlotNumber = Math.floor(newProgress / 20)
    
    console.log('Updating progress:', {
      currentProgress: hookahStock.progress,
      newProgress: newProgress,
      currentSlots: currentSlots,
      newSlotNumber: newSlotNumber
    })

    // Обновляем прогресс
    const updatedStock = await db.updateStockProgress(hookahStock.id, newProgress)
    console.log('Updated stock:', updatedStock)

    if (!updatedStock) {
      return NextResponse.json({ success: false, message: 'Failed to update stock' }, { status: 500 })
    }

    // Добавляем в историю
    const historyEntry = await db.addHookahToHistory(user.id, 'regular', newSlotNumber)
    console.log('Added to history:', historyEntry)

    // Если акция завершена, создаем бесплатный кальян
    if (newProgress >= 100) {
      console.log('Creating free hookah for completed promotion')
      await db.createFreeHookah(user.id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test scan successful',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      stock: updatedStock,
      historyEntry: historyEntry,
      completed: newProgress >= 100
    })

  } catch (error) {
    console.error('Error in test scan:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
