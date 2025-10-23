import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * DEBUG ENDPOINT: Test direct SQL deletion
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, hookah_type } = await request.json()

    if (!user_id || !hookah_type) {
      return NextResponse.json({
        success: false,
        message: 'Необходимо указать user_id и hookah_type'
      }, { status: 400 })
    }

    const logs: string[] = []

    // Step 1: Find last record
    logs.push(`Finding last ${hookah_type} hookah for user_id=${user_id}`)
    
    const lastRecord = await prisma.$queryRaw<Array<{id: number, created_at: Date, hookah_type: string}>>`
      SELECT id, created_at, hookah_type
      FROM hookah_history
      WHERE user_id = ${user_id}
        AND hookah_type = ${hookah_type}
      ORDER BY created_at DESC
      LIMIT 1
    `

    logs.push(`Query result: ${JSON.stringify(lastRecord)}`)

    if (!lastRecord || lastRecord.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No matching record found',
        logs
      })
    }

    const recordId = lastRecord[0].id
    logs.push(`Found record ID: ${recordId}`)

    // Step 2: Delete reviews first
    logs.push(`Deleting reviews for hookah_id=${recordId}`)
    
    const deleteReviewsResult = await prisma.$executeRaw`
      DELETE FROM hookah_reviews
      WHERE hookah_id = ${recordId}
    `
    
    logs.push(`Deleted reviews: ${deleteReviewsResult} rows`)

    // Step 3: Delete hookah record
    logs.push(`Deleting hookah record id=${recordId}`)
    
    const deleteHookahResult = await prisma.$executeRaw`
      DELETE FROM hookah_history
      WHERE id = ${recordId}
    `
    
    logs.push(`Deleted hookah: ${deleteHookahResult} rows`)

    return NextResponse.json({
      success: deleteHookahResult > 0,
      message: deleteHookahResult > 0 ? 'Record deleted successfully' : 'No rows affected',
      deletedId: recordId,
      affectedRows: deleteHookahResult,
      logs
    })

  } catch (error) {
    console.error('Error in test-direct-delete:', error)
    return NextResponse.json({
      success: false,
      message: 'Error',
      error: String(error)
    }, { status: 500 })
  }
}

