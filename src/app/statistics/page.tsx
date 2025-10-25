'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

interface HookahHistory {
  id: number
  hookah_type: string
  slot_number?: number
  created_at: string
  review?: {
    rating: number
    review_text?: string
  }
}

interface Statistics {
  totalHookahs: number
  regularHookahs: number
  freeHookahs: number
  averageRating: number
  totalReviews: number
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  const { user, loading, error, isInitialized } = useUser()


  // Load statistics data
  const loadStatistics = useCallback(async () => {
    console.log('📈 loadStatistics called:', { tgId: user?.tg_id })
    if (!user?.tg_id) {
      console.log('📈 No tg_id, skipping statistics load')
      return
    }

    setIsLoading(true)
    try {
      // Load history with reviews (request large limit to avoid default 50 cap)
      const url = `/api/history/${Number(user.tg_id)}?withReviews=true&limit=1000&offset=0`
      console.log('📈 Fetching URL:', url)
      
      const historyResponse = await fetch(url, { cache: 'no-store' })
      console.log('📈 Response status:', historyResponse.status, historyResponse.statusText)
      
      if (!historyResponse.ok) {
        throw new Error('Failed to load history')
      }

      const historyData = await historyResponse.json()
      console.log('📈 History data:', historyData)
      
      let history: HookahHistory[] = historyData.history || []
      console.log('📈 History items:', history.length)
      
      // If withReviews failed and we got empty history, try without reviews
      if (history.length === 0) {
        console.log('📈 withReviews returned empty, trying without reviews...')
        const fallbackResponse = await fetch(`/api/history/${Number(user.tg_id)}?limit=1000&offset=0`, { cache: 'no-store' })
        const fallbackData = await fallbackResponse.json()
        history = fallbackData.history || []
        console.log('📈 Fallback history items:', history.length)
      }

      // Calculate statistics
      const totalHookahs = history.length
      const regularHookahs = history.filter(h => h.hookah_type === 'regular').length
      const freeHookahs = history.filter(h => h.hookah_type === 'free').length
      
      // Calculate reviews statistics
      const reviews = history.filter(h => h.review).map(h => h.review!)
      const totalReviews = reviews.length
      console.log('📈 Reviews found:', totalReviews)
      console.log('📈 Reviews data:', reviews)
      
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0
      console.log('📈 Average rating calculated:', averageRating)

      setStatistics({
        totalHookahs,
        regularHookahs,
        freeHookahs,
        averageRating,
        totalReviews
      })

    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.tg_id])


  useEffect(() => {
    if (isInitialized && user?.tg_id) {
      loadStatistics()
    } else if (isInitialized && !user) {
      router.push('/register')
    }
  }, [isInitialized, user, loadStatistics, router])

  // Auto-refresh when page gets focus or becomes visible
  useEffect(() => {
    const onFocus = () => {
      if (isInitialized && user?.tg_id) {
        loadStatistics()
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus()
    })
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus as any)
    }
  }, [isInitialized, user?.tg_id, loadStatistics])

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Загрузка статистики...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-400 mb-4">Ошибка загрузки данных</p>
            <p className="text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-300 mb-4">Пользователь не найден</p>
            <button 
              onClick={() => router.push('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Перейти к регистрации
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center text-white">
            <span className="mr-3 text-4xl">📈</span>
            Статистика покупок
          </h1>
          <p className="text-gray-500 text-sm mb-4">Анализ вашей активности в кальянной</p>
          <button
            onClick={() => loadStatistics()}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border-2 border-gray-800 bg-gray-900 text-gray-200 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Обновление...' : 'Обновить данные'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mb-4"></div>
            <span className="text-xl text-gray-300">Загрузка статистики...</span>
          </div>
        ) : statistics ? (
          <div className="space-y-10">
            {/* Основные метрики */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-6 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <span className="text-3xl">🚬</span>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-400">Всего кальянов</h3>
                      <p className="text-3xl font-bold text-white">{statistics.totalHookahs}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-6 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <span className="text-3xl">💚</span>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-400">Платные кальяны</h3>
                      <p className="text-3xl font-bold text-white">{statistics.regularHookahs}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-6 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <span className="text-3xl">🎁</span>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-400">Бесплатные кальяны</h3>
                      <p className="text-3xl font-bold text-white">{statistics.freeHookahs}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-6 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <span className="text-3xl">⭐</span>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-400">Средняя оценка</h3>
                      <p className="text-3xl font-bold text-white">{statistics.averageRating.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-700/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-600/30 p-12">
              <span className="text-6xl mb-4 block">📊</span>
              <p className="text-2xl text-gray-400 mb-2">Статистика недоступна</p>
              <p className="text-gray-500">Попробуйте обновить страницу</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}