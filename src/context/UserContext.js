import React, { createContext, useEffect, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  // App user (registered in your backend)
  const [user, setUser] = useState(null)
  // Raw Telegram user from WebApp context
  const [telegramUser, setTelegramUser] = useState(null)
  // Telegram context flag
  const [isTg, setIsTg] = useState(false)
  // Raw initData string from Telegram WebApp (for server verification)
  const [initData, setInitData] = useState('')

  // 1) Init Telegram WebApp and read Telegram user
  useEffect(() => {
    console.log('🔍 UserContext: Initializing Telegram WebApp...')
    console.log('🔍 UserContext: window.Telegram:', window?.Telegram)
    console.log('🔍 UserContext: window.Telegram?.WebApp:', window?.Telegram?.WebApp)
    
    const webApp = window?.Telegram?.WebApp
    if (webApp) {
      console.log('✅ UserContext: Telegram WebApp found')
      try {
        webApp.ready()
        console.log('✅ UserContext: WebApp.ready() called')
      } catch (e) {
        console.warn('⚠️ UserContext: WebApp.ready() failed:', e)
      }
      
      try {
        webApp.expand()
        console.log('✅ UserContext: WebApp.expand() called')
      } catch (e) {
        console.warn('⚠️ UserContext: WebApp.expand() failed:', e)
      }
      
      // Save raw initData for backend verification (HMAC)
      try {
        const rawInit = webApp?.initData || ''
        setInitData(rawInit)
        console.log('🔍 UserContext: initData length:', rawInit?.length || 0)
      } catch (e) {
        console.warn('⚠️ UserContext: reading initData failed:', e)
      }
      
      const theme = webApp?.themeParams || {}
      try {
        webApp?.setBackgroundColor?.(theme.bg_color || '#ffffff')
        webApp?.setHeaderColor?.(theme.bg_color || '#ffffff')
        console.log('✅ UserContext: Theme colors set')
      } catch (e) {
        console.warn('⚠️ UserContext: Theme colors failed:', e)
      }
    } else {
      console.warn('⚠️ UserContext: Telegram WebApp not found')
    }

    const tg = webApp?.initDataUnsafe?.user
    console.log('🔍 UserContext: initDataUnsafe.user:', tg)
    
    if (tg) {
      console.log('✅ UserContext: Telegram user found:', tg)
      setTelegramUser({
        id: tg.id,
        name: tg.first_name,
        surname: tg.last_name || '',
        firstName: tg.first_name,
        lastName: tg.last_name || '',
        username: tg.username || ''
      })
    } else {
      console.log('❌ UserContext: No Telegram user data')
    }
    
    const isTelegram = !!tg
    setIsTg(isTelegram)
    console.log('🔍 UserContext: isTg set to:', isTelegram)
    
    // (Optional) Handle Telegram theme changes gracefully
    try {
      webApp?.onEvent?.('themeChanged', () => {
        const theme = webApp?.themeParams || {}
        webApp?.setBackgroundColor?.(theme.bg_color || '#ffffff')
        webApp?.setHeaderColor?.(theme.bg_color || '#ffffff')
        console.log('✅ UserContext: Theme change handled')
      })
    } catch (e) {
      console.warn('⚠️ UserContext: Theme change handler failed:', e)
    }
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
    <UserContext.Provider value={{ user, setUser, telegramUser, setTelegramUser, isRegistered, logout, isTg, initData }}>
      {children}
    </UserContext.Provider>
  )
}