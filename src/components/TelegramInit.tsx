"use client"

import { useEffect } from 'react'

export default function TelegramInit() {
  useEffect(() => {
    const initTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        console.log('🚀 Initializing Telegram WebApp')
        window.Telegram.WebApp.ready()
        window.Telegram.WebApp.expand()
        console.log('✅ Telegram WebApp initialized')
      } else {
        console.log('❌ Telegram WebApp not available')
      }
    }

    // Проверяем, что DOM загружен
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTelegramWebApp)
    } else {
      initTelegramWebApp()
    }

    // Cleanup
    return () => {
      document.removeEventListener('DOMContentLoaded', initTelegramWebApp)
    }
  }, [])

  return null // Этот компонент не рендерит ничего
}
