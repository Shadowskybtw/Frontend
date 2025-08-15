import React, { useContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, UserContext } from './context/UserContext'
import { userAPI } from './utils/api'

import Navbar from './components/Navbar'
import Profile from './pages/Profile'
import Promo from './pages/Promo'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import ErrorBoundary from './components/ErrorBoundary'

function AppRoutes() {
  const { user, setUser, telegramUser } = useContext(UserContext)
  const [checking, setChecking] = useState(true)

  // When Telegram user appears, check if they are registered in backend
  useEffect(() => {
    let canceled = false

    async function check() {
      // If we already have a stored user with phone, skip backend check
      if (user && user.phone && String(user.phone).trim().length > 0) {
        setChecking(false)
        return
      }
      // Нет данных от Telegram — завершить проверку и показать регистрацию по умолчанию
      if (!telegramUser?.id) {
        setChecking(false)
        return
      }

      try {
        const data = await userAPI.checkUser(telegramUser.id)
        
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
      } catch (e) {
        if (e.message?.includes('404')) {
          // Пользователь не найден — на регистрацию и очистить localStorage
          setUser(null)
          try { localStorage.removeItem('user') } catch {}
        } else {
          console.error('check /api/main error:', e)
          // Не сбрасываем user при сетевых сбоях, чтобы не показывать регистрацию повторно
        }
      } finally {
        if (!canceled) setChecking(false)
      }
    }

    check()
    return () => { canceled = true }
  }, [telegramUser?.id, user, setUser])

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
    <ErrorBoundary>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </ErrorBoundary>
  )
}

export default App
