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

    console.log('🔍 Processing remove request:', { user_tg_id, type, removeCount })

    if (type === 'regular') {
      // Получаем акцию пользователя только для платных кальянов
      const stocks = await db.getUserStocks(user.id)
      const stock = stocks.find(s => s.stock_name === '5+1 кальян')
      
      if (!stock) {
        return NextResponse.json(
          { success: false, message: 'У пользователя нет активной акции 5+1' },
          { status: 400 }
        )
      }

      console.log('📊 Current stock:', stock)

      // ВАЖНО: Проверяем реальное состояние истории перед удалением
      const currentHistory = await db.getHookahHistory(user.id)
      const regularHookahs = currentHistory.filter(h => h.hookah_type === 'regular')
      const freeHookahs = currentHistory.filter(h => h.hookah_type === 'free')
      
      console.log('📜 Current history state:', {
        total: currentHistory.length,
        regular: regularHookahs.length,
        free: freeHookahs.length,
        stockProgress: stock.progress,
        expectedFromProgress: Math.floor(stock.progress / 20)
      })

      // Если progress > 0, но нет записей regular в истории - это несоответствие
      if (stock.progress > 0 && regularHookahs.length === 0) {
        console.log('⚠️ MISMATCH DETECTED: Stock progress is', stock.progress, 'but no regular hookahs in history!')
        console.log('⚠️ This means stock.progress is out of sync with hookah_history table')
        
        // В этом случае просто сбрасываем progress до 0
        await db.updateStockProgress(stock.id, 0)
        console.log('✅ Reset stock progress to 0 to match history')
        
        return NextResponse.json({
          success: false,
          message: 'Обнаружено несоответствие данных. Прогресс был сброшен до 0. Попробуйте снова.',
          debug: {
            stockProgress: stock.progress,
            historyCount: regularHookahs.length,
            action: 'progress_reset_to_zero'
          }
        }, { status: 400 })
      }

      // Удаляем N последних regular из истории и уменьшаем прогресс на 20*N
      let removed = 0
      for (let i = 0; i < removeCount; i++) {
        const ok = await db.removeHookahFromHistory(user.id, 'regular')
        if (ok) {
          removed++
          console.log(`✅ Removed hookah ${i + 1}/${removeCount}`)
        } else {
          console.log(`⚠️ No more hookahs to remove after ${removed}`)
          break
        }
      }

      if (removed === 0) {
        return NextResponse.json(
          { success: false, message: 'У пользователя нет платных кальянов для удаления' },
          { status: 400 }
        )
      }

      // Обновляем прогресс независимо от текущего значения
      const delta = removed * 20
      newProgress = Math.max(0, stock.progress - delta)
      await db.updateStockProgress(stock.id, newProgress)
      console.log(`📉 Updated progress: ${stock.progress} -> ${newProgress} (removed ${removed} hookahs)`)
    } else {
      // Удаляем N последних бесплатных кальянов
      let removed = 0
      for (let i = 0; i < removeCount; i++) {
        const ok = await db.removeHookahFromHistory(user.id, 'free')
        if (ok) {
          removed++
          console.log(`✅ Removed free hookah ${i + 1}/${removeCount}`)
        } else {
          console.log(`⚠️ No more free hookahs to remove after ${removed}`)
          break
        }
      }

      if (removed === 0) {
        return NextResponse.json(
          { success: false, message: 'У пользователя нет бесплатных кальянов для удаления' },
          { status: 400 }
        )
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