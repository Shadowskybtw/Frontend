import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const phone = url.searchParams.get('phone')

    if (!phone || phone.length !== 4) {
      return NextResponse.json(
        { success: false, message: 'Необходимо указать 4 цифры номера телефона' },
        { status: 400 }
      )
    }

    // Получаем всех пользователей
    const allUsers = await db.getAllUsers()
    console.log('🔍 Search-user API: получено пользователей:', allUsers.length)
    
    // Ищем пользователя по последним 4 цифрам номера телефона
    const user = allUsers.find(u => {
      const phoneDigits = u.phone.replace(/\D/g, '')
      const last4 = phoneDigits.slice(-4)
      console.log(`🔍 Проверяем пользователя ${u.first_name} ${u.last_name}: ${u.phone} -> ${last4} (ищем: ${phone})`)
      return last4 === phone
    })
    
    console.log('🔍 Search-user API: найден пользователь:', user ? `${user.first_name} ${user.last_name}` : 'Нет')

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Получаем статистику пользователя
    const stocks = await db.getUserStocks(user.id)
    const stock = stocks.find(s => s.stock_name === '5+1 кальян')
    const freeHookahs = await db.getFreeHookahs(user.id)
    const unusedFreeHookahs = freeHookahs.filter(h => !h.used)
    
    // ВАЖНО: Проверяем реальное количество кальянов в истории
    const history = await db.getHookahHistory(user.id)
    const regularCount = history.filter(h => h.hookah_type === 'regular').length
    const freeCount = history.filter(h => h.hookah_type === 'free').length
    
    // CYCLIC PROGRESS: (count % 5) * 20
    const currentCycleCount = regularCount % 5
    const expectedProgress = currentCycleCount * 20
    const completedCycles = Math.floor(regularCount / 5)
    const actualProgress = stock ? stock.progress : 0
    
    console.log(`📊 Search-user progress calculation: ${regularCount} hookahs = ${completedCycles} cycles + ${currentCycleCount} in current = ${expectedProgress}%`)
    
    // Если есть несоответствие - логируем
    if (expectedProgress !== actualProgress) {
      console.log('⚠️ MISMATCH in search-user:', {
        user: `${user.first_name} ${user.last_name}`,
        expectedProgress,
        actualProgress,
        regularInHistory: regularCount,
        currentCycleCount,
        completedCycles
      })
    }

    const stats = {
      slotsFilled: currentCycleCount, // Слоты в ТЕКУЩЕМ цикле (0-4)
      slotsRemaining: 5 - currentCycleCount, // Осталось до завершения ТЕКУЩЕГО цикла
      progress: expectedProgress, // Прогресс текущего цикла (0%, 20%, 40%, 60%, 80%)
      totalHookahs: regularCount, // Всего кальянов
      completedCycles, // Завершенных циклов
      actualStockProgress: actualProgress, // Для отладки
      hasFreeHookah: unusedFreeHookahs.length > 0,
      mismatch: expectedProgress !== actualProgress
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username
      },
      stats
    })

  } catch (error) {
    console.error('Error searching user:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}