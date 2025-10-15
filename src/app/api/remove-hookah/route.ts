import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Ensure this mutation route is never cached or statically optimized
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { user_tg_id, admin_tg_id, hookah_type, count } = await request.json()

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

    const type: 'regular' | 'free' = hookah_type === 'free' ? 'free' : 'regular'

    let newProgress: number | undefined
    const removeCount = Math.max(1, parseInt(String(count || '1')) || 1)

    if (type === 'regular') {
      // Получаем акцию пользователя только для платных кальянов
      const stocks = await db.getUserStocks(user.id)
      const stock = stocks.find(s => s.stock_name === '5+1 кальян')
      
      if (!stock || stock.progress <= 0) {
        return NextResponse.json(
          { success: false, message: 'У пользователя нет платных кальянов для удаления' },
          { status: 400 }
        )
      }

      // Удаляем N последних regular из истории и уменьшаем прогресс на 20*N
      let removed = 0
      for (let i = 0; i < removeCount; i++) {
        const ok = await db.removeHookahFromHistory(user.id, stock.id, 'regular')
        if (ok) removed++
        else break
      }
      const delta = removed * 20
      newProgress = Math.max(0, stock.progress - delta)
      await db.updateStockProgress(stock.id, newProgress)
    } else {
      // Удаляем N последних бесплатных кальянов
      for (let i = 0; i < removeCount; i++) {
        const ok = await db.removeHookahFromHistory(user.id, 0, 'free')
        if (!ok) break
      }
    }

    const res = NextResponse.json({
      success: true,
      message: type === 'regular' ? 'Платный кальян удален у пользователя' : 'Бесплатный кальян удален у пользователя',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      },
      newProgress
    })
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res

  } catch (error) {
    console.error('Error removing hookah:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}