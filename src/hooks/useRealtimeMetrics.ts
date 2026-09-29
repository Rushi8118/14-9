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

/**
 * Roles counted for the dashboard breakdown. Bounded on purpose: each entry is
 * one `head: true` count that transfers no rows, so the cost is fixed no matter
 * how large user_profiles grows. Mirrors ROLE_HIERARCHY in src/lib/rbac.
 */
const COUNTED_ROLES = [
  'super_admin',
  'admin',
  'marketing',
  'accountant',
  'counselor',
  'visa_officer',
  'hr',
  'customer',
] as const

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
      // Counts come back as counts. This previously selected `user_role` from
      // every row of user_profiles and `status` from every row of applications,
      // downloaded both, and counted them in JavaScript on the main thread --
      // on a timer. `head: true` asks Postgres for the number and transfers no
      // rows at all, and the per-role breakdown is a bounded set of small counts
      // rather than the whole table.
      const [usersRes, appsRes, pendingRes, sessionsRes, ...roleRes] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('admin_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ...COUNTED_ROLES.map((role) =>
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_role', role),
        ),
      ])

      if (usersRes.error) throw usersRes.error
      if (appsRes.error) throw appsRes.error

      const totalUsers = usersRes.count ?? 0
      const totalApplications = appsRes.count ?? 0
      const activeSessions = sessionsRes.error ? 0 : (sessionsRes.count ?? 0)

      const usersByRole = COUNTED_ROLES.map((role, i) => ({
        role,
        count: roleRes[i]?.error ? 0 : (roleRes[i]?.count ?? 0),
      })).filter((r) => r.count > 0)

      const pending = pendingRes.error ? 0 : (pendingRes.count ?? 0)

      setMetrics((prev) => ({
        ...prev,
        // Was `Math.max(1, Math.floor(activeSessions * 0.6))` -- a made-up
        // number presented as a metric. There is no data behind the 0.6, and it
        // could never return 0 once any session existed. One active session is
        // one active session until something actually measures users.
        activeUsers: activeSessions,
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
