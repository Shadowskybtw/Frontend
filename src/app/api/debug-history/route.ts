import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('Debug History API called')
    
    // Проверяем, существует ли таблица hookah_history
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'hookah_history'
      );
    `)
    
    console.log('Table exists:', tableExists)
    
    // Пытаемся получить все записи из истории
    const history = await prisma.hookahHistory.findMany({
      take: 10,
      orderBy: { created_at: 'desc' }
    })
    
    console.log('History records:', history)
    
    // Пытаемся создать тестовую запись
    try {
      const testRecord = await prisma.hookahHistory.create({
        data: {
          user_id: 1,
          hookah_type: 'regular',
          slot_number: 1
        }
      })
      console.log('Test record created:', testRecord)
      
      // Удаляем тестовую запись
      await prisma.hookahHistory.delete({
        where: { id: testRecord.id }
      })
      console.log('Test record deleted')
    } catch (createError) {
      console.error('Error creating test record:', createError)
    }
    
    return NextResponse.json({ 
      success: true, 
      tableExists,
      historyCount: history.length,
      history: history,
      message: 'Debug completed'
    })
    
  } catch (error) {
    console.error('Debug History API error:', error)
    return NextResponse.json(
      { success: false, message: 'Debug error', error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
