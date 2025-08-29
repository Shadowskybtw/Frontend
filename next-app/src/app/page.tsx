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

export default function HomePage() {
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [user, setUser] = useState<TgUser | null>(null)

  useEffect(() => {
    // Check if we're inside Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setIsInTelegram(true)
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
      if (tgUser) {
        setUser(tgUser)
      }
    }
  }, [])

  const openWebApp = () => {
    // This would be the URL that the bot sends after /start
    const webAppUrl = `${window.location.origin}/register`
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // If already in Telegram, just navigate
      window.location.href = webAppUrl
    } else {
      // If not in Telegram, show instructions
      alert('Откройте эту ссылку в Telegram:\n' + webAppUrl)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Добро пожаловать!
          </h1>
          <p className="text-gray-600 mb-8">
            Зарегистрируйтесь в нашем приложении
          </p>

          {isInTelegram ? (
            <div className="space-y-4">
              {user && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm">
                    👋 Привет, {user.first_name}!
                  </p>
                </div>
              )}
              
              <Link 
                href="/register"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
              >
                📝 Зарегистрироваться
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={openWebApp}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
              >
                🔗 Открыть в Telegram
              </button>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  💡 Для полного доступа к функциям откройте приложение в Telegram
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Что вы получите:
            </h3>
            <ul className="text-left space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Отслеживание прогресса акций
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Бесплатные кальяны
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Персональные предложения
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
