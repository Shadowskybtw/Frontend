import { google } from 'googleapis'

// Инициализация Google Sheets API
export function getGoogleSheetsClient() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}')
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    return sheets
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error)
    throw error
  }
}

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || ''

// Названия листов
export const SHEETS = {
  USERS: 'Пользователи',
  ADMINS: 'Админы',
  REGULAR_HOOKAHS: 'Платные кальяны',
  FREE_HOOKAHS: 'Бесплатные кальяны'
}

// Функция для добавления строки в таблицу
export async function appendRowToSheet(sheetName: string, values: any[]) {
  const sheets = getGoogleSheetsClient()
  
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    })
    
    return response.data
  } catch (error) {
    console.error(`Error appending to sheet ${sheetName}:`, error)
    throw error
  }
}

// Функция для обновления строки в таблице
export async function updateRowInSheet(sheetName: string, rowNumber: number, values: any[]) {
  const sheets = getGoogleSheetsClient()
  
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}:Z${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    })
    
    return response.data
  } catch (error) {
    console.error(`Error updating sheet ${sheetName}:`, error)
    throw error
  }
}

// Функция для поиска строки по ID
export async function findRowByValue(sheetName: string, columnLetter: string, searchValue: any) {
  const sheets = getGoogleSheetsClient()
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${columnLetter}:${columnLetter}`
    })
    
    const values = response.data.values || []
    const rowIndex = values.findIndex(row => row[0] === String(searchValue))
    
    return rowIndex >= 0 ? rowIndex + 1 : null // +1 потому что Google Sheets использует 1-based индексацию
  } catch (error) {
    console.error(`Error finding row in sheet ${sheetName}:`, error)
    return null
  }
}

// Функция для получения всех данных из листа
export async function getAllDataFromSheet(sheetName: string) {
  const sheets = getGoogleSheetsClient()
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`
    })
    
    return response.data.values || []
  } catch (error) {
    console.error(`Error getting data from sheet ${sheetName}:`, error)
    throw error
  }
}

// Функция для очистки листа (кроме заголовков)
export async function clearSheetData(sheetName: string) {
  const sheets = getGoogleSheetsClient()
  
  try {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:Z`
    })
    
    return response.data
  } catch (error) {
    console.error(`Error clearing sheet ${sheetName}:`, error)
    throw error
  }
}

// Функция для batch обновления (массовая загрузка данных)
export async function batchUpdateSheet(sheetName: string, values: any[][]) {
  const sheets = getGoogleSheetsClient()
  
  try {
    // Сначала очищаем данные (кроме заголовков)
    await clearSheetData(sheetName)
    
    // Затем добавляем новые данные
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    })
    
    return response.data
  } catch (error) {
    console.error(`Error batch updating sheet ${sheetName}:`, error)
    throw error
  }
}

