import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'

export interface RealtimeMetrics {
  activeUsers: number
  activeSessions: number
  totalApplications: number
  pendingApplications: number
  totalUsers: number
  newUsersToday: number
  errorRate: number
  avgResponseMs: number
  recentEvents: RealtimeEvent[]
  usersByRole: RoleCount[]
  applicationsOverTime: TimePoint[]
  lastUpdated: string
}

export interface RealtimeEvent {
  id: string
  type: 'user_registered' | 'application_submitted' | 'session_started' | 'error' | 'payment'
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'error'
}

export interface RoleCount { role: string; count: number }
export interface TimePoint { label: string; value: number }

export function useRealtimeMetrics(refreshIntervalMs = 30000) {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeUsers: 0,
    activeSessions: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalUsers: 0,
    newUsersToday: 0,
    errorRate: 0,
    avgResponseMs: 0,
    recentEvents: [],
    usersByRole: [],
    applicationsOverTime: [],
    lastUpdated: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const [usersRes, appsRes, sessionsRes] = await Promise.all([
        supabase.from('user_profiles').select('user_role', { count: 'exact' }),
        supabase.from('applications').select('status', { count: 'exact' }),
        supabase.from('admin_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])

      if (usersRes.error) throw usersRes.error
      if (appsRes.error) throw appsRes.error

      const totalUsers = usersRes.count ?? 0
      const totalApplications = appsRes.count ?? 0
      const activeSessions = sessionsRes.error ? 0 : (sessionsRes.count ?? 0)

      const roleCounts: Record<string, number> = {}
      if (usersRes.data) {
        for (const row of usersRes.data) {
          if (row.user_role) roleCounts[row.user_role] = (roleCounts[row.user_role] ?? 0) + 1
        }
      }
      const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({ role, count }))

      const pending = appsRes.data
        ? appsRes.data.filter((a: { status: string }) => a.status === 'pending').length
        : 0

      setMetrics((prev) => ({
        ...prev,
        activeUsers: activeSessions > 0 ? Math.max(1, Math.floor(activeSessions * 0.6)) : 0,
        activeSessions,
        totalApplications,
        pendingApplications: pending,
        totalUsers,
        usersByRole,
        lastUpdated: new Date().toISOString(),
      }))
    } catch {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, refreshIntervalMs)

    let unsubscribe = () => {}
    try {
      unsubscribe = subscribePostgresChanges(
        supabase,
        'admin-realtime',
        [
          { event: 'INSERT', schema: 'public', table: 'user_profiles' },
          { event: 'INSERT', schema: 'public', table: 'applications' },
        ],
        (raw) => {
          const payload = raw as { table?: string; new?: { email?: string } }
          if (payload.table === 'user_profiles') {
            const event: RealtimeEvent = {
              id: Date.now().toString(),
              type: 'user_registered',
              message: `New user registered: ${payload.new?.email ?? 'unknown'}`,
              timestamp: new Date().toISOString(),
              severity: 'info',
            }
            setMetrics((prev) => ({
              ...prev,
              totalUsers: prev.totalUsers + 1,
              newUsersToday: prev.newUsersToday + 1,
              recentEvents: [event, ...prev.recentEvents].slice(0, 20),
            }))
            return
          }

          const event: RealtimeEvent = {
            id: Date.now().toString(),
            type: 'application_submitted',
            message: 'New application submitted',
            timestamp: new Date().toISOString(),
            severity: 'info',
          }
          setMetrics((prev) => ({
            ...prev,
            totalApplications: prev.totalApplications + 1,
            recentEvents: [event, ...prev.recentEvents].slice(0, 20),
          }))
        },
        (status) => setConnected(status === 'SUBSCRIBED'),
      )
    } catch {
      setConnected(false)
    }

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [fetchMetrics, refreshIntervalMs])

  return { metrics, loading, connected, refetch: fetchMetrics }
}
