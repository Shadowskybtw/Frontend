import React, { createContext, useEffect, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  // App user (registered in your backend)
  const [user, setUser] = useState(null)
  // Raw Telegram user from WebApp context
  const [telegramUser, setTelegramUser] = useState(null)
  // Telegram context flag
  const [isTg, setIsTg] = useState(false)

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
    setIsTg(!!tg)
    // (Optional) Handle Telegram theme changes gracefully
    try {
      webApp?.onEvent?.('themeChanged', () => {
        const theme = webApp?.themeParams || {}
        webApp?.setBackgroundColor?.(theme.bg_color || '#ffffff')
        webApp?.setHeaderColor?.(theme.bg_color || '#ffffff')
      })
    } catch (e) {}
  }, [])

  // 2) Restore registered app user from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user')
      if (saved) {
        const savedUser = JSON.parse(saved)
        // Проверяем, что сохраненный пользователь валиден
        if (savedUser && savedUser.phone && String(savedUser.phone).trim().length > 0) {
          setUser(savedUser)
        } else {
          // Очищаем невалидные данные
          localStorage.removeItem('user')
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // 2b) Handle Telegram context changes
  useEffect(() => {
    if (isTg && telegramUser?.id) {
      // В Telegram контексте проверяем пользователя через API
      // но не очищаем localStorage автоматически
      console.log('Telegram context detected:', telegramUser.id)
    }
  }, [isTg, telegramUser?.id])

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