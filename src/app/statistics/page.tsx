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

  // Format month helper
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
  }

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
      const url = `/api/history/${Number(user.tg_id)}`
      console.log('📈 Fetching URL:', url)
      
      const historyResponse = await fetch(url)
      console.log('📈 Response status:', historyResponse.status, historyResponse.statusText)
      
      if (!historyResponse.ok) {
        throw new Error('Failed to load history')
      }

      const historyData = await historyResponse.json()
      console.log('📈 History data:', historyData)
      
      const history: HookahHistory[] = historyData.history || []
      console.log('📈 History items:', history.length)

      // Calculate statistics
      const totalHookahs = history.length
      const regularHookahs = history.filter(h => h.hookah_type === 'regular').length
      const freeHookahs = history.filter(h => h.hookah_type === 'free').length
      
      // Calculate reviews statistics
      const reviews = history.filter(h => h.review).map(h => h.review!)
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0

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
      setStatistics(null)
    } finally {
      setIsLoading(false)
    }
  }, [user?.tg_id, calculateMonthlyStats, calculateRatingDistribution])

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
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
            <span className="mr-3">📈</span>
            Статистика
          </h1>
          <p className="text-gray-300">Ваша активность и достижения</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Загрузка статистики...</p>
            </div>
          </div>
        ) : statistics ? (
          <div className="space-y-8">
            {/* Основная статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-300">Всего кальянов</h3>
                    <p className="text-3xl font-bold text-white">{statistics.totalHookahs}</p>
                  </div>
                  <div className="text-4xl">🚬</div>
                </div>
              </div>

              <div className="bg-green-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-300">Обычные кальяны</h3>
                    <p className="text-3xl font-bold text-white">{statistics.regularHookahs}</p>
                  </div>
                  <div className="text-4xl">💚</div>
                </div>
              </div>

              <div className="bg-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300">Бесплатные кальяны</h3>
                    <p className="text-3xl font-bold text-white">{statistics.freeHookahs}</p>
                  </div>
                  <div className="text-4xl">🎁</div>
                </div>
              </div>

              <div className="bg-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-300">Средняя оценка</h3>
                    <p className="text-3xl font-bold text-white">{statistics.averageRating.toFixed(1)}</p>
                  </div>
                  <div className="text-4xl">⭐</div>
                </div>
              </div>
            </div>

            {/* Месячная статистика */}
            {statistics.monthlyStats.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="mr-3">📅</span>
                  Активность по месяцам
                </h2>
                <div className="space-y-4">
                  {statistics.monthlyStats.slice(0, 6).map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-white">{month.month}</span>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-300">Всего</p>
                          <p className="text-xl font-bold text-white">{month.total}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-300">Обычные</p>
                          <p className="text-xl font-bold text-green-400">{month.regular}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-300">Бесплатные</p>
                          <p className="text-xl font-bold text-purple-400">{month.free}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Распределение оценок */}
            {statistics.ratingDistribution.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="mr-3">⭐</span>
                  Распределение оценок
                </h2>
                <div className="grid grid-cols-5 gap-4">
                  {statistics.ratingDistribution.map((rating, index) => (
                    <div key={index} className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl mb-2">{'⭐'.repeat(rating.rating)}</div>
                      <p className="text-lg font-bold text-white">{rating.count}</p>
                      <p className="text-sm text-gray-300">{rating.rating} звезд</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl text-gray-300 mb-2">Статистика недоступна</p>
              <p className="text-gray-400">Данные для статистики не найдены</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}