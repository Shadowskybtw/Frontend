"use client"
import React, { useEffect, useState, useCallback } from 'react'
import QRScanner from '@/components/QRScanner'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

export default function ProfilePage() {
  const { user, isInTelegram, loading, isInitialized } = useUser()
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
  const [guestSearchPhone, setGuestSearchPhone] = useState('')
  const [foundGuest, setFoundGuest] = useState<any>(null)
  const [isSearchingGuest, setIsSearchingGuest] = useState(false)
  const [isAddingHookah, setIsAddingHookah] = useState(false)
  const [isRemovingHookah, setIsRemovingHookah] = useState(false)

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

  // Поиск гостя по последним 4 цифрам номера телефона
  const searchGuest = async () => {
    if (!guestSearchPhone || guestSearchPhone.length !== 4) {
      alert('Введите ровно 4 последние цифры номера телефона')
      return
    }
    
    setIsSearchingGuest(true)
    try {
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_digits: guestSearchPhone,
          admin_key: 'admin123'
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.user) {
        setFoundGuest(data.user)
      } else {
        setFoundGuest(null)
        alert('Гость не найден')
      }
    } catch (error) {
      console.error('Error searching guest:', error)
      alert('Ошибка поиска гостя')
    } finally {
      setIsSearchingGuest(false)
    }
  }

  // Добавить кальян гостю (заполняет слот)
  const addHookahToGuest = async () => {
    if (!foundGuest || isAddingHookah) return
    
    setIsAddingHookah(true)
    try {
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_digits: guestSearchPhone,
          admin_key: 'admin123'
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        alert('✅ Кальян добавлен гостю! Слот заполнен.')
        // Обновляем данные гостя
        searchGuest()
      } else {
        alert('Ошибка добавления кальяна: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding hookah to guest:', error)
      alert('Ошибка добавления кальяна')
    } finally {
      setIsAddingHookah(false)
    }
  }

  // Убрать кальян у гостя (освобождает слот)
  const removeHookahFromGuest = async () => {
    if (!foundGuest || isRemovingHookah) return
    
    setIsRemovingHookah(true)
    try {
      const response = await fetch('/api/remove-hookah', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_digits: guestSearchPhone,
          admin_key: 'admin123'
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        alert('✅ Кальян убран у гостя! Слот освобожден.')
        // Обновляем данные гостя
        searchGuest()
      } else {
        alert('Ошибка удаления кальяна: ' + data.message)
      }
    } catch (error) {
      console.error('Error removing hookah from guest:', error)
      alert('Ошибка удаления кальяна')
    } finally {
      setIsRemovingHookah(false)
    }
  }

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center">
            <div className="text-center mb-2">
              <h1 className="text-3xl font-bold text-white">
                👤 Профиль
              </h1>
            </div>
            <p className="text-gray-300 mb-8">
              Управляйте своим профилем
            </p>

          {loading || !isInitialized ? (
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-yellow-300 text-sm">
                ⏳ Загрузка пользователя...
              </p>
            </div>
          ) : user ? (
            <div className="space-y-4">
              {/* Кнопка админа */}
              {isAdmin && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
                  <button
                    onClick={() => setAdminPanelOpen(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span className="text-xl">👑</span>
                    <span>Админ панель</span>
                  </button>
                </div>
              )}

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

              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="font-semibold text-blue-300 mb-2">Статистика</h3>
                <div className="text-left space-y-2 text-blue-200 text-sm">
                  <p>Дата регистрации: {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('ru-RU') : 'Сегодня'}</p>
                  <p>Выкурено всего кальянов: {profileStats?.totalSmokedHookahs || 0}</p>
                  <p>Получено бесплатных: {profileStats?.freeHookahsReceived || 0}</p>
                </div>
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
      
      {/* Admin Panel Modal */}
      {adminPanelOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="text-3xl mr-3">👑</span>
                  Админ панель
                </h2>
                <button
                  onClick={() => setAdminPanelOpen(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* QR Scanner */}
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-300 mb-3">QR Сканер</h3>
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span className="text-xl">📷</span>
                    <span>Открыть сканер</span>
                  </button>
                </div>

                {/* Поиск гостя */}
                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-300 mb-3">Поиск гостя</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-green-300 mb-1">
                        Последние 4 цифры номера телефона:
                      </label>
                      <input
                        type="text"
                        value={guestSearchPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setGuestSearchPhone(value)
                        }}
                        placeholder="Например: 1234"
                        className="w-full px-3 py-2 border-2 border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl font-bold text-black bg-white shadow-inner"
                        maxLength={4}
                      />
                    </div>
                    <button
                      onClick={searchGuest}
                      disabled={isSearchingGuest || guestSearchPhone.length !== 4}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-md text-sm font-medium"
                    >
                      {isSearchingGuest ? '⏳ Поиск...' : '🔍 Найти гостя'}
                    </button>
                  </div>

                  {/* Результат поиска */}
                  {foundGuest && (
                    <div className="mt-4 p-3 bg-green-800/50 rounded-lg border border-green-400">
                      <h4 className="font-semibold text-green-300 mb-2">Найденный гость:</h4>
                      <div className="text-green-200 text-sm space-y-1">
                        <p><strong>Имя:</strong> {foundGuest.first_name} {foundGuest.last_name}</p>
                        <p><strong>Телефон:</strong> {foundGuest.phone || 'Не указан'}</p>
                        <p><strong>Telegram ID:</strong> {foundGuest.tg_id}</p>
                        <p><strong>Username:</strong> @{foundGuest.username || 'Не указан'}</p>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={addHookahToGuest}
                          disabled={isAddingHookah || isRemovingHookah}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-3 rounded-md text-sm font-medium"
                        >
                          {isAddingHookah ? '⏳ Добавляем...' : '➕ Добавить кальян'}
                        </button>
                        <button
                          onClick={removeHookahFromGuest}
                          disabled={isRemovingHookah || isAddingHookah}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-3 rounded-md text-sm font-medium"
                        >
                          {isRemovingHookah ? '⏳ Убираем...' : '➖ Убрать кальян'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Назначение админа */}
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
              </div>
            </div>
          </div>
        </div>
      )}

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
