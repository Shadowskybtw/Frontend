"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import QRScanner from '@/components/QRScanner'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

export default function ProfilePage() {
  const { user, isInTelegram, loading, error, isInitialized } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState<{
    id: number
    first_name: string
    last_name: string
    phone: string
    username?: string
    created_at: string
  } | null>(null)
  const [profileStats, setProfileStats] = useState<{
    totalSmokedHookahs: number
    totalFreeHookahs: number
    regularHookahs: number
    freeHookahsReceived: number
    freeHookahsUsed: number
    slotsFilled: number
    isPromotionCompleted: boolean
  } | null>(null)
  const [, setUsedFreeHookahs] = useState<Array<{
    id: number
    used_at: string
    created_at: string
  }>>([])

  const [hookahHistory, setHookahHistory] = useState<Array<{
    id: number
    hookah_type: string
    slot_number?: number
    created_at: string
  }>>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [qrScannerOpen, setQrScannerOpen] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [, setScanResult] = useState<{
    success: boolean
    message: string
    user?: {
      id: number
      first_name: string
      last_name: string
    }
    stock?: {
      stock_name: string
      progress: number
    }
  } | null>(null)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [newAdminTgId, setNewAdminTgId] = useState('')
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false)
  const [adminStatusChecked, setAdminStatusChecked] = useState(false)
  const [phoneDigits, setPhoneDigits] = useState('')

  useEffect(() => {
    if (isInitialized && user?.id) {
      console.log('👤 Loading profile data for user:', user.id)
      loadProfileData(user.id)
      loadProfileStats(user.id)
      checkAdminRights(user.id)
      checkAdminStatus()
    }
  }, [isInitialized, user])

  // Загружаем данные профиля
  const loadProfileData = async (tgId: number) => {
    try {
      const response = await fetch('/api/check-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tg_id: tgId }),
      })

      const data = await response.json()
      if (data.success && data.registered && data.user) {
        setProfileData(data.user)
        setEditForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    }
  }

  // Загружаем статистику профиля
  const loadProfileStats = async (tgId: number) => {
    try {
      const response = await fetch(`/api/profile/${tgId}`)
      const data = await response.json()
      if (data.success) {
        setProfileStats(data.stats)
        setUsedFreeHookahs(data.usedFreeHookahs || [])
        setHookahHistory(data.hookahHistory || [])
      }
    } catch (error) {
      console.error('Error loading profile stats:', error)
    }
  }

  // Обновляем профиль
  const updateProfile = async () => {
    if (!user?.id || isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: user.id,
          first_name: editForm.first_name,
          last_name: editForm.last_name
        }),
      })

      const data = await response.json()
      if (data.success) {
        setProfileData(data.user)
        setIsEditing(false)
        alert('Профиль успешно обновлен!')
      } else {
        alert('Ошибка обновления: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Ошибка обновления профиля')
    } finally {
      setIsSaving(false)
    }
  }

  // Получение TG ID из базы данных
  const getTgIdFromDb = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`/api/check-registration?tg_id=${userId}`)
      const data = await response.json()
      if (data.success && data.user?.tg_id) {
        return data.user.tg_id
      }
    } catch (error) {
      console.error('Error getting TG ID from DB:', error)
    }
    return null
  }, [])

  // Проверка админских прав
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) return
    
    let tgId = user.tg_id
    
    // Если tg_id не получен из Telegram, получаем из базы данных
    if (!tgId || tgId === 0) {
      tgId = await getTgIdFromDb(user.id)
    }
    
    if (!tgId) {
      console.error('Could not get TG ID for admin check')
      return
    }
    
    console.log(`Checking admin status for user ${user.first_name} ${user.last_name} (TG ID: ${tgId})`)
    
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: String(tgId),
          action: 'check_admin',
          admin_key: 'admin123'
        }),
      })

      const data = await response.json()
      console.log('Admin check response:', data)
      
      if (data.success) {
        setIsAdmin(data.is_admin)
        setAdminStatusChecked(true)
        console.log(`Admin status: ${data.is_admin ? 'ADMIN' : 'USER'}`)
      } else {
        console.error('Admin check failed:', data.message)
        // Fallback: проверяем по известным админам
        const knownAdmins = [937011437, 1159515006] // Ваш ID и Кирилл
        if (knownAdmins.includes(Number(tgId))) {
          console.log('User is known admin, setting admin status')
          setIsAdmin(true)
          setAdminStatusChecked(true)
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      // Fallback: проверяем по известным админам
      const knownAdmins = [937011437, 1159515006] // Ваш ID и Кирилл
      if (knownAdmins.includes(Number(tgId))) {
        console.log('User is known admin (fallback), setting admin status')
        setIsAdmin(true)
        setAdminStatusChecked(true)
      }
    }
  }, [user?.id, user?.tg_id, user?.first_name, user?.last_name, getTgIdFromDb])

  // Загружаем данные профиля когда получаем пользователя
  useEffect(() => {
    if (user?.id && isInTelegram) {
      loadProfileData(user.id)
      loadProfileStats(user.id)
      checkAdminRights(user.id)
      checkAdminStatus()
    }
  }, [user, isInTelegram, checkAdminStatus])

  // Добавляем периодическое обновление данных для отслеживания изменений
  useEffect(() => {
    if (!user?.id || !isInTelegram) return

    const interval = setInterval(() => {
      loadProfileStats(user.id)
    }, 5000) // Обновляем каждые 5 секунд

    return () => clearInterval(interval)
  }, [user, isInTelegram])

  // Добавляем обработчик для обновления данных при возвращении на страницу
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && isInTelegram) {
        loadProfileStats(user.id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, isInTelegram])

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  // Проверяем админские права
  const checkAdminRights = async (tgId: number) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: tgId,
          action: 'check_admin',
          admin_key: process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsAdmin(data.is_admin)
      }
    } catch (error) {
      console.error('Error checking admin rights:', error)
    }
  }


  // Обработка сканирования QR кода с камеры
  const handleQRScan = (result: string) => {
    setShowQRScanner(false)
    
    // Автоматически сканируем QR код без показа поля ввода
    scanQrCodeDirectly(result)
  }

  // Прямое сканирование QR кода без проверки поля ввода
  const scanQrCodeDirectly = async (qrData: string) => {
    if (!qrData.trim()) {
      alert('Ошибка: пустые данные QR кода')
      return
    }

    try {
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_data: qrData,
          admin_key: 'admin123'
        }),
      })

      const data = await response.json()
      setScanResult(data)
      
      if (data.success) {
        alert(`QR код отсканирован! Пользователь: ${data.user.first_name} ${data.user.last_name}`)
        setQrScannerOpen(false)
        
        // Принудительно обновляем статистику профиля
        if (user?.id) {
          // Множественные обновления для надежности
          loadProfileStats(user.id)
          setTimeout(() => loadProfileStats(user.id), 500)
          setTimeout(() => loadProfileStats(user.id), 1000)
          setTimeout(() => loadProfileStats(user.id), 2000)
          setTimeout(() => loadProfileStats(user.id), 5000)
        }
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('Ошибка сканирования QR кода')
    }
  }

  // Назначение админских прав
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

    // Получаем TG ID текущего пользователя
    let currentTgId = user.tg_id
    if (!currentTgId || currentTgId === 0) {
      currentTgId = await getTgIdFromDb(user.id)
    }

    if (!currentTgId) {
      alert('Ошибка: не удалось получить ваш Telegram ID')
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
          tg_id: String(currentTgId), // TG ID текущего пользователя (админа)
          target_tg_id: String(tgId), // TG ID пользователя, которому выдаем права
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

  // Подтверждение по номеру телефона
  const confirmByPhone = async () => {
    if (!phoneDigits.trim()) {
      alert('Введите последние 4 цифры номера телефона')
      return
    }

    if (phoneDigits.length !== 4 || !/^\d{4}$/.test(phoneDigits)) {
      alert('Введите ровно 4 цифры')
      return
    }

    try {
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_digits: phoneDigits,
          admin_key: 'admin123'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Кальян подтвержден! Пользователь: ${data.user.first_name} ${data.user.last_name}`)
        setPhoneDigits('')
        setQrScannerOpen(false)
        
        // Принудительно обновляем статистику профиля
        if (user?.id) {
          // Множественные обновления для надежности
          loadProfileStats(user.id)
          setTimeout(() => loadProfileStats(user.id), 500)
          setTimeout(() => loadProfileStats(user.id), 1000)
          setTimeout(() => loadProfileStats(user.id), 2000)
          setTimeout(() => loadProfileStats(user.id), 5000)
        }
      } else {
        alert('❌ Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error confirming by phone:', error)
      alert('❌ Ошибка при подтверждении по номеру телефона')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center">
            <div className="flex items-start justify-between mb-2">
              <Link 
                href="/"
                className="text-white hover:text-gray-300 transition-colors flex items-center font-bold -mt-2 -ml-2"
              >
                <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-base font-bold">Назад</span>
              </Link>
              <h1 className="text-3xl font-bold text-white">
                👤 Профиль
              </h1>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>
            <p className="text-gray-300 mb-8">
              Управляйте своим профилем
            </p>

          {isInTelegram && user ? (
            <div className="space-y-4">
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-purple-300">Информация о пользователе</h3>
                  <div className="flex items-center gap-2">
                    {adminStatusChecked && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isAdmin 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isAdmin ? '👑 Админ' : '👤 Пользователь'}
                      </span>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        ✏️ Редактировать
                      </button>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">Имя</label>
                      <input
                        type="text"
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Введите имя"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">Фамилия</label>
                      <input
                        type="text"
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Введите фамилию"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={updateProfile}
                        disabled={isSaving}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-md text-sm font-medium"
                      >
                        {isSaving ? '💾 Сохранение...' : '💾 Сохранить'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditForm({
                            first_name: profileData?.first_name || '',
                            last_name: profileData?.last_name || ''
                          })
                        }}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium"
                      >
                        ❌ Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-left space-y-2 text-purple-800 text-sm">
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Имя:</strong> {profileData?.first_name || user.first_name || 'Не указано'}</p>
                    <p><strong>Фамилия:</strong> {profileData?.last_name || user.last_name || 'Не указано'}</p>
                    <p><strong>Телефон:</strong> {profileData?.phone || 'Не указано'}</p>
                    <p><strong>Username:</strong> @{user.username || 'Не указано'}</p>
                  </div>
                )}
              </div>
              
              {/* Админские функции */}
              {isAdmin && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
                  <h3 className="font-semibold text-red-300 mb-2">🔧 Админ панель</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowQRScanner(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                      >
                        📷 Камера
                      </button>
                      <button
                        onClick={() => setQrScannerOpen(!qrScannerOpen)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                      >
                        {qrScannerOpen ? '❌ Закрыть' : '📝 Ввод'}
                      </button>
                    </div>
                    
                    <div className="pt-2 border-t border-red-200">
                      <button
                        onClick={() => setAdminPanelOpen(!adminPanelOpen)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                      >
                        {adminPanelOpen ? '❌ Закрыть' : '👑 Назначить админа'}
                      </button>
                    </div>
                    
                    {qrScannerOpen && (
                      <div className="space-y-3">
                        {/* Кнопка сканирования QR кода через камеру */}
                        <button
                          onClick={() => setShowQRScanner(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md text-sm font-medium flex items-center justify-center space-x-2"
                        >
                          <span>📱</span>
                          <span>Сканировать QR код камерой</span>
                        </button>

                        {/* Разделитель */}
                        <div className="flex items-center">
                          <div className="flex-1 border-t border-gray-300"></div>
                          <span className="px-3 text-gray-500 text-sm">или</span>
                          <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Ввод последних 4 цифр номера телефона */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-red-300">
                            Последние 4 цифры номера телефона:
                          </label>
                          <input
                            type="text"
                            value={phoneDigits}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                              setPhoneDigits(value)
                            }}
                            placeholder="Например: 1234"
                            className="w-full px-3 py-2 border-2 border-red-400 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-xl font-bold text-black bg-white shadow-inner"
                            maxLength={4}
                          />
                          <button
                            onClick={confirmByPhone}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                          >
                            ✅ Подтвердить кальян
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {adminPanelOpen && (
                      <div className="space-y-2 pt-2 border-t border-red-200">
                        <div>
                          <label className="block text-sm font-medium text-red-300 mb-1">
                            Telegram ID пользователя:
                          </label>
                          <input
                            type="number"
                            value={newAdminTgId}
                            onChange={(e) => setNewAdminTgId(e.target.value)}
                            placeholder="Введите Telegram ID..."
                            className="w-full px-3 py-2 border-2 border-red-400 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-black bg-white shadow-inner font-mono"
                          />
                        </div>
                        <button
                          onClick={grantAdminRights}
                          disabled={isGrantingAdmin}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-md text-sm font-medium"
                        >
                          {isGrantingAdmin ? '⏳ Назначаем...' : '👑 Назначить админа'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="font-semibold text-blue-300 mb-2">Статистика</h3>
                <div className="text-left space-y-2 text-blue-200 text-sm">
                  <p>Дата регистрации: {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('ru-RU') : 'Сегодня'}</p>
                  <p>Выкурено всего кальянов: {profileStats?.totalSmokedHookahs || 0}</p>
                  <p>Получено бесплатных: {profileStats?.freeHookahsReceived || 0}</p>
                </div>
                
                {/* История всех выкуренных кальянов */}
                {hookahHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <h4 className="font-medium text-blue-300 mb-2">История получения кальянов:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {hookahHistory.map((hookah) => (
                        <div key={hookah.id} className="text-xs text-blue-200 bg-blue-800/50 rounded px-3 py-2 flex justify-between items-center backdrop-blur-sm">
                          <div className="flex items-center space-x-2">
                            <span>
                              {hookah.hookah_type === 'regular' 
                                ? '🚬 Кальян' 
                                : '🎁 Бесплатный кальян'
                              }
                            </span>
                          </div>
                          <span className="text-blue-300 text-xs">
                            {new Date(hookah.created_at).toLocaleDateString('ru-RU')} в {new Date(hookah.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-red-300 text-sm">
                ❌ Откройте приложение в Telegram для просмотра профиля
              </p>
            </div>
          )}

        </div>
      </div>
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </main>
    </div>
  )
}
