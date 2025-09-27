import { NextRequest, NextResponse } from 'next/server'

// Hardcoded список админов (можно расширять)
const HARDCODED_ADMINS = [
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

    // Проверяем, есть ли уже в списке
    if (HARDCODED_ADMINS.includes(targetTgId)) {
      console.log(`ℹ️ User ${targetTgId} is already in hardcoded admin list`)
      return NextResponse.json({ 
        success: true, 
        message: `Admin ${targetTgId} is already in hardcoded list`,
        hardcoded_admins: HARDCODED_ADMINS,
        note: 'Admin rights are already active'
      })
    }

    // Для демонстрации показываем, что добавили бы
    const newAdminList = [...HARDCODED_ADMINS, targetTgId]
    console.log(`✅ Would add ${targetTgId} to hardcoded admin list. New list would be:`, newAdminList)

    return NextResponse.json({ 
      success: true, 
      message: `Admin ${targetTgId} would be added to hardcoded list`,
      current_admins: HARDCODED_ADMINS,
      new_admin_list: newAdminList,
      note: 'Note: This is a demonstration. In production, you would need to update the hardcoded list in the code.'
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
