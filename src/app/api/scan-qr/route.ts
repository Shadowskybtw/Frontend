import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { qr_data, admin_key } = await request.json()
    
    // Проверяем админский ключ (более гибкая проверка)
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    console.log('QR scan admin key check:', { received: admin_key, expected: expectedAdminKey })
    
    if (admin_key !== expectedAdminKey) {
      console.log('Unauthorized QR scan request, admin_key:', admin_key, 'expected:', expectedAdminKey)
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!qr_data) {
      return NextResponse.json({ success: false, message: 'QR data is required' }, { status: 400 })
    }

    // Парсим данные QR кода
    const userData = JSON.parse(qr_data)
    const tgId = userData.tg_id

    if (!tgId) {
      return NextResponse.json({ success: false, message: 'Invalid QR code' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Получаем или создаем акцию "5+1 кальян"
    let stock = await db.getUserStocks(user.id).then(stocks => 
      stocks.find(s => s.stock_name === '5+1 кальян')
    )

    if (!stock) {
      // Создаем акцию если её нет
      stock = await db.createStock({
        user_id: user.id,
        stock_name: '5+1 кальян',
        progress: 0
      })
    }

    // Проверяем, сколько слотов уже заполнено
    const currentSlots = Math.floor(stock.progress / 20)
    const maxSlots = 5
    
    if (currentSlots >= maxSlots) {
      return NextResponse.json({ 
        success: false, 
        message: 'Все слоты уже заполнены!',
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name
        },
        stock: stock
      })
    }
    
    // Заполняем следующий слот (увеличиваем прогресс на 20%)
    const newProgress = Math.min(stock.progress + 20, 100)
    
    console.log('Updating stock progress:', {
      stockId: stock.id,
      currentProgress: stock.progress,
      newProgress: newProgress,
      currentSlots: currentSlots,
      newSlots: Math.floor(newProgress / 20)
    })
    
    const updatedStock = await db.updateStockProgress(stock.id, newProgress)
    
    console.log('Stock updated successfully:', updatedStock)

    // Если акция завершена, создаем бесплатный кальян
    if (newProgress >= 100) {
      console.log('Creating free hookah for completed promotion')
      await db.createFreeHookah(user.id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'QR code scanned successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      stock: updatedStock,
      completed: newProgress >= 100
    })

  } catch (error) {
    console.error('Error scanning QR code:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
