import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface AdminSession {
  id: string
  user_id: string
  user_email?: string
  user_role?: string
  fingerprint: string | null
  user_agent: string | null
  ip_address: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  location: string | null
  timezone: string | null
  is_active: boolean
  last_seen: string
  terminated_at: string | null
  terminated_by: string | null
  created_at: string
}

export function useActiveSessions() {
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('admin_sessions')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(100)

      if (err) throw err
      setSessions(data ?? [])
    } catch {
      setError('Failed to load sessions')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const terminateSession = useCallback(async (sessionId: string, terminatedBy: string) => {
    try {
      const { error: err } = await supabase
        .from('admin_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          terminated_by: terminatedBy,
        })
        .eq('id', sessionId)
      if (err) throw err
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, is_active: false, terminated_at: new Date().toISOString() }
            : s,
        ),
      )
      return { success: true }
    } catch (err: unknown) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, is_active: false, terminated_at: new Date().toISOString() }
            : s,
        ),
      )
      return { success: false, error: err instanceof Error ? err.message : 'Failed' }
    }
  }, [])

  useEffect(() => {
    void fetchSessions()

    // A bare setInterval keeps firing while the tab is hidden, so an admin with
    // the panel open in a background tab kept polling every 30 seconds all day.
    // Skip the tick when hidden, and refresh once on return so the view is not
    // stale when it becomes visible again.
    const interval = setInterval(() => {
      if (document.hidden) return
      void fetchSessions()
    }, 60_000)

    const onVisible = () => {
      if (!document.hidden) void fetchSessions()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchSessions])

  const activeSessions = sessions.filter(s => s.is_active)
  const terminatedSessions = sessions.filter(s => !s.is_active)

  return { sessions, activeSessions, terminatedSessions, loading, error, refetch: fetchSessions, terminateSession }
}
