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

      // КРИТИЧНО: Если progress не соответствует истории - исправляем НЕМЕДЛЕННО
      const correctProgress = Math.min(100, regularHookahs.length * 20)
      
      if (stock.progress !== correctProgress) {
        console.log('⚠️ CRITICAL MISMATCH DETECTED!')
        console.log(`   Stock progress: ${stock.progress}%`)
        console.log(`   History count: ${regularHookahs.length} hookahs`)
        console.log(`   Expected progress: ${correctProgress}%`)
        console.log('🔧 Auto-fixing...')
        
        // Автоматически исправляем progress
        await db.updateStockProgress(stock.id, correctProgress)
        console.log(`✅ Fixed! Progress updated from ${stock.progress}% to ${correctProgress}%`)
        
        // Если после исправления нет кальянов для удаления
        if (regularHookahs.length === 0) {
          return NextResponse.json({
            success: false,
            message: `Обнаружено критическое несоответствие! Прогресс был ${stock.progress}%, но в истории 0 кальянов. Данные исправлены. Теперь прогресс: ${correctProgress}%`,
            debug: {
              oldProgress: stock.progress,
              newProgress: correctProgress,
              historyCount: regularHookahs.length,
              action: 'critical_mismatch_fixed'
            }
          }, { status: 400 })
        }
        
        // Обновляем stock объект для дальнейшей работы
        stock.progress = correctProgress
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
        // Детальная информация о том, почему не удалось удалить
        const detailedMessage = regularHookahs.length === 0
          ? `В истории нет записей типа 'regular'. Прогресс был автоматически сброшен до 0%. Проверьте через /api/diagnose-user?phone=6642 для детальной информации.`
          : `Не удалось найти записи для удаления в базе данных, хотя в истории ${regularHookahs.length} записей. Возможна проблема с базой данных.`
        
        return NextResponse.json({
          success: false,
          message: detailedMessage,
          debug: {
            totalHistory: currentHistory.length,
            regularCount: regularHookahs.length,
            freeCount: freeHookahs.length,
            stockProgress: stock.progress,
            diagnoseUrl: `/api/diagnose-user?phone=XXXX`
          }
        }, { status: 400 })
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