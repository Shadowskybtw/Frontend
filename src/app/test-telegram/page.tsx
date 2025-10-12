'use client'

import { useEffect, useState } from 'react'

export default function TestTelegramPage() {
  const [telegramData, setTelegramData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Проверяем наличие Telegram WebApp
    const checkTelegramWebApp = () => {
      const data: any = {
        isInTelegram: false,
        hasWebApp: false,
        hasInitData: false,
        hasUser: false,
        initData: '',
        user: null
      }

      if (typeof window !== 'undefined') {
        data.isInTelegram = !!(window as any).Telegram
        data.hasWebApp = !!(window as any).Telegram?.WebApp
        data.hasInitData = !!(window as any).Telegram?.WebApp?.initData
        data.initData = (window as any).Telegram?.WebApp?.initData || ''
        data.hasUser = !!(window as any).Telegram?.WebApp?.initDataUnsafe?.user
        data.user = (window as any).Telegram?.WebApp?.initDataUnsafe?.user || null
      }

      setTelegramData(data)

      // Если есть пользователь, пробуем зарегистрировать/проверить
      if (data.user) {
        registerOrCheckUser(data.user, data.initData)
      }
    }

    const registerOrCheckUser = async (tgUser: any, initData: string) => {
      try {
        console.log('🔍 Trying to check/register user:', tgUser)
        
        const response = await fetch('/api/check-or-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-telegram-init-data': initData
          },
          body: JSON.stringify({
            tg_id: tgUser.id,
            firstName: tgUser.first_name || 'Unknown',
            lastName: tgUser.last_name || 'User',
            username: tgUser.username
          })
        })

        const data = await response.json()
        console.log('📡 API response:', data)
        
        if (data.success) {
          setUser(data.user)
        } else {
          console.error('❌ API error:', data.message)
        }
      } catch (error) {
        console.error('❌ Request error:', error)
      }
    }

    checkTelegramWebApp()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔧 Тест Telegram WebApp</h1>
        
        <div className="space-y-6">
          {/* Telegram WebApp Status */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">📱 Статус Telegram WebApp</h2>
            {telegramData ? (
              <div className="space-y-2 text-white">
                <div className="flex justify-between">
                  <span>В Telegram:</span>
                  <span className={telegramData.isInTelegram ? 'text-green-400' : 'text-red-400'}>
                    {telegramData.isInTelegram ? '✅ Да' : '❌ Нет'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>WebApp доступен:</span>
                  <span className={telegramData.hasWebApp ? 'text-green-400' : 'text-red-400'}>
                    {telegramData.hasWebApp ? '✅ Да' : '❌ Нет'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>InitData доступен:</span>
                  <span className={telegramData.hasInitData ? 'text-green-400' : 'text-red-400'}>
                    {telegramData.hasInitData ? '✅ Да' : '❌ Нет'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Пользователь доступен:</span>
                  <span className={telegramData.hasUser ? 'text-green-400' : 'text-red-400'}>
                    {telegramData.hasUser ? '✅ Да' : '❌ Нет'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Загрузка...</p>
            )}
          </div>

          {/* InitData */}
          {telegramData?.initData && (
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">📡 InitData</h2>
              <div className="bg-black/50 rounded p-4 font-mono text-sm text-gray-300 break-all">
                {telegramData.initData}
              </div>
            </div>
          )}

          {/* Telegram User */}
          {telegramData?.user && (
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">👤 Пользователь Telegram</h2>
              <div className="space-y-2 text-white">
                <div><strong>ID:</strong> {telegramData.user.id}</div>
                <div><strong>Имя:</strong> {telegramData.user.first_name}</div>
                <div><strong>Фамилия:</strong> {telegramData.user.last_name}</div>
                <div><strong>Username:</strong> @{telegramData.user.username}</div>
              </div>
            </div>
          )}

          {/* API Response */}
          {user && (
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">✅ API Ответ</h2>
              <div className="space-y-2 text-white">
                <div><strong>ID в БД:</strong> {user.id}</div>
                <div><strong>TG ID:</strong> {user.tg_id}</div>
                <div><strong>Имя:</strong> {user.first_name} {user.last_name}</div>
                <div><strong>Телефон:</strong> {user.phone}</div>
                <div><strong>Username:</strong> @{user.username}</div>
                <div><strong>Админ:</strong> {user.is_admin ? 'Да' : 'Нет'}</div>
                <div><strong>Всего покупок:</strong> {user.total_purchases}</div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900/30 rounded-2xl p-6 border border-blue-500/50">
            <h2 className="text-xl font-bold text-white mb-4">📋 Инструкции</h2>
            <div className="text-gray-300 space-y-2">
              <p>1. Откройте эту страницу в Telegram WebApp</p>
              <p>2. Проверьте статус Telegram WebApp</p>
              <p>3. Если все зеленые - API должен работать</p>
              <p>4. Если красные - проблема с Telegram окружением</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
