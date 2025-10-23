"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useUser } from './UserContext'

interface AdminContextType {
  isAdmin: boolean
  isChecking: boolean
  pendingCount: number
  refreshPendingCount: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isChecking: true,
  pendingCount: 0,
  refreshPendingCount: async () => {}
})

export const useAdmin = () => useContext(AdminContext)

interface AdminProviderProps {
  children: ReactNode
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { user, isInitialized } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  // Check admin status ONCE when user is initialized
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.tg_id || !isInitialized) {
        setIsChecking(false)
        return
      }

      // Check localStorage cache first
      const cacheKey = `admin_status_${user.tg_id}`
      const cachedStatus = localStorage.getItem(cacheKey)
      
      if (cachedStatus !== null) {
        const adminStatus = cachedStatus === 'true'
        console.log('💾 Using cached admin status:', adminStatus)
        setIsAdmin(adminStatus)
        setIsChecking(false)
        
        // Fetch pending count in background if admin
        if (adminStatus) {
          fetchPendingCount()
        }
        return
      }

      try {
        console.log('🔍 Checking admin status for user:', user.tg_id)
        const response = await fetch(`/api/admin?tg_id=${user.tg_id}`, {
          cache: 'force-cache'
        })
        const data = await response.json()
        const adminStatus = data.is_admin || false
        
        // Cache the result
        localStorage.setItem(cacheKey, String(adminStatus))
        
        setIsAdmin(adminStatus)
        console.log('✅ Admin status:', adminStatus)
        
        // If admin, fetch initial pending count
        if (adminStatus) {
          await fetchPendingCount()
        }
      } catch (error) {
        console.error('❌ Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAdminStatus()
  }, [user?.tg_id, isInitialized])

  // Fetch pending requests count
  const fetchPendingCount = async () => {
    if (!user?.tg_id) return

    try {
      const response = await fetch(
        `/api/free-hookah-requests/list?admin_tg_id=${user.tg_id}&status=pending`,
        { cache: 'no-store' }
      )
      const data = await response.json()
      if (data.success) {
        setPendingCount(data.stats?.pending || 0)
      }
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }

  // Auto-refresh pending count every 30 seconds for admins
  useEffect(() => {
    if (!isAdmin || !user?.tg_id) return

    const interval = setInterval(() => {
      fetchPendingCount()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isAdmin, user?.tg_id])

  const value: AdminContextType = {
    isAdmin,
    isChecking,
    pendingCount,
    refreshPendingCount: fetchPendingCount
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

