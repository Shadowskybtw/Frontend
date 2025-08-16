import React from 'react'
import styles from '../styles/InitError.module.css'

const InitError = ({ error, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <h2 className={styles.errorTitle}>Ошибка инициализации</h2>
      <p className={styles.errorMessage}>
        Не удалось инициализировать WebApp. Возможные причины:
      </p>
      <ul className={styles.errorList}>
        <li>WebApp открыт не в Telegram</li>
        <li>Проблемы с подключением к серверу</li>
        <li>Ошибка в конфигурации</li>
      </ul>
      
      {error && (
        <details className={styles.errorDetails}>
          <summary className={styles.errorSummary}>Детали ошибки</summary>
          <pre className={styles.errorCode}>{error.toString()}</pre>
        </details>
      )}
      
      <div className={styles.errorActions}>
        <button onClick={onRetry} className={styles.retryButton}>
          Попробовать снова
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.reloadButton}
        >
          Обновить страницу
        </button>
      </div>
      
      <p className={styles.errorNote}>
        Если проблема повторяется, попробуйте открыть WebApp заново через бота
      </p>
    </div>
  )
}

export default InitError
