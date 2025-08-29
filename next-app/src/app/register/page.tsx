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
  const initData = useMemo(() => (typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : ''), [])

  useEffect(() => {
    const tgUser = (typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.user : null) as TgUser | undefined
    if (tgUser) {
      setUser(tgUser)
      setForm((prev) => ({
        ...prev,
        name: prev.name || tgUser.first_name || '',
        surname: prev.surname || tgUser.last_name || '',
      }))
    }
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.agree) return alert('Нужно согласиться с правилами')
    const tgIdNum = Number(user?.id)
    if (!Number.isFinite(tgIdNum) || tgIdNum <= 0) return alert('Откройте приложение в Telegram')

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
    if (!resp.ok) {
      const txt = await resp.text()
      return alert(`Ошибка: ${resp.status} ${txt}`)
    }
    const data = await resp.json()
    if (!data?.success) return alert(data?.message || 'Ошибка регистрации')
    alert('Успешно!')
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Регистрация</h1>
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


