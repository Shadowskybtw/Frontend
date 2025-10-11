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
    
    // Ищем пользователя по последним 4 цифрам номера телефона
    const user = allUsers.find(u => {
      const phoneDigits = u.phone.replace(/\D/g, '')
      return phoneDigits.endsWith(phone)
    })

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

    const stats = {
      slotsFilled: stock ? Math.floor(stock.progress / 20) : 0,
      slotsRemaining: stock ? 5 - Math.floor(stock.progress / 20) : 5,
      progress: stock ? stock.progress : 0,
      hasFreeHookah: unusedFreeHookahs.length > 0
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