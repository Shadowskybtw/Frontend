"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

interface PurchaseHistory {
  id: number
  created_at: string
  is_free: boolean
  rating?: number
  rating_comment?: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<PurchaseHistory[]>([])
  const [, setHistoryLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { user, loading, error, isInitialized } = useUser()

  const fetchHistory = useCallback(async (tgId: number, page: number = 1) => {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tg_id: tgId, page }),
      })

      const data = await response.json()

      if (data.success) {
        setHistory(data.history || [])
        setTotalPages(data.totalPages || 1)
      } else {
        console.error('Failed to fetch history:', data.message)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInitialized && user?.tg_id) {
      console.log('📊 Loading history for user:', user.tg_id, 'page:', currentPage)
      fetchHistory(user.tg_id, currentPage)
    }
  }, [isInitialized, user, currentPage, fetchHistory])

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Загрузка пользователя...</p>
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
                            {new Date(item.created_at).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  ← Назад
                </button>
                
                <span className="px-4 py-2 text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Вперед →
                </button>
              </div>
            )}

            {/* Статистика */}
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
