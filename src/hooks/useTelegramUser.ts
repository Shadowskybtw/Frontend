import { useState, useEffect, useCallback } from 'react'

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

interface UseTelegramUserOptions {
  onUserLoaded?: (user: any) => void
  onError?: (error: string) => void
  fallbackUser?: TgUser
}

export function useTelegramUser(options: UseTelegramUserOptions = {}) {
  const [user, setUser] = useState<TgUser | null>(null)
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkOrRegisterUser = useCallback(async (tgUser: TgUser) => {
    try {
      console.log('Checking or registering user:', tgUser)
      
      const response = await fetch('/api/check-or-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': (window as any).Telegram?.WebApp?.initData || ''
        },
        body: JSON.stringify({
          tg_id: tgUser.id,
          firstName: tgUser.first_name || 'Unknown',
          lastName: tgUser.last_name || 'User',
          username: tgUser.username
        })
      })

      const data = await response.json()
      console.log('Check/register response:', data)

      if (data.success) {
        setUser(data.user)
        setLoading(false)
        options.onUserLoaded?.(data.user)
        
        if (data.isNewUser) {
          console.log('✅ New user registered successfully!')
        } else {
          console.log('✅ Existing user loaded successfully!')
        }
      } else {
        console.error('❌ Failed to check/register user:', data.message)
        const errorMsg = 'Ошибка загрузки пользователя'
        setError(errorMsg)
        setLoading(false)
        options.onError?.(errorMsg)
      }
    } catch (error) {
      console.error('❌ Error checking/registering user:', error)
      const errorMsg = 'Ошибка загрузки пользователя'
      setError(errorMsg)
      setLoading(false)
      options.onError?.(errorMsg)
    }
  }, [options])

  const loadFallbackData = useCallback(() => {
    console.log('Using fallback data')
    if (options.fallbackUser) {
      setUser(options.fallbackUser)
      setLoading(false)
      options.onUserLoaded?.(options.fallbackUser)
    } else {
      const testUser = { 
        id: 937011437, 
        tg_id: 937011437, 
        first_name: 'Николай', 
        last_name: 'Шадовский', 
        username: 'shadowskydie' 
      }
      setUser(testUser)
      setLoading(false)
      options.onUserLoaded?.(testUser)
    }
  }, [options])

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
            console.log('User found in initDataUnsafe:', tgUser)
            checkOrRegisterUser(tgUser)
          } else {
            console.log('No user data in initDataUnsafe, trying to get from initData')
            // Пытаемся получить tg_id из initData
            const initData = (window as any).Telegram.WebApp.initData
            if (initData) {
              const urlParams = new URLSearchParams(initData)
              const userParam = urlParams.get('user')
              if (userParam) {
                try {
                  const userData = JSON.parse(decodeURIComponent(userParam))
                  if (userData.id) {
                    console.log('User found in initData:', userData)
                    checkOrRegisterUser({ 
                      id: userData.id,
                      tg_id: userData.id,
                      first_name: userData.first_name, 
                      last_name: userData.last_name, 
                      username: userData.username 
                    })
                  }
                } catch (e) {
                  console.error('Error parsing user data:', e)
                  loadFallbackData()
                }
              } else {
                console.log('No user data in initData')
                loadFallbackData()
              }
            } else {
              console.log('No initData available')
              loadFallbackData()
            }
          }
        } else {
          console.log('Telegram WebApp not available, using fallback')
          loadFallbackData()
        }
      } catch (error) {
        console.error('Error checking Telegram WebApp:', error)
        loadFallbackData()
      }
    }

    checkTelegramWebApp()
  }, [checkOrRegisterUser, loadFallbackData])

  return {
    user,
    isInTelegram,
    loading,
    error,
    setUser,
    setLoading,
    setError
  }
}
