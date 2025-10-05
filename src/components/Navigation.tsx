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
      href: '/stocks',
      label: 'Акции',
      icon: '🎁',
      active: pathname === '/stocks'
    },
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
    }
  ]

  return (
    <nav className={`bg-black/50 backdrop-blur-sm border-b border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-20">
          <h1 className="text-3xl font-bold text-white tracking-wider mr-8">
            <span className="text-red-500">D</span>UNGEON
          </h1>
          
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2
                  ${item.active 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
