'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { useAuth } from '@/hooks/use-auth'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { AdminAmbientScene } from '@/components/admin/AdminAmbientScene'
import { ApplicationDetailPanel, ApplicationDetailSkeleton } from '@/components/admin/ApplicationDetailPanel'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Archive, Briefcase, Check, ChevronLeft, ChevronRight, Download, FileText,
  Filter, MoreHorizontal, RefreshCw, Search, ShieldAlert, Trash2, X, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { writeAuditLog } from '@/lib/audit-log'
import {
  type AppRow, type DetailData, type Officer,
  STATUSES, TYPES, PRIORITIES, PAGE_SIZES,
  statusVariant, pretty, dateText, daysPending,
} from '@/pages/admin/applications.types'

function StatCard({ label, value, active, onClick, variant }: { label: string; value: number; active?: boolean; onClick: () => void; variant?: string }) {
  return <button type="button" onClick={onClick} className={cn('rounded-xl border px-4 py-3 text-center transition-colors hover:border-primary/50', active && 'border-primary bg-primary/5', variant === 'urgent' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-muted/50 border-border text-foreground')}>
    <p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </button>
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="hidden h-3 w-24 rounded sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminApplicationsWorkspace() {
  const { hasPermission, isSuperAdmin } = useAuth()
  const queryClient = useQueryClient()
  const canRead = hasPermission('applications.read')
  const canUpdate = hasPermission('applications.update') || isSuperAdmin
  const canProcess = hasPermission('applications.process') || isSuperAdmin
  const canDelete = hasPermission('applications.delete') || isSuperAdmin
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [officerFilter, setOfficerFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selected, setSelected] = useState<string[]>([])
  const [selectedApp, setSelectedApp] = useState<AppRow | null>(null)
  const [action, setAction] = useState<{ name: string; row?: AppRow; value?: string } | null>(null)
  const [reason, setReason] = useState('')
  const [actionPending, setActionPending] = useState(false)
  const [detailDirty, setDetailDirty] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [visible, setVisible] = useState<Record<string, boolean>>({ country: true, officer: true, updated: true, sla: true })

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams()
    const values: Record<string, string> = { q: search, status: statusFilter, type: typeFilter, country: countryFilter, priority: priorityFilter, officer: officerFilter, from: dateFrom, to: dateTo }
    Object.entries(values).forEach(([key, value]) => { if (value && value !== 'all') params.set(key, value) })
    window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`)
  }, [search, statusFilter, typeFilter, countryFilter, priorityFilter, officerFilter, dateFrom, dateTo])
  useEffect(() => { syncUrl(); setPage(1) }, [syncUrl])

  const { data: rawData = [], isLoading, error, refetch, isFetching } = useQuery<AppRow[]>({
    queryKey: ['admin-applications', page, pageSize],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.rpc('get_all_applications', { p_page: page, p_page_size: pageSize })
      if (queryError) throw queryError
      return (typeof data === 'string' ? JSON.parse(data) : data ?? []) as AppRow[]
    }, enabled: canRead,
  })
  const { data: countries = [] } = useQuery<{ id: string; name: string }[]>({ queryKey: ['admin-countries'], queryFn: async () => { const { data, error: queryError } = await supabase.from('countries').select('id,name').order('name'); if (queryError) throw queryError; return data ?? [] }, enabled: canRead })
  const { data: officers = [] } = useQuery<Officer[]>({ queryKey: ['admin-application-officers'], enabled: canRead, queryFn: async () => {
    const rpc = await supabase.rpc('get_application_officers')
    if (!rpc.error) return (typeof rpc.data === 'string' ? JSON.parse(rpc.data) : rpc.data ?? []) as Officer[]
    if (!/schema cache|could not find the function|PGRST202/i.test(rpc.error.message)) throw rpc.error
    const { data, error: officerError } = await supabase.from('user_profiles').select('id,full_name,email').in('user_role', ['hr', 'visa_officer', 'counselor', 'consultant', 'manager', 'admin', 'super_admin', 'superadmin']).eq('status', 'active').order('full_name')
    if (officerError) throw officerError
    return (data ?? []) as Officer[]
  } })
  const detailQuery = useQuery<DetailData>({ queryKey: ['admin-application-detail', selectedApp?.id], enabled: !!selectedApp && canRead, queryFn: async () => {
    const { data, error: queryError } = await supabase.rpc('get_application_management_data', { p_application_id: selectedApp!.id })
    if (!queryError && data) return data as DetailData
    if (queryError && !/schema cache|could not find the function|PGRST202/i.test(queryError.message)) throw queryError

    const isEnquiry = selectedApp!.application_id?.startsWith('ENQ-') || selectedApp!.meta?.source === 'consultations'
    if (isEnquiry) {
      const { data: consultation, error: consultationError } = await supabase.from('consultations').select('*, applicant:user_profiles!consultations_user_id_fkey(*), assigned_officer:user_profiles!consultations_assigned_consultant_fkey(*)').eq('id', selectedApp!.id).maybeSingle()
      if (consultationError) throw consultationError
      if (!consultation) throw new Error('This consultation enquiry could not be found.')
      const application = {
        ...selectedApp!,
        ...consultation,
        application_id: selectedApp!.application_id,
        application_type: selectedApp!.application_type,
        status: selectedApp!.status,
        priority: selectedApp!.priority,
        consultant_notes: consultation.consultant_notes,
        personal_info: consultation.user_notes,
        applicant: consultation.applicant,
        assigned_officer: consultation.assigned_officer,
        meta: { source: 'consultations', consultation_type: consultation.consultation_type, preferred_country: consultation.preferred_country, visa_category: consultation.visa_category },
      }
      return { application, documents: [], activity: [], messages: [] } as DetailData
    }

    const { data: application, error: applicationError } = await supabase.from('applications').select('*, applicant:user_profiles!applications_user_id_fkey(*), country:countries(*), visa_program:visa_programs(*), assigned_officer:user_profiles!applications_assigned_consultant_fkey(*)').eq('id', selectedApp!.id).maybeSingle()
    if (applicationError) throw applicationError
    if (!application) throw new Error('This application could not be found.')
    const [{ data: documents }, { data: activity }] = await Promise.all([
      supabase.from('documents').select('*').eq('application_id', selectedApp!.id).order('created_at', { ascending: false }),
      supabase.from('application_activity').select('*').eq('application_id', selectedApp!.id).order('created_at', { ascending: false }),
    ])
    return { application, documents: documents ?? [], activity: activity ?? [], messages: [] } as DetailData
  } })

  useEffect(() => subscribePostgresChanges(supabase, 'admin-applications-workspace', { event: '*', schema: 'public', table: 'applications' }, () => { void refetch(); if (selectedApp) void detailQuery.refetch() }), [refetch, selectedApp, detailQuery])

  const filtered = useMemo(() => rawData.filter(row => {
    const q = search.toLowerCase()
    const matchesSearch = !q || [row.application_id, row.user_profile_full_name, row.user_profile_email, row.country_name, row.application_type].some(v => v?.toLowerCase().includes(q))
    return matchesSearch && (statusFilter === 'all' || row.status === statusFilter) && (typeFilter === 'all' || row.application_type === typeFilter) && (countryFilter === 'all' || row.country_id === countryFilter) && (priorityFilter === 'all' || row.priority === priorityFilter) && (officerFilter === 'all' || row.assigned_consultant === officerFilter) && (!dateFrom || row.created_at >= dateFrom) && (!dateTo || row.created_at <= `${dateTo}T23:59:59`)
  }), [rawData, search, statusFilter, typeFilter, countryFilter, priorityFilter, officerFilter, dateFrom, dateTo])
  const sorted = useMemo(() => [...filtered].sort((a, b) => { const av = String((a as any)[sortKey] ?? ''), bv = String((b as any)[sortKey] ?? ''); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av) }), [filtered, sortKey, sortDir])
  const kpis = useMemo(() => Object.fromEntries(['total', ...STATUSES, 'urgent'].map(key => [key, key === 'total' ? rawData.length : key === 'urgent' ? rawData.filter(row => row.priority === 'urgent').length : rawData.filter(row => row.status === key).length])), [rawData])

  const runAction = async () => {
    if (!action || actionPending) return
    const ids = action.row ? [action.row.id] : selected
    if (!ids.length) return
    const rpcAction = action.name === 'under_review' ? 'change_status' : action.name
    const rpcValue = action.name === 'under_review' ? 'under_review' : action.value
    if (['reject', 'return_for_corrections', 'request_documents', 'change_status', 'under_review', 'archive', 'delete'].includes(action.name) && !reason.trim()) { toast.error('A reason is required for this action.'); return }
    setActionPending(true)
    try {
      for (const id of ids) {
        const rpcResult = await supabase.rpc('manage_application', { p_application_id: id, p_action: rpcAction, p_value: rpcValue ? (rpcAction === 'assign' ? { officer_id: rpcValue } : rpcAction === 'change_priority' ? { priority: rpcValue } : { status: rpcValue }) : {}, p_reason: reason.trim() || null })
        if (rpcResult.error && !/schema cache|could not find the function|PGRST202/i.test(rpcResult.error.message)) throw rpcResult.error
        if (rpcResult.error) {
          const isEnquiry = action.row?.application_id?.startsWith('ENQ-')
          if (isEnquiry) {
            const consultationUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
            if (rpcAction === 'change_status' || ['approve', 'reject', 'request_documents'].includes(rpcAction)) consultationUpdates.status = rpcAction === 'approve' || rpcValue === 'approved' ? 'confirmed' : rpcAction === 'reject' || rpcValue === 'rejected' ? 'cancelled' : rpcAction === 'request_documents' ? 'requested' : 'scheduled'
            if (rpcAction === 'assign') consultationUpdates.assigned_consultant = rpcValue || null
            if (rpcAction === 'add_note') consultationUpdates.consultant_notes = reason.trim()
            const { data: updatedConsultation, error: consultationError } = await supabase.from('consultations').update(consultationUpdates).eq('id', id).select('id').maybeSingle()
            if (consultationError) throw consultationError
            if (!updatedConsultation) throw new Error('No consultation was updated. Check your admin permissions.')
          } else if (rpcAction === 'duplicate') {
            const { data: source, error: sourceError } = await supabase.from('applications').select('user_id,visa_program_id,country_id,application_type,priority,personal_info,education_history,work_history,document_checklist,meta,consultant_notes').eq('id', id).single()
            if (sourceError) throw sourceError
            const { error: duplicateError } = await supabase.from('applications').insert({ ...source, status: 'draft', meta: { ...(source.meta || {}), duplicated_from: id } })
            if (duplicateError) throw duplicateError
          } else if (rpcAction === 'delete') {
            const { error: deleteError } = await supabase.from('applications').delete().eq('id', id)
            if (deleteError) throw deleteError
          } else {
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
            if (rpcAction === 'change_status') updates.status = rpcValue
            if (rpcAction === 'change_priority') updates.priority = rpcValue
            if (rpcAction === 'assign') updates.assigned_consultant = rpcValue || null
            if (rpcAction === 'add_note') updates.consultant_notes = reason.trim()
            if (rpcAction === 'archive') updates.meta = { archived: true, archived_at: new Date().toISOString() }
            const { data: updatedApplication, error: updateError } = await supabase.from('applications').update(updates).eq('id', id).select('id').maybeSingle()
            if (updateError) throw updateError
            if (!updatedApplication) throw new Error('No application was updated. Check your admin permissions.')
          }
        }
      }
      toast.success(`${pretty(action.name)} completed for ${ids.length} application${ids.length === 1 ? '' : 's'}.`)
      setAction(null); setReason(''); setSelected([]); await queryClient.invalidateQueries({ queryKey: ['admin-applications'] }); if (selectedApp) void detailQuery.refetch()
    } catch (err: any) {
      toast.error(err.message || 'Action failed.')
    } finally {
      setActionPending(false)
    }
  }

  const setCaseStatus = async (status: string) => {
    if (!selectedApp) return
    try {
      const { error: rpcError } = await supabase.rpc('set_application_case_status', { p_application_id: selectedApp.id, p_status: status })
      if (rpcError) throw rpcError
      toast.success(`Case marked ${pretty(status)}.`)
      await queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      await detailQuery.refetch()
    } catch (err: any) {
      toast.error(err.message || 'Could not update case status.')
    }
  }

  const saveDetails = async (values: { status: string; priority: string; officerId: string; notes: string; fullName: string; phone: string }) => {
    if (!selectedApp || !canUpdate) return
    const isEnquiry = selectedApp.application_id?.startsWith('ENQ-')
    try {
      if (isEnquiry) {
        const consultationStatus = values.status === 'approved' ? 'confirmed' : values.status === 'rejected' ? 'cancelled' : values.status === 'under_review' ? 'scheduled' : 'requested'
        const { error: consultationError } = await supabase.from('consultations').update({ status: consultationStatus, assigned_consultant: values.officerId || null, consultant_notes: values.notes || null, updated_at: new Date().toISOString() }).eq('id', selectedApp.id)
        if (consultationError) throw consultationError
      } else {
        const { error: applicationError } = await supabase.from('applications').update({ status: values.status, priority: values.priority, assigned_consultant: values.officerId || null, consultant_notes: values.notes || null, personal_info: { ...(detailQuery.data?.application.personal_info || {}), full_name: values.fullName, phone: values.phone }, updated_at: new Date().toISOString() }).eq('id', selectedApp.id)
        if (applicationError) throw applicationError
      }
      if (values.fullName || values.phone) await supabase.from('user_profiles').update({ full_name: values.fullName || null, phone: values.phone || null, updated_at: new Date().toISOString() }).eq('id', selectedApp.user_id)
      toast.success('Application details saved.')
      await queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      await detailQuery.refetch()
    } catch (err: any) {
      toast.error(err.message || 'Could not save application details.')
      throw err
    }
  }

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setCountryFilter('all'); setPriorityFilter('all'); setOfficerFilter('all'); setDateFrom(''); setDateTo('') }
  const exportRows = (rows: AppRow[]) => { const csv = [['Application ID', 'Applicant', 'Email', 'Type', 'Country', 'Status', 'Priority', 'Created', 'Updated'], ...rows.map(row => [row.application_id || row.id, row.user_profile_full_name || '', row.user_profile_email || '', row.application_type, row.country_name || '', row.status, row.priority, row.created_at, row.updated_at || ''])].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'applications.csv'; anchor.click(); URL.revokeObjectURL(url); void writeAuditLog({ action: 'export.csv', resource: 'applications', newValue: { rowCount: rows.length } }) }
  const sort = (key: string) => { setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'); setSortKey(key) }
  const toggleSelected = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  const hasFilters = Boolean(search || statusFilter !== 'all' || typeFilter !== 'all' || countryFilter !== 'all' || priorityFilter !== 'all' || officerFilter !== 'all' || dateFrom || dateTo)

  if (!canRead) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900"><ShieldAlert className="mx-auto mb-3 h-8 w-8" /><h1 className="font-semibold">Permission denied</h1><p className="mt-1 text-sm">You do not have permission to view applications.</p></div>

  return <div className="space-y-6">
    <div className="relative overflow-hidden rounded-2xl">
      <AdminAmbientScene variant="header" className="z-0" />
      <div className="relative z-10 flex flex-col gap-3 p-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Briefcase className="w-7 h-7" /> Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage, respond to, and track visa applications across all statuses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportRows(selected.length ? sorted.filter(row => selected.includes(row.id)) : sorted)}><Download className="mr-1.5 h-4 w-4" />Export</Button>
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={cn('mr-1.5 h-4 w-4', isFetching && 'animate-spin')} />Refresh</Button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">{[['total', 'Total'], ['draft', 'Draft'], ['submitted', 'Submitted'], ['under_review', 'Under Review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['urgent', 'Urgent']].map(([key, label]) => <StatCard key={key} label={label} value={Number(kpis[key] || 0)} active={statusFilter === key || (key === 'urgent' && priorityFilter === 'urgent')} variant={key === 'urgent' ? 'urgent' : undefined} onClick={() => key === 'urgent' ? setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent') : setStatusFilter(key === 'total' || statusFilter === key ? 'all' : key)} />)}</div>

    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><Filter className="h-4 w-4" />Filters</h2>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs"><X className="mr-1 h-3 w-3" />Clear filters</Button>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search applications" placeholder="Name, email, ID, passport..." value={search} onChange={event => setSearch(event.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent></Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{TYPES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent></Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem>{PRIORITIES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent></Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}><SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger><SelectContent><SelectItem value="all">All countries</SelectItem>{countries.map(country => <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>)}</SelectContent></Select>
        <Select value={officerFilter} onValueChange={setOfficerFilter}><SelectTrigger><SelectValue placeholder="Officer" /></SelectTrigger><SelectContent><SelectItem value="all">All officers</SelectItem>{officers.map(officer => <SelectItem key={officer.id} value={officer.id}>{officer.full_name || officer.email}</SelectItem>)}</SelectContent></Select>
        <Input aria-label="Created from" type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} />
        <Input aria-label="Created to" type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} />
      </div>
    </div>

    {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"><span className="text-sm font-medium">{selected.length} selected</span><Select onValueChange={value => setAction({ name: 'change_status', value })}><SelectTrigger className="w-40"><SelectValue placeholder="Change status" /></SelectTrigger><SelectContent>{STATUSES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent></Select><Select onValueChange={value => setAction({ name: 'change_priority', value })}><SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>{PRIORITIES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" onClick={() => exportRows(sorted.filter(row => selected.includes(row.id)))}><Download className="mr-1 h-4 w-4" />Export selected</Button>{canDelete && <Button variant="destructive" size="sm" onClick={() => setAction({ name: 'delete' })}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>}</div>}

    <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{sorted.length} application{sorted.length === 1 ? '' : 's'} found{hasFilters && ' (filtered)'}</span><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Columns</span>{Object.entries(visible).map(([key, value]) => <label key={key} className="flex items-center gap-1 text-xs"><Checkbox checked={value} onCheckedChange={checked => setVisible(current => ({ ...current, [key]: Boolean(checked) }))} />{pretty(key)}</label>)}<Select value={String(pageSize)} onValueChange={value => setPageSize(Number(value))}><SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger><SelectContent>{PAGE_SIZES.map(value => <SelectItem key={value} value={String(value)}>{value}/page</SelectItem>)}</SelectContent></Select></div></div>

    {isLoading ? <TableSkeleton /> : error ? (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-medium">Failed to load applications.</p>
        <p className="mt-1 text-xs font-mono text-red-700">{(error as Error).message}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again</Button>
      </div>
    ) : sorted.length === 0 ? (
      <div className="relative overflow-hidden rounded-xl border border-dashed border-border">
        <AdminAmbientScene variant="empty" />
        <div className="relative z-10">
          <Empty title={hasFilters ? 'No applications match your filters' : 'No applications yet'} description={hasFilters ? 'Try adjusting or clearing your filters.' : 'Applications will appear here once submitted.'}>
            {hasFilters && <Button variant="outline" size="sm" onClick={clearFilters}><X className="mr-1.5 h-3.5 w-3.5" />Clear filters</Button>}
          </Empty>
        </div>
      </div>
    ) : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[1100px]"><thead><tr className="border-b border-border bg-muted/30"><th className="w-10 px-4 py-3"><Checkbox aria-label="Select all visible applications" checked={sorted.length > 0 && sorted.every(row => selected.includes(row.id))} onCheckedChange={checked => setSelected(checked ? sorted.map(row => row.id) : [])} /></th>{[['application_id', 'ID'], ['user_profile_full_name', 'Applicant'], ['application_type', 'Type'], ['country_name', 'Country'], ['status', 'Status'], ['priority', 'Priority'], ['assigned_officer_name', 'Officer'], ['created_at', 'Created'], ['updated_at', 'Updated'], ['sla', 'SLA']].map(([key, label]) => (key === 'country_name' && !visible.country) || (key === 'assigned_officer_name' && !visible.officer) || (key === 'updated_at' && !visible.updated) || (key === 'sla' && !visible.sla) ? null : <th key={key} scope="col" tabIndex={0} className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => sort(key)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); sort(key) } }}>{label}{sortKey === key && <span className="ml-1 text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>)}<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th></tr></thead><tbody className="divide-y divide-border">{sorted.map(row => <tr key={row.id} tabIndex={0} className="cursor-pointer hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" onClick={() => setSelectedApp(row)} onKeyDown={event => { if (event.key === 'Enter') setSelectedApp(row) }}><td className="px-4 py-3" onClick={event => event.stopPropagation()}><Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelected(row.id)} aria-label={`Select ${row.application_id || row.id}`} /></td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.application_id || row.id.slice(0, 8)}</td><td className="px-4 py-3"><p className="text-sm font-medium">{row.user_profile_full_name || 'Unknown'}</p><p className="text-xs text-muted-foreground">{row.user_profile_email}</p></td><td className="px-4 py-3 text-sm capitalize">{pretty(row.application_type)}</td>{visible.country && <td className="px-4 py-3 text-sm">{row.country_flag_emoji} {row.country_name || 'Not set'}</td>}<td className="px-4 py-3"><StatusBadge status={row.status} variant={statusVariant(row.status)} /></td><td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', row.priority === 'urgent' ? 'bg-amber-100 text-amber-700' : row.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground')}>{pretty(row.priority)}</span></td>{visible.officer && <td className="px-4 py-3 text-sm">{row.assigned_officer_name || 'Unassigned'}</td>}<td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{dateText(row.created_at)}</td>{visible.updated && <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{dateText(row.updated_at || row.created_at)}</td>}{visible.sla && <td className="px-4 py-3 text-xs"><span className={cn(daysPending(row) > 14 && row.status !== 'approved' && row.status !== 'rejected' ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>{daysPending(row)}d pending</span></td>}<td className="px-4 py-3 text-right" onClick={event => event.stopPropagation()}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Application actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setSelectedApp(row)}><FileText className="h-4 w-4" />Open application</DropdownMenuItem>{canProcess && <DropdownMenuItem onClick={() => setAction({ name: 'under_review', row })}><Zap className="h-4 w-4" />Move to Under Review</DropdownMenuItem>}{canProcess && <DropdownMenuItem onClick={() => setAction({ name: 'approve', row })}><Check className="h-4 w-4" />Approve</DropdownMenuItem>}{canProcess && <DropdownMenuItem onClick={() => setAction({ name: 'reject', row })}><X className="h-4 w-4" />Reject</DropdownMenuItem>}{canUpdate && <DropdownMenuItem onClick={() => setAction({ name: 'archive', row })}><Archive className="h-4 w-4" />Archive</DropdownMenuItem>}{canDelete && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setAction({ name: 'delete', row })}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div>}
    <div className="flex items-center justify-between px-2"><span className="text-xs text-muted-foreground">Page {page}</span><div className="flex items-center gap-1"><Button variant="outline" size="sm" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1}><ChevronLeft className="h-3 w-3" /></Button><Button variant="outline" size="sm" onClick={() => setPage(current => current + 1)} disabled={sorted.length < pageSize}><ChevronRight className="h-3 w-3" /></Button></div></div>

    <Sheet
      open={!!selectedApp}
      onOpenChange={open => {
        if (open) return
        if (detailDirty) { setCloseConfirmOpen(true); return }
        setSelectedApp(null)
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{selectedApp?.application_id || 'Application details'}</SheetTitle>
          <SheetDescription>{selectedApp?.user_profile_full_name} · {selectedApp?.user_profile_email}</SheetDescription>
        </SheetHeader>
        {detailQuery.isLoading ? <ApplicationDetailSkeleton /> : detailQuery.error ? (
          <div className="mx-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            <p>{(detailQuery.error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void detailQuery.refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again</Button>
          </div>
        ) : detailQuery.data && (
          <ApplicationDetailPanel
            detail={detailQuery.data}
            officers={officers}
            canUpdate={canUpdate}
            canProcess={canProcess}
            onSave={saveDetails}
            onAction={(name, value) => name === 'set_case_status' && value ? void setCaseStatus(value) : setAction({ name, row: selectedApp || undefined, value })}
            onDirtyChange={setDetailDirty}
            onMessageSent={() => { void detailQuery.refetch(); void queryClient.invalidateQueries({ queryKey: ['admin-applications'] }) }}
          />
        )}
      </SheetContent>
    </Sheet>

    <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>You have edits on this application that haven't been saved. Closing now will lose them.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction onClick={() => { setDetailDirty(false); setCloseConfirmOpen(false); setSelectedApp(null) }}>Discard and close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={!!action} onOpenChange={open => { if (!open) { setAction(null); setReason('') } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pretty(action?.name || 'Action')}</DialogTitle>
          <DialogDescription>{action?.row ? `This action will update ${action.row.application_id || 'the application'}.` : `This action will update ${selected.length} selected applications.`}</DialogDescription>
        </DialogHeader>
        {action?.name === 'assign' ? (
          <Select value={action.value || ''} onValueChange={value => setAction(current => current ? ({ ...current, value }) : current)}>
            <SelectTrigger><SelectValue placeholder="Choose officer" /></SelectTrigger>
            <SelectContent>{officers.map(officer => <SelectItem key={officer.id} value={officer.id}>{officer.full_name || officer.email}</SelectItem>)}</SelectContent>
          </Select>
        ) : action?.name === 'change_priority' ? (
          <Select value={action.value || ''} onValueChange={value => setAction(current => current ? ({ ...current, value }) : current)}>
            <SelectTrigger><SelectValue placeholder="Choose priority" /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Textarea autoFocus value={reason} onChange={event => setReason(event.target.value)} placeholder={['approve'].includes(action?.name || '') ? 'Optional comment' : 'Reason or internal comment (required)'} disabled={actionPending} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setAction(null)} disabled={actionPending}>Cancel</Button>
          <Button
            variant={['reject', 'delete'].includes(action?.name || '') ? 'destructive' : 'default'}
            onClick={() => void runAction()}
            disabled={actionPending || (['assign', 'change_priority'].includes(action?.name || '') && !action?.value)}
          >
            {actionPending ? 'Working…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}
