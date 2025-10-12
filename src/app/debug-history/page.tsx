'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'

export default function DebugHistoryPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [apiTest, setApiTest] = useState<any>({})
  
  const { user, loading, error, isInitialized } = useUser()

  useEffect(() => {
    const debug = {
      user: user,
      loading: loading,
      error: error,
      isInitialized: isInitialized,
      tgId: user?.tg_id,
      userId: user?.id,
      timestamp: new Date().toISOString()
    }
    setDebugInfo(debug)
    
    console.log('🔍 Debug History Page - User Info:', debug)
  }, [user, loading, error, isInitialized])

  const testAPI = async () => {
    if (!user?.tg_id) {
      setApiTest({ error: 'No tg_id available' })
      return
    }

    try {
      console.log('🧪 Testing API for tg_id:', user.tg_id)
      
      const response = await fetch(`/api/history/${Number(user.tg_id)}?limit=5`)
      const data = await response.json()
      
      setApiTest({
        status: response.status,
        data: data,
        url: `/api/history/${Number(user.tg_id)}?limit=5`,
        timestamp: new Date().toISOString()
      })
      
      console.log('🧪 API Test Result:', data)
    } catch (error) {
      setApiTest({ error: error instanceof Error ? error.message : 'Unknown error' })
      console.error('🧪 API Test Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <span className="mr-2">🔍</span> Debug History Page
      </h1>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">👤</span> User Context Debug
        </h2>
        <pre className="bg-gray-700/50 p-4 rounded-lg text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🧪</span> API Test
        </h2>
        <button 
          onClick={testAPI}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-4"
        >
          Test History API
        </button>
        <pre className="bg-gray-700/50 p-4 rounded-lg text-sm overflow-auto">
          {JSON.stringify(apiTest, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">📋</span> Instructions
        </h2>
        <ul className="list-disc list-inside space-y-2">
          <li>1. Check if user is properly initialized</li>
          <li>2. Verify tg_id is correct (should be 937011437)</li>
          <li>3. Test API call manually</li>
          <li>4. Check browser console for logs</li>
        </ul>
      </div>
    </div>
  )
}
