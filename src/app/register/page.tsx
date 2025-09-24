"use client"
import React, { useEffect, useMemo, useState } from 'react'

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

  useEffect(() => {
    // Load Telegram WebApp script
    const loadTelegramScript = () => {
      if (typeof window !== 'undefined' && !window.Telegram) {
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
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          setIsInTelegram(true)
          const tgUser = window.Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
          const tgInitData = window.Telegram.WebApp.initData || ''
          
          setInitData(tgInitData)
          
          if (tgUser) {
            setUser(tgUser)
            setForm((prev) => ({
              ...prev,
              name: prev.name || tgUser.first_name || '',
              surname: prev.surname || tgUser.last_name || '',
            }))
          }
        }
      } catch (error) {
        console.error('Error checking Telegram WebApp on register page:', error)
      }
    }

    // Delay loading Telegram script to ensure basic JS works first
    setTimeout(loadTelegramScript, 100)
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submission started')
    console.log('User:', user)
    console.log('InitData:', initData)
    console.log('IsInTelegram:', isInTelegram)
    
    if (!form.agree) return alert('Нужно согласиться с правилами')
    
    const tgIdNum = Number(user?.id)
    console.log('TG ID:', tgIdNum)
    
    if (!Number.isFinite(tgIdNum) || tgIdNum <= 0) {
      console.error('Invalid TG ID or not in Telegram')
      return alert('Откройте приложение в Telegram. Debug: TG ID = ' + tgIdNum + ', User = ' + JSON.stringify(user))
    }

    console.log('Sending registration request...')
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
      return alert(`Ошибка: ${resp.status} ${txt}`)
    }
    const data = await resp.json()
    console.log('Registration response:', data)
    if (!data?.success) return alert(data?.message || 'Ошибка регистрации')
    alert('Успешно!')
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Регистрация</h1>
      
      {/* Debug info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 mb-4">
        <p>Debug: IsInTelegram = {isInTelegram ? '✅ да' : '❌ нет'}</p>
        <p>Debug: User ID = {user?.id || 'не загружен'}</p>
        <p>Debug: InitData = {initData ? 'есть' : 'нет'}</p>
        <p>Debug: Window.Telegram = {typeof window !== 'undefined' && window.Telegram ? 'доступен' : 'не доступен'}</p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Имя</label>
            <input name="name" value={form.name} onChange={onChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Фамилия</label>
            <input name="surname" value={form.surname} onChange={onChange} required className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Телефон</label>
          <input name="phone" value={form.phone} onChange={onChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} /> Я согласен с правилами и политикой
        </label>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Зарегистрироваться</button>
      </form>
    </main>
  )
}


