import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tg_id = searchParams.get('tg_id')
    
    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await db.getUserByTgId(parseInt(tg_id))
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Генерируем QR код с данными пользователя
    const qrData = {
      user_id: user.id,
      tg_id: user.tg_id,
      name: user.first_name,
      phone: user.phone,
      timestamp: new Date().toISOString()
    }

    // Создаем URL для QR кода (используем более надежный сервис)
    const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(JSON.stringify(qrData))}`

    return NextResponse.json({ 
      success: true, 
      qr_url: qrUrl,
      qr_data: qrData
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
