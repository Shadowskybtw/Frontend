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
import Loading from './components/Loading'
import InitError from './components/InitError'

function AppRoutes() {
  const { user, setUser, telegramUser } = useContext(UserContext)
  const [checking, setChecking] = useState(true)
  const [initError, setInitError] = useState(null)

  // When Telegram user appears, check if they are registered in backend
  useEffect(() => {
    let canceled = false

    async function check() {
      try {
        // Инициализируем Telegram WebApp
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready()
          window.Telegram.WebApp.expand()
        }

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

        // Проверяем существование пользователя через новый endpoint
        try {
          const response = await fetch(`/api/webapp/init/${telegramUser.id}`)
          if (response.ok) {
            const data = await response.json()
            
            if (data.userExists && data.user) {
              // Пользователь найден и зарегистрирован
              setUser({
                id: data.user.tg_id ?? data.user.id ?? telegramUser.id,
                name: data.user.firstName ?? data.user.name ?? '',
                surname: data.user.lastName ?? data.user.surname ?? '',
                phone: data.user.phone ?? '',
                username: data.user.username ?? telegramUser.username ?? ''
              })
              // Сохраняем в localStorage для персистентности
              try { localStorage.setItem('user', JSON.stringify(data.user)) } catch {}
            } else {
              // Пользователь не найден или не зарегистрирован
              setUser(null)
              try { localStorage.removeItem('user') } catch {}
            }
          } else {
            // Fallback на старый API если новый endpoint недоступен
            const data = await userAPI.checkUser(telegramUser.id)
            
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
              setUser(null)
              try { localStorage.removeItem('user') } catch {}
            }
          }
        } catch (apiError) {
          console.error('New API error:', apiError)
          // Fallback на старый API
          try {
            const data = await userAPI.checkUser(telegramUser.id)
            
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
              setUser(null)
              try { localStorage.removeItem('user') } catch {}
            }
          } catch (fallbackError) {
            console.error('Fallback API also failed:', fallbackError)
            setInitError(fallbackError)
          }
        }
      } catch (e) {
        if (e.message?.includes('404')) {
          // Пользователь не найден — на регистрацию и очистить localStorage
          setUser(null)
          try { localStorage.removeItem('user') } catch {}
        } else {
          console.error('check /api/main error:', e)
          setInitError(e)
        }
      } finally {
        if (!canceled) setChecking(false)
      }
    }

    check()
    return () => { canceled = true }
  }, [telegramUser?.id, user, setUser])

  // Показываем лоадер во время проверки
  if (checking) return <Loading message="Инициализация WebApp..." size="large" />

  // Показываем ошибку инициализации если есть
  if (initError) {
    return (
      <InitError 
        error={initError} 
        onRetry={() => {
          setInitError(null)
          setChecking(true)
          // Перезапускаем проверку
          setTimeout(() => {
            const check = async () => {
              try {
                if (telegramUser?.id) {
                  const response = await fetch(`/api/webapp/init/${telegramUser.id}`)
                  if (response.ok) {
                    const data = await response.json()
                    if (data.userExists && data.user) {
                      setUser({
                        id: data.user.tg_id ?? data.user.id ?? telegramUser.id,
                        name: data.user.firstName ?? data.user.name ?? '',
                        surname: data.user.lastName ?? data.user.surname ?? '',
                        phone: data.user.phone ?? '',
                        username: data.user.username ?? telegramUser.username ?? ''
                      })
                      try { localStorage.setItem('user', JSON.stringify(data.user)) } catch {}
                      setInitError(null)
                    }
                  }
                }
              } catch (e) {
                console.error('Retry failed:', e)
              } finally {
                setChecking(false)
              }
            }
            check()
          }, 100)
        }}
      />
    )
  }

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
