import React, { createContext, useEffect, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  // App user (registered in your backend)
  const [user, setUser] = useState(null)
  // Raw Telegram user from WebApp context
  const [telegramUser, setTelegramUser] = useState(null)

  // 1) Init Telegram WebApp and read Telegram user
  useEffect(() => {
    const webApp = window?.Telegram?.WebApp
    try {
      webApp?.ready()
      webApp?.expand?.()
      const theme = webApp?.themeParams || {}
      webApp?.setBackgroundColor?.(theme.bg_color || '#ffffff')
      webApp?.setHeaderColor?.(theme.bg_color || '#ffffff')
    } catch (e) {
      // no-op
    }

    const tg = webApp?.initDataUnsafe?.user
    if (tg) {
      setTelegramUser({
        id: tg.id,
        name: tg.first_name,
        surname: tg.last_name || '',
        username: tg.username || ''
      })
    }
  }, [])

  // 2) Restore registered app user from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user')
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // 3) Persist app user to localStorage when it changes
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('user', JSON.stringify(user))
      } catch (e) {
        // ignore
      }
    }
  }, [user])

  const isRegistered = !!user
  const logout = () => {
    setUser(null)
    try { localStorage.removeItem('user') } catch {}
  }

  return (
    <UserContext.Provider value={{ user, setUser, telegramUser, setTelegramUser, isRegistered, logout }}>
      {children}
    </UserContext.Provider>
  )
}