"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

interface PurchaseHistory {
  id: number
  user_id: number
  hookah_type: 'regular' | 'free'
  slot_number?: number | null
  stock_id?: number | null
  admin_id?: number | null
  scan_method?: string | null
  created_at: string
  review?: {
    rating: number
    review_text?: string
  }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<PurchaseHistory[]>([])
  const [, setHistoryLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedHookahForReview, setSelectedHookahForReview] = useState<PurchaseHistory | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const { user, loading, error, isInitialized } = useUser()

  const fetchHistory = useCallback(async (tgId: number, page: number = 1) => {
    console.log('📊 fetchHistory called:', { tgId, page })
    setHistoryLoading(true)
    try {
      const limit = 8
      const offset = (page - 1) * limit
      const url = `/api/history/${tgId}?limit=${limit}&offset=${offset}`
      console.log('📊 Fetching URL:', url)
      
      const response = await fetch(url)
      console.log('📊 Response status:', response.status, response.statusText)

      const data = await response.json()
      console.log('📊 Response data:', data)

      if (data.success) {
        const historyData = data.history || data.items || []
        console.log('📊 Setting history:', historyData.length, 'items')
        setHistory(historyData)
        // Calculate total pages based on total count
        const totalPages = Math.ceil((data.total || historyData.length || 0) / limit)
        setTotalPages(totalPages)
      } else {
        console.error('❌ Failed to fetch history:', data.message)
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('📊 History page useEffect triggered:', {
      isInitialized,
      hasUser: !!user,
      tgId: user?.tg_id,
      currentPage
    })
    
    if (isInitialized && user?.tg_id) {
      console.log('📊 Loading history for user:', user.tg_id, 'page:', currentPage)
      fetchHistory(Number(user.tg_id), currentPage)
    } else {
      console.log('📊 Not loading history:', {
        isInitialized,
        hasUser: !!user,
        tgId: user?.tg_id
      })
    }
  }, [isInitialized, user?.tg_id, currentPage, fetchHistory, user])

  // Handle review submission
  const submitReview = async () => {
    if (!selectedHookahForReview || !user?.tg_id) return

    setIsSubmittingReview(true)
    try {
      const response = await fetch('/api/add-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tgId: user.tg_id,
          hookahId: selectedHookahForReview.id,
          rating: reviewRating,
          reviewText: reviewText || undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ Отзыв успешно добавлен!')
        setShowReviewModal(false)
        setSelectedHookahForReview(null)
        setReviewText('')
        setReviewRating(5)
        // Reload history to show the review
        if (user?.tg_id) {
          fetchHistory(Number(user.tg_id), currentPage)
        }
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Ошибка при отправке отзыва')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // Open review modal
  const openReviewModal = (hookah: PurchaseHistory) => {
    setSelectedHookahForReview(hookah)
    setShowReviewModal(true)
    setReviewRating(hookah.review?.rating || 5)
    setReviewText(hookah.review?.review_text || '')
  }

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
                {history
                  .filter(item => item.hookah_type === 'regular' || item.hookah_type === 'free')
                  .map((item) => {
                    const getItemInfo = () => {
                      switch (item.hookah_type) {
                        case 'free':
                          return {
                            icon: '🎁',
                            title: 'Бесплатный кальян',
                            bgColor: 'bg-green-900/30 border-green-500/50',
                            description: 'Получен за завершение акции 5+1'
                          }
                        case 'regular':
                          return {
                            icon: '🛒',
                            title: 'Обычная покупка',
                            bgColor: 'bg-gray-700/50 border-gray-600',
                            description: item.slot_number ? `Слот ${item.slot_number}/5` : 'Кальян добавлен'
                          }
                        default:
                          // Этот случай больше не должен происходить благодаря фильтрации выше
                          return null
                      }
                    }

                    const itemInfo = getItemInfo()
                    
                    // Если itemInfo null, не отображаем элемент
                    if (!itemInfo) return null

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${itemInfo.bgColor}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {itemInfo.icon}
                            </span>
                            <div>
                              <h3 className="font-semibold text-white">
                                {itemInfo.title}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {itemInfo.description}
                              </p>
                              <p className="text-gray-500 text-xs">
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
                            {item.scan_method && (
                              <div className="text-gray-400 text-xs mb-2">
                                {item.scan_method === 'admin_add' && '👑 Админ добавил'}
                                {item.scan_method === 'promotion_completed' && '🎯 Акция завершена'}
                                {item.scan_method === 'user_claimed' && '🎁 Получен пользователем'}
                                {item.scan_method === 'admin_remove' && '👑 Админ удалил'}
                              </div>
                            )}
                            {item.review && (
                              <div className="flex items-center justify-end gap-1 mb-2">
                                <span className="text-yellow-400 text-sm">
                                  {Array.from({ length: item.review.rating }, () => '★').join('')}
                                </span>
                                {item.review.review_text && (
                                  <span className="text-gray-300 text-xs ml-2">
                                    &ldquo;{item.review.review_text}&rdquo;
                                  </span>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => openReviewModal(item)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              {item.review ? '✏️ Изменить отзыв' : '⭐ Оценить'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || historyLoading}
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <span>←</span>
                  <span>Предыдущая</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={historyLoading}
                        className={`w-10 h-10 rounded-xl font-bold transition-all duration-200 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg scale-110'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || historyLoading}
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <span>Следующая</span>
                  <span>→</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedHookahForReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Оставить отзыв</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Оценка (1-5 звезд):
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className={`text-2xl ${
                        rating <= reviewRating ? 'text-yellow-400' : 'text-gray-400'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Выбрано: {reviewRating} звезд
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Комментарий (необязательно):
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Оставьте комментарий о кальяне..."
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedHookahForReview(null)
                    setReviewText('')
                    setReviewRating(5)
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={submitReview}
                  disabled={isSubmittingReview}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md font-medium"
                >
                  {isSubmittingReview ? '⏳ Отправляем...' : 'Отправить отзыв'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
