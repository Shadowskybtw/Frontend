import React, { createContext, useEffect, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    window.Telegram?.WebApp?.ready();

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
    console.log('initData:', window.Telegram?.WebApp?.initData);
    console.log('initDataUnsafe.user:', tgUser)

    if (tgUser) {
      setUser({
        id: tgUser.id,
        name: tgUser.first_name,
        surname: tgUser.last_name || '',
        phone: ''
      });
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}