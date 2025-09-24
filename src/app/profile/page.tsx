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
                <h3 className="font-semibold text-purple-900 mb-2">Информация о пользователе</h3>
                <div className="text-left space-y-2 text-purple-800 text-sm">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Имя:</strong> {user.first_name || 'Не указано'}</p>
                  <p><strong>Фамилия:</strong> {user.last_name || 'Не указано'}</p>
                  <p><strong>Username:</strong> @{user.username || 'Не указано'}</p>
                </div>
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
