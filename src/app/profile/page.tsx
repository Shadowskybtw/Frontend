"use client"
import React, { useEffect, useState, useCallback } from 'react'
import QRScanner from '@/components/QRScanner'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

interface Stock {
  id: number
  user_id: number
  stock_name: string
  progress: number
  promotion_completed: boolean
  created_at: string
  updated_at: string
}

interface FreeHookah {
  id: number
  user_id: number
  used: boolean
  used_at?: string
  created_at: string
}

interface HookahHistoryItem {
  id: number
  user_id: number
  hookah_type: string
  slot_number?: number
  stock_id?: number
  admin_id?: number
  scan_method?: string
  created_at: string
  review?: {
    rating: number
    review_text?: string
  }
}

export default function ProfilePage() {
  const { user, isInTelegram, loading, isInitialized } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [freeHookahs, setFreeHookahs] = useState<FreeHookah[]>([])
  const [history, setHistory] = useState<HookahHistoryItem[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedHookahForReview, setSelectedHookahForReview] = useState<HookahHistoryItem | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Load profile data
  const loadProfileData = useCallback(async () => {
    if (!user?.tg_id) return

    try {
      // Load stocks
      const stocksResponse = await fetch(`/api/stocks/${user.tg_id}`)
      if (stocksResponse.ok) {
        const stocksData = await stocksResponse.json()
        setStocks(stocksData.stocks || [])
      }

      // Load free hookahs
      const freeHookahsResponse = await fetch(`/api/free-hookahs/${user.tg_id}`)
      if (freeHookahsResponse.ok) {
        const freeHookahsData = await freeHookahsResponse.json()
        setFreeHookahs(freeHookahsData.freeHookahs || [])
      }

      // Load history with reviews
      const historyResponse = await fetch(`/api/history/${user.tg_id}?withReviews=true`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setHistory(historyData.history || [])
      }

      // Check admin status
      const adminResponse = await fetch(`/api/admin?tg_id=${user.tg_id}`)
      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        setIsAdmin(adminData.isAdmin || false)
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    }
  }, [user?.tg_id])

  useEffect(() => {
    if (isInitialized && user?.tg_id) {
      loadProfileData()
    }
  }, [isInitialized, user?.tg_id, loadProfileData])

  // Save profile changes
  const saveProfile = async () => {
    if (!user?.tg_id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/profile/${user.tg_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        setIsEditing(false)
        loadProfileData()
      } else {
        alert('Ошибка при сохранении профиля')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Ошибка при сохранении профиля')
    } finally {
      setIsSaving(false)
    }
  }

  // Claim free hookah
  const claimFreeHookah = async () => {
    if (!user?.tg_id || isClaiming) return

    setIsClaiming(true)
    try {
      const response = await fetch('/api/claim-free-hookah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: user.tg_id })
      })

      const data = await response.json()
      if (data.success) {
        alert('🎉 Вы получили бесплатный кальян! Покажите это сообщение администратору.')
        loadProfileData() // Reload data
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error claiming free hookah:', error)
      alert('Ошибка при получении бесплатного кальяна')
    } finally {
      setIsClaiming(false)
    }
  }

  // Handle QR scan
  const handleQRScan = async (qrData: string) => {
    if (!user?.tg_id) return

    try {
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData,
          tg_id: user.tg_id
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message)
        loadProfileData() // Reload data
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('Ошибка при сканировании QR кода')
    }
  }

  // Handle review submission
  const submitReview = async () => {
    if (!selectedHookahForReview || !user?.id) return

    setIsSubmittingReview(true)
    try {
      const response = await fetch('/api/add-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          hookahId: selectedHookahForReview.id,
          rating: reviewRating,
          reviewText: reviewText.trim() || undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Отзыв успешно добавлен!')
        setShowReviewModal(false)
        setSelectedHookahForReview(null)
        setReviewText('')
        loadProfileData() // Reload data
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
  const openReviewModal = (hookah: HookahHistoryItem) => {
    setSelectedHookahForReview(hookah)
    setReviewRating(hookah.review?.rating || 5)
    setReviewText(hookah.review?.review_text || '')
    setShowReviewModal(true)
  }

  // Render stars for rating
  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-400'} ${
              interactive ? 'cursor-pointer hover:text-yellow-300' : ''
            }`}
            onClick={interactive ? () => setReviewRating(star) : undefined}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  if (loading || !isInitialized) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <div className="text-center">
          <p className="text-gray-300 mb-4">Пользователь не найден</p>
                      <button
            onClick={() => window.location.href = '/register'}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                      >
            Регистрация
                      </button>
                  </div>
                </div>
    )
  }

  const stock = stocks.find(s => s.stock_name === '5+1 кальян')
  const unusedFreeHookahs = freeHookahs.filter(h => !h.used)
  const hasUnusedFreeHookah = unusedFreeHookahs.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />
      
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Info */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
          <h1 className="text-3xl font-bold text-white mb-6">👤 Профиль</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Информация о пользователе</h2>
                
                {isEditing ? (
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Имя</label>
                      <input
                        type="text"
                        value={editForm.first_name}
                      onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                      />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Фамилия</label>
                      <input
                        type="text"
                        value={editForm.last_name}
                      onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                      onClick={saveProfile}
                        disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md"
                      >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                    >
                      Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="space-y-2">
                  <p className="text-gray-300"><strong>Имя:</strong> {user.first_name}</p>
                  <p className="text-gray-300"><strong>Фамилия:</strong> {user.last_name}</p>
                  <p className="text-gray-300"><strong>Телефон:</strong> {user.phone || 'Не указан'}</p>
                  <p className="text-gray-300"><strong>Username:</strong> @{user.username || 'Не указан'}</p>
                  <button
                    onClick={() => {
                      setEditForm({ first_name: user.first_name || '', last_name: user.last_name || '' })
                      setIsEditing(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mt-4"
                  >
                    Редактировать
                  </button>
                  </div>
                )}
              </div>
              
            {/* Free Hookahs Counter */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Бесплатные кальяны</h2>
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {unusedFreeHookahs.length}
                  </div>
                  <p className="text-yellow-200">Доступно бесплатных кальянов</p>
                  {hasUnusedFreeHookah && (
                      <button
                      onClick={claimFreeHookah}
                      disabled={isClaiming}
                      className="mt-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-6 py-2 rounded-md font-medium"
                      >
                      {isClaiming ? '⏳ Получаем...' : '🎁 Получить бесплатный кальян'}
                      </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slots Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Акция "5+1 кальян"</h2>
          
          {stock ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  {stock.progress}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${stock.progress}%` }}
                  ></div>
                </div>
                <p className="text-gray-300">
                  Заполнено слотов: {Math.floor(stock.progress / 20)}/5
                </p>
                    </div>
                    
              {/* Slots */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((slot) => (
                  <div
                    key={slot}
                    className={`h-16 rounded-lg border-2 flex items-center justify-center text-white font-bold ${
                      Math.floor(stock.progress / 20) >= slot
                        ? 'bg-green-600 border-green-500'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    {Math.floor(stock.progress / 20) >= slot ? '✅' : slot}
                  </div>
                ))}
                    </div>
                    
              {stock.progress >= 100 && (
                <div className="text-center p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <p className="text-green-200 font-semibold">
                    🎉 Акция завершена! Бесплатный кальян добавлен!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-300">
              <p>Акция еще не начата</p>
            </div>
          )}

          {/* QR Scanner Button */}
          <div className="mt-6 text-center">
                        <button
                          onClick={() => setShowQRScanner(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                        >
              📱 Сканировать QR код
                        </button>
          </div>
                        </div>

        {/* History */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📜 История кальянов</h2>
          
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold">
                        {item.hookah_type === 'free' ? '🎁 Бесплатный кальян' : '🚬 Обычный кальян'}
                      </p>
                      <p className="text-gray-300 text-sm">
                        {new Date(item.created_at).toLocaleString('ru-RU')}
                      </p>
                      {item.review && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-gray-300 text-sm">Ваш отзыв:</span>
                          {renderStars(item.review.rating)}
                          {item.review.review_text && (
                            <span className="text-gray-300 text-sm">"{item.review.review_text}"</span>
                          )}
                        </div>
                      )}
                      </div>
                    
                    {!item.review && (
                        <button
                        onClick={() => openReviewModal(item)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                        ⭐ Оставить отзыв
                        </button>
                    )}
                  </div>
                        </div>
                      ))}
            </div>
          ) : (
            <div className="text-center text-gray-300">
              <p>История пуста</p>
            </div>
          )}
        </div>
      </main>
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedHookahForReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Оставить отзыв</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Оценка</label>
                <div className="flex justify-center">
                  {renderStars(reviewRating, true)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Отзыв (необязательно)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Оставьте ваш отзыв..."
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white h-20 resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={submitReview}
                  disabled={isSubmittingReview}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md"
                >
                  {isSubmittingReview ? 'Отправка...' : 'Отправить отзыв'}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}