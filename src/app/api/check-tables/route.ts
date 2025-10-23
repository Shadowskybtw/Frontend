import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * DEBUG ENDPOINT: Check which tables exist in database
 */
export async function GET(request: NextRequest) {
  try {
    const tables = await prisma.$queryRaw<Array<{tablename: string}>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    return NextResponse.json({
      success: true,
      tables: tables.map(t => t.tablename),
      count: tables.length
    })

  } catch (error) {
    console.error('Error in check-tables:', error)
    return NextResponse.json({
      success: false,
      message: 'Error',
      error: String(error)
    }, { status: 500 })
  }
}

