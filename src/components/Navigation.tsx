"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = "" }: NavigationProps) {
  const pathname = usePathname()
  const { user, isInitialized } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.tg_id) return

      try {
        const response = await fetch(`/api/admin?tg_id=${user.tg_id}`)
        const data = await response.json()
        setIsAdmin(data.is_admin || false)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    if (isInitialized && user) {
      checkAdmin()
    }
  }, [isInitialized, user])

  // Fetch pending requests count for admins
  useEffect(() => {
    if (!isAdmin || !user?.tg_id) return

    const fetchPendingCount = async () => {
      try {
        const response = await fetch(`/api/free-hookah-requests/list?admin_tg_id=${user.tg_id}&status=pending`, {
          cache: 'no-store'
        })
        const data = await response.json()
        if (data.success) {
          setPendingCount(data.stats?.pending || 0)
        }
      } catch (error) {
        console.error('Error fetching pending count:', error)
      }
    }

    fetchPendingCount()
    const interval = setInterval(fetchPendingCount, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [isAdmin, user?.tg_id])

  const navItems = [
    {
      href: '/profile',
      label: 'Профиль',
      icon: '👤',
      active: pathname === '/profile',
      adminOnly: false
    },
    {
      href: '/history',
      label: 'История',
      icon: '📊',
      active: pathname === '/history',
      adminOnly: false
    },
    {
      href: '/statistics',
      label: 'Статистика',
      icon: '📈',
      active: pathname === '/statistics',
      adminOnly: false
    },
    {
      href: '/admin-requests',
      label: 'Запросы',
      icon: '🎁',
      active: pathname === '/admin-requests',
      adminOnly: true,
      badge: pendingCount
    }
  ]

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <nav className={`bg-black border-b-2 border-gray-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Логотип по центру */}
        <div className="flex justify-center items-center h-16">
          <h1 className="text-3xl font-bold text-white tracking-wider">
            DUNGEON
          </h1>
        </div>
        
        {/* Кнопки навигации под логотипом */}
        <div className="flex justify-center items-center pb-4">
          <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-2 w-full max-w-3xl`}>
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 text-center
                  border-2
                  ${item.active 
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/50' 
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/50'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
