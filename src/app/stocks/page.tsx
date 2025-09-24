"use client"
import React, { useEffect, useState, useCallback } from 'react'
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
    try {
      const response = await fetch(`/api/stocks?tg_id=${tgId}`)
      const data = await response.json()
      if (data.success) {
        setStocks(data.stocks)
      }
    } catch (error) {
      console.error('Error loading stocks:', error)
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

  // Создаем акцию "5+1 кальян" автоматически при первом заходе
  const ensureStockExists = useCallback(async (tgId: number) => {
    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: tgId,
          stock_name: '5+1 кальян',
          progress: 0
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadStocks(tgId) // Перезагружаем акции
      }
    } catch (error) {
      console.error('Error ensuring stock exists:', error)
    }
  }, [])

  // Загружаем данные когда получаем пользователя
  useEffect(() => {
    if (user?.id && isInTelegram) {
      ensureStockExists(user.id) // Создаем акцию если её нет
      loadStocks(user.id)
      loadQrCode(user.id)
    }
  }, [user, isInTelegram, ensureStockExists])

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
              
              {/* Акция 5+1 кальян - визуальные слоты */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3">🔥 Акция &quot;5+1 кальян&quot;</h3>
                <p className="text-red-800 text-sm mb-4">
                  Купите 5 кальянов и получите 1 бесплатно!
                </p>
                
                {/* Визуальные слоты */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((slot) => {
                    const stock = stocks.find(s => s.stock_name === '5+1 кальян')
                    const isActive = stock && stock.progress >= slot * 20
                    return (
                      <div
                        key={slot}
                        className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${
                          isActive 
                            ? 'bg-green-100 border-green-400 shadow-lg' 
                            : 'bg-gray-100 border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-2xl mb-1 ${isActive ? 'animate-pulse' : 'opacity-50'}`}>
                            🚬
                          </div>
                          <div className={`text-xs font-medium ${isActive ? 'text-green-800' : 'text-gray-500'}`}>
                            {isActive ? '✓' : slot}
                          </div>
                        </div>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Прогресс бар */}
                {(() => {
                  const stock = stocks.find(s => s.stock_name === '5+1 кальян')
                  const progress = stock ? stock.progress : 0
                  return (
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )
                })()}
                
                <p className="text-red-700 text-xs mt-2 text-center">
                  Покажите QR код администратору для активации слотов
                </p>
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
