import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { tgId, hookahId } = await req.json()
    
    console.log('🧪 Testing review logic:', { tgId, hookahId })
    
    // Находим пользователя по tg_id
    const user = await db.getUserByTgId(tgId)
    console.log('👤 Found user:', user ? { id: user.id, tg_id: user.tg_id, name: `${user.first_name} ${user.last_name}` } : null)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }
    
    // Проверяем, существует ли запись истории кальяна
    const hookahHistory = await db.getHookahHistoryById(hookahId)
    console.log('📝 Found history record:', hookahHistory ? { id: hookahHistory.id, user_id: hookahHistory.user_id, hookah_type: hookahHistory.hookah_type } : null)
    
    if (!hookahHistory) {
      return NextResponse.json({ 
        success: false, 
        message: 'Hookah history record not found' 
      }, { status: 404 })
    }
    
    // Проверяем авторизацию
    const isAuthorized = hookahHistory.user_id === user.id
    console.log('🔐 Authorization check:', { 
      historyUserId: hookahHistory.user_id, 
      requestUserId: user.id,
      isAuthorized
    })
    
    return NextResponse.json({
      success: true,
      message: 'Review logic test completed',
      data: {
        user: {
          id: user.id,
          tg_id: user.tg_id,
          name: `${user.first_name} ${user.last_name}`
        },
        history: {
          id: hookahHistory.id,
          user_id: hookahHistory.user_id,
          hookah_type: hookahHistory.hookah_type
        },
        authorization: {
          historyUserId: hookahHistory.user_id,
          requestUserId: user.id,
          isAuthorized
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Review test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Review test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
