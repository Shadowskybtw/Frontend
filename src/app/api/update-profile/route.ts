import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { tg_id, first_name, last_name } = await request.json()
    
    if (!tg_id) {
      return NextResponse.json({ success: false, message: 'TG ID is required' }, { status: 400 })
    }

    if (!first_name && !last_name) {
      return NextResponse.json({ success: false, message: 'At least one field is required' }, { status: 400 })
    }

    // Обновляем профиль пользователя
    const updatedUser = await db.updateUser(tg_id, {
      first_name: first_name || undefined,
      last_name: last_name || undefined
    })

    if (!updatedUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        username: updatedUser.username
      }
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
