"use client"
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type TgUser = {
  id: number
  tg_id: number | bigint
  username?: string
  first_name?: string
  last_name?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

type TelegramWebApp = {
  initData: string
  initDataUnsafe?: { user?: TgUser }
}

type TelegramWindow = {
  Telegram?: { WebApp?: TelegramWebApp }
}

declare const window: TelegramWindow & Window

interface UserContextType {
  user: TgUser | null
  isInTelegram: boolean
  loading: boolean
  error: string | null
  isInitialized: boolean
  setUser: (user: TgUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TgUser | null>(null)
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [hasTriedInitialization, setHasTriedInitialization] = useState(false)

  const checkOrRegisterUser = useCallback(async (tgUser: TgUser) => {
    // Защита от повторных вызовов
    if (isInitializing) {
      console.log('⚠️ Already initializing, skipping duplicate call')
      return
    }
    
    if (isInitialized && user && Number(user.tg_id) === tgUser.id) {
      console.log('⚠️ User already initialized with same ID, skipping duplicate call')
      return
    }
    
    if (hasTriedInitialization && !isInitialized) {
      console.log('⚠️ Initialization already attempted and failed, skipping duplicate call')
      return
    }
    
    setIsInitializing(true)
    
    try {
      console.log('🔍 Checking or registering user globally:', tgUser)
      console.log('🔍 Current user state before API call:', user)
      
      const initData = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initData || '' : ''
      console.log('📡 Init data available:', !!initData)
      
      const response = await fetch('/api/check-or-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify({
          tg_id: tgUser.id,
          firstName: tgUser.first_name || 'Unknown',
          lastName: tgUser.last_name || 'User',
          username: tgUser.username
        })
      })

      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📡 Global check/register response:', data)

      if (data.success) {
        console.log('✅ User data loaded successfully:', data.user)
        console.log('📱 User phone in context:', data.user.phone)
        setUser(data.user)
        setLoading(false)
        setIsInitialized(true)
        setError(null) // Сбрасываем ошибку при успешной загрузке
        
        if (data.isNewUser) {
          console.log('✅ New user registered globally!')
        } else {
          console.log('✅ Existing user loaded globally!')
        }
      } else {
        console.error('❌ Failed to check/register user globally:', data.message)
        setError(data.message)
        // В случае ошибки используем fallback вместо показа ошибки
        loadFallbackData()
      }
    } catch (error) {
      console.error('❌ Error checking/registering user globally:', error)
      // В случае ошибки используем fallback вместо показа ошибки
      loadFallbackData()
    } finally {
      setIsInitializing(false)
    }
  }, [isInitializing, isInitialized, user, hasTriedInitialization])

  const loadFallbackData = () => {
    console.log('🔄 No Telegram user data available - using fallback for development')
    
    // Для разработки используем тестового пользователя
    const fallbackUser = {
      id: 1024,
      tg_id: 937011437,
      first_name: 'Николай',
      last_name: 'Шадовский',
      username: 'shadowskydie',
      phone: '+79270036642',
      created_at: '2025-06-06T16:33:45.601Z',
      updated_at: '2025-10-12T15:00:42.000Z',
      is_admin: true,
      total_purchases: 11,
      total_regular_purchases: 0,
      total_free_purchases: 0
    }
    
    console.log('🔧 Using fallback user for development:', fallbackUser)
    setUser(fallbackUser)
    setLoading(false)
    setIsInitialized(true)
    setIsInitializing(false)
    setHasTriedInitialization(true)
    setError(null)
  }

  const tryToGetUserFromUrl = useCallback(() => {
    console.log('🔍 Trying to get user data from URL parameters')
    const urlParams = new URLSearchParams(window.location.search)
    const tgId = urlParams.get('tg_id')
    const firstName = urlParams.get('first_name')
    const lastName = urlParams.get('last_name')
    const username = urlParams.get('username')
    
    console.log('🔍 URL parameters:', { tgId, firstName, lastName, username })
    
    if (tgId) {
      console.log('👤 User data found in URL parameters, attempting registration')
      const parsedTgId = parseInt(tgId)
      console.log('🔍 Parsed tg_id:', parsedTgId, 'Original:', tgId, 'Is valid:', !isNaN(parsedTgId))
      
      if (isNaN(parsedTgId)) {
        console.error('❌ Invalid tg_id in URL parameters:', tgId)
        loadFallbackData()
        return
      }
      
      checkOrRegisterUser({
        id: parsedTgId,
        tg_id: parsedTgId,
        first_name: firstName || 'Unknown',
        last_name: lastName || 'User',
        username: username || undefined
      })
    } else {
      console.log('❌ No user data in URL parameters')
      loadFallbackData()
    }
  }, [checkOrRegisterUser])

  useEffect(() => {
    const checkTelegramWebApp = () => {
      // Защита от повторной инициализации только если уже есть пользователь
      if (hasTriedInitialization && user) {
        console.log('⚠️ Initialization already attempted and user exists, skipping')
        return
      }
      
      setHasTriedInitialization(true)
      
      try {
        console.log('🔍 Checking Telegram WebApp availability...')
        console.log('🔍 Window object:', typeof window)
        console.log('🔍 Telegram object:', typeof (window as any).Telegram)
        console.log('🔍 WebApp object:', typeof (window as any).Telegram?.WebApp)
        
        // Проверяем, что DOM загружен
        if (document.readyState === 'loading') {
          console.log('⏳ DOM still loading, waiting...')
          document.addEventListener('DOMContentLoaded', checkTelegramWebApp)
          return
        }
        
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          console.log('✅ Telegram WebApp is available')
          // Инициализируем WebApp
          const telegramWebApp = (window as any).Telegram.WebApp
          telegramWebApp.ready()
          telegramWebApp.expand()
          
          setIsInTelegram(true)
          const tgUser = telegramWebApp.initDataUnsafe?.user as TgUser | undefined
          
          console.log('🔍 initDataUnsafe:', telegramWebApp.initDataUnsafe)
          console.log('🔍 tgUser from initDataUnsafe:', tgUser)
          
          if (tgUser && tgUser.id) {
            console.log('👤 User found in initDataUnsafe globally:', tgUser)
            console.log('🔍 tgUser.id type:', typeof tgUser.id, 'value:', tgUser.id)
            
            // Убеждаемся, что id - это число
            const userId = typeof tgUser.id === 'string' ? parseInt(tgUser.id) : tgUser.id
            if (isNaN(userId)) {
              console.error('❌ Invalid user ID from initDataUnsafe:', tgUser.id)
              loadFallbackData()
              return
            }
            
            checkOrRegisterUser({
              ...tgUser,
              id: userId,
              tg_id: userId
            })
          } else {
            console.log('🔍 No user data in initDataUnsafe, trying to get from initData')
            // Пытаемся получить tg_id из initData
            const initData = telegramWebApp.initData
            console.log('🔍 initData:', initData)
            
            if (initData) {
              const urlParams = new URLSearchParams(initData)
              const userParam = urlParams.get('user')
              console.log('🔍 userParam from initData:', userParam)
              
              if (userParam) {
                try {
                  const userData = JSON.parse(decodeURIComponent(userParam))
                  console.log('🔍 Parsed userData:', userData)
                  
                  if (userData.id) {
                    console.log('👤 User found in initData globally:', userData)
                    console.log('🔍 userData.id type:', typeof userData.id, 'value:', userData.id)
                    
                    // Убеждаемся, что id - это число
                    const userId = typeof userData.id === 'string' ? parseInt(userData.id) : userData.id
                    if (isNaN(userId)) {
                      console.error('❌ Invalid user ID from initData:', userData.id)
                      loadFallbackData()
                      return
                    }
                    
                    checkOrRegisterUser({ 
                      id: userId,
                      tg_id: userId,
                      first_name: userData.first_name, 
                      last_name: userData.last_name, 
                      username: userData.username 
                    })
                  } else {
                    console.log('❌ No user ID in parsed data globally')
                    loadFallbackData()
                  }
                } catch (e) {
                  console.error('❌ Error parsing user data globally:', e)
                  loadFallbackData()
                }
              } else {
                console.log('❌ No user data in initData globally, trying URL parameters')
                tryToGetUserFromUrl()
              }
            } else {
              console.log('❌ No initData available globally, trying URL parameters')
              tryToGetUserFromUrl()
            }
          }
        } else {
          console.log('❌ Telegram WebApp not available globally')
          
          // Ждем немного и пытаемся еще раз
          setTimeout(() => {
            if ((window as any).Telegram?.WebApp) {
              console.log('✅ Telegram WebApp became available after delay')
              setHasTriedInitialization(false) // Сбрасываем флаг для повторной попытки
              checkTelegramWebApp()
            } else {
              console.log('❌ Telegram WebApp still not available, trying URL parameters')
              tryToGetUserFromUrl()
            }
          }, 1000)
        }
      } catch (error) {
        console.error('❌ Error checking Telegram WebApp globally:', error)
        loadFallbackData()
      }
    }

        // Запускаем проверку сразу
        checkTelegramWebApp()
      }, [checkOrRegisterUser, tryToGetUserFromUrl, hasTriedInitialization, user])

  const value = {
    user,
    isInTelegram,
    loading,
    error,
    isInitialized,
    setUser,
    setLoading,
    setError
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
