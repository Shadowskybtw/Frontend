"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import QRScanner from '@/components/QRScanner'

type TgUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

type TelegramWebApp = {
  initData: string
  initDataUnsafe?: { user?: TgUser }
}

type TelegramWindow = {
  Telegram?: { WebApp?: TelegramWebApp }
}

declare const window: TelegramWindow & Window

export default function ProfilePage() {
  const [user, setUser] = useState<TgUser | null>(null)
  const [isInTelegram, setIsInTelegram] = useState(false)
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
  const [qrData, setQrData] = useState('')
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
  const [inputMode, setInputMode] = useState<'qr' | 'phone'>('qr')
  const [phoneDigits, setPhoneDigits] = useState('')

  useEffect(() => {
    // Load Telegram WebApp script
    const loadTelegramScript = () => {
      if (typeof window !== 'undefined' && !window.Telegram) {
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-web-app.js'
        script.async = true
        script.onload = () => {
          console.log('Telegram WebApp script loaded on profile page')
          checkTelegramWebApp()
        }
        document.head.appendChild(script)
      } else {
        checkTelegramWebApp()
      }
    }

    const checkTelegramWebApp = () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          setIsInTelegram(true)
          const tgUser = window.Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
          if (tgUser) {
            setUser(tgUser)
          }
        }
      } catch (error) {
        console.error('Error checking Telegram WebApp on profile page:', error)
      }
    }

    setTimeout(loadTelegramScript, 100)
  }, [])

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

  // Загружаем данные профиля когда получаем пользователя
  useEffect(() => {
    if (user?.id && isInTelegram) {
      loadProfileData(user.id)
      loadProfileStats(user.id)
      checkAdminRights(user.id)
    }
  }, [user, isInTelegram])

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

  // Сканируем QR код
  const scanQrCode = async () => {
    if (!qrData.trim()) {
      alert('Введите данные QR кода')
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
        setQrData('')
        setQrScannerOpen(false)
        
        // Обновляем статистику профиля после успешного сканирования
        if (user?.id) {
          setTimeout(() => {
            loadProfileStats(user.id)
          }, 500)
          // Дополнительное обновление через 2 секунды для надежности
          setTimeout(() => {
            loadProfileStats(user.id)
          }, 2000)
        }
      } else {
        alert('Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error scanning QR:', error)
      alert('Ошибка сканирования QR кода')
    }
  }

  // Обработка сканирования QR кода с камеры
  const handleQRScan = (result: string) => {
    setQrData(result)
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
        setQrData('')
        setQrScannerOpen(false)
        
        // Обновляем статистику профиля после успешного сканирования
        if (user?.id) {
          setTimeout(() => {
            loadProfileStats(user.id)
          }, 500)
          // Дополнительное обновление через 2 секунды для надежности
          setTimeout(() => {
            loadProfileStats(user.id)
          }, 2000)
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
          tg_id: tgId,
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
        
        // Обновляем статистику профиля после успешного подтверждения
        if (user?.id) {
          setTimeout(() => {
            loadProfileStats(user.id)
          }, 500)
          setTimeout(() => {
            loadProfileStats(user.id)
          }, 2000)
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
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👤 Профиль
          </h1>
          <p className="text-gray-600 mb-8">
            Управляйте своим профилем
          </p>

          {isInTelegram && user ? (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-purple-900">Информация о пользователе</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      ✏️ Редактировать
                    </button>
                  )}
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
                    <p><strong>Username:</strong> @{user.username || 'Не указано'}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Статистика</h3>
                <div className="text-left space-y-2 text-blue-800 text-sm">
                  <p>Зарегистрирован: {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('ru-RU') : 'Сегодня'}</p>
                  <p>Всего выкурено кальянов: {profileStats?.totalSmokedHookahs || 0}</p>
                  <p>Получено бесплатных: {profileStats?.freeHookahsReceived || 0}</p>
                </div>
                
                {/* История всех выкуренных кальянов */}
                {hookahHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">История кальянов:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {hookahHistory.map((hookah) => (
                        <div key={hookah.id} className="text-xs text-blue-700 bg-blue-100 rounded px-2 py-1 flex justify-between items-center">
                          <span>
                            {hookah.hookah_type === 'regular' 
                              ? '🚬 Кальян' 
                              : '🎁 Бесплатный'
                            }
                          </span>
                          <span className="text-blue-600">
                            {new Date(hookah.created_at).toLocaleDateString('ru-RU')} в {new Date(hookah.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Админские функции */}
              {isAdmin && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">🔧 Админ панель</h3>
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
                      <div className="space-y-2">
                        {/* Переключатель режимов */}
                        <div className="flex bg-gray-100 rounded-md p-1">
                          <button
                            onClick={() => setInputMode('qr')}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium ${
                              inputMode === 'qr' 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            📱 QR код
                          </button>
                          <button
                            onClick={() => setInputMode('phone')}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium ${
                              inputMode === 'phone' 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            📞 Телефон
                          </button>
                        </div>

                        {/* Режим QR кода */}
                        {inputMode === 'qr' && (
                          <div className="space-y-2">
                    <textarea
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      placeholder="Вставьте данные QR кода сюда..."
                      className="w-full px-3 py-2 border-2 border-red-400 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none text-sm text-black bg-white shadow-inner font-mono"
                    />
                            <button
                              onClick={scanQrCode}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                            >
                              🔍 Сканировать QR код
                            </button>
                          </div>
                        )}

                        {/* Режим номера телефона */}
                        {inputMode === 'phone' && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium text-red-900 mb-1">
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
                            </div>
                            <button
                              onClick={confirmByPhone}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                            >
                              ✅ Подтвердить кальян
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {adminPanelOpen && (
                      <div className="space-y-2 pt-2 border-t border-red-200">
                        <div>
                          <label className="block text-sm font-medium text-red-900 mb-1">
                            Telegram ID пользователя:
                          </label>
                          <input
                            type="number"
                            value={newAdminTgId}
                            onChange={(e) => setNewAdminTgId(e.target.value)}
                            placeholder="Введите Telegram ID..."
                            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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


              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Настройки</h3>
                <p className="text-green-800 text-sm">
                  Здесь будут настройки профиля
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                ❌ Откройте приложение в Telegram для просмотра профиля
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Вернуться на главную
            </Link>
          </div>
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
  )
}
