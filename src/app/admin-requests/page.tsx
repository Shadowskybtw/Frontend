"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'

interface FreeHookahRequest {
  id: number
  user: {
    id: number
    tg_id: string
    name: string
    phone: string
    username?: string
  }
  status: 'pending' | 'approved' | 'rejected'
  approver?: {
    name: string
  } | null
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export default function AdminRequestsPage() {
  const { user, loading, isInitialized } = useUser()
  const [requests, setRequests] = useState<FreeHookahRequest[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const fetchRequests = useCallback(async (tgId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/free-hookah-requests/list?admin_tg_id=${tgId}&status=${filter}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (data.success) {
        setRequests(data.requests || [])
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
      } else {
        console.error('Failed to fetch requests:', data.message)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.tg_id) return

      try {
        const response = await fetch(`/api/admin?tg_id=${user.tg_id}`)
        const data = await response.json()
        setIsAdmin(data.is_admin || false)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    if (isInitialized && user) {
      checkAdmin()
    }
  }, [isInitialized, user])

  // Fetch requests
  useEffect(() => {
    if (isInitialized && user?.tg_id && isAdmin) {
      fetchRequests(Number(user.tg_id))
    }
  }, [isInitialized, user?.tg_id, isAdmin, filter, fetchRequests])

  // Auto-refresh every 10 seconds for pending requests
  useEffect(() => {
    if (!isInitialized || !user?.tg_id || !isAdmin || filter !== 'pending') return

    const interval = setInterval(() => {
      fetchRequests(Number(user.tg_id))
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [isInitialized, user?.tg_id, isAdmin, filter, fetchRequests])

  const handleApprove = async (requestId: number) => {
    if (!user?.tg_id || !confirm('Подтвердить получение бесплатного кальяна?')) return

    setProcessingId(requestId)
    try {
      const response = await fetch('/api/free-hookah-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          admin_tg_id: user.tg_id,
          action: 'approve'
        })
      })

      const data = await response.json()
      if (data.success) {
        // Show success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideUp'
        notification.innerHTML = '✅ Запрос подтвержден!'
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.style.opacity = '0'
          notification.style.transition = 'opacity 0.3s'
          setTimeout(() => notification.remove(), 300)
        }, 3000)

        // Refresh list
        fetchRequests(Number(user.tg_id))
      } else {
        alert('❌ Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error approving request:', error)
      alert('❌ Ошибка при подтверждении запроса')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: number) => {
    if (!user?.tg_id || !confirm('Отклонить запрос на бесплатный кальян?')) return

    setProcessingId(requestId)
    try {
      const response = await fetch('/api/free-hookah-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          admin_tg_id: user.tg_id,
          action: 'reject'
        })
      })

      const data = await response.json()
      if (data.success) {
        // Show success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideUp'
        notification.innerHTML = '❌ Запрос отклонен'
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.style.opacity = '0'
          notification.style.transition = 'opacity 0.3s'
          setTimeout(() => notification.remove(), 300)
        }, 3000)

        // Refresh list
        fetchRequests(Number(user.tg_id))
      } else {
        alert('❌ Ошибка: ' + data.message)
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('❌ Ошибка при отклонении запроса')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Загрузка...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-white mb-4">Доступ запрещен</h2>
            <p className="text-gray-400">Только администраторы могут просматривать эту страницу</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl border-2 border-purple-500/30 p-6 mb-6 shadow-lg shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <span className="text-4xl mr-3">🎁</span>
                Запросы на бесплатные кальяны
              </h1>
              <button
                onClick={() => user?.tg_id && fetchRequests(Number(user.tg_id))}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:scale-100"
              >
                {isLoading ? '⏳' : '🔄'} Обновить
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400">Всего</div>
              </div>
              <div className="bg-yellow-900/30 rounded-lg p-3 text-center border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-xs text-yellow-300">Ожидают</div>
              </div>
              <div className="bg-green-900/30 rounded-lg p-3 text-center border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
                <div className="text-xs text-green-300">Одобрено</div>
              </div>
              <div className="bg-red-900/30 rounded-lg p-3 text-center border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                <div className="text-xs text-red-300">Отклонено</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  filter === f
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {f === 'all' && '📋 Все'}
                {f === 'pending' && '⏳ Ожидают'}
                {f === 'approved' && '✅ Одобрено'}
                {f === 'rejected' && '❌ Отклонено'}
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Запросов нет</h3>
                <p className="text-gray-500">
                  {filter === 'pending' && 'Нет новых запросов на подтверждение'}
                  {filter === 'approved' && 'Нет одобренных запросов'}
                  {filter === 'rejected' && 'Нет отклоненных запросов'}
                  {filter === 'all' && 'Нет запросов'}
                </p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className={`bg-gray-900 rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${
                    req.status === 'pending'
                      ? 'border-yellow-500/50 hover:border-yellow-500 hover:shadow-yellow-500/20'
                      : req.status === 'approved'
                      ? 'border-green-500/30 hover:border-green-500/50'
                      : 'border-red-500/30 hover:border-red-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-3xl mr-3">
                          {req.status === 'pending' && '⏳'}
                          {req.status === 'approved' && '✅'}
                          {req.status === 'rejected' && '❌'}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-white">{req.user.name}</h3>
                          <p className="text-sm text-gray-400">📞 {req.user.phone}</p>
                          {req.user.username && (
                            <p className="text-xs text-gray-500">@{req.user.username}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-3">
                        <span>🕐 {new Date(req.created_at).toLocaleString('ru-RU')}</span>
                        {req.approver && (
                          <span className="text-purple-400">
                            👤 Обработал: {req.approver.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {req.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={processingId === req.id}
                          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:scale-100 shadow-lg shadow-green-500/30"
                        >
                          {processingId === req.id ? '⏳' : '✅'} Выдать
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:scale-100 shadow-lg shadow-red-500/30"
                        >
                          {processingId === req.id ? '⏳' : '❌'} Отклонить
                        </button>
                      </div>
                    )}

                    {req.status !== 'pending' && (
                      <div className={`px-4 py-2 rounded-lg font-semibold ${
                        req.status === 'approved'
                          ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                          : 'bg-red-900/30 text-red-400 border border-red-500/30'
                      }`}>
                        {req.status === 'approved' ? '✅ Выдан' : '❌ Отклонен'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

