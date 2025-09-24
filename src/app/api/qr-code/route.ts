import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    console.log('QR code API called')
    const { searchParams } = new URL(request.url)
    const tg_id = searchParams.get('tg_id')
    console.log('QR code request for TG ID:', tg_id)
    
    if (!tg_id) {
      console.log('No TG ID provided for QR code')
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    // Получаем пользователя
    console.log('Looking up user for QR code with TG ID:', tg_id)
    const user = await db.getUserByTgId(parseInt(tg_id))
    console.log('QR code user lookup result:', { tg_id, user })
    
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
        tg_id: Number(tempUser.tg_id),
        name: tempUser.first_name,
        phone: tempUser.phone,
        timestamp: new Date().toISOString()
      }

      // Генерируем QR код как PNG изображение для временного пользователя
      console.log('Generating QR code for temp user data:', qrData)
      const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
        type: 'png',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      console.log('QR code generated for temp user, buffer size:', qrCodeBuffer.length)

      // Возвращаем изображение с правильным Content-Type
      return new NextResponse(qrCodeBuffer.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Генерируем QR код с данными пользователя
    const qrData = {
      user_id: user.id,
      tg_id: Number(user.tg_id),
      name: user.first_name,
      phone: user.phone,
      timestamp: new Date().toISOString()
    }

    // Генерируем QR код как PNG изображение
    console.log('Generating QR code for data:', qrData)
    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
      type: 'png',
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    console.log('QR code generated, buffer size:', qrCodeBuffer.length)

    // Возвращаем изображение с правильным Content-Type
    return new NextResponse(qrCodeBuffer.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
