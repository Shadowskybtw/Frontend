import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Health check API called')
    
    const isConnected = db.isConnected()
    console.log('🔍 Database connected:', isConnected)
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Database not connected',
        connected: false
      }, { status: 500 })
    }

    // Попробуем выполнить простой запрос
    const userCount = await db.getAllUsersCount()
    console.log('🔍 User count:', userCount)

    return NextResponse.json({
      success: true,
      message: 'Database is healthy',
      connected: true,
      userCount: userCount
    })

  } catch (error) {
    console.error('❌ Health check error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
