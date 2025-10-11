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
  const { user, loading, isInitialized } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [freeHookahs, setFreeHookahs] = useState<FreeHookah[]>([])
  const [history, setHistory] = useState<HookahHistoryItem[]>([])
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedHookahForReview, setSelectedHookahForReview] = useState<HookahHistoryItem | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [newAdminTgId, setNewAdminTgId] = useState('')
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false)
  const [isAddingHookah, setIsAddingHookah] = useState(false)
  const [isRemovingHookah, setIsRemovingHookah] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')
  const [searchedUser, setSearchedUser] = useState<any>(null)
  const [isSearchingUser, setIsSearchingUser] = useState(false)

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

  // Admin functions
  const grantAdminRights = async () => {
    if (!newAdminTgId.trim()) {
      alert('Введите Telegram ID')
      return
    }

    if (!user?.id) {
      alert('Ошибка: пользователь не найден')
      return
    }

    const tgId = parseInt(newAdminTgId)
    if (isNaN(tgId)) {
      alert('Неверный формат Telegram ID')
      return
    }

    setIsGrantingAdmin(true)
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: String(user.tg_id),
          target_tg_id: String(tgId),
          action: 'grant_admin',
          admin_key: 'admin123'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Админские права успешно предоставлены пользователю ${data.user.first_name} ${data.user.last_name}`)
        setNewAdminTgId('')
        setAdminPanelOpen(false)
      } else {
        alert('❌ Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error granting admin rights:', error)
      alert('❌ Ошибка при предоставлении админских прав')
    } finally {
      setIsGrantingAdmin(false)
    }
  }

  const searchUser = async () => {
    if (searchPhone.length !== 4) {
      alert('Введите ровно 4 цифры номера телефона')
      return
    }

    setIsSearchingUser(true)
    try {
      const response = await fetch(`/api/search-user?phone=${searchPhone}`)
      const data = await response.json()

      if (data.success && data.user) {
        setSearchedUser(data)
      } else {
        setSearchedUser(null)
        alert('Пользователь не найден')
      }
    } catch (error) {
      console.error('Error searching user:', error)
      alert('Ошибка при поиске пользователя')
    } finally {
      setIsSearchingUser(false)
    }
  }

  const addHookahDirectly = async () => {
    if (!searchedUser || !user?.tg_id) return

    setIsAddingHookah(true)
    try {
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: `admin_add_${searchedUser.user.tg_id}`,
          tg_id: user.tg_id
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ Кальян успешно добавлен пользователю')
        loadProfileData()
        setSearchedUser(null)
        setSearchPhone('')
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding hookah:', error)
      alert('Ошибка при добавлении кальяна')
    } finally {
      setIsAddingHookah(false)
    }
  }

  const removeHookahDirectly = async () => {
    if (!searchedUser || !user?.tg_id) return

    setIsRemovingHookah(true)
    try {
      const response = await fetch('/api/remove-hookah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_tg_id: searchedUser.user.tg_id,
          admin_tg_id: user.tg_id
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ Кальян успешно удален у пользователя')
        loadProfileData()
        setSearchedUser(null)
        setSearchPhone('')
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error removing hookah:', error)
      alert('Ошибка при удалении кальяна')
    } finally {
      setIsRemovingHookah(false)
    }
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">👤 Профиль</h1>
            {isAdmin && (
              <button
                onClick={() => setAdminPanelOpen(!adminPanelOpen)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                👑 Админ панель
              </button>
            )}
          </div>
          
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

        {/* Admin Panel */}
        {isAdmin && adminPanelOpen && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">👑 Админская панель</h2>
            
            <div className="space-y-6">
              {/* Grant Admin Rights */}
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-300 mb-3">Назначить админа</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-1">
                      Telegram ID пользователя:
                    </label>
                    <input
                      type="number"
                      value={newAdminTgId}
                      onChange={(e) => setNewAdminTgId(e.target.value)}
                      placeholder="Введите Telegram ID..."
                      className="w-full px-3 py-2 border-2 border-purple-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-black bg-white shadow-inner font-mono"
                    />
                  </div>
                  <button
                    onClick={grantAdminRights}
                    disabled={isGrantingAdmin || !newAdminTgId}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-md text-sm font-medium"
                  >
                    {isGrantingAdmin ? '⏳ Назначаем...' : '👑 Назначить админа'}
                  </button>
                </div>
              </div>

              {/* Search User */}
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-3">Поиск пользователя</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-300 mb-1">
                      Последние 4 цифры номера телефона:
                    </label>
                    <input
                      type="text"
                      value={searchPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setSearchPhone(value)
                      }}
                      placeholder="Например: 1234"
                      className="w-full px-3 py-2 border-2 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl font-bold text-black bg-white shadow-inner"
                      maxLength={4}
                    />
                  </div>
                  
                  <button
                    onClick={searchUser}
                    disabled={isSearchingUser || searchPhone.length !== 4}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md text-sm font-medium"
                  >
                    {isSearchingUser ? '⏳ Поиск...' : '🔍 Найти пользователя'}
                  </button>

                  {/* Search Result */}
                  {searchedUser && (
                    <div className="mt-4 p-3 bg-blue-800/50 rounded-lg border border-blue-400">
                      <h4 className="font-semibold text-blue-300 mb-2">Информация о пользователе:</h4>
                      <div className="text-blue-200 text-sm space-y-1">
                        <p><strong>Имя:</strong> {searchedUser.user.first_name} {searchedUser.user.last_name}</p>
                        <p><strong>Телефон:</strong> {searchedUser.user.phone}</p>
                        <p><strong>Username:</strong> @{searchedUser.user.username || 'Не указан'}</p>
                        <p><strong>Telegram ID:</strong> {searchedUser.user.tg_id}</p>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-blue-400">
                        <h5 className="font-semibold text-blue-300 mb-2">Статистика кальянов:</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-blue-700/50 rounded p-2">
                            <div className="text-blue-200">Заполнено слотов:</div>
                            <div className="text-white font-bold text-lg">{searchedUser.stats.slotsFilled}/5</div>
                          </div>
                          <div className="bg-blue-700/50 rounded p-2">
                            <div className="text-blue-200">Осталось до бесплатного:</div>
                            <div className="text-white font-bold text-lg">{searchedUser.stats.slotsRemaining}</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-blue-200 text-sm">Прогресс: {searchedUser.stats.progress}%</div>
                          <div className="w-full bg-blue-600 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-300 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${searchedUser.stats.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        {searchedUser.stats.hasFreeHookah && (
                          <div className="mt-2 text-green-400 font-semibold">
                            🎁 Есть бесплатный кальян!
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={addHookahDirectly}
                          disabled={isAddingHookah || isRemovingHookah}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-3 rounded-md text-sm font-medium"
                        >
                          {isAddingHookah ? '⏳ Добавляем...' : '➕ Добавить кальян'}
                        </button>
                        <button
                          onClick={removeHookahDirectly}
                          disabled={isRemovingHookah || isAddingHookah}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-3 rounded-md text-sm font-medium"
                        >
                          {isRemovingHookah ? '⏳ Убираем...' : '➖ Убрать кальян'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slots Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Акция &ldquo;5+1 кальян&rdquo;</h2>
          
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

          {/* QR Code Panel */}
          <div className="mt-6">
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3">📱 QR Код для сканирования</h3>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-3">
                  <div className="text-black text-sm font-mono">
                    📱 Используйте камеру для сканирования QR кодов кальянов
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Покажите QR код администратору для добавления кальяна в акцию
                </p>
              </div>
            </div>
          </div>
                        </div>

        {/* Hookah Statistics */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Статистика кальянов</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {history.filter(item => item.hookah_type === 'regular').length}
              </div>
              <p className="text-blue-200 font-semibold">Обычные кальяны</p>
              <p className="text-blue-300 text-sm">В акции</p>
            </div>
            
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {history.filter(item => item.hookah_type === 'free').length}
              </div>
              <p className="text-green-200 font-semibold">Бесплатные кальяны</p>
              <p className="text-green-300 text-sm">Получено</p>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-2">
                {history.length}
              </div>
              <p className="text-yellow-200 font-semibold">Всего кальянов</p>
              <p className="text-gray-300 text-sm">За все время</p>
            </div>
          </div>
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