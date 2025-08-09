import React, { useContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, UserContext } from './context/UserContext'

import Navbar from './components/Navbar'
import Profile from './pages/Profile'
import Promo from './pages/Promo'
import NotFound from './pages/NotFound'
import Register from './pages/Register'

// CRA-only: use REACT_APP_API_URL (with optional window fallback). No Vite vars here.
const API_BASE = (
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  (typeof window !== 'undefined' && window.__API_URL__) ||
  ''
).toString().trim().replace(/\/$/, '')

function AppRoutes() {
  const { user, setUser, telegramUser } = useContext(UserContext)
  const [checking, setChecking] = useState(true)

  // When Telegram user appears, check if they are registered in backend
  useEffect(() => {
    let canceled = false

    async function check() {
      if (!telegramUser?.id) {
        setChecking(false)
        return
      }
      try {
        const res = await fetch(`${API_BASE}/api/main/${telegramUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data?.registered && data.user) {
            setUser({
              id: data.user.tg_id,
              name: data.user.firstName || '',
              surname: data.user.lastName || '',
              phone: data.user.phone || '',
              username: data.user.username || ''
            })
          }
        }
      } catch (e) {
        console.error('check /api/main failed:', e)
      } finally {
        if (!canceled) setChecking(false)
      }
    }

    check()
    return () => { canceled = true }
  }, [telegramUser?.id, setUser])

  if (checking) return null // could be a loader/spinner

  return (
    <>
      {user && <Navbar />}
      <Routes>
        {!user ? (
          <>
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </>
        ) : (
          <>
            <Route path="/profile" element={<Profile />} />
            <Route path="/promo" element={<Promo />} />
            <Route path="/" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Routes>
    </>
  )
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}

export default App
