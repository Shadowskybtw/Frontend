"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = "" }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/profile',
      label: 'Профиль',
      icon: '👤',
      active: pathname === '/profile'
    },
    {
      href: '/history',
      label: 'История',
      icon: '📊',
      active: pathname === '/history'
    },
    {
      href: '/statistics',
      label: 'Статистика',
      icon: '📈',
      active: pathname === '/statistics'
    }
  ]

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
          <div className="grid grid-cols-3 gap-2 w-full max-w-2xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 text-center
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
        </div>
      </div>
    </nav>
  )
}
