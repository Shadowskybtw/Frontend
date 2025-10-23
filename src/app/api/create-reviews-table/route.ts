import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Create hookah_reviews table if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    const { admin_tg_id } = await request.json()

    if (Number(admin_tg_id) !== 937011437) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 403 })
    }

    // Create hookah_reviews table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS hookah_reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        hookah_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, hookah_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hookah_id) REFERENCES hookah_history(id) ON DELETE CASCADE
      )
    `

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS hookah_reviews_user_id_idx ON hookah_reviews(user_id)
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS hookah_reviews_hookah_id_idx ON hookah_reviews(hookah_id)
    `

    return NextResponse.json({
      success: true,
      message: 'hookah_reviews table created successfully'
    })

  } catch (error) {
    console.error('Error creating hookah_reviews table:', error)
    return NextResponse.json({
      success: false,
      message: 'Error',
      error: String(error)
    }, { status: 500 })
  }
}

