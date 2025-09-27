import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    console.log('Recreate History Table API called')
    
    // Удаляем таблицу hookah_history если она существует
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS hookah_history;`)
      console.log('✅ Dropped existing hookah_history table')
    } catch (error) {
      console.log('ℹ️ Table might not exist:', error)
    }
    
    // Создаем новую таблицу hookah_history с правильной структурой
    await prisma.$executeRawUnsafe(`
      CREATE TABLE hookah_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        hookah_type VARCHAR(20) NOT NULL,
        slot_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)
    console.log('✅ Created new hookah_history table')
    
    // Создаем индекс для быстрого поиска по user_id
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_hookah_history_user_id ON hookah_history(user_id);
    `)
    console.log('✅ Created index on user_id')
    
    // Создаем индекс для быстрого поиска по created_at
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_hookah_history_created_at ON hookah_history(created_at);
    `)
    console.log('✅ Created index on created_at')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hookah history table recreated successfully',
      steps: [
        'Dropped existing table',
        'Created new table with correct structure',
        'Added indexes for performance'
      ]
    })
    
  } catch (error) {
    console.error('Recreate History Table API error:', error)
    return NextResponse.json(
      { success: false, message: 'Error recreating table', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
