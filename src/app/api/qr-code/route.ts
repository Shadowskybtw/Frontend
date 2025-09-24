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
    console.log('QR code user lookup:', { tg_id, user })
    
    if (!user) {
      // Если пользователь не найден, создаем временные данные для QR
      const tempUser = {
        id: parseInt(tg_id),
        tg_id: parseInt(tg_id),
        first_name: 'Пользователь',
        last_name: '',
        username: '',
        phone: ''
      }
      console.log('Using temp user data for QR:', tempUser)
      
      const qrData = {
        user_id: tempUser.id,
        tg_id: tempUser.tg_id,
        name: tempUser.first_name,
        phone: tempUser.phone,
        timestamp: new Date().toISOString()
      }

      const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(JSON.stringify(qrData))}`
      
      return NextResponse.json({ 
        success: true, 
        qr_url: qrUrl,
        qr_data: qrData
      })
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
