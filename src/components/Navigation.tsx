"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdmin } from '@/contexts/AdminContext'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = "" }: NavigationProps) {
  const pathname = usePathname()
  const { isAdmin, pendingCount } = useAdmin()

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
        <div className="flex flex-col items-center pb-4 px-4">
          {/* Первый ряд - основные страницы */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-2xl mb-2">
            {visibleItems.filter(item => !item.adminOnly).map((item) => (
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
              </Link>
            ))}
          </div>

          {/* Второй ряд - админские страницы */}
          {isAdmin && (
            <div className="w-full max-w-2xl">
              <div className="grid grid-cols-1 gap-2">
                {visibleItems.filter(item => item.adminOnly).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 text-center
                      border-2
                      ${item.active 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-500 shadow-lg shadow-purple-500/50' 
                        : 'bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400 border-gray-800 hover:from-purple-900 hover:to-blue-900 hover:text-white hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/50'
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
