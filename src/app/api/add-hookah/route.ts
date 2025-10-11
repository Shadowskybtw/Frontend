import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { user_tg_id, admin_tg_id } = await request.json()

    if (!user_tg_id || !admin_tg_id) {
      return NextResponse.json(
        { success: false, message: 'Необходимо указать TG ID пользователя и админа' },
        { status: 400 }
      )
    }

    // Проверяем, что админ имеет права
    const admin = await db.getUserByTgId(admin_tg_id)
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Админ не найден' },
        { status: 404 }
      )
    }

    // Проверяем админские права напрямую
    const adminTgId = parseInt(process.env.ADMIN_TG_ID || '937011437')
    const isHardcodedAdmin = Number(admin_tg_id) === adminTgId
    const isDbAdmin = await db.isUserAdmin(admin.id)
    const isAdmin = isHardcodedAdmin || isDbAdmin
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      )
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(user_tg_id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Получаем или создаем акцию пользователя
    const stocks = await db.getUserStocks(user.id)
    let stock = stocks.find(s => s.stock_name === '5+1 кальян')
    
    if (!stock) {
      // Создаем новую акцию если её нет
      stock = await db.createStock({
        user_id: user.id,
        stock_name: '5+1 кальян',
        progress: 0
      })
    }

    // Увеличиваем прогресс на 20% (один слот)
    const newProgress = Math.min(100, stock.progress + 20)
    await db.updateStockProgress(stock.id, newProgress)

    // Добавляем запись в историю
    await db.addHookahToHistory(
      user.id,
      'regular',
      Math.floor(newProgress / 20), // slot_number
      stock.id,
      admin.id, // adminId
      'admin_add' // scanMethod
    )

    // Проверяем, заполнены ли все слоты (100% прогресса)
    if (newProgress >= 100) {
      // Сбрасываем прогресс на 0
      await db.updateStockProgress(stock.id, 0)
      
      // Создаем бесплатный кальян автоматически
      console.log(`🎁 Creating free hookah for user ${user.id} after promotion completion`)
      const freeHookah = await db.createFreeHookah(user.id)
      console.log(`✅ Free hookah created:`, freeHookah)
      
      // Добавляем запись в историю о получении бесплатного кальяна
      try {
        await db.addHookahToHistory(
          user.id,
          'free',
          undefined, // slot_number
          stock.id,
          admin.id, // adminId
          'promotion_completed' // scanMethod
        )
        console.log(`✅ Free hookah added to history`)
      } catch (historyError) {
        console.error(`❌ Error adding free hookah to history:`, historyError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Кальян успешно добавлен пользователю',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      newProgress
    })

  } catch (error) {
    console.error('Error adding hookah:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
