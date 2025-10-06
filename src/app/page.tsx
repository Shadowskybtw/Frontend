"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

export default function HomePage() {
  const router = useRouter()
  const { user, loading, isInitialized } = useUser()

  useEffect(() => {
    if (isInitialized && !loading) {
      if (user) {
        // Пользователь авторизован - перенаправляем на акции
        console.log('✅ User authenticated, redirecting to stocks:', user)
        router.push('/stocks')
      } else {
        // Пользователь не авторизован - перенаправляем на регистрацию
        console.log('❌ User not authenticated, redirecting to register')
        router.push('/register')
      }
    }
  }, [user, loading, isInitialized, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-300">
          {loading ? 'Загрузка пользователя...' : 'Перенаправление...'}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {!isInitialized ? 'Инициализация...' : user ? `Добро пожаловать, ${user.first_name}!` : 'Регистрация...'}
        </p>
      </div>
    </div>
  )
}