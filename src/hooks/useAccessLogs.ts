/**
 * Filtered, paginated access-log query with optional 60s polling.
 * Polling always uses the active filters and refreshes the already-loaded
 * window (does not reset page index or scroll).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AccessLogFilters,
  AccessLogRow,
  AccessEventType,
  PAGE_SIZE,
  exportAccessLogsCsv,
  fetchAccessLogPage,
  fetchEventTypeCounts,
} from '@/lib/access-log'

type UseAccessLogsResult = {
  rows: AccessLogRow[]
  total: number
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
  error: string | null
  hasMore: boolean
  eventTypeCounts: Partial<Record<AccessEventType, number>>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  exportCsv: () => Promise<void>
  exporting: boolean
}

/** Stable key for query filters — excludes `live` so pause/resume does not remount the list. */
function queryKeyFromFilters(filters: AccessLogFilters): string {
  return JSON.stringify({
    tab: filters.tab,
    eventTypes: filters.eventTypes,
    role: filters.role ?? null,
    userId: filters.userId ?? null,
    device: filters.device ?? null,
    browser: filters.browser ?? null,
    path: filters.path ?? null,
    referrer: filters.referrer ?? null,
    timeRange: filters.timeRange,
    from: filters.from ?? null,
    to: filters.to ?? null,
    source: filters.source,
  })
}

export function useAccessLogs(filters: AccessLogFilters): UseAccessLogsResult {
  const [rows, setRows] = useState<AccessLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventTypeCounts, setEventTypeCounts] = useState<
    Partial<Record<AccessEventType, number>>
  >({})

  const loadedCountRef = useRef(0)
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  loadedCountRef.current = rows.length

  const queryKey = useMemo(() => queryKeyFromFilters(filters), [filters])

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const current = filtersRef.current
      const [{ rows: pageRows, total: pageTotal }, counts] = await Promise.all([
        fetchAccessLogPage(current, 0, PAGE_SIZE),
        fetchEventTypeCounts(current),
      ])
      setRows(pageRows)
      setTotal(pageTotal)
      setEventTypeCounts(counts)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load access logs')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch when filter query fields change (not when only `live` toggles).
  useEffect(() => {
    void fetchInitial()
  }, [queryKey, fetchInitial])

  /** Silent re-poll: same filters, same loaded window, no scroll reset. */
  const silentRefresh = useCallback(async () => {
    const current = filtersRef.current
    const limit = Math.max(loadedCountRef.current, PAGE_SIZE)
    setRefreshing(true)
    try {
      // Do not re-fetch event-type counts on every poll — only the row window.
      const { rows: pageRows, total: pageTotal } = await fetchAccessLogPage(
        current,
        0,
        limit,
      )
      setRows(pageRows)
      setTotal(pageTotal)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to refresh access logs')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!filters.live) return
    const id = window.setInterval(() => {
      void silentRefresh()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [filters.live, silentRefresh])

  const loadMore = useCallback(async () => {
    if (loadingMore || rows.length >= total) return
    setLoadingMore(true)
    setError(null)
    try {
      const { rows: next, total: pageTotal } = await fetchAccessLogPage(
        filtersRef.current,
        rows.length,
        PAGE_SIZE,
      )
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        return [...prev, ...next.filter((r) => !seen.has(r.id))]
      })
      setTotal(pageTotal)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, rows.length, total])

  const refresh = useCallback(async () => {
    await silentRefresh()
  }, [silentRefresh])

  const exportCsv = useCallback(async () => {
    setExporting(true)
    try {
      const blob = await exportAccessLogsCsv(filtersRef.current)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `access-logs-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'CSV export failed')
    } finally {
      setExporting(false)
    }
  }, [])

  return {
    rows,
    total,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: rows.length < total,
    eventTypeCounts,
    loadMore,
    refresh,
    exportCsv,
    exporting,
  }
}
