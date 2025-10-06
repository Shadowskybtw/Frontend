"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type TgUser = {
  id: number
  tg_id: number
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

  const checkOrRegisterUser = async (tgUser: TgUser) => {
    try {
      console.log('🔍 Checking or registering user globally:', tgUser)
      
      const initData = (window as any).Telegram?.WebApp?.initData || ''
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
        setUser(data.user)
        setLoading(false)
        setIsInitialized(true)
        
        if (data.isNewUser) {
          console.log('✅ New user registered globally!')
        } else {
          console.log('✅ Existing user loaded globally!')
        }
      } else {
        console.error('❌ Failed to check/register user globally:', data.message)
        // В случае ошибки используем fallback вместо показа ошибки
        loadFallbackData()
      }
    } catch (error) {
      console.error('❌ Error checking/registering user globally:', error)
      // В случае ошибки используем fallback вместо показа ошибки
      loadFallbackData()
    }
  }

  const loadFallbackData = () => {
    console.log('🔄 No Telegram user data available - using fallback for development')
    // Для разработки используем тестового пользователя, если нет Telegram данных
    const testUser = { 
      id: 937011437, 
      tg_id: 937011437, 
      first_name: 'Тест', 
      last_name: 'Пользователь', 
      username: 'test_user' 
    }
    setUser(testUser)
    setLoading(false)
    setIsInitialized(true)
  }

  useEffect(() => {
    const checkTelegramWebApp = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          // Инициализируем WebApp
          (window as any).Telegram.WebApp.ready()
          ;(window as any).Telegram.WebApp.expand()
          
          setIsInTelegram(true)
          const tgUser = (window as any).Telegram.WebApp.initDataUnsafe?.user as TgUser | undefined
          
          if (tgUser) {
            console.log('👤 User found in initDataUnsafe globally:', tgUser)
            checkOrRegisterUser(tgUser)
          } else {
            console.log('🔍 No user data in initDataUnsafe, trying to get from initData')
            // Пытаемся получить tg_id из initData
            const initData = (window as any).Telegram.WebApp.initData
            if (initData) {
              const urlParams = new URLSearchParams(initData)
              const userParam = urlParams.get('user')
              if (userParam) {
                try {
                  const userData = JSON.parse(decodeURIComponent(userParam))
                  if (userData.id) {
                    console.log('👤 User found in initData globally:', userData)
                    checkOrRegisterUser({ 
                      id: userData.id,
                      tg_id: userData.id,
                      first_name: userData.first_name, 
                      last_name: userData.last_name, 
                      username: userData.username 
                    })
                  }
                } catch (e) {
                  console.error('❌ Error parsing user data globally:', e)
                  loadFallbackData()
                }
              } else {
                console.log('❌ No user data in initData globally')
                loadFallbackData()
              }
            } else {
              console.log('❌ No initData available globally')
              loadFallbackData()
            }
          }
        } else {
          console.log('🔄 Telegram WebApp not available globally, checking if we can get user data from URL')
          // Проверяем, есть ли данные пользователя в URL параметрах
          const urlParams = new URLSearchParams(window.location.search)
          const tgId = urlParams.get('tg_id')
          const firstName = urlParams.get('first_name')
          const lastName = urlParams.get('last_name')
          const username = urlParams.get('username')
          
          if (tgId) {
            console.log('👤 User data found in URL parameters:', { tgId, firstName, lastName, username })
            checkOrRegisterUser({
              id: parseInt(tgId),
              tg_id: parseInt(tgId),
              first_name: firstName || 'Unknown',
              last_name: lastName || 'User',
              username: username || undefined
            })
          } else {
            console.log('🔄 No user data in URL, using fallback')
            loadFallbackData()
          }
        }
      } catch (error) {
        console.error('❌ Error checking Telegram WebApp globally:', error)
        loadFallbackData()
      }
    }

    // Запускаем проверку сразу
    checkTelegramWebApp()
  }, [])

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
