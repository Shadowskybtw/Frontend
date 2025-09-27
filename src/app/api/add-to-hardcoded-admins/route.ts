import { NextRequest, NextResponse } from 'next/server'

// Hardcoded список админов (можно расширять)
let HARDCODED_ADMINS = [
  937011437, // Основной админ
  1159515006, // Кирилл
]

export async function POST(request: NextRequest) {
  try {
    const { admin_key, tg_id } = await request.json()
    
    // Проверяем админский ключ
    const expectedAdminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    
    if (admin_key !== expectedAdminKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    const targetTgId = parseInt(tg_id)
    if (isNaN(targetTgId)) {
      return NextResponse.json({ success: false, message: 'Invalid TG ID format' }, { status: 400 })
    }

    console.log(`Adding to hardcoded admins: ${targetTgId}`)

    // Добавляем в hardcoded список
    if (!HARDCODED_ADMINS.includes(targetTgId)) {
      HARDCODED_ADMINS.push(targetTgId)
      console.log(`✅ Added ${targetTgId} to hardcoded admin list. New list:`, HARDCODED_ADMINS)
    } else {
      console.log(`ℹ️ User ${targetTgId} is already in hardcoded admin list`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Admin ${targetTgId} added to hardcoded list`,
      hardcoded_admins: HARDCODED_ADMINS,
      note: 'Admin rights are now active immediately'
    })

  } catch (error) {
    console.error('Error adding to hardcoded admins:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    hardcoded_admins: HARDCODED_ADMINS,
    total: HARDCODED_ADMINS.length
  })
}
