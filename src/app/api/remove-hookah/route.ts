import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Простая система блокировки для предотвращения дублирования запросов
const activeRequests = new Set<string>()

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9)
  console.log(`🚀 [${requestId}] Remove hookah request started`)
  
  try {
    const { phone_digits, admin_key } = await request.json()
    console.log(`🔍 [${requestId}] Request data:`, { phone_digits, admin_key: admin_key ? 'provided' : 'missing' })
    
    // Проверяем админский ключ
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Создаем уникальный ключ для запроса
    const requestKey = `${phone_digits || 'unknown'}-${Date.now()}`
    
    // Проверяем, не выполняется ли уже такой запрос
    if (activeRequests.has(requestKey)) {
      console.log(`⚠️ [${requestId}] Duplicate request detected, ignoring`)
      return NextResponse.json({ success: false, message: 'Request already in progress' }, { status: 429 })
    }
    
    // Добавляем запрос в активные
    activeRequests.add(requestKey)
    console.log(`🔒 [${requestId}] Request locked: ${requestKey}`)

    if (!phone_digits || phone_digits.length !== 4 || !/^\d{4}$/.test(phone_digits)) {
      return NextResponse.json({ success: false, message: 'Phone digits must be exactly 4 digits' }, { status: 400 })
    }

    // Ищем пользователя по последним 4 цифрам номера телефона
    const allUsers = await db.getAllUsers()
    const user = allUsers.find(u => {
      const phone = u.phone.replace(/\D/g, '') // Убираем все нецифровые символы
      return phone.endsWith(phone_digits)
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'Пользователь с такими последними цифрами номера не найден' }, { status: 404 })
    }

    // Получаем акцию пользователя
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
      return NextResponse.json({ success: false, message: 'У пользователя нет активных акций' }, { status: 404 })
    }

    // Проверяем, есть ли что убирать
    if (stock.progress <= 0) {
      return NextResponse.json({ success: false, message: 'Нет кальянов для удаления' }, { status: 400 })
    }

    // Уменьшаем прогресс на один слот (20%)
    const updatedStock = await db.decreaseStockProgress(stock.id)

    if (!updatedStock) {
      return NextResponse.json({ success: false, message: 'Ошибка при обновлении прогресса' }, { status: 500 })
    }

    // Добавляем запись в историю кальянов (удаление)
    try {
      await db.addHookahToHistory(
        user.id, 
        'removed', 
        Math.floor(updatedStock.progress / 20),
        stock.id,
        null, // adminId
        'admin_remove' // scanMethod
      )
      console.log('✅ Hookah removal added to history successfully')
    } catch (historyError) {
      console.error('❌ Error adding hookah removal to history:', historyError)
      // Продолжаем выполнение, даже если не удалось добавить в историю
    }

    return NextResponse.json({ 
      success: true, 
      message: `✅ Кальян убран! Слот освобожден. Прогресс: ${updatedStock.progress}%`,
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username
      },
      stock: updatedStock,
      slotNumber: Math.floor(updatedStock.progress / 20),
      progress: updatedStock.progress
    })

  } catch (error) {
    console.error(`❌ [${requestId}] Error removing hookah:`, error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ошибка при удалении кальяна: ' + String(error)
      },
      { status: 500 }
    )
  } finally {
    // Освобождаем блокировку
    activeRequests.clear() // Очищаем все активные запросы
    console.log(`🔓 [${requestId}] Request unlocked`)
  }
}
