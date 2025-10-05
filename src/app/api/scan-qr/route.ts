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
      let userData
      
      try {
        // Пытаемся парсить как JSON
        userData = JSON.parse(qr_data)
        console.log('Parsed QR data as JSON:', userData)
      } catch (parseError) {
        // Если не JSON, проверяем, может быть это просто TG ID
        console.log('QR data is not JSON, treating as raw data:', qr_data)
        
        // Если это число, используем как TG ID
        const numericId = parseInt(qr_data)
        if (!isNaN(numericId)) {
          userData = { tg_id: numericId }
        } else {
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid QR code format. Expected JSON or numeric ID.' 
          }, { status: 400 })
        }
      }
      
      const tgId = userData.tg_id

      if (!tgId) {
        return NextResponse.json({ success: false, message: 'Invalid QR code - no TG ID found' }, { status: 400 })
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

    // Проверяем, заполнены ли все слоты (100% прогресса)
    if (stock.progress >= 100) {
      // Если все слоты заполнены, сбрасываем прогресс на 0
      const resetStock = await db.updateStockProgress(stock.id, 0)
      
      // Создаем бесплатный кальян для завершенной акции
      await db.createFreeHookah(user.id)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Акция завершена! Получен бесплатный кальян! Прогресс сброшен.',
        user: {
          id: user.id,
          tg_id: user.tg_id,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          username: user.username
        },
        stock: resetStock,
        newPromotion: true,
        refreshRequired: true,
        freeHookahCreated: true
      })
    }
    
    // Заполняем следующий слот (увеличиваем прогресс на 20%)
    const newProgress = stock.progress + 20
    const newSlotNumber = Math.floor(newProgress / 20)
    
    const updatedStock = await db.updateStockProgress(stock.id, newProgress)

    // Добавляем запись в историю кальянов
    try {
      await db.addHookahToHistory(
        user.id, 
        'regular', 
        newSlotNumber
      )
      console.log('✅ Hookah added to history successfully')
    } catch (historyError) {
      console.error('❌ Error adding to hookah history:', historyError)
      // Продолжаем выполнение, даже если не удалось добавить в историю
    }

    return NextResponse.json({ 
      success: true, 
      message: `✅ Кальян добавлен! Слот ${newSlotNumber}/5 заполнен`,
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username
      },
      stock: updatedStock,
      completed: newProgress >= 100,
      slotNumber: newSlotNumber,
      progress: newProgress
    })

  } catch (error) {
    console.error('Error scanning QR code:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ошибка при сканировании QR кода: ' + String(error)
      },
      { status: 500 }
    )
  }
}
