import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { qr_data, phone_digits, admin_key } = await request.json()
    
    // Проверяем админский ключ (более гибкая проверка)
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    let user

    // Если передан QR код
    if (qr_data) {
      // Парсим данные QR кода
      const userData = JSON.parse(qr_data)
      const tgId = userData.tg_id

      if (!tgId) {
        return NextResponse.json({ success: false, message: 'Invalid QR code' }, { status: 400 })
      }

      // Получаем пользователя по TG ID
      user = await db.getUserByTgId(tgId)
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
      }
    }
    // Если передан номер телефона
    else if (phone_digits) {
      if (phone_digits.length !== 4 || !/^\d{4}$/.test(phone_digits)) {
        return NextResponse.json({ success: false, message: 'Phone digits must be exactly 4 digits' }, { status: 400 })
      }

      // Ищем пользователя по последним 4 цифрам номера телефона
      const allUsers = await db.getAllUsers()
      user = allUsers.find(u => {
        const phone = u.phone.replace(/\D/g, '') // Убираем все нецифровые символы
        return phone.endsWith(phone_digits)
      })

      if (!user) {
        return NextResponse.json({ success: false, message: 'Пользователь с такими последними цифрами номера не найден' }, { status: 404 })
      }
    }
    else {
      return NextResponse.json({ success: false, message: 'QR data or phone digits is required' }, { status: 400 })
    }

    // Получаем или создаем акцию "5+1 кальян"
    const userStocks = await db.getUserStocks(user.id)
    let stock = userStocks.find(s => s.stock_name === '5+1 кальян')
    
    // Если есть несколько акций, берем самую последнюю (с наибольшим ID)
    if (!stock && userStocks.length > 0) {
      const hookahStocks = userStocks.filter(s => s.stock_name === '5+1 кальян')
      if (hookahStocks.length > 0) {
        stock = hookahStocks.reduce((latest, current) => 
          current.id > latest.id ? current : latest
        )
      }
    }

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
      // Если все слоты заполнены, создаем новую акцию с 0 прогрессом
      const newStock = await db.createStock({
        user_id: user.id,
        stock_name: '5+1 кальян',
        progress: 0
      })
      
      // Создаем бесплатный кальян для завершенной акции
      await db.createFreeHookah(user.id)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Акция завершена! Получен бесплатный кальян! Начата новая акция.',
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name
        },
        stock: newStock,
        newPromotion: true,
        refreshRequired: true,
        freeHookahCreated: true
      })
    }
    
    // Заполняем следующий слот (увеличиваем прогресс на 20%)
    const newProgress = Math.min(stock.progress + 20, 100)
    const newSlotNumber = Math.floor(newProgress / 20)
    
    const updatedStock = await db.updateStockProgress(stock.id, newProgress)

    // Добавляем запись в историю кальянов
    await db.addHookahToHistory(user.id, 'regular', newSlotNumber)

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
