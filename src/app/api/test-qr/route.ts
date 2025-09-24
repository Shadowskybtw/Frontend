import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Test QR API called')
    
    // Простой тестовый QR код
    const testData = {
      user_id: 123,
      tg_id: 937011437,
      name: 'Тест',
      phone: '+1234567890',
      timestamp: new Date().toISOString()
    }
    
    const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(JSON.stringify(testData))}`
    console.log('Test QR URL:', qrUrl)
    
    return NextResponse.json({ 
      success: true, 
      qr_url: qrUrl,
      qr_data: testData,
      message: 'Test QR code generated'
    })
    
  } catch (error) {
    console.error('Test QR error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
