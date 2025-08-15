import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы следующий рендер показал fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку в консоль
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // Можно рендерить любой fallback UI
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#dc3545' }}>Что-то пошло не так</h2>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Обновить страницу
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                Детали ошибки (только для разработчиков)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.9rem',
                color: '#6c757d'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
