"use client"
import React, { useState } from 'react'

export default function AdminPage() {
  const [qrData, setQrData] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleScan = async () => {
    if (!qrData.trim()) {
      alert('Введите данные QR кода')
      return
    }

    setIsScanning(true)
    try {
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_data: qrData,
          admin_key: 'admin123' // В реальном приложении это должно быть более безопасно
        }),
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        alert(`QR код отсканирован! Пользователь: ${data.user.first_name} ${data.user.last_name}`)
        setQrData('') // Очищаем поле
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('Ошибка сканирования QR кода')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Админ панель
          </h1>
          <p className="text-gray-600 mb-8">
            Сканирование QR кодов пользователей
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Данные QR кода
              </label>
              <textarea
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="Вставьте данные QR кода сюда..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
            </div>

            <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {isScanning ? '⏳ Сканирование...' : '📱 Сканировать QR код'}
            </button>

            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Результат сканирования</h3>
                <div className="text-left space-y-2 text-sm">
                  <p><strong>Статус:</strong> {result.success ? '✅ Успешно' : '❌ Ошибка'}</p>
                  {result.user && (
                    <>
                      <p><strong>Пользователь:</strong> {result.user.first_name} {result.user.last_name}</p>
                      <p><strong>ID:</strong> {result.user.id}</p>
                    </>
                  )}
                  {result.stock && (
                    <>
                      <p><strong>Акция:</strong> {result.stock.stock_name}</p>
                      <p><strong>Прогресс:</strong> {result.stock.progress}%</p>
                    </>
                  )}
                  {result.completed && (
                    <p className="text-green-600 font-medium">🎉 Акция завершена! Пользователь получил бесплатный кальян!</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Инструкция</h3>
              <div className="text-yellow-800 text-sm space-y-1">
                <p>1. Пользователь показывает QR код</p>
                <p>2. Скопируйте данные QR кода</p>
                <p>3. Вставьте в поле выше</p>
                <p>4. Нажмите "Сканировать"</p>
                <p>5. Слот активируется автоматически</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
