import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { request_id, admin_tg_id } = await request.json()

    if (!request_id || !admin_tg_id) {
      return NextResponse.json({ success: false, message: 'Недостаточно данных' }, { status: 400 })
    }

    // Получаем администратора
    const admin = await db.getUserByTgId(admin_tg_id)
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Администратор не найден' }, { status: 404 })
    }

    // Проверяем права администратора
    const isAdmin = await db.checkAdminRights(admin.id)
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав' }, { status: 403 })
    }

    // Получаем запрос
    const freeHookahRequest = await db.getFreeHookahRequestById(request_id)
    if (!freeHookahRequest) {
      return NextResponse.json({ success: false, message: 'Запрос не найден' }, { status: 404 })
    }

    if (freeHookahRequest.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Запрос уже обработан' }, { status: 400 })
    }

    // Подтверждаем запрос
    const approved = await db.approveFreeHookahRequest(request_id, admin.id)
    if (!approved) {
      return NextResponse.json({ success: false, message: 'Ошибка при подтверждении запроса' }, { status: 500 })
    }

    // Создаем бесплатный кальян
    const freeHookah = await db.createFreeHookah(freeHookahRequest.user_id)
    
    // Сбрасываем флаг promotion_completed
    await db.updateStockPromotionCompleted(freeHookahRequest.stock_id, false)
    
    // Добавляем запись в историю
    try {
      await db.addHookahToHistory(
        freeHookahRequest.user_id, 
        'free', 
        5, // 5-й слот завершил акцию
        freeHookahRequest.stock_id,
        admin.id, // adminId
        'admin_approved' // scanMethod
      )
      console.log('✅ Free hookah approved and added to history successfully')
    } catch (historyError) {
      console.error('❌ Error adding free hookah to history:', historyError)
    }

    // Уведомляем пользователя
    await db.notifyUserAboutApprovedFreeHookah(freeHookahRequest.user_id)

    return NextResponse.json({ 
      success: true, 
      message: '✅ Запрос на бесплатный кальян подтвержден!',
      freeHookah: freeHookah
    })

  } catch (error) {
    console.error('Error approving free hookah:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
