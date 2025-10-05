"use client"
import React, { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'

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

interface PurchaseHistory {
  id: number
  created_at: string
  is_free: boolean
  rating?: number
  rating_comment?: string
}

export default function HistoryPage() {
  const [user, setUser] = useState<TgUser | null>(null)
  const [history, setHistory] = useState<PurchaseHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkTelegramWebApp = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          (window as any).Telegram.WebApp.ready()
          ;(window as any).Telegram.WebApp.expand()
          
          const tgUser = (window as any).Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
          if (tgUser) {
            setUser(tgUser)
            fetchHistory(tgUser.id)
          } else {
            setError('Пользователь не найден')
            setLoading(false)
          }
        } else {
          setError('Приложение должно быть открыто в Telegram')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error checking Telegram WebApp:', error)
        setError('Ошибка инициализации')
        setLoading(false)
      }
    }

    checkTelegramWebApp()
  }, [])

  const fetchHistory = async (tgId: number) => {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tg_id: tgId }),
      })

      const data = await response.json()

      if (data.success) {
        setHistory(data.history || [])
      } else {
        setError(data.message || 'Ошибка загрузки истории')
      }
    } catch (error) {
      console.error('Error fetching history:', error)
      setError('Ошибка загрузки истории')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Загрузка истории...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Ошибка</h2>
            <p className="text-gray-300">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />
      
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <span className="text-3xl mr-3">📊</span>
                История покупок
              </h1>
              {user && (
                <div className="text-gray-300">
                  Привет, {user.first_name || user.last_name || 'пользователь'}!
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">История пуста</h3>
                <p className="text-gray-400">У вас пока нет покупок</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      item.is_free 
                        ? 'bg-green-900/30 border-green-500/50' 
                        : 'bg-gray-700/50 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {item.is_free ? '🎁' : '🛒'}
                        </span>
                        <div>
                          <h3 className="font-semibold text-white">
                            {item.is_free ? 'Бесплатный кальян' : 'Обычная покупка'}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {item.rating && (
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-white font-semibold">{item.rating}</span>
                          </div>
                        )}
                        {item.rating_comment && (
                          <p className="text-gray-400 text-sm mt-1 max-w-xs">
                            &ldquo;{item.rating_comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-600">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {history.filter(item => !item.is_free).length}
                  </div>
                  <div className="text-gray-400 text-sm">Обычных покупок</div>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {history.filter(item => item.is_free).length}
                  </div>
                  <div className="text-gray-400 text-sm">Бесплатных кальянов</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
