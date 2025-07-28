import React, { createContext, useEffect, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
    console.log('initDataUnsafe.user:', tgUser)

    if (tgUser) {
      setUser({
        id: tgUser.id,
        name: tgUser.first_name,
        surname: tgUser.last_name || '',
        phone: ''
      })
    } else {
      console.warn('Telegram user not found. Did you open from Telegram button?')
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}