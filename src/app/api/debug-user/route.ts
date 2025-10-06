import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id } = await request.json()
    
    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    console.log('🔍 Debug: Looking up user with tg_id:', tg_id)
    
    // Get user from database
    const user = await db.getUserByTgId(tg_id)
    console.log('🔍 Debug: Raw user from database:', user)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    // Return detailed user information
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      phoneDetails: {
        phone: user.phone,
        phoneType: typeof user.phone,
        phoneLength: user.phone ? user.phone.length : 0,
        isPhoneEmpty: !user.phone || user.phone.trim() === '',
        isPhoneNull: user.phone === null,
        isPhoneUndefined: user.phone === undefined
      }
    })

  } catch (error) {
    console.error('Error in debug-user API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
