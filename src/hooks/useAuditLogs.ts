import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { applyLogEnvironmentFilter, withLogEnvironmentFallback } from '@/lib/log-environment'
import type { LogEnvironmentFilter } from '@/lib/runtime-env'

export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  user_role: string | null
  action: string
  resource: string | null
  resource_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  fingerprint: string | null
  severity: 'info' | 'warning' | 'critical'
  created_at: string
  environment?: string | null
}

export interface AuditLogFilters {
  action?: string
  severity?: string
  userId?: string
  from?: string
  to?: string
  search?: string
  /**
   * Which environment's records to read. Defaults to the live site, so admin
   * actions taken against localhost are not shown as real ones.
   */
  environment?: LogEnvironmentFilter
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async (page = 1, limit = 50) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (filters.severity) query = query.eq('severity', filters.severity)
      if (filters.userId)   query = query.eq('user_id', filters.userId)
      if (filters.action)   query = query.ilike('action', `%${filters.action}%`)
      if (filters.from)     query = query.gte('created_at', filters.from)
      if (filters.to)       query = query.lte('created_at', filters.to)
      if (filters.search)   query = query.or(
        `user_email.ilike.%${filters.search}%,action.ilike.%${filters.search}%,resource.ilike.%${filters.search}%`
      )

      const { data, error: err, count } = await withLogEnvironmentFallback(() =>
        applyLogEnvironmentFilter(query, filters.environment ?? 'production'),
      )
      if (err) throw err
      setLogs(data ?? [])
      setTotal(count ?? 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
      setLogs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filters.severity, filters.userId, filters.action, filters.from, filters.to, filters.search, filters.environment])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return { logs, loading, error, total, refetch: fetchLogs }
}

export async function insertAuditLog(entry: Omit<AuditLog, 'id' | 'created_at'>) {
  try {
    await supabase.from('audit_logs').insert(entry)
  } catch {
    // Silently fail — audit log should never break main flow
  }
}


