import React, { useState, useEffect } from 'react'
import styles from '../styles/InitStatus.module.css'

const InitStatus = () => {
  const [status, setStatus] = useState({
    telegramAvailable: false,
    webAppAvailable: false,
    userData: null,
    localStorage: null,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    const updateStatus = () => {
      const newStatus = {
        telegramAvailable: !!window.Telegram,
        webAppAvailable: !!window.Telegram?.WebApp,
        userData: window.Telegram?.WebApp?.initDataUnsafe?.user || null,
        localStorage: (() => {
          try {
            const saved = localStorage.getItem('user')
            return saved ? JSON.parse(saved) : null
          } catch (e) {
            return { error: e.message }
          }
        })(),
        timestamp: new Date().toISOString()
      }
      setStatus(newStatus)
    }

    // Обновляем статус каждые 2 секунды
    updateStatus()
    const interval = setInterval(updateStatus, 2000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (value) => value ? '✅' : '❌'
  const getStatusText = (value) => value ? 'Доступно' : 'Недоступно'

  return (
    <div className={styles.statusContainer}>
      <h3 className={styles.statusTitle}>Статус инициализации WebApp</h3>
      
      <div className={styles.statusGrid}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Telegram объект:</span>
          <span className={styles.statusValue}>
            {getStatusIcon(status.telegramAvailable)} {getStatusText(status.telegramAvailable)}
          </span>
        </div>
        
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>WebApp объект:</span>
          <span className={styles.statusValue}>
            {getStatusIcon(status.webAppAvailable)} {getStatusText(status.webAppAvailable)}
          </span>
        </div>
        
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Данные пользователя:</span>
          <span className={styles.statusValue}>
            {status.userData ? '✅ Получены' : '❌ Отсутствуют'}
          </span>
        </div>
        
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>localStorage:</span>
          <span className={styles.statusValue}>
            {status.localStorage ? '✅ Есть данные' : '❌ Пусто'}
          </span>
        </div>
        
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Время проверки:</span>
          <span className={styles.statusValue}>
            {new Date(status.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {status.userData && (
        <details className={styles.userDetails}>
          <summary>Данные пользователя Telegram</summary>
          <pre>{JSON.stringify(status.userData, null, 2)}</pre>
        </details>
      )}

      {status.localStorage && (
        <details className={styles.localStorageDetails}>
          <summary>Данные localStorage</summary>
          <pre>{JSON.stringify(status.localStorage, null, 2)}</pre>
        </details>
      )}

      <div className={styles.statusActions}>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.reloadButton}
        >
          Обновить страницу
        </button>
        
        <button 
          onClick={() => {
            console.log('=== MANUAL STATUS CHECK ===')
            console.log('window.Telegram:', window.Telegram)
            console.log('window.Telegram?.WebApp:', window.Telegram?.WebApp)
            console.log('initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe)
            console.log('user:', window.Telegram?.WebApp?.initDataUnsafe?.user)
            console.log('localStorage:', localStorage.getItem('user'))
          }} 
          className={styles.logButton}
        >
          Логировать в консоль
        </button>
      </div>
    </div>
  )
}

export default InitStatus
