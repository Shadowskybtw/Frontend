"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

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
  } | null>(null)

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
    }
  }, [user, isInTelegram])

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
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
                  <p>Зарегистрирован: Сегодня</p>
                  <p>Акций выполнено: 0</p>
                  <p>Кальянов получено: 0</p>
                </div>
              </div>
              
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
    </main>
  )
}
