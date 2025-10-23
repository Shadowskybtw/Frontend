"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { useUser } from '@/contexts/UserContext'
import { useAdmin } from '@/contexts/AdminContext'

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
  const { isAdmin, isChecking, refreshPendingCount } = useAdmin()
  const [requests, setRequests] = useState<FreeHookahRequest[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const fetchRequests = useCallback(async (tgId: number) => {
    setIsLoading(true)
    try {
      // Fetch filtered requests
      const response = await fetch(`/api/free-hookah-requests/list?admin_tg_id=${tgId}&status=${filter}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (data.success) {
        setRequests(data.requests || [])
        
        // Always fetch stats for ALL requests (not filtered)
        const statsResponse = await fetch(`/api/free-hookah-requests/list?admin_tg_id=${tgId}&status=all`, {
          cache: 'no-store'
        })
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
        }
      } else {
        console.error('Failed to fetch requests:', data.message)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  // Fetch requests when admin status is confirmed
  useEffect(() => {
    if (isInitialized && user?.tg_id && isAdmin && !isChecking) {
      fetchRequests(Number(user.tg_id))
    }
  }, [isInitialized, user?.tg_id, isAdmin, isChecking, filter, fetchRequests])

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

        // Refresh list and pending count
        fetchRequests(Number(user.tg_id))
        refreshPendingCount()
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

        // Refresh list and pending count
        fetchRequests(Number(user.tg_id))
        refreshPendingCount()
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

  if (loading || !isInitialized || isChecking) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-3"></div>
            <p className="text-sm text-gray-400">Проверка прав...</p>
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
          <div className="max-w-sm w-full bg-gray-900 rounded-xl border border-red-500/30 p-6 text-center">
            <div className="text-red-500 text-5xl mb-3">🚫</div>
            <h2 className="text-lg font-bold text-white mb-2">Доступ запрещен</h2>
            <p className="text-xs text-gray-400">Только для администраторов</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="flex-1 p-3 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-500/30 p-4 mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-2">🎁</span>
                <span className="text-base">Запросы</span>
              </h1>
              <button
                onClick={() => user?.tg_id && fetchRequests(Number(user.tg_id))}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm transition-all"
              >
                {isLoading ? '⏳' : '🔄'}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-black/40 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-white">{stats.total}</div>
                <div className="text-[10px] text-gray-400">Всего</div>
              </div>
              <div className="bg-yellow-900/30 rounded-lg p-2 text-center border border-yellow-500/40">
                <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-[10px] text-yellow-300">Ожидают</div>
              </div>
              <div className="bg-green-900/30 rounded-lg p-2 text-center border border-green-500/40">
                <div className="text-xl font-bold text-green-400">{stats.approved}</div>
                <div className="text-[10px] text-green-300">Одобрено</div>
              </div>
              <div className="bg-red-900/30 rounded-lg p-2 text-center border border-red-500/40">
                <div className="text-xl font-bold text-red-400">{stats.rejected}</div>
                <div className="text-[10px] text-red-300">Отклонено</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {f === 'all' && '📋'}
                {f === 'pending' && '⏳'}
                {f === 'approved' && '✅'}
                {f === 'rejected' && '❌'}
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="text-base font-semibold text-gray-300 mb-1">Запросов нет</h3>
                <p className="text-xs text-gray-500">
                  {filter === 'pending' && 'Нет ожидающих'}
                  {filter === 'approved' && 'Нет одобренных'}
                  {filter === 'rejected' && 'Нет отклоненных'}
                  {filter === 'all' && 'Нет запросов'}
                </p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className={`bg-gray-900 rounded-xl border p-4 transition-all ${
                    req.status === 'pending'
                      ? 'border-yellow-500/50 shadow-yellow-500/10'
                      : req.status === 'approved'
                      ? 'border-green-500/30'
                      : 'border-red-500/30'
                  }`}
                >
                  {/* User Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start flex-1">
                      <span className="text-2xl mr-2 mt-0.5">
                        {req.status === 'pending' && '⏳'}
                        {req.status === 'approved' && '✅'}
                        {req.status === 'rejected' && '❌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white truncate">{req.user.name}</h3>
                        <p className="text-xs text-gray-400">📞 {req.user.phone}</p>
                        {req.user.username && (
                          <p className="text-[10px] text-gray-500">@{req.user.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {req.status !== 'pending' && (
                      <div className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ml-2 ${
                        req.status === 'approved'
                          ? 'bg-green-900/30 text-green-400 border border-green-500/40'
                          : 'bg-red-900/30 text-red-400 border border-red-500/40'
                      }`}>
                        {req.status === 'approved' ? '✅' : '❌'}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-[10px] text-gray-500 mb-3">
                    🕐 {new Date(req.created_at).toLocaleString('ru-RU', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {req.approver && (
                      <span className="ml-2 text-purple-400">
                        • {req.approver.name}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id}
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg"
                      >
                        {processingId === req.id ? '⏳' : '✅ Выдать'}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg"
                      >
                        {processingId === req.id ? '⏳' : '❌ Отклонить'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

