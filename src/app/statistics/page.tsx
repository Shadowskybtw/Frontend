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

  // Load statistics data
  const loadStatistics = useCallback(async () => {
    if (!user?.tg_id) return

    setIsLoading(true)
    try {
      // Load history with reviews
      const historyResponse = await fetch(`/api/history/${user.tg_id}?withReviews=true`)
      if (!historyResponse.ok) {
        throw new Error('Failed to load history')
      }

      const historyData = await historyResponse.json()
      const history: HookahHistory[] = historyData.history || []

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
    } finally {
      setIsLoading(false)
    }
  }, [user?.tg_id])

  // Calculate monthly statistics
  const calculateMonthlyStats = (history: HookahHistory[]) => {
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
  }

  // Calculate rating distribution
  const calculateRatingDistribution = (reviews: Array<{ rating: number }>) => {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    
    reviews.forEach(review => {
      distribution[review.rating]++
    })

    return Object.entries(distribution)
      .map(([rating, count]) => ({
        rating: parseInt(rating),
        count
      }))
      .sort((a, b) => b.rating - a.rating)
  }

  // Format month for display
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    if (isInitialized && user?.tg_id) {
      loadStatistics()
    }
  }, [isInitialized, user?.tg_id, loadStatistics])

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Инициализация...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">Ошибка загрузки пользователя</p>
          <button 
            onClick={() => router.push('/register')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Перейти к регистрации
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />
      
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📊 Статистика</h1>
          <p className="text-gray-300">Ваша активность и достижения</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Загрузка статистики...</p>
          </div>
        ) : statistics ? (
          <>
            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Hookahs */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Всего кальянов</p>
                    <p className="text-3xl font-bold">{statistics.totalHookahs}</p>
                  </div>
                  <div className="text-4xl opacity-80">🚬</div>
                </div>
              </div>

              {/* Regular Hookahs */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Обычные кальяны</p>
                    <p className="text-3xl font-bold">{statistics.regularHookahs}</p>
                  </div>
                  <div className="text-4xl opacity-80">💚</div>
                </div>
              </div>

              {/* Free Hookahs */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Бесплатные кальяны</p>
                    <p className="text-3xl font-bold">{statistics.freeHookahs}</p>
                  </div>
                  <div className="text-4xl opacity-80">🎁</div>
                </div>
              </div>

              {/* Average Rating */}
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Средняя оценка</p>
                    <p className="text-3xl font-bold">{statistics.averageRating.toFixed(1)}</p>
                  </div>
                  <div className="text-4xl opacity-80">⭐</div>
                </div>
              </div>
            </div>

            {/* Monthly Statistics */}
            {statistics.monthlyStats.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  📅 Статистика по месяцам
                </h2>
                <div className="space-y-4">
                  {statistics.monthlyStats.slice(0, 6).map((month, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-medium">{month.month}</h3>
                        <span className="text-gray-300 text-sm">Всего: {month.total}</span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-green-400">Обычные: {month.regular}</span>
                        <span className="text-purple-400">Бесплатные: {month.free}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Distribution */}
            {statistics.totalReviews > 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  ⭐ Распределение оценок
                </h2>
                <div className="space-y-3">
                  {statistics.ratingDistribution.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 w-20">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <div className="flex-1 bg-gray-700 rounded-full h-4">
                        <div 
                          className="bg-yellow-400 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${(count / statistics.totalReviews) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm w-12 text-right">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-gray-400 text-sm">
                  Всего отзывов: {statistics.totalReviews}
                </div>
              </div>
            )}

            {/* Empty State */}
            {statistics.totalHookahs === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">Статистика пуста</h3>
                <p className="text-gray-400">Начните покупки кальянов, чтобы увидеть статистику</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-400">Ошибка загрузки статистики</p>
          </div>
        )}
      </main>
    </div>
  )
}
