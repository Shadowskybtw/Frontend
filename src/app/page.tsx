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
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        setIsInTelegram(true)
        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
        if (tgUser) {
          setUser(tgUser)
        }
      }
    } catch (error) {
      console.error('Error checking Telegram WebApp:', error)
    }
  }, [])

  const openWebApp = () => {
    console.log('openWebApp called') // Debug log
    
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.error('Window object is not available')
        return
      }

      const webAppUrl = `${window.location.origin}/register`
      const botUsername = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'pop_222_bot' // Fallback to known bot name
      
      console.log('Bot username:', botUsername) // Debug log
      console.log('WebApp URL:', webAppUrl) // Debug log

      if (window.Telegram?.WebApp) {
        console.log('Already in Telegram WebApp, redirecting to register')
        // We are already inside Telegram WebApp
        window.location.href = webAppUrl
        return
      }

      // Not inside Telegram WebApp: try to open the Telegram app directly
      const tgDeepLink = `tg://resolve?domain=${encodeURIComponent(botUsername)}&start`
      const httpsFallback = `https://t.me/${encodeURIComponent(botUsername)}?start`
      
      console.log('Opening Telegram deep link:', tgDeepLink)
      console.log('Fallback URL:', httpsFallback)

      // Attempt deep link first (mobile Telegram app), fallback to https
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const openFallback = () => {
        console.log('Opening fallback URL')
        window.location.href = httpsFallback
      }
      
      try {
        // iOS needs immediate fallback due to lack of onblur on failed deeplink
        if (isIOS) {
          setTimeout(openFallback, 50)
        } else {
          const timeout = setTimeout(openFallback, 500)
          const onBlur = () => {
            console.log('Window blurred, clearing timeout')
            clearTimeout(timeout)
          }
          window.addEventListener('blur', onBlur, { once: true })
        }
        window.location.href = tgDeepLink
      } catch (error) {
        console.error('Error opening Telegram deep link:', error)
        openFallback()
      }
    } catch (error) {
      console.error('Error in openWebApp:', error)
      alert('Произошла ошибка. Попробуйте обновить страницу.')
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
                type="button"
              >
                🔗 Открыть в Telegram
              </button>
              
              {/* Test button */}
              <button
                onClick={() => {
                  console.log('Test button clicked');
                  alert('Кнопка работает! Проверьте консоль для debug информации.');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center text-sm"
                type="button"
              >
                🧪 Тест кнопки
              </button>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  💡 Для полного доступа к функциям откройте приложение в Telegram
                </p>
              </div>
              
              {/* Debug info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p>Debug: Bot username = {process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'не настроен'}</p>
                <p>Debug: URL = {typeof window !== 'undefined' ? window.location.origin : 'не доступен'}</p>
                <p>Debug: Expected bot = pop_222_bot</p>
                <p>Debug: Window.Telegram = {typeof window !== 'undefined' && window.Telegram ? 'доступен' : 'не доступен'}</p>
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
