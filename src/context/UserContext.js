import React, { createContext, useEffect, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [telegramUser, setTelegramUser] = useState(null)

  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    webApp?.ready()

    const tg = webApp?.initDataUnsafe?.user
    console.log('initData:', webApp?.initData)
    console.log('initDataUnsafe.user:', tg)

    if (tg) {
      setTelegramUser({
        id: tg.id,
        name: tg.first_name,
        surname: tg.last_name || '',
        username: tg.username
      })
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, telegramUser, setTelegramUser }}>
      {children}
    </UserContext.Provider>
  )
}