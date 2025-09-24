"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type TgUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

type TelegramWebApp = {
  initData: string
  initDataUnsafe?: { user?: TgUser }
}

type TelegramWindow = {
  Telegram?: { WebApp?: TelegramWebApp }
}

declare const window: TelegramWindow & Window

export default function StocksPage() {
  const [user, setUser] = useState<TgUser | null>(null)
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [stocks, setStocks] = useState<{
    id: number
    user_id: number
    stock_name: string
    progress: number
    created_at: string
    updated_at: string
  }[]>([])
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load Telegram WebApp script
    const loadTelegramScript = () => {
      if (typeof window !== 'undefined' && !window.Telegram) {
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-web-app.js'
        script.async = true
        script.onload = () => {
          console.log('Telegram WebApp script loaded on stocks page')
          checkTelegramWebApp()
        }
        document.head.appendChild(script)
      } else {
        checkTelegramWebApp()
      }
    }

    const checkTelegramWebApp = () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          setIsInTelegram(true)
          const tgUser = window.Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
          if (tgUser) {
            setUser(tgUser)
          }
        }
      } catch (error) {
        console.error('Error checking Telegram WebApp on stocks page:', error)
      }
    }

    setTimeout(loadTelegramScript, 100)
  }, [])

  // Загружаем акции пользователя
  const loadStocks = async (tgId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/stocks?tg_id=${tgId}`)
      const data = await response.json()
      if (data.success) {
        setStocks(data.stocks)
      }
    } catch (error) {
      console.error('Error loading stocks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Загружаем QR код
  const loadQrCode = async (tgId: number) => {
    try {
      const response = await fetch(`/api/qr-code?tg_id=${tgId}`)
      const data = await response.json()
      if (data.success) {
        setQrCode(data.qr_url)
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
    }
  }

  // Создаем акцию "5+1 кальян"
  const createStock = async (stockName: string) => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: user.id,
          stock_name: stockName,
          progress: 0
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadStocks(user.id) // Перезагружаем акции
        alert('Акция создана успешно!')
      } else {
        alert('Ошибка создания акции: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating stock:', error)
      alert('Ошибка создания акции')
    } finally {
      setIsLoading(false)
    }
  }

  // Загружаем данные когда получаем пользователя
  useEffect(() => {
    if (user?.id && isInTelegram) {
      loadStocks(user.id)
      loadQrCode(user.id)
    }
  }, [user, isInTelegram])

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📈 Мои акции
          </h1>
          <p className="text-gray-600 mb-8">
            Отслеживайте прогресс ваших акций
          </p>

          {isInTelegram && user ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm">
                  👋 Привет, {user.first_name}!
                </p>
              </div>
              
              {/* Акция 5+1 кальян */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">🔥 Акция &quot;5+1 кальян&quot;</h3>
                <p className="text-red-800 text-sm mb-3">
                  Купите 5 кальянов и получите 1 бесплатно!
                </p>
                <button
                  onClick={() => createStock('5+1 кальян')}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-4 rounded-md text-sm font-medium"
                >
                  {isLoading ? '⏳ Создание...' : '🎯 Начать акцию'}
                </button>
              </div>

              {/* Слоты с нарисовым кальяном */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">🎨 Слоты с нарисовым кальяном</h3>
                <p className="text-purple-800 text-sm mb-3">
                  Забронируйте слот для нарисового кальяна
                </p>
                <button
                  onClick={() => createStock('Нарисовый кальян')}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-md text-sm font-medium"
                >
                  {isLoading ? '⏳ Создание...' : '🎨 Забронировать слот'}
                </button>
              </div>

              {/* Ваши акции */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Ваши активные акции</h3>
                {isLoading ? (
                  <p className="text-blue-800 text-sm">⏳ Загрузка акций...</p>
                ) : stocks.length > 0 ? (
                  <div className="space-y-2">
                    {stocks.map((stock, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-900 font-medium">{stock.stock_name}</span>
                          <span className="text-blue-600 text-sm">{stock.progress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${stock.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-800 text-sm">
                    У вас пока нет активных акций. Создайте акцию выше!
                  </p>
                )}
              </div>
              
              {/* QR код */}
              {qrCode && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">📱 Ваш QR код</h3>
                  <div className="flex justify-center">
                    <Image 
                      src={qrCode} 
                      alt="QR Code" 
                      width={128}
                      height={128}
                      className="border border-gray-300 rounded-lg"
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-2 text-center">
                    Покажите этот код для получения скидок
                  </p>
                </div>
              )}
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">🎁 Бесплатные кальяны</h3>
                <p className="text-yellow-800 text-sm">
                  Количество доступных бесплатных кальянов: {stocks.filter(s => s.stock_name === '5+1 кальян' && s.progress >= 100).length}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                ❌ Откройте приложение в Telegram для просмотра акций
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
