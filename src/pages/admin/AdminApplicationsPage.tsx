'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import {
  Briefcase, Filter, RefreshCw, Search, X, Calendar,
  ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Empty } from '@/components/ui/empty'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { ThemeDatePicker } from '@/components/ui/theme-date-picker'

type AppRow = {
  id: string
  application_id: string | null
  user_profile_full_name: string | null
  user_profile_email: string | null
  application_type: string
  status: string
  priority: string
  created_at: string
  country_id: string | null
}

const STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn']
const APPLICABLE_TYPES = ['work', 'study', 'business', 'tourist', 'investor']
const PRIORITY_LABELS: Record<string, string> = {
  normal: 'Normal', urgent: 'Urgent', high: 'High', low: 'Low'
}

function StatCard({ label, value, variant }: { label: string; value: number; variant?: string }) {
  const variantClass = variant === 'urgent'
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-muted/50 border-border text-foreground'
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-center', variantClass)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

export default function AdminApplicationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-applications', page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_applications', { p_page: page, p_page_size: pageSize })
      if (error) throw error
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      return (parsed ?? []) as AppRow[]
    },
  })

  const { data: countries } = useQuery({
    queryKey: ['admin-countries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('countries').select('id,name').order('name').limit(50)
      if (error) throw error
      return (data ?? []) as { id: string; name: string }[]
    },
  })

  useEffect(() => {
    const unsubscribe = subscribePostgresChanges(
      supabase,
      'admin-applications',
      { event: '*', schema: 'public', table: 'applications' },
      () => { void refetch() },
    )
    return unsubscribe
  }, [refetch])

  const filtered = useMemo(() => {
    if (!rawData) return []
    return rawData.filter(row => {
      const q = search.toLowerCase()
      const matchesSearch = !q || [
        row.application_id, row.user_profile_full_name, row.user_profile_email, row.application_type, row.status
      ].some(v => v?.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const matchesType = typeFilter === 'all' || row.application_type === typeFilter
      const matchesCountry = countryFilter === 'all' || row.country_id === countryFilter
      const matchesPriority = priorityFilter === 'all' || row.priority === priorityFilter
      let matchesDate = true
      if (dateFrom) {
        matchesDate = matchesDate && new Date(row.created_at) >= new Date(dateFrom)
      }
      if (dateTo) {
        matchesDate = matchesDate && new Date(row.created_at) <= new Date(dateTo + 'T23:59:59')
      }
      return matchesSearch && matchesStatus && matchesType && matchesCountry && matchesPriority && matchesDate
    })
  }, [rawData, search, statusFilter, typeFilter, countryFilter, priorityFilter, dateFrom, dateTo])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = String((a as any)[sortKey] ?? '')
      const bVal = String((b as any)[sortKey] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize)

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, statusFilter, typeFilter, countryFilter, priorityFilter, dateFrom, dateTo])

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }, [sortKey])

  const clearFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setCountryFilter('all')
    setPriorityFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }, [])

  // KPI counts
  const kpis = useMemo(() => {
    if (!rawData) return {}
    return {
      total: rawData.length,
      draft: rawData.filter(r => r.status === 'draft').length,
      submitted: rawData.filter(r => r.status === 'submitted').length,
      under_review: rawData.filter(r => r.status === 'under_review').length,
      approved: rawData.filter(r => r.status === 'approved').length,
      rejected: rawData.filter(r => r.status === 'rejected').length,
      urgent: rawData.filter(r => r.priority === 'urgent').length,
    }
  }, [rawData])

  const hasActiveFilters = search || statusFilter !== 'all' || typeFilter !== 'all' || countryFilter !== 'all' || priorityFilter !== 'all' || dateFrom || dateTo

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-7 h-7" /> Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track visa applications across all statuses
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4 mr-1.5', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard label="Total" value={kpis.total ?? 0} />
        <StatCard label="Draft" value={kpis.draft ?? 0} />
        <StatCard label="Submitted" value={kpis.submitted ?? 0} />
        <StatCard label="Under Review" value={kpis.under_review ?? 0} />
        <StatCard label="Approved" value={kpis.approved ?? 0} />
        <StatCard label="Rejected" value={kpis.rejected ?? 0} />
        <StatCard label="Urgent" value={kpis.urgent ?? 0} variant="urgent" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </h2>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground">
              <X className="w-3 h-3 mr-1" /> Clear all
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Application Type</SelectLabel>
                <SelectItem value="all">All Types</SelectItem>
                {APPLICABLE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Priority</SelectLabel>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Country</SelectLabel>
                <SelectItem value="all">All Countries</SelectItem>
                {(countries ?? []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ThemeDatePicker
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="From date"
            variant="admin"
            showShortcuts={false}
            className="h-9 text-xs w-36"
          />
          <ThemeDatePicker
            value={dateTo}
            onChange={setDateTo}
            placeholder="To date"
            variant="admin"
            showShortcuts={false}
            className="h-9 text-xs w-36"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {sorted.length} application{sorted.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ' (filtered)'}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p>Failed to load applications.</p>
          <p className="mt-1 text-xs font-mono text-red-700">{(error as any)?.message || 'Unknown error'}</p>
          <p className="mt-2 text-xs text-red-600">
            Run <code>supabase/FIX_APP_RPC.sql</code> then <code>supabase/FIX_APP_ADMIN_ACCESS.sql</code> in Supabase SQL Editor.
          </p>
        </div>
      ) : pageData.length === 0 ? (
        <Empty title="No applications found" description="Applications will appear here once submitted." />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  { key: 'application_id', label: 'ID' },
                  { key: 'user_profile_full_name', label: 'Applicant' },
                  { key: 'application_type', label: 'Type' },
                  { key: 'status', label: 'Status' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'created_at', label: 'Created' },
                ].map(col => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      'cursor-pointer select-none hover:bg-muted/50 transition-colors',
                    )}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageData.map(row => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {row.application_id || row.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.user_profile_full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{row.user_profile_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-sm">{row.application_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'destructive' : row.status === 'under_review' ? 'warning' : row.status === 'draft' ? 'default' : row.status === 'withdrawn' ? 'purple' : 'info'} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      row.priority === 'urgent' ? 'bg-amber-100 text-amber-700' :
                      row.priority === 'high' ? 'bg-red-100 text-red-700' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {PRIORITY_LABELS[row.priority] || row.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
