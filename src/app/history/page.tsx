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
  const [historyLoading, setHistoryLoading] = useState(false)
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
      
      // Fetch current page with total count
      const url = `/api/history/${tgId}?limit=${limit}&offset=${offset}&timestamp=${Date.now()}`
      console.log('📊 Fetching URL:', url)
      
      const response = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      console.log('📊 Response status:', response.status, response.statusText)

      const data = await response.json()
      console.log('📊 Response data:', data)

      if (data.success) {
        const historyData = data.history || data.items || []
        const totalCount = data.total || historyData.length
        console.log('📊 Setting history:', historyData.length, 'items, total:', totalCount)
        setHistory(historyData)
        // Calculate total pages based on total count from API
        const totalPages = Math.max(1, Math.ceil(totalCount / limit))
        setTotalPages(totalPages)
        console.log('📊 Total pages calculated:', totalPages)
      } else {
        console.error('❌ Failed to fetch history:', data.message)
        setHistory([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error)
      setHistory([])
      setTotalPages(1)
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

  // Auto-refresh history when page regains focus/visibility
  useEffect(() => {
    const onFocus = () => {
      if (isInitialized && user?.tg_id) {
        fetchHistory(Number(user.tg_id), currentPage)
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
  }, [isInitialized, user?.tg_id, currentPage, fetchHistory])

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
        // Close modal first
        setShowReviewModal(false)
        setSelectedHookahForReview(null)
        setReviewText('')
        setReviewRating(5)
        
        // Show success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideUp'
        notification.innerHTML = '✅ Отзыв успешно добавлен!'
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.style.opacity = '0'
          notification.style.transition = 'opacity 0.3s'
          setTimeout(() => notification.remove(), 300)
        }, 3000)
        
        // Reload history to show the review
        if (user?.tg_id) {
          fetchHistory(Number(user.tg_id), currentPage)
        }
      } else {
        alert('❌ Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('❌ Ошибка при отправке отзыва')
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
      <div className="min-h-screen bg-black">
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
      <div className="min-h-screen bg-black">
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
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-6 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
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
                              <div className="mb-2 bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                                <div className="flex items-center gap-1 mb-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <span 
                                      key={i}
                                      className={`text-lg ${i < item.review!.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="text-gray-400 text-xs ml-1">
                                    ({item.review.rating}/5)
                                  </span>
                                </div>
                                {item.review.review_text && (
                                  <p className="text-gray-300 text-xs italic">
                                    &ldquo;{item.review.review_text}&rdquo;
                                  </p>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => openReviewModal(item)}
                              className={`${
                                item.review 
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30'
                              } px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105`}
                            >
                              {item.review ? '✏️ Изменить' : '⭐ Оценить'}
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
              <div className="flex justify-between items-center mt-8 px-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || historyLoading}
                  className="w-12 h-12 bg-gray-800 text-white rounded-full border-2 border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-2xl"
                >
                  ←
                </button>
                
                <div className="text-center">
                  <span className="text-gray-300 text-sm">Страница</span>
                  <div className="text-white font-bold text-lg">{currentPage} из {totalPages}</div>
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || historyLoading}
                  className="w-12 h-12 bg-gray-800 text-white rounded-full border-2 border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-2xl"
                >
                  →
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedHookahForReview && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReviewModal(false)
              setSelectedHookahForReview(null)
              setReviewText('')
              setReviewRating(5)
            }
          }}
        >
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 w-full max-w-md border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 animate-slideUp">
            <div className="text-center mb-6">
              <span className="text-5xl mb-3 block">⭐</span>
              <h3 className="text-2xl font-bold text-white">Оставить отзыв</h3>
              <p className="text-gray-400 text-sm mt-1">
                {selectedHookahForReview.hookah_type === 'free' ? 'Бесплатный кальян' : 'Платный кальян'}
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 text-center">
                  Ваша оценка:
                </label>
                <div className="flex justify-center space-x-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className={`text-5xl transition-all duration-200 transform hover:scale-125 ${
                        rating <= reviewRating 
                          ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-center text-purple-300 text-sm mt-3 font-medium">
                  {reviewRating === 5 && '🎉 Отлично!'}
                  {reviewRating === 4 && '😊 Хорошо'}
                  {reviewRating === 3 && '😐 Нормально'}
                  {reviewRating === 2 && '😕 Плохо'}
                  {reviewRating === 1 && '😞 Очень плохо'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Комментарий (необязательно):
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Расскажите о своих впечатлениях..."
                  className="w-full px-4 py-3 border-2 border-gray-700 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-gray-500 text-xs mt-1 text-right">
                  {reviewText.length}/200
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedHookahForReview(null)
                    setReviewText('')
                    setReviewRating(5)
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                >
                  Отмена
                </button>
                <button
                  onClick={submitReview}
                  disabled={isSubmittingReview}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:scale-100 shadow-lg shadow-purple-500/30"
                >
                  {isSubmittingReview ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Отправляем...
                    </span>
                  ) : (
                    '✨ Отправить отзыв'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
