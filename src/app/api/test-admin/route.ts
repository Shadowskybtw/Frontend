import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Test admin API is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: 'Test admin API POST is working',
    timestamp: new Date().toISOString()
  })
}