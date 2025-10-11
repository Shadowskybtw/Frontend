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

    // Проверяем админские права через API
    try {
      const adminCheckResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin?tg_id=${admin_tg_id}`)
      const adminCheckData = await adminCheckResponse.json()
      
      if (!adminCheckData.success || !adminCheckData.isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Недостаточно прав для выполнения операции' },
          { status: 403 }
        )
      }
    } catch (error) {
      console.error('Error checking admin rights:', error)
      return NextResponse.json(
        { success: false, message: 'Ошибка при проверке админских прав' },
        { status: 500 }
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

    // Получаем акцию пользователя
    const stocks = await db.getUserStocks(user.id)
    const stock = stocks.find(s => s.stock_name === '5+1 кальян')
    
    if (!stock || stock.progress <= 0) {
      return NextResponse.json(
        { success: false, message: 'У пользователя нет кальянов для удаления' },
        { status: 400 }
      )
    }

    // Уменьшаем прогресс на 20% (один слот)
    const newProgress = Math.max(0, stock.progress - 20)
    await db.updateStockProgress(stock.id, newProgress)

    // Добавляем запись в историю об удалении
    await db.addHookahToHistory(
      user.id,
      'regular',
      Math.floor(newProgress / 20) + 1, // slot_number
      stock.id,
      admin.id, // adminId
      'admin_remove' // scanMethod
    )

    return NextResponse.json({
      success: true,
      message: 'Кальян успешно удален у пользователя',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      newProgress
    })

  } catch (error) {
    console.error('Error removing hookah:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}