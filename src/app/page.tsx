"use client"
import React, { useEffect, useState, useCallback } from 'react'
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
  const [jsLoaded, setJsLoaded] = useState(false)
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [hasCheckedRegistration, setHasCheckedRegistration] = useState(false)

  useEffect(() => {
    console.log('useEffect running - JavaScript is working!')
    
    // Check if JavaScript is working
    setJsLoaded(true)
    
    // Load Telegram WebApp script
    const loadTelegramScript = () => {
      if (typeof window !== 'undefined' && !(window as any).Telegram) {
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-web-app.js'
        script.async = true
        script.onload = () => {
          console.log('Telegram WebApp script loaded')
          checkTelegramWebApp()
        }
        script.onerror = () => {
          console.error('Failed to load Telegram WebApp script')
        }
        document.head.appendChild(script)
      } else {
        checkTelegramWebApp()
      }
    }

    const checkTelegramWebApp = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          setIsInTelegram(true)
          const tgUser = (window as any).Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
          if (tgUser) {
            // Исправляем порядок имени и фамилии
            const correctedUser = {
              ...tgUser,
              first_name: tgUser.first_name || '',
              last_name: tgUser.last_name || ''
            }
            setUser(correctedUser)
          }
        }
      } catch (error) {
        console.error('Error checking Telegram WebApp:', error)
      }
    }

    // Delay loading Telegram script to ensure basic JS works first
    setTimeout(loadTelegramScript, 100)
  }, [])

  // Функция проверки регистрации пользователя
  const checkUserRegistration = useCallback(async (tgId: number) => {
    if (isChecking || hasCheckedRegistration) return // Предотвращаем множественные запросы
    
    setIsChecking(true)
    setHasCheckedRegistration(true)
    try {
      const response = await fetch('/api/check-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tg_id: tgId }),
      })

      const data = await response.json()
      console.log('Registration check result:', data)

      if (data.success) {
        setIsRegistered(data.registered)
        
        // Если пользователь зарегистрирован, показываем сообщение и остаемся на главной
        if (data.registered) {
          console.log('User is already registered, staying on main page')
        }
      } else {
        console.error('Failed to check registration:', data.message)
        setIsRegistered(false)
      }
    } catch (error) {
      console.error('Error checking registration:', error)
      setIsRegistered(false)
    } finally {
      setIsChecking(false)
    }
  }, [isChecking, hasCheckedRegistration])

  // Проверяем регистрацию когда получаем данные пользователя
  useEffect(() => {
    if (user?.id && isInTelegram) {
      checkUserRegistration(user.id)
    }
  }, [user, isInTelegram, checkUserRegistration])

  const openWebApp = () => {
    console.log('openWebApp called') // Debug log
    
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.error('Window object is not available')
        return
      }

      const webAppUrl = typeof window !== 'undefined' && window.location 
        ? `${window.location.origin}/register` 
        : '/register'
      const botUsername = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'pop_222_bot' // Fallback to known bot name
      
      console.log('Bot username:', botUsername) // Debug log
      console.log('WebApp URL:', webAppUrl) // Debug log

      if ((window as any).Telegram?.WebApp) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-20">
            <h1 className="text-3xl font-bold text-white tracking-wider">
              <span className="text-red-500">D</span>UNGEON
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🎉 Добро пожаловать!
            </h1>
            <p className="text-gray-300 mb-8">
              Зарегистрируйтесь в нашем приложении
            </p>

          {isInTelegram ? (
            <div className="space-y-4">
              {user && (
                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
                  <p className="text-green-300 text-sm">
                    👋 Привет, {user.first_name || user.last_name || 'пользователь'}!
                  </p>
                  {isChecking && (
                    <p className="text-green-400 text-xs mt-1">
                      🔍 Проверяем статус регистрации...
                    </p>
                  )}
                  {isRegistered === true && (
                    <p className="text-green-400 text-xs mt-1">
                      ✅ Вы зарегистрированы!
                    </p>
                  )}
                  {isRegistered === false && (
                    <p className="text-orange-400 text-xs mt-1">
                      ⚠️ Требуется регистрация
                    </p>
                  )}
                </div>
              )}
              
              {isRegistered === true ? (
                // Показываем кнопки для зарегистрированных пользователей
                <div className="grid grid-cols-1 gap-3">
                  <Link 
                    href="/stocks"
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center"
                  >
                    <span className="mr-2">🎁</span>
                    Мои акции
                  </Link>
                  
                  <Link 
                    href="/profile"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center"
                  >
                    <span className="mr-2">👤</span>
                    Профиль
                  </Link>
                </div>
              ) : isRegistered === false ? (
                // Показываем кнопку регистрации для незарегистрированных
                <div className="grid grid-cols-1 gap-3">
                  <Link 
                    href="/register"
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25 flex items-center justify-center"
                  >
                    <span className="mr-2">🚀</span>
                    Начать
                  </Link>
                </div>
              ) : (
                // Показываем загрузку пока проверяем статус
                <div className="grid grid-cols-1 gap-3">
                  <div className="w-full bg-gray-700/50 text-gray-300 font-semibold py-4 px-6 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                    Проверяем статус...
                  </div>
                </div>
              )}
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
                <p>Debug: JavaScript loaded = {jsLoaded ? '✅ да' : '❌ нет'}</p>
                <p>Debug: Bot username = {process.env.NEXT_PUBLIC_TG_BOT_USERNAME || 'не настроен'}</p>
                <p>Debug: URL = {typeof window !== 'undefined' && window.location ? window.location.origin : 'не доступен'}</p>
                <p>Debug: Expected bot = pop_222_bot</p>
                <p>Debug: Window.Telegram = {typeof window !== 'undefined' && (window as any).Telegram ? 'доступен' : 'не доступен'}</p>
                <p>Debug: Window object = {typeof window !== 'undefined' ? 'доступен' : 'не доступен'}</p>
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
    </div>
  )
}
