import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Простая система блокировки для предотвращения дублирования запросов
const activeRequests = new Map<string, number>()

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9)
  console.log(`🚀 [${requestId}] QR scan request started`)
  
  let userKey = 'unknown' // Инициализируем переменную
  
  try {
    const { qr_data, phone_digits, admin_key } = await request.json()
    console.log(`🔍 [${requestId}] Request data:`, { qr_data: qr_data ? 'provided' : 'missing', phone_digits, admin_key: admin_key ? 'provided' : 'missing' })
    
    // Проверяем админский ключ (более гибкая проверка)
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Создаем уникальный ключ для запроса на основе данных пользователя
    userKey = phone_digits || qr_data || 'unknown'
    
    // Временно отключаем блокировку для отладки
    // if (activeRequests.has(userKey)) {
    //   console.log(`⚠️ [${requestId}] Request already in progress for user ${userKey}, ignoring`)
    //   return NextResponse.json({ success: false, message: 'Request already in progress for this user' }, { status: 429 })
    // }
    
    // Добавляем запрос в активные
    activeRequests.set(userKey, Date.now())
    console.log(`🔒 [${requestId}] Request locked for user: ${userKey}`)

    let user

    // Если передан QR код
    if (qr_data) {
      let userData
      
      try {
        // Пытаемся парсить как JSON
        userData = JSON.parse(qr_data)
        console.log('Parsed QR data as JSON:', userData)
      } catch {
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
      console.log(`🔍 [${requestId}] Searching user by phone digits: ${phone_digits}`)
      const allUsers = await db.getAllUsers()
      console.log(`📊 [${requestId}] Total users found: ${allUsers.length}`)
      
      user = allUsers.find(u => {
        const phone = u.phone.replace(/\D/g, '') // Убираем все нецифровые символы
        const matches = phone.endsWith(phone_digits)
        console.log(`📞 [${requestId}] Checking user ${u.id}: phone=${u.phone}, clean=${phone}, endsWith=${phone_digits}? ${matches}`)
        return matches
      })

      if (!user) {
        console.log(`❌ [${requestId}] User not found for phone digits: ${phone_digits}`)
        return NextResponse.json({ success: false, message: 'Пользователь с такими последними цифрами номера не найден' }, { status: 404 })
      }
      
      console.log(`✅ [${requestId}] User found: ${user.id} (${user.first_name} ${user.last_name})`)
    }
    else {
      return NextResponse.json({ success: false, message: 'QR data or phone digits is required' }, { status: 400 })
    }

    // Получаем или создаем акцию "5+1 кальян"
    console.log(`📊 [${requestId}] Getting stocks for user ${user.id}`)
    const userStocks = await db.getUserStocks(user.id)
    console.log(`📊 [${requestId}] User stocks found: ${userStocks.length}`)
    
    let stock = userStocks.find(s => s.stock_name === '5+1 кальян')
    console.log(`📊 [${requestId}] Hookah stock found: ${stock ? `ID ${stock.id}, progress ${stock.progress}%` : 'None'}`)
    
    // Если есть несколько акций, берем самую последнюю (с наибольшим ID)
    if (!stock && userStocks.length > 0) {
      const hookahStocks = userStocks.filter(s => s.stock_name === '5+1 кальян')
      console.log(`📊 [${requestId}] Filtered hookah stocks: ${hookahStocks.length}`)
      if (hookahStocks.length > 0) {
        stock = hookahStocks.reduce((latest, current) => 
          current.id > latest.id ? current : latest
        )
        console.log(`📊 [${requestId}] Selected latest stock: ID ${stock.id}, progress ${stock.progress}%`)
      }
    }

    if (!stock) {
      // Создаем акцию если её нет
      console.log(`📊 [${requestId}] Creating new stock for user ${user.id}`)
      stock = await db.createStock({
        user_id: user.id,
        stock_name: '5+1 кальян',
        progress: 0
      })
      console.log(`✅ [${requestId}] Created new stock: ID ${stock.id}`)
    }

    // Заполняем следующий слот (увеличиваем прогресс на 20%)
    const newProgress = stock.progress + 20
    const newSlotNumber = Math.floor(newProgress / 20)
    
    console.log(`📊 [${requestId}] Updating stock progress:`, { 
      stockId: stock.id, 
      currentProgress: stock.progress, 
      newProgress, 
      newSlotNumber 
    })
    
    const updatedStock = await db.updateStockProgress(stock.id, newProgress)
    
    if (!updatedStock) {
      return NextResponse.json({ success: false, message: 'Ошибка при обновлении прогресса' }, { status: 500 })
    }
    
    // Проверяем, заполнены ли все слоты ПОСЛЕ добавления (100% прогресса)
    if (updatedStock.progress >= 100) {
      // Если все слоты заполнены, сбрасываем прогресс на 0
      const resetStock = await db.updateStockProgress(stock.id, 0)
      
      // НЕ создаем бесплатный кальян автоматически - только показываем, что он доступен
      // Бесплатный кальян будет создан только когда пользователь нажмет кнопку
      
      return NextResponse.json({ 
        success: true, 
        message: 'Акция завершена! Бесплатный кальян доступен! Нажмите кнопку для получения.',
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
        freeHookahAvailable: true // Показываем, что бесплатный кальян доступен
      })
    }

    // Добавляем запись в историю кальянов
    try {
      console.log(`📝 [${requestId}] Adding to history:`, { 
        userId: user.id, 
        hookahType: 'regular', 
        slotNumber: newSlotNumber,
        stockId: stock.id 
      })
      
      await db.addHookahToHistory(
        user.id, 
        'regular', 
        newSlotNumber,
        stock.id,
        null, // adminId
        'admin_add' // scanMethod
      )
      console.log(`✅ [${requestId}] Hookah added to history successfully`)
    } catch (historyError) {
      console.error(`❌ [${requestId}] Error adding to hookah history:`, historyError)
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
    console.error(`❌ [${requestId}] Error scanning QR code:`, error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ошибка при сканировании QR кода: ' + String(error)
      },
      { status: 500 }
    )
  } finally {
    // Освобождаем блокировку для этого пользователя
    activeRequests.delete(userKey)
    console.log(`🔓 [${requestId}] Request unlocked for user: ${userKey}`)
  }
}
