import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    console.log('Setup Admin Simple API called')
    
    const results: string[] = []

    // 1. Добавляем столбец is_admin, если его нет
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_admin';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        results.push('✅ Column is_admin already exists in users table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE users
          ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        results.push('✅ Column is_admin added to users table successfully.')
      }
    } catch (error) {
      results.push(`❌ Error adding is_admin field: ${error}`)
      console.error('Error adding is_admin field:', error)
    }

    // 2. Выдаем админские права для предопределенных TG ID
    const adminTgIdsToGrant = [937011437, 1159515006] // Ваш ID и Кирилл
    results.push(`Attempting to grant admin rights to: ${adminTgIdsToGrant.join(', ')}`)

    for (const tgId of adminTgIdsToGrant) {
      try {
        const user = await prisma.user.findUnique({
          where: { tg_id: BigInt(tgId) }
        })

        if (user) {
          // Обновляем is_admin = true
          await prisma.$executeRawUnsafe(`
            UPDATE users 
            SET is_admin = true 
            WHERE id = ${user.id}
          `)
          results.push(`✅ Set is_admin=true for user ${user.first_name} ${user.last_name} (TG ID: ${tgId})`)
        } else {
          results.push(`ℹ️ User with TG ID ${tgId} not found in database`)
        }
      } catch (error) {
        results.push(`❌ Error processing admin ${tgId}: ${error instanceof Error ? error.message : String(error)}`)
        console.error(`Error processing admin ${tgId}:`, error)
      }
    }

    return NextResponse.json({ success: true, message: 'Admin setup complete', results })

  } catch (error) {
    console.error('Error in setup-admin-simple API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
