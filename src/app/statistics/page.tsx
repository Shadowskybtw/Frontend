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
  monthlyStats: Array<{
    month: string
    regular: number
    free: number
    total: number
  }>
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  const { user, loading, error, isInitialized } = useUser()

  // Calculate monthly statistics
  const calculateMonthlyStats = useCallback((history: HookahHistory[]) => {
    const monthlyData: { [key: string]: { regular: number, free: number, total: number } } = {}
    
    history.forEach(record => {
      const date = new Date(record.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { regular: 0, free: 0, total: 0 }
      }
      
      monthlyData[monthKey].total++
      if (record.hookah_type === 'regular') {
        monthlyData[monthKey].regular++
      } else if (record.hookah_type === 'free') {
        monthlyData[monthKey].free++
      }
    })

    return Object.entries(monthlyData)
      .map(([month, stats]) => ({
        month: formatMonth(month),
        ...stats
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12) // Last 12 months
  }, [])

  // Calculate rating distribution
  const calculateRatingDistribution = useCallback((reviews: Array<{ rating: number }>) => {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    
    reviews.forEach(review => {
      distribution[review.rating]++
    })

    return Object.entries(distribution)
      .map(([rating, count]) => ({
        rating: parseInt(rating),
        count
      }))
  }, [])

  // Load statistics data
  const loadStatistics = useCallback(async () => {
    console.log('📈 loadStatistics called:', { tgId: user?.tg_id })
    if (!user?.tg_id) {
      console.log('📈 No tg_id, skipping statistics load')
      return
    }

    setIsLoading(true)
    try {
      // Load history with reviews
      const url = `/api/history/${Number(user.tg_id)}?withReviews=true`
      console.log('📈 Fetching URL:', url)
      
      const historyResponse = await fetch(url)
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
        const fallbackResponse = await fetch(`/api/history/${Number(user.tg_id)}`)
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

      // Calculate monthly statistics
      const monthlyStats = calculateMonthlyStats(history)
      
      // Calculate rating distribution
      const ratingDistribution = calculateRatingDistribution(reviews)

      setStatistics({
        totalHookahs,
        regularHookahs,
        freeHookahs,
        averageRating,
        totalReviews,
        monthlyStats,
        ratingDistribution
      })

    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.tg_id, calculateMonthlyStats, calculateRatingDistribution])

  // Format month helper
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    if (isInitialized && user?.tg_id) {
      loadStatistics()
    } else if (isInitialized && !user) {
      router.push('/register')
    }
  }, [isInitialized, user, loadStatistics, router])

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center">
            <span className="mr-4 text-6xl">📈</span>
            Статистика покупок
          </h1>
          <p className="text-gray-400 text-xl">Анализ вашей активности в кальянной</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mb-4"></div>
            <span className="text-xl text-gray-300">Загрузка статистики...</span>
          </div>
        ) : statistics ? (
          <div className="space-y-10">
            {/* Основные метрики */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-500/30 p-8 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-2xl">
                    <span className="text-3xl">🚬</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-blue-300">Всего кальянов</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">{statistics.totalHookahs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-green-500/30 p-8 hover:border-green-400/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500/20 p-3 rounded-2xl">
                    <span className="text-3xl">💚</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-green-300">Платные кальяны</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">{statistics.regularHookahs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-500/30 p-8 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-500/20 p-3 rounded-2xl">
                    <span className="text-3xl">🎁</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-purple-300">Бесплатные кальяны</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">{statistics.freeHookahs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/30 to-orange-800/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-yellow-500/30 p-8 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-500/20 p-3 rounded-2xl">
                    <span className="text-3xl">⭐</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-yellow-300">Средняя оценка</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">{statistics.averageRating.toFixed(1)}</p>
                    <p className="text-sm text-gray-400">{statistics.totalReviews} отзывов</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Дополнительная статистика */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Процентное соотношение */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-700/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-600/30 p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-gray-500/20 p-3 rounded-2xl mr-4">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Соотношение покупок</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-300">Платные кальяны</span>
                      <span className="text-green-400 font-bold">{((statistics.regularHookahs / statistics.totalHookahs) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-400 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(statistics.regularHookahs / statistics.totalHookahs) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-300">Бесплатные кальяны</span>
                      <span className="text-purple-400 font-bold">{((statistics.freeHookahs / statistics.totalHookahs) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-400 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(statistics.freeHookahs / statistics.totalHookahs) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Распределение оценок */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-700/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-600/30 p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-yellow-500/20 p-3 rounded-2xl mr-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Распределение оценок</h2>
                </div>
                <div className="space-y-3">
                  {statistics.ratingDistribution.map((rating, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-br from-gray-700/50 to-gray-600/40 rounded-xl p-4 border border-gray-600/30 hover:border-yellow-500/50 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">⭐</span>
                        <span className="text-lg font-semibold text-white">{rating.rating} звезд</span>
                      </div>
                      <div className="text-xl font-bold text-yellow-400">{rating.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Активность по месяцам */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-700/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-600/30 p-8">
              <div className="flex items-center mb-8">
                <div className="bg-blue-500/20 p-3 rounded-2xl mr-4">
                  <span className="text-3xl">📅</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Активность по месяцам</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {statistics.monthlyStats.map((month, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-700/50 to-gray-600/40 rounded-2xl p-6 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                    <h3 className="font-bold text-white mb-4 text-lg">{month.month}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-600/40 rounded-lg">
                        <span className="text-gray-300">Всего</span>
                        <span className="font-bold text-white text-lg">{month.total}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-green-500/20 rounded-lg border border-green-500/30">
                        <span className="text-green-300">Платные</span>
                        <span className="font-bold text-green-400">{month.regular}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                        <span className="text-purple-300">Бесплатные</span>
                        <span className="font-bold text-purple-400">{month.free}</span>
                      </div>
                    </div>
                  </div>
                ))}
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