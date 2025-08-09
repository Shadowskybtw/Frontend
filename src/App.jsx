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
      // Нет данных от Telegram — завершить проверку и показать регистрацию по умолчанию
      if (!telegramUser?.id) {
        setChecking(false)
        return
      }

      // Если базовый URL бэка не задан — тоже заканчиваем проверку
      if (!API_BASE) {
        console.warn('REACT_APP_API_URL is not set; skipping backend check')
        setChecking(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/main/${telegramUser.id}`)
        if (res.ok) {
          const data = await res.json()

          // Бэкенд мог вернуть { registered, user } или просто объект пользователя.
          const payload = data?.user ?? data
          const phoneVal = payload?.phone
          const hasPhone =
            (typeof phoneVal === 'string' && phoneVal.trim().length > 0 && !['null','undefined'].includes(phoneVal.trim().toLowerCase())) ||
            (typeof phoneVal === 'number' && String(phoneVal).trim().length > 0)

          if (hasPhone) {
            setUser({
              id: payload.tg_id ?? payload.id ?? telegramUser.id,
              name: payload.firstName ?? payload.name ?? '',
              surname: payload.lastName ?? payload.surname ?? '',
              phone: payload.phone ?? '',
              username: payload.username ?? telegramUser.username ?? ''
            })
          } else {
            // Пользователь найден, но телефон не заполнен — форсим регистрацию и чистим localStorage
            setUser(null)
            try { localStorage.removeItem('user') } catch {}
          }
        } else if (res.status === 404) {
          // Пользователь не найден — на регистрацию и очистить localStorage
          setUser(null)
          try { localStorage.removeItem('user') } catch {}
        } else {
          console.error('check /api/main failed with status:', res.status)
          // На всякий случай позволим пройти регистрацию и очистим localStorage
          setUser(null)
          try { localStorage.removeItem('user') } catch {}
        }
      } catch (e) {
        console.error('check /api/main error:', e)
        setUser(null)
        try { localStorage.removeItem('user') } catch {}
      } finally {
        if (!canceled) setChecking(false)
      }
    }

    check()
    return () => { canceled = true }
  }, [telegramUser?.id, setUser])

  // Можно показать лоадер, чтобы избежать "мигания" при проверке
  if (checking) return null

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
