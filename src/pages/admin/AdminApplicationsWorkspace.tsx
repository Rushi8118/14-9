'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Archive, Briefcase, Check, ChevronLeft, ChevronRight, Clock, Download, FileText,
  Filter, MoreHorizontal, MoveHorizontal, RefreshCw, Search, ShieldAlert, Trash2, UserPlus, X, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeDatePicker } from '@/components/ui/theme-date-picker'
import { writeAuditLog } from '@/lib/audit-log'
import {
  type AppRow, type DetailData, type Officer,
  STATUSES, TYPES, PRIORITIES, PAGE_SIZES,
  statusVariant, pretty, dateText, formatDateOnly, formatTimeOnly, formatFullDateTime, daysPending,
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
  const { data: officers = [] } = useQuery<Officer[]>({
    queryKey: ['admin-application-officers'],
    enabled: canRead,
    queryFn: async () => {
      try {
        const rpc = await supabase.rpc('get_application_officers')
        if (!rpc.error && rpc.data) {
          const list = (typeof rpc.data === 'string' ? JSON.parse(rpc.data) : rpc.data) as Officer[]
          if (Array.isArray(list) && list.length > 0) return list
        }
      } catch {
        // Fall back below
      }

      const { data: staffProfiles, error: staffErr } = await supabase
        .from('user_profiles')
        .select('id,full_name,email')
        .in('user_role', ['super_admin', 'superadmin', 'admin', 'manager', 'hr', 'visa_officer', 'counselor', 'consultant'])
        .order('full_name')

      if (!staffErr && staffProfiles && staffProfiles.length > 0) {
        return staffProfiles as Officer[]
      }

      const { data: allProfiles } = await supabase
        .from('user_profiles')
        .select('id,full_name,email')
        .order('full_name')
        .limit(100)

      return (allProfiles ?? []) as Officer[]
    },
  })

  const officersMap = useMemo(() => new Map(officers.map(o => [o.id, o])), [officers])

  const handleAssignOfficer = async (rowId: string, officerId: string | null) => {
    if (!canUpdate) {
      toast.error('You do not have permission to assign officers.')
      return
    }
    const isEnquiry = rowId.startsWith('ENQ-') || rawData.find(r => r.id === rowId)?.application_id?.startsWith('ENQ-') || rawData.find(r => r.id === rowId)?.meta?.source === 'consultations'
    const targetOfficer = officerId ? officersMap.get(officerId) : null
    const officerName = targetOfficer?.full_name || targetOfficer?.email || 'Officer'

    try {
      const { error: rpcErr } = await supabase.rpc('admin_assign_officer', {
        p_id: rowId,
        p_officer_id: officerId || null,
      })

      if (rpcErr) {
        if (isEnquiry) {
          const { error: directErr } = await supabase
            .from('consultations')
            .update({ assigned_consultant: officerId || null, updated_at: new Date().toISOString() })
            .eq('id', rowId)
          if (directErr) throw directErr
        } else {
          const { error: directErr } = await supabase
            .from('applications')
            .update({ assigned_consultant: officerId || null, updated_at: new Date().toISOString() })
            .eq('id', rowId)
          if (directErr) throw directErr
        }
      }

      toast.success(officerId ? `Assigned to ${officerName}` : 'Officer unassigned')
      await queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      if (selectedApp?.id === rowId) {
        void detailQuery.refetch()
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not assign officer.')
    }
  }

  const handleUpdateStatus = async (rowId: string, newStatus: string) => {
    if (!canProcess && !canUpdate) {
      toast.error('You do not have permission to update status.')
      return
    }
    const isEnquiry = rowId.startsWith('ENQ-') || rawData.find(r => r.id === rowId)?.application_id?.startsWith('ENQ-') || rawData.find(r => r.id === rowId)?.meta?.source === 'consultations'

    try {
      const { error: rpcErr } = await supabase.rpc('admin_quick_update_application', {
        p_id: rowId,
        p_field: 'status',
        p_value: newStatus,
      })

      if (rpcErr) {
        if (isEnquiry) {
          const consultationStatus = newStatus === 'approved' ? 'confirmed' : newStatus === 'rejected' ? 'cancelled' : newStatus === 'under_review' ? 'scheduled' : newStatus === 'withdrawn' ? 'no_show' : 'requested'
          const { error: directErr } = await supabase
            .from('consultations')
            .update({ status: consultationStatus, updated_at: new Date().toISOString() })
            .eq('id', rowId)
          if (directErr) throw directErr
        } else {
          const updatePayload: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          }
          if (newStatus === 'approved') {
            updatePayload.decision_at = new Date().toISOString()
          }
          const { error: directErr } = await supabase
            .from('applications')
            .update(updatePayload)
            .eq('id', rowId)
          if (directErr) throw directErr
        }
      }

      toast.success(`Status updated to ${pretty(newStatus)}`)
      await queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      if (selectedApp?.id === rowId) {
        void detailQuery.refetch()
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not update status.')
    }
  }

  const handleUpdatePriority = async (rowId: string, newPriority: string) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update priority.')
      return
    }
    const isEnquiry = rowId.startsWith('ENQ-') || rawData.find(r => r.id === rowId)?.application_id?.startsWith('ENQ-') || rawData.find(r => r.id === rowId)?.meta?.source === 'consultations'

    try {
      const { error: rpcErr } = await supabase.rpc('admin_quick_update_application', {
        p_id: rowId,
        p_field: 'priority',
        p_value: newPriority,
      })

      if (rpcErr) {
        if (isEnquiry) {
          const { error: directErr } = await supabase
            .from('consultations')
            .update({ priority: newPriority, updated_at: new Date().toISOString() })
            .eq('id', rowId)
          if (directErr) throw directErr
        } else {
          const { error: directErr } = await supabase
            .from('applications')
            .update({ priority: newPriority, updated_at: new Date().toISOString() })
            .eq('id', rowId)
          if (directErr) throw directErr
        }
      }

      toast.success(`Priority updated to ${pretty(newPriority)}`)
      await queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      if (selectedApp?.id === rowId) {
        void detailQuery.refetch()
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not update priority.')
    }
  }
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

  /**
   * Keep the open detail panel in step with the list.
   *
   * selectedApp is a snapshot of the row taken when it was clicked. Every action
   * invalidates and refetches the list, but nothing re-pointed selectedApp at
   * the refreshed row, so the panel header kept rendering the status the row had
   * when it was opened -- changing an enquiry to Under Review updated the table
   * and the panel still read "Submitted".
   *
   * Compared by id, and only assigned when the row object has actually changed,
   * so this cannot loop on a stable refetch.
   */
  useEffect(() => {
    if (!selectedApp) return
    const fresh = rawData.find(row => row.id === selectedApp.id)
    if (fresh && fresh !== selectedApp) setSelectedApp(fresh)
  }, [rawData, selectedApp])

  const filtered = useMemo(() => rawData.filter(row => {
    const q = search.toLowerCase()
    const matchesSearch = !q || [row.application_id, row.user_profile_full_name, row.user_profile_email, row.country_name, row.application_type].some(v => v?.toLowerCase().includes(q))
    return matchesSearch && (statusFilter === 'all' || row.status === statusFilter) && (typeFilter === 'all' || row.application_type === typeFilter) && (countryFilter === 'all' || row.country_id === countryFilter) && (priorityFilter === 'all' || row.priority === priorityFilter) && (officerFilter === 'all' || row.assigned_consultant === officerFilter) && (!dateFrom || row.created_at >= dateFrom) && (!dateTo || row.created_at <= `${dateTo}T23:59:59`)
  }), [rawData, search, statusFilter, typeFilter, countryFilter, priorityFilter, officerFilter, dateFrom, dateTo])
  const sorted = useMemo(() => [...filtered].sort((a, b) => { const av = String((a as any)[sortKey] ?? ''), bv = String((b as any)[sortKey] ?? ''); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av) }), [filtered, sortKey, sortDir])
  const kpis = useMemo(() => Object.fromEntries(['total', ...STATUSES, 'urgent'].map(key => [key, key === 'total' ? rawData.length : key === 'urgent' ? rawData.filter(row => row.priority === 'urgent').length : rawData.filter(row => row.status === key).length])), [rawData])

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollIndicators = useCallback(() => {
    const el = tableContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 6)
    setCanScrollRight(maxScroll > 6 && el.scrollLeft < maxScroll - 6)
  }, [])

  const scrollHorizontally = useCallback((direction: 'left' | 'right') => {
    const el = tableContainerRef.current
    if (!el) return
    const distance = Math.min(el.clientWidth * 0.75, 420)
    el.scrollBy({
      left: direction === 'right' ? distance : -distance,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    const el = tableContainerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      // Allow trackpad or horizontal scroll wheels that emit deltaX natively
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return
      }

      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return

      const scrollingRight = e.deltaY > 0
      const scrollingLeft = e.deltaY < 0

      const atRightEdge = el.scrollLeft >= maxScroll - 4
      const atLeftEdge = el.scrollLeft <= 4

      // When pointing at any application row in the table, translate vertical mouse wheel to horizontal scroll
      if ((scrollingRight && !atRightEdge) || (scrollingLeft && !atLeftEdge)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 1.2
        updateScrollIndicators()
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('scroll', updateScrollIndicators, { passive: true })
    window.addEventListener('resize', updateScrollIndicators, { passive: true })

    updateScrollIndicators()

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', updateScrollIndicators)
      window.removeEventListener('resize', updateScrollIndicators)
    }
  }, [updateScrollIndicators, sorted.length])

  const runAction = async () => {
    if (!action || actionPending) return
    const ids = action.row ? [action.row.id] : selected
    /**
     * Enquiry rows are consultations surfaced as pseudo-applications (ENQ-xxxx).
     * Their id is a consultations id, so manage_application cannot find them and
     * returns "Application not found" -- which is correct of it, and was being
     * thrown straight at the user. The RPC fallback below only triggered when the
     * function was MISSING, never when it ran and legitimately found nothing.
     *
     * Resolved per id rather than from action.row, because a bulk action over
     * `selected` has no row and can mix applications with enquiries.
     */
    const rowById = new Map(rawData.map(row => [row.id, row]))
    const isEnquiryRow = (id: string) => {
      const row = rowById.get(id) ?? (action.row?.id === id ? action.row : undefined)
      return Boolean(row?.application_id?.startsWith('ENQ-') || row?.meta?.source === 'consultations')
    }
    if (!ids.length) return
    const rpcAction = action.name === 'under_review' ? 'change_status' : action.name
    const rpcValue = action.name === 'under_review' ? 'under_review' : action.value
    if (['reject', 'return_for_corrections', 'request_documents', 'change_status', 'under_review', 'archive', 'delete'].includes(action.name) && !reason.trim()) { toast.error('A reason is required for this action.'); return }
    setActionPending(true)
    try {
      for (const id of ids) {
        if (rpcAction === 'assign') {
          const { error: assignRpcErr } = await supabase.rpc('admin_assign_officer', {
            p_id: id,
            p_officer_id: rpcValue || null,
          })
          if (!assignRpcErr) continue
        }
        const isEnquiry = isEnquiryRow(id)
        // Skip the RPC for enquiries: it only knows the applications table.
        const rpcResult = isEnquiry
          ? { error: { message: 'skipped: enquiry row, handled against consultations' } as { message: string } }
          : await supabase.rpc('manage_application', { p_application_id: id, p_action: rpcAction, p_value: rpcValue ? (rpcAction === 'assign' ? { officer_id: rpcValue } : rpcAction === 'change_priority' ? { priority: rpcValue } : { status: rpcValue }) : {}, p_reason: reason.trim() || null })
        if (!isEnquiry && rpcResult.error && !/schema cache|could not find the function|PGRST202/i.test(rpcResult.error.message)) throw rpcResult.error
        if (rpcResult.error) {
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
            /**
             * approve / reject / return_for_corrections / request_documents used
             * to fall through this block setting nothing but updated_at, so the
             * toast said the action completed and the row never changed. Only
             * change_status was mapped. The consultations branch above always
             * handled these; the applications branch did not.
             */
            const STATUS_FOR_ACTION: Record<string, string> = {
              approve: 'approved',
              reject: 'rejected',
              return_for_corrections: 'draft',
              request_documents: 'under_review',
            }
            if (STATUS_FOR_ACTION[rpcAction]) updates.status = STATUS_FOR_ACTION[rpcAction]
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
      // Same reason as runAction: set_application_case_status only knows the
      // applications table, so an ENQ- row's consultations id makes it report
      // "Application not found".
      const isEnquiry = selectedApp.application_id?.startsWith('ENQ-') || selectedApp.meta?.source === 'consultations'
      if (isEnquiry) {
        const consultationStatus = status === 'approved' ? 'confirmed' : status === 'rejected' ? 'cancelled' : status === 'under_review' ? 'scheduled' : 'requested'
        const { data: updated, error: consultationError } = await supabase.from('consultations').update({ status: consultationStatus, updated_at: new Date().toISOString() }).eq('id', selectedApp.id).select('id').maybeSingle()
        if (consultationError) throw consultationError
        if (!updated) throw new Error('No consultation was updated. Check your admin permissions.')
      } else {
        const { error: rpcError } = await supabase.rpc('set_application_case_status', { p_application_id: selectedApp.id, p_status: status })
        if (rpcError) throw rpcError
      }
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
        /**
         * Only status, officer and notes were ever written here, so editing the
         * applicant's name, phone or priority on an enquiry silently did
         * nothing -- the form reported success and the values reverted.
         *
         * name goes back into user_notes, which is where the forms put it and
         * where get_all_applications now reads it from. The existing keys are
         * preserved rather than replaced, because user_notes also carries the
         * applicant's own message, the vacancy they applied to, and so on.
         *
         * phone has a real column on consultations and simply was not used.
         *
         * priority needs a column that does not exist yet; see
         * supabase/FIX_APPLICATION_IDS.sql, which adds it.
         */
        const existingNotes = (detailQuery.data?.application.personal_info ?? {}) as Record<string, unknown>
        const consultationUpdates: Record<string, unknown> = {
          status: consultationStatus,
          assigned_consultant: values.officerId || null,
          consultant_notes: values.notes || null,
          priority: values.priority || 'normal',
          updated_at: new Date().toISOString(),
        }
        if (values.phone) consultationUpdates.phone_number = values.phone
        if (values.fullName) {
          consultationUpdates.user_notes = {
            ...existingNotes,
            name: values.fullName,
            // Keep the key the vacancy form uses in step, or the list would go
            // on showing the old name through its applicant_name fallback.
            ...(existingNotes.applicant_name ? { applicant_name: values.fullName } : {}),
          }
        }
        const { data: updatedConsultation, error: consultationError } = await supabase.from('consultations').update(consultationUpdates).eq('id', selectedApp.id).select('id').maybeSingle()
        if (consultationError) throw consultationError
        if (!updatedConsultation) throw new Error('No consultation was updated. Check your admin permissions.')
      } else {
        const { error: applicationError } = await supabase.from('applications').update({ status: values.status, priority: values.priority, assigned_consultant: values.officerId || null, consultant_notes: values.notes || null, personal_info: { ...(detailQuery.data?.application.personal_info || {}), full_name: values.fullName, phone: values.phone }, updated_at: new Date().toISOString() }).eq('id', selectedApp.id)
        if (applicationError) throw applicationError
      }
      // Only when the row belongs to an account. An anonymous enquiry has
      // user_id null, and `.eq('id', null)` matches nothing -- it looked like a
      // save because it reported no error while updating no rows.
      if (selectedApp.user_id && (values.fullName || values.phone)) {
        await supabase.from('user_profiles').update({ full_name: values.fullName || null, phone: values.phone || null, updated_at: new Date().toISOString() }).eq('id', selectedApp.user_id)
      }
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
        <ThemeDatePicker
          value={dateFrom}
          onChange={setDateFrom}
          placeholder="Created from"
          variant="admin"
          showShortcuts={false}
          className="h-10 text-xs w-36"
        />
        <ThemeDatePicker
          value={dateTo}
          onChange={setDateTo}
          placeholder="Created to"
          variant="admin"
          showShortcuts={false}
          className="h-10 text-xs w-36"
        />
      </div>
    </div>

    {selected.length > 0 && (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <span className="text-sm font-medium">{selected.length} selected</span>
        <Select onValueChange={value => setAction({ name: 'change_status', value })}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Change status" /></SelectTrigger>
          <SelectContent>{STATUSES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={value => setAction({ name: 'change_priority', value })}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>{PRIORITIES.map(value => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent>
        </Select>
        {canUpdate && (
          <Select onValueChange={value => setAction({ name: 'assign', value: value === 'unassigned' ? '' : value })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Assign officer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassign</SelectItem>
              {officers.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.full_name || o.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" onClick={() => exportRows(sorted.filter(row => selected.includes(row.id)))}>
          <Download className="mr-1 h-4 w-4" />Export selected
        </Button>
        {canDelete && (
          <Button variant="destructive" size="sm" onClick={() => setAction({ name: 'delete' })}>
            <Trash2 className="mr-1 h-4 w-4" />Delete
          </Button>
        )}
      </div>
    )}

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {sorted.length} application{sorted.length === 1 ? '' : 's'} found{hasFilters && ' (filtered)'}
        </span>
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border/60 bg-muted/20 px-1.5 py-0.5 text-xs text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md disabled:opacity-30 hover:bg-muted"
            onClick={() => scrollHorizontally('left')}
            disabled={!canScrollLeft}
            title="Scroll table left (or roll mouse wheel)"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[11px] font-medium px-1 flex items-center gap-1 select-none">
            <MoveHorizontal className="h-3 w-3 text-primary" /> Scroll
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md disabled:opacity-30 hover:bg-muted"
            onClick={() => scrollHorizontally('right')}
            disabled={!canScrollRight}
            title="Scroll table right (or roll mouse wheel)"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1">
          <span className="text-xs font-medium text-muted-foreground">Columns:</span>
          {Object.entries(visible).map(([key, value]) => (
            <label key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
              <Checkbox
                checked={value}
                onCheckedChange={checked => setVisible(current => ({ ...current, [key]: Boolean(checked) }))}
              />
              <span>{pretty(key)}</span>
            </label>
          ))}
        </div>
        <Select value={String(pageSize)} onValueChange={value => setPageSize(Number(value))}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map(value => <SelectItem key={value} value={String(value)}>{value}/page</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>

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
    ) : (
      <div className="relative group/table rounded-xl">
        {/* Floating Quick Scroll Left Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollHorizontally('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-xl border border-border backdrop-blur-md hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all duration-200"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Floating Quick Scroll Right Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollHorizontally('right')}
            className="absolute right-14 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-xl border border-border backdrop-blur-md hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all duration-200"
            title="Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={tableContainerRef}
          className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs custom-horizontal-scrollbar scroll-smooth"
        >
          <table className="w-full text-left text-xs min-w-[1250px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-3.5 py-3 text-center">
                <Checkbox
                  aria-label="Select all visible applications"
                  checked={sorted.length > 0 && sorted.every(row => selected.includes(row.id))}
                  onCheckedChange={checked => setSelected(checked ? sorted.map(row => row.id) : [])}
                />
              </th>
              {([
                ['application_id', 'ID'],
                ['user_profile_full_name', 'Applicant'],
                ['application_type', 'Type'],
                ['country_name', 'Country'],
                ['status', 'Status'],
                ['priority', 'Priority'],
                ['assigned_officer_name', 'Officer'],
                ['created_at', 'Created'],
                ['updated_at', 'Updated'],
                ['sla', 'SLA'],
              ] as const).map(([key, label]) =>
                (key === 'country_name' && !visible.country) ||
                (key === 'assigned_officer_name' && !visible.officer) ||
                (key === 'updated_at' && !visible.updated) ||
                (key === 'sla' && !visible.sla) ? null : (
                  <th
                    key={key}
                    scope="col"
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer px-3.5 py-3 text-left hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors whitespace-nowrap',
                      key === 'created_at' || key === 'updated_at' ? 'min-w-[115px]' : '',
                      key === 'assigned_officer_name' ? 'min-w-[145px]' : ''
                    )}
                    onClick={() => sort(key)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        sort(key)
                      }
                    }}
                  >
                    {label}
                    {sortKey === key && <span className="ml-1 text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                )
              )}
              <th className="sticky right-0 bg-muted/95 backdrop-blur-xs px-3.5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-l border-border/40 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.15)] z-10 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(row => (
              <tr
                key={row.id}
                tabIndex={0}
                className="group cursor-pointer hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary transition-colors"
                onClick={() => setSelectedApp(row)}
                onKeyDown={event => { if (event.key === 'Enter') setSelectedApp(row) }}
              >
                <td className="px-3.5 py-3 text-center" onClick={event => event.stopPropagation()}>
                  <Checkbox
                    checked={selected.includes(row.id)}
                    onCheckedChange={() => toggleSelected(row.id)}
                    aria-label={`Select ${row.application_id || row.id}`}
                  />
                </td>
                <td className="px-3.5 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {row.application_id || row.id.slice(0, 8)}
                </td>
                <td className="px-3.5 py-3 min-w-[200px]">
                  <p className="text-xs font-semibold text-foreground">{row.user_profile_full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground break-all">{row.user_profile_email}</p>
                </td>
                <td className="px-3.5 py-3 text-xs capitalize whitespace-nowrap">
                  {pretty(row.application_type)}
                </td>
                {visible.country && (
                  <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                    {row.country_flag_emoji} {row.country_name || 'Not set'}
                  </td>
                )}
                <td className="px-3.5 py-3 whitespace-nowrap min-w-[130px]" onClick={event => event.stopPropagation()}>
                  {canProcess || canUpdate ? (
                    <Select
                      value={row.status}
                      onValueChange={val => void handleUpdateStatus(row.id, val)}
                    >
                      <SelectTrigger
                        size="sm"
                        className={cn(
                          'h-7 text-[11px] font-medium rounded-full px-2.5 py-0 gap-1.5 shadow-none border transition-colors w-auto min-w-[115px]',
                          row.status === 'approved' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
                          row.status === 'under_review' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
                          row.status === 'submitted' && 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25',
                          row.status === 'rejected' && 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
                          row.status === 'withdrawn' && 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/25',
                          row.status === 'draft' && 'bg-muted/70 text-muted-foreground border-border/60 hover:bg-muted'
                        )}
                      >
                        <SelectValue>
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0',
                              row.status === 'approved' && 'bg-emerald-500',
                              row.status === 'under_review' && 'bg-amber-500',
                              row.status === 'submitted' && 'bg-blue-500',
                              row.status === 'rejected' && 'bg-rose-500',
                              row.status === 'withdrawn' && 'bg-purple-500',
                              row.status === 'draft' && 'bg-muted-foreground'
                            )} />
                            <span>{pretty(row.status)}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start">
                        {STATUSES.map(st => (
                          <SelectItem key={st} value={st}>
                            <span className="flex items-center gap-2 text-xs">
                              <span className={cn(
                                'h-2 w-2 rounded-full',
                                st === 'approved' && 'bg-emerald-500',
                                st === 'under_review' && 'bg-amber-500',
                                st === 'submitted' && 'bg-blue-500',
                                st === 'rejected' && 'bg-rose-500',
                                st === 'withdrawn' && 'bg-purple-500',
                                st === 'draft' && 'bg-muted-foreground'
                              )} />
                              <span>{pretty(st)}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={row.status} variant={statusVariant(row.status)} />
                  )}
                </td>
                <td className="px-3.5 py-3 whitespace-nowrap min-w-[110px]" onClick={event => event.stopPropagation()}>
                  {canUpdate ? (
                    <Select
                      value={row.priority || 'normal'}
                      onValueChange={val => void handleUpdatePriority(row.id, val)}
                    >
                      <SelectTrigger
                        size="sm"
                        className={cn(
                          'h-7 text-[11px] font-medium rounded-full px-2.5 py-0 gap-1.5 shadow-none border transition-colors w-auto min-w-[95px]',
                          row.priority === 'urgent' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
                          row.priority === 'high' && 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
                          row.priority === 'low' && 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/20 hover:bg-slate-500/20',
                          (!row.priority || row.priority === 'normal') && 'bg-muted/70 text-muted-foreground border-border/50 hover:bg-muted'
                        )}
                      >
                        <SelectValue>
                          <span className="capitalize font-medium">{pretty(row.priority || 'normal')}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start">
                        {PRIORITIES.map(pr => (
                          <SelectItem key={pr} value={pr}>
                            <span className="flex items-center gap-2 text-xs">
                              <span className={cn(
                                'h-2 w-2 rounded-full',
                                pr === 'urgent' && 'bg-amber-500',
                                pr === 'high' && 'bg-rose-500',
                                pr === 'low' && 'bg-slate-400',
                                pr === 'normal' && 'bg-muted-foreground'
                              )} />
                              <span className="capitalize">{pretty(pr)}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      row.priority === 'urgent' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      row.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {pretty(row.priority)}
                    </span>
                  )}
                </td>
                {visible.officer && (
                  <td className="px-3.5 py-3 text-xs whitespace-nowrap min-w-[145px]" onClick={event => event.stopPropagation()}>
                    {canUpdate ? (
                      <Select
                        value={row.assigned_consultant || 'unassigned'}
                        onValueChange={val => void handleAssignOfficer(row.id, val === 'unassigned' ? null : val)}
                      >
                        <SelectTrigger className="h-7 text-xs border-dashed border-border/80 bg-background/50 hover:bg-muted/40 w-[145px] px-2 py-0">
                          <SelectValue>
                            {row.assigned_consultant && officersMap.has(row.assigned_consultant) ? (
                              <span className="font-medium text-foreground truncate max-w-[115px] block">
                                {officersMap.get(row.assigned_consultant)?.full_name || officersMap.get(row.assigned_consultant)?.email}
                              </span>
                            ) : row.assigned_officer_name ? (
                              <span className="font-medium text-foreground truncate max-w-[115px] block">
                                {row.assigned_officer_name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic flex items-center gap-1 text-[11px]">
                                <UserPlus className="h-3 w-3 text-primary/70" /> Unassigned
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="unassigned">
                            <span className="text-muted-foreground italic">Unassigned</span>
                          </SelectItem>
                          {officers.map(o => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.full_name || o.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">
                        {row.assigned_consultant ? officersMap.get(row.assigned_consultant)?.full_name || row.assigned_officer_name || 'Assigned' : 'Unassigned'}
                      </span>
                    )}
                  </td>
                )}
                <td className="whitespace-nowrap px-3.5 py-3 min-w-[115px]">
                  <div className="flex flex-col leading-snug">
                    <span className="font-medium text-foreground text-xs">{formatDateOnly(row.created_at)}</span>
                    <span className="text-[11px] text-muted-foreground">{formatTimeOnly(row.created_at)}</span>
                  </div>
                </td>
                {visible.updated && (
                  <td className="whitespace-nowrap px-3.5 py-3 min-w-[115px]">
                    <div className="flex flex-col leading-snug">
                      <span className="font-medium text-foreground text-xs">{formatDateOnly(row.updated_at || row.created_at)}</span>
                      <span className="text-[11px] text-muted-foreground">{formatTimeOnly(row.updated_at || row.created_at)}</span>
                    </div>
                  </td>
                )}
                {visible.sla && (
                  <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                    <span className={cn(
                      daysPending(row) > 14 && row.status !== 'approved' && row.status !== 'rejected'
                        ? 'text-red-600 font-semibold'
                        : 'text-muted-foreground'
                    )}>
                      {daysPending(row)}d pending
                    </span>
                  </td>
                )}
                <td
                  className="sticky right-0 bg-card group-hover:bg-muted/40 px-3.5 py-3 text-center border-l border-border/40 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.15)] z-10 transition-colors"
                  onClick={event => event.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg mx-auto" aria-label="Application actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedApp(row)}>
                        <FileText className="h-4 w-4" />Open application
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => setAction({ name: 'assign', row, value: row.assigned_consultant || '' })}>
                          <UserPlus className="h-4 w-4" />Assign officer
                        </DropdownMenuItem>
                      )}
                      {canProcess && (
                        <DropdownMenuItem onClick={() => setAction({ name: 'under_review', row })}>
                          <Zap className="h-4 w-4" />Move to Under Review
                        </DropdownMenuItem>
                      )}
                      {canProcess && (
                        <DropdownMenuItem onClick={() => setAction({ name: 'approve', row })}>
                          <Check className="h-4 w-4" />Approve
                        </DropdownMenuItem>
                      )}
                      {canProcess && (
                        <DropdownMenuItem onClick={() => setAction({ name: 'reject', row })}>
                          <X className="h-4 w-4" />Reject
                        </DropdownMenuItem>
                      )}
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => setAction({ name: 'archive', row })}>
                          <Archive className="h-4 w-4" />Archive
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setAction({ name: 'delete', row })}>
                            <Trash2 className="h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    )}
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
