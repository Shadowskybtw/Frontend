import React, { useState } from 'react'
import styles from '../styles/ApiTester.module.css'

const ApiTester = ({ telegramId }) => {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (endpoint, name) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      const data = await response.text()
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          ok: response.ok,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          error: error.message,
          status: 'ERROR'
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const testAllEndpoints = async () => {
    if (!telegramId) {
      alert('Telegram ID не определен')
      return
    }

    setLoading(true)
    
    // Тестируем все endpoints
    await Promise.all([
      testEndpoint(`/api/webapp/init/${telegramId}`, 'New API'),
      testEndpoint(`/api/main/${telegramId}`, 'Legacy API'),
      testEndpoint(`/api/stocks/${telegramId}`, 'Stocks API'),
      testEndpoint(`/api/free-hookahs/${telegramId}`, 'Hookahs API')
    ])
  }

  return (
    <div className={styles.testerContainer}>
      <h3 className={styles.testerTitle}>Тестирование API</h3>
      
      <div className={styles.testerInfo}>
        <p><strong>Telegram ID:</strong> {telegramId || 'Не определен'}</p>
        <p><strong>Текущий URL:</strong> {window.location.href}</p>
      </div>

      <div className={styles.testerActions}>
        <button 
          onClick={testAllEndpoints} 
          disabled={loading || !telegramId}
          className={styles.testButton}
        >
          {loading ? 'Тестирование...' : 'Тестировать все API'}
        </button>
        
        <button 
          onClick={() => setResults({})} 
          className={styles.clearButton}
        >
          Очистить результаты
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className={styles.resultsContainer}>
          <h4>Результаты тестирования:</h4>
          
          {Object.entries(results).map(([name, result]) => (
            <div key={name} className={styles.resultItem}>
              <h5 className={styles.resultName}>{name}</h5>
              
              <div className={styles.resultDetails}>
                <p><strong>Статус:</strong> {result.status}</p>
                <p><strong>OK:</strong> {result.ok ? '✅' : '❌'}</p>
                
                {result.data && (
                  <details className={styles.resultData}>
                    <summary>Данные ответа</summary>
                    <pre>{result.data}</pre>
                  </details>
                )}
                
                {result.error && (
                  <p className={styles.resultError}><strong>Ошибка:</strong> {result.error}</p>
                )}
                
                {result.headers && Object.keys(result.headers).length > 0 && (
                  <details className={styles.resultHeaders}>
                    <summary>Заголовки</summary>
                    <pre>{JSON.stringify(result.headers, null, 2)}</pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ApiTester
