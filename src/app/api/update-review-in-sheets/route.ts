import { NextRequest, NextResponse } from 'next/server'
import { findRowByValue, updateRowInSheet, SHEETS } from '@/lib/googleSheets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/update-review-in-sheets
 * Обновление оценки кальяна в Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const { hookah_id, hookah_type, rating, comment } = await request.json()

    if (!hookah_id || !hookah_type) {
      return NextResponse.json({
        success: false,
        message: 'hookah_id и hookah_type обязательны'
      }, { status: 400 })
    }

    // Определяем название листа
    const sheetName = hookah_type === 'free' ? SHEETS.FREE_HOOKAHS : SHEETS.REGULAR_HOOKAHS

    // Ищем строку с этим ID кальяна (ID в колонке A)
    const rowNumber = await findRowByValue(sheetName, 'A', hookah_id)

    if (!rowNumber) {
      console.log(`⚠️ Hookah ${hookah_id} not found in ${sheetName}, skipping update`)
      return NextResponse.json({
        success: false,
        message: 'Кальян не найден в таблице'
      }, { status: 404 })
    }

    // Получаем текущие данные строки, чтобы не перезаписать другие поля
    const { getAllDataFromSheet } = await import('@/lib/googleSheets')
    const allData = await getAllDataFromSheet(sheetName)
    const currentRow = allData[rowNumber - 1] // -1 потому что массив 0-based

    if (!currentRow) {
      return NextResponse.json({
        success: false,
        message: 'Не удалось получить данные строки'
      }, { status: 500 })
    }

    // Обновляем только колонки G (оценка) и H (комментарий)
    // Сохраняем все остальные данные как есть
    const updatedRow = [...currentRow]
    updatedRow[6] = rating || '' // Колонка G (индекс 6)
    updatedRow[7] = comment || '' // Колонка H (индекс 7)

    await updateRowInSheet(sheetName, rowNumber, updatedRow)

    console.log(`✅ Updated review in ${sheetName} for hookah ${hookah_id}, row ${rowNumber}`)

    return NextResponse.json({
      success: true,
      message: '✅ Оценка обновлена в Google Sheets',
      rowNumber
    })

  } catch (error) {
    console.error('❌ Error updating review in Google Sheets:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка при обновлении оценки',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

