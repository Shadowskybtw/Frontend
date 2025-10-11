import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import QRCode from 'qrcode'

export async function GET(request: NextRequest, { params }: { params: Promise<{ tgId: string }> }) {
  try {
    const resolvedParams = await params
    const tgId = parseInt(resolvedParams.tgId)

    if (!tgId || isNaN(tgId)) {
      return NextResponse.json(
        { success: false, message: 'Неверный Telegram ID' },
        { status: 400 }
      )
    }

    // Получаем пользователя по tg_id
    const user = await db.getUserByTgId(tgId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Создаем QR код данные для пользователя
    const qrData = {
      type: 'user_hookah',
      userId: user.id,
      tgId: user.tg_id,
      phone: user.phone,
      timestamp: Date.now()
    }

    // Конвертируем в строку для QR кода
    const qrString = JSON.stringify(qrData)

    // Генерируем QR код как Data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      success: true,
      qrData: qrString,
      qrCodeImage: qrCodeDataURL,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone
      }
    })

  } catch (error) {
    console.error('Error generating user QR code:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
