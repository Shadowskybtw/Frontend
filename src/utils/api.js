// API utilities for the WebApp

// Resolve API base URL with fallbacks
export const resolveApiBase = () => {
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || ''
  const onVercel = /\.vercel\.app$/.test(host)
  if (onVercel) return ''
  
  const env = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || null
  const win = (typeof window !== 'undefined' && window.__API_URL__) || null
  const fallback = 'https://refactored-cod-v6ww469vp657fwqpw-8000.app.github.dev'
  
  let base = env || win || fallback
  if (!/^https?:\/\//.test(base)) base = fallback
  return base.replace(/\/+$/, '')
}

const API_BASE = resolveApiBase()

// Helper to construct full API URLs
export const api = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`

// Common fetch wrapper with error handling
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(api(endpoint), {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error)
    throw error
  }
}

// User management API
export const userAPI = {
  // Check if user exists and get their data (legacy endpoint)
  checkUser: (telegramId) => apiRequest(`/api/main/${telegramId}`),
  
  // New WebApp initialization endpoint
  initWebApp: (telegramId) => apiRequest(`/api/webapp/init/${telegramId}`),
  
  // Register new user
  register: (userData) => apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // Get user's stock progress
  getStocks: (telegramId) => apiRequest(`/api/stocks/${telegramId}`),
  
  // Get free hookahs count
  getFreeHookahs: (telegramId) => apiRequest(`/api/free-hookahs/${telegramId}`),
  
  // Use free hookah slot
  useFreeSlot: (telegramId) => apiRequest(`/api/use-free-slot/${telegramId}`, {
    method: 'POST',
  }),
  
  // Grant admin rights (admin only)
  grantAdmin: (targetId, grantBy) => apiRequest('/api/grant-admin', {
    method: 'POST',
    body: JSON.stringify({ targetId, grantBy }),
  }),
}

// QR code redemption API
export const qrAPI = {
  // Redeem guest visit (admin scans QR)
  redeem: (url, adminId) => fetch(url, {
    method: 'POST',
    headers: { 'X-Telegram-ID': String(adminId) },
  }).then(res => res.json()),
}

// Error handling utilities
export const handleApiError = (error, fallbackMessage = 'Произошла ошибка') => {
  const message = error.message || fallbackMessage
  console.error('API Error:', error)
  
  // Show user-friendly error message
  if (typeof window !== 'undefined' && window.alert) {
    alert(message)
  }
  
  return { error: true, message }
}

// Success handling utilities
export const handleApiSuccess = (data, successMessage = 'Операция выполнена успешно') => {
  if (data?.message) {
    alert(data.message)
  } else if (successMessage) {
    alert(successMessage)
  }
  return { success: true, data }
}
