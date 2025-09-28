"use client"
import React, { useEffect, useState, useCallback } from 'react'

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

export default function RegisterPage() {
  const [user, setUser] = useState<TgUser | null>(null)
  const [form, setForm] = useState({ name: '', surname: '', phone: '', agree: false })
  const [initData, setInitData] = useState('')
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [hasCheckedRegistration, setHasCheckedRegistration] = useState(false)

  useEffect(() => {
    // Load Telegram WebApp script
    const loadTelegramScript = () => {
      if (typeof window !== 'undefined' && !(window as any).Telegram) {
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-web-app.js'
        script.async = true
        script.onload = () => {
          console.log('Telegram WebApp script loaded on register page')
          checkTelegramWebApp()
        }
        script.onerror = () => {
          console.error('Failed to load Telegram WebApp script on register page')
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
          const tgInitData = (window as any).Telegram.WebApp.initData || ''
          
          setInitData(tgInitData)
          
          if (tgUser) {
            // Исправляем порядок имени и фамилии
            const correctedUser = {
              ...tgUser,
              first_name: tgUser.first_name || '',
              last_name: tgUser.last_name || ''
            }
            setUser(correctedUser)
            // Не автозаполняем поля имени и фамилии
            // setForm((prev) => ({
            //   ...prev,
            //   name: prev.name || tgUser.first_name || '',
            //   surname: prev.surname || tgUser.last_name || '',
            // }))
          }
        }
      } catch (error) {
        console.error('Error checking Telegram WebApp on register page:', error)
      }
    }

    // Delay loading Telegram script to ensure basic JS works first
    setTimeout(loadTelegramScript, 100)
  }, [])

  // Функция проверки регистрации пользователя
  const checkUserRegistration = useCallback(async (tgId: number) => {
    if (isChecking || hasCheckedRegistration) return
    
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

      if (data.success) {
        // Если пользователь уже зарегистрирован, перенаправляем на главную
        if (data.registered) {
          window.location.href = '/'
        }
      } else {
        console.error('Failed to check registration:', data.message)
      }
    } catch (error) {
      console.error('Error checking registration:', error)
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.agree) return alert('Нужно согласиться с правилами')
    
    const tgIdNum = Number(user?.id)
    
    if (!Number.isFinite(tgIdNum) || tgIdNum <= 0) {
      console.error('Invalid TG ID or not in Telegram')
      return alert('Откройте приложение в Telegram')
    }
    const resp = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': initData,
      },
      body: JSON.stringify({
        tg_id: tgIdNum,
        firstName: form.name,
        lastName: form.surname,
        phone: form.phone,
        username: user?.username || null,
      }),
    })
    
    console.log('Response status:', resp.status)
    
    if (!resp.ok) {
      const txt = await resp.text()
      console.error('Registration error:', txt)
      
      // Обработка ошибки 409 - пользователь уже зарегистрирован
      if (resp.status === 409) {
        try {
          const errorData = JSON.parse(txt)
          if (errorData.message === 'User already registered') {
            alert('Вы уже зарегистрированы! Переходим к главной странице...')
            // Редирект на главную страницу
            window.location.href = '/'
            return
          }
        } catch {
          // Если не удалось распарсить JSON, показываем обычную ошибку
        }
      }
      
      return alert(`Ошибка: ${resp.status} ${txt}`)
    }
    const data = await resp.json()
    console.log('Registration response:', data)
    if (!data?.success) return alert(data?.message || 'Ошибка регистрации')
    
    // Успешная регистрация
    alert('Регистрация успешна! Переходим к главной странице...')
    // Редирект на главную страницу
    window.location.href = '/'
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
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Регистрация</h1>
      
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-300">Имя</label>
            <input name="name" value={form.name} onChange={onChange} required className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-300">Фамилия</label>
            <input name="surname" value={form.surname} onChange={onChange} required className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-300">Телефон</label>
          <input name="phone" value={form.phone} onChange={onChange} required className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500" /> Я согласен с правилами и политикой
        </label>
        <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25">
          🚀 Зарегистрироваться
        </button>
      </form>
        </div>
      </main>
    </div>
  )
}


