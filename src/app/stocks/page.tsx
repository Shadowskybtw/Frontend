"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

export default function StocksPage() {
  const { user, isInTelegram, loading, isInitialized } = useUser()
  const [stocks, setStocks] = useState<{
    id: number
    user_id: number
    stock_name: string
    progress: number
    promotion_completed: boolean
    created_at: string
    updated_at: string
  }[]>([])
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [freeHookahs, setFreeHookahs] = useState<{
    id: number
    user_id: number
    used: boolean
    used_at?: string
    created_at: string
  }[]>([])
  const [isUsingHookah, setIsUsingHookah] = useState(false)

  useEffect(() => {
    if (isInitialized && user?.tg_id) {
      console.log('📊 Loading stocks data for user:', user.tg_id)
      loadStocks(Number(user.tg_id))
      loadQrCode(Number(user.tg_id))
      loadFreeHookahs(Number(user.tg_id))
    }
  }, [isInitialized, user])

  // Загружаем акции пользователя
  const loadStocks = async (tgId: number) => {
    try {
      console.log('Loading stocks for tgId:', tgId)
      const response = await fetch(`/api/stocks?tg_id=${tgId}`)
      const data = await response.json()
      console.log('Stocks response:', data)
      if (data.success) {
        setStocks(data.stocks)
        console.log('Stocks loaded:', data.stocks)
      } else {
        console.error('Failed to load stocks:', data.message)
      }
    } catch (error) {
      console.error('Error loading stocks:', error)
    }
  }

  // Загружаем QR код
  const loadQrCode = async (tgId: number) => {
    try {
      const response = await fetch(`/api/qr-code?tg_id=${tgId}`)
      
      if (response.ok) {
        // API возвращает изображение, создаем blob URL
        const blob = await response.blob()
        const qrUrl = URL.createObjectURL(blob)
        setQrCode(qrUrl)
      } else {
        console.error('QR code API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
    }
  }


  // Загружаем бесплатные кальяны
  const loadFreeHookahs = async (tgId: number) => {
    try {
      const response = await fetch(`/api/free-hookahs/${tgId}`)
      const data = await response.json()
      if (data.success) {
        setFreeHookahs(data.hookahs)
      }
    } catch (error) {
      console.error('Error loading free hookahs:', error)
    }
  }

  // Используем бесплатный кальян
  const useFreeHookah = async () => {
    if (!user?.id || isUsingHookah) return
    
    setIsUsingHookah(true)
    try {
      const response = await fetch(`/api/free-hookahs/${Number(user.tg_id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (data.success) {
        alert('🎉 Бесплатный кальян успешно получен!')
        await loadFreeHookahs(Number(user.tg_id)) // Перезагружаем бесплатные кальяны
        await loadStocks(Number(user.tg_id)) // Перезагружаем акции
      } else {
        alert('❌ Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error using free hookah:', error)
      alert('❌ Произошла ошибка при получении бесплатного кальяна')
    } finally {
      setIsUsingHookah(false)
    }
  }

  // Запрашиваем бесплатный кальян (отправляем запрос администраторам)
  const requestFreeHookah = async () => {
    if (!user?.tg_id || isUsingHookah) return
    
    setIsUsingHookah(true)
    try {
      const response = await fetch('/api/request-free-hookah', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: Number(user.tg_id)
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('⏳ Запрос на бесплатный кальян отправлен администраторам. Ожидайте подтверждения.')
        await loadStocks(Number(user.tg_id)) // Перезагружаем акции
      } else {
        alert('❌ Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error requesting free hookah:', error)
      alert('❌ Произошла ошибка при отправке запроса')
    } finally {
      setIsUsingHookah(false)
    }
  }

  // Создаем акцию "5+1 кальян" автоматически при первом заходе
  const ensureStockExists = useCallback(async (tgId: number) => {
    try {
      // Сначала загружаем существующие акции
      const response = await fetch(`/api/stocks?tg_id=${tgId}`)
      const data = await response.json()
      
      if (data.success) {
        // Проверяем, есть ли уже акция "5+1 кальян"
        const existingStock = data.stocks.find((stock: { stock_name: string }) => stock.stock_name === '5+1 кальян')
        
        if (!existingStock) {
          // Создаем акцию только если её нет
          const createResponse = await fetch('/api/stocks', {
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

          const createData = await createResponse.json()
          if (createData.success) {
            await loadStocks(tgId) // Перезагружаем акции
          }
        } else {
          // Просто загружаем акции
          await loadStocks(tgId)
        }
      }
    } catch (error) {
      console.error('Error ensuring stock exists:', error)
    }
  }, [])

  // Загружаем данные когда получаем пользователя
  useEffect(() => {
    if (user?.id && isInTelegram) {
      ensureStockExists(user.id) // Создаем акцию если её нет
      loadStocks(Number(user.tg_id))
      loadQrCode(Number(user.tg_id))
      loadFreeHookahs(Number(user.tg_id)) // Загружаем бесплатные кальяны
    }
  }, [user, isInTelegram, ensureStockExists])

  // Добавляем периодическое обновление данных для отслеживания изменений
  useEffect(() => {
    if (!user?.id || !isInTelegram) return

    const interval = setInterval(() => {
      loadStocks(Number(user.tg_id))
      loadFreeHookahs(Number(user.tg_id))
    }, 2000) // Обновляем каждые 2 секунды

    return () => clearInterval(interval)
  }, [user, isInTelegram])

  // Добавляем обработчик для обновления данных при возвращении на страницу
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && isInTelegram) {
        loadStocks(Number(user.tg_id))
        loadFreeHookahs(Number(user.tg_id))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, isInTelegram])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center">
            <div className="text-center mb-2">
              <h1 className="text-3xl font-bold text-white">
                🎁 Мои акции
              </h1>
            </div>
            <p className="text-gray-300 mb-8">
              Отслеживайте прогресс ваших акций
            </p>

          {loading || !isInitialized ? (
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-yellow-300 text-sm">
                ⏳ Загрузка пользователя...
              </p>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
                <p className="text-green-300 text-sm">
                  👋 Привет, {user.first_name}!
                </p>
              </div>
              
              {/* Акция 5+1 кальян - визуальные слоты */}
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="font-semibold text-red-300 mb-3">🔥 Акция &quot;5+1 кальян&quot;</h3>
                <p className="text-red-200 text-sm mb-4">
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
                          <div className={`text-xs font-medium ${isActive ? 'text-green-300' : 'text-gray-400'}`}>
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
                
                <p className="text-red-300 text-xs mt-2 text-center">
                  Покажите QR код администратору для активации слотов
                </p>
                
                {/* Кнопка получения бесплатного кальяна */}
                {(() => {
                  const stock = stocks.find(s => s.stock_name === '5+1 кальян')
                  const hasUnusedFreeHookah = freeHookahs.some(h => !h.used)
                  
                  if (stock?.promotion_completed && !hasUnusedFreeHookah) {
                    return (
                      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                        <p className="text-yellow-200 text-sm mb-3 text-center">
                          🎉 Все слоты заполнены! Бесплатный кальян доступен!
                        </p>
                        <button
                          onClick={requestFreeHookah}
                          disabled={isUsingHookah}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                          {isUsingHookah ? '⏳ Отправляем запрос...' : '🎁 Запросить бесплатный кальян'}
                        </button>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              
        {/* QR код */}
        {qrCode ? (
          <div className="bg-gray-700/50 border border-gray-500/50 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="font-semibold text-gray-300 mb-2">📱 Ваш QR код</h3>
            <div className="flex justify-center">
              <Image
                src={qrCode} 
                alt="QR Code" 
                width={256}
                height={256}
                className="border border-gray-300 rounded-lg"
                onError={(e) => {
                  console.error('QR Code image failed to load:', e)
                  console.log('QR Code URL:', qrCode)
                }}
                onLoad={() => {
                  console.log('QR Code image loaded successfully:', qrCode)
                }}
              />
            </div>
            <p className="text-gray-300 text-xs mt-2 text-center">
              Покажите этот код для получения скидок
            </p>
          </div>
        ) : (
          <div className="bg-gray-700/50 border border-gray-500/50 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="font-semibold text-gray-300 mb-2">📱 Ваш QR код</h3>
            <div className="flex justify-center items-center h-32 bg-gray-200 rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">❓</div>
                <p className="text-gray-500 text-sm">QR код загружается...</p>
              </div>
            </div>
            <p className="text-gray-300 text-xs mt-2 text-center">
              Покажите этот код для получения скидок
            </p>
          </div>
        )}
              
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="font-semibold text-yellow-300 mb-2">🎁 Бесплатные кальяны</h3>
                <p className="text-yellow-200 text-sm mb-3">
                  Доступно бесплатных кальянов: {freeHookahs.filter(h => !h.used).length}
                </p>
                {freeHookahs.filter(h => !h.used).length > 0 ? (
                  <button
                    onClick={useFreeHookah}
                    disabled={isUsingHookah}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  >
                    {isUsingHookah ? '⏳ Получаем...' : '🎉 Получить бесплатный кальян'}
                  </button>
                ) : (
                  <p className="text-yellow-300 text-xs text-center">
                    Нет доступных бесплатных кальянов
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-red-300 text-sm">
                ❌ Загрузка данных пользователя...
              </p>
            </div>
          )}

        </div>
        </div>
      </main>
    </div>
  )
}
