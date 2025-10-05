import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { phone_digits, admin_key } = await request.json()

    if (!phone_digits) {
      return NextResponse.json(
        { success: false, message: 'Phone digits не предоставлен' },
        { status: 400 }
      )
    }

    // Проверяем админский ключ
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (phone_digits.length !== 4 || !/^\d{4}$/.test(phone_digits)) {
      return NextResponse.json({ success: false, message: 'Phone digits must be exactly 4 digits' }, { status: 400 })
    }

    // Ищем пользователя по последним 4 цифрам номера телефона
    const user = await db.getUserByPhoneDigits(phone_digits)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Пользователь не найден' }, { status: 404 })
    }

    // Получаем акции пользователя
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

    // Получаем бесплатные кальяны пользователя
    const freeHookahs = await db.getUnusedFreeHookahs(user.id)

    // Вычисляем сколько кальянов осталось до бесплатного
    const slotsFilled = stock ? Math.floor(stock.progress / 20) : 0
    const slotsRemaining = 5 - slotsFilled

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
      stock: stock || null,
      freeHookahs: freeHookahs,
      stats: {
        slotsFilled,
        slotsRemaining,
        progress: stock?.progress || 0,
        hasFreeHookah: freeHookahs.length > 0
      }
    })

  } catch (error) {
    console.error('Error searching user:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
