import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Inbox,
  Layers,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserX,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Consultation = {
  id: string
  user_id: string | null
  consultation_type: string | null
  status: 'requested' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  scheduled_at: string
  duration_minutes: number | null
  preferred_country: string | null
  visa_category: string | null
  user_notes: Record<string, unknown> | null
  assigned_officer_name: string | null
  created_at: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
}

type View = 'all' | 'upcoming' | 'requested' | 'completed' | 'cancelled'

const VIEWS: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'requested', label: 'New requests', icon: Inbox },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle },
]

const STATUS_CONFIG: Record<
  Consultation['status'],
  { style: string; icon: React.ComponentType<{ className?: string }>; dot: string }
> = {
  requested: {
    style: 'bg-amber-50 text-amber-900 border-amber-300/80 shadow-xs shadow-amber-500/10',
    icon: Clock,
    dot: 'bg-amber-500 animate-pulse',
  },
  scheduled: {
    style: 'bg-sky-50 text-sky-900 border-sky-300/80 shadow-xs shadow-sky-500/10',
    icon: Calendar,
    dot: 'bg-sky-500',
  },
  confirmed: {
    style: 'bg-emerald-50 text-emerald-900 border-emerald-300/80 shadow-xs shadow-emerald-500/10',
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
  },
  completed: {
    style: 'bg-slate-100 text-slate-800 border-slate-300/80',
    icon: Check,
    dot: 'bg-slate-500',
  },
  cancelled: {
    style: 'bg-red-50 text-red-800 border-red-200/80',
    icon: XCircle,
    dot: 'bg-red-500',
  },
  no_show: {
    style: 'bg-rose-50 text-rose-800 border-rose-200/80',
    icon: UserX,
    dot: 'bg-rose-500',
  },
}

function sourceLabel(c: Consultation) {
  const source = typeof c.user_notes?.source === 'string' ? c.user_notes.source : ''
  if (source === 'appointments_page' || source === 'user_dashboard') return 'Dashboard booking'
  if (c.consultation_type === 'urgent_requirement') return 'Urgent job application'
  if (!c.user_id) return 'Website enquiry'
  return 'Consultation'
}

function meetingLabel(c: Consultation) {
  const meeting = typeof c.user_notes?.meeting_type === 'string' ? c.user_notes.meeting_type : ''
  return meeting || (c.consultation_type ? c.consultation_type.replace(/_/g, ' ') : 'General')
}

export default function AppointmentsAdminPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Consultation | null>(null)

  // Debounce so typing doesn't hit the database on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const queryKey = ['admin-consultations', view, search]
  const { data = [], isLoading, isError, isFetching, refetch } = useQuery<Consultation[]>({
    queryKey,
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc('get_admin_consultations', {
        p_status: view === 'all' || view === 'upcoming' ? null : view,
        p_upcoming_only: view === 'upcoming',
        p_search: search || null,
        p_limit: 300,
      })
      if (error) {
        logger.error('Admin appointments failed to load:', error.message)
        throw new Error('load failed')
      }
      return (rows ?? []) as Consultation[]
    },
    refetchInterval: 60_000,
  })

  // New bookings appear without a manual refresh.
  useEffect(
    () =>
      subscribePostgresChanges(supabase, 'admin-consultations', { table: 'consultations' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['admin-consultations'] })
      }),
    [queryClient],
  )

  const counts = useMemo(() => {
    const now = Date.now()
    return {
      today: data.filter((c) => new Date(c.scheduled_at).toDateString() === new Date().toDateString()).length,
      requested: data.filter((c) => c.status === 'requested').length,
      upcoming: data.filter((c) => new Date(c.scheduled_at).getTime() > now && ['requested', 'scheduled', 'confirmed'].includes(c.status)).length,
    }
  }, [data])

  const updateStatus = async (c: Consultation, status: Consultation['status']) => {
    setPendingId(c.id)
    try {
      const { error } = await supabase.rpc('admin_update_consultation', { p_id: c.id, p_status: status })
      if (error) {
        logger.error('Appointment update failed:', error.message)
        toast.error(/privileges/i.test(error.message) ? 'You do not have permission to update appointments.' : 'The appointment could not be updated. Please try again.')
        return
      }
      toast.success(`Appointment marked ${status.replace('_', ' ')}.`)
      await queryClient.invalidateQueries({ queryKey: ['admin-consultations'] })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="desk-display flex items-center gap-2 text-2xl font-semibold text-[var(--desk-navy)]">
            <CalendarClock className="h-6 w-6 text-[var(--desk-gold)]" aria-hidden="true" />
            Appointments
          </h1>
          <p className="mt-1 text-sm text-[var(--desk-muted)]">
            Consultations booked from the applicant dashboard, website enquiries and urgent job applications.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Shown in this view', value: data.length },
          { label: 'Awaiting confirmation', value: counts.requested },
          { label: 'Scheduled today', value: counts.today },
        ].map((stat) => (
          <div key={stat.label} className="desk-panel rounded-2xl border border-[var(--desk-line)] p-4">
            <p className="text-xs text-[var(--desk-muted)]">{stat.label}</p>
            <p className="desk-display mt-1 text-2xl font-semibold text-[var(--desk-navy)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filter appointments" className="flex flex-wrap gap-2">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const isSelected = view === v.id
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setView(v.id)}
                className={`group inline-flex items-center gap-2 min-h-9 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'border-[var(--desk-gold)] bg-gradient-to-r from-[var(--desk-gold)]/20 to-[var(--desk-gold)]/10 text-[var(--desk-navy)] shadow-xs ring-1 ring-[var(--desk-gold)]/30'
                    : 'border-[var(--desk-line)] bg-white/60 text-[var(--desk-muted)] hover:bg-white hover:text-[var(--desk-navy)] hover:border-[var(--desk-gold)]/30 hover:shadow-2xs'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200 group-hover:scale-110 ${
                    isSelected
                      ? 'bg-[var(--desk-gold)] text-[var(--desk-navy)] shadow-2xs'
                      : 'bg-black/[0.04] text-[var(--desk-muted)] group-hover:bg-[var(--desk-gold)]/15 group-hover:text-[var(--desk-navy)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span>{v.label}</span>
              </button>
            )
          })}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--desk-muted)]" aria-hidden="true" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, phone, country…"
            aria-label="Search appointments"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-[var(--desk-muted)]">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading appointments" />
        </div>
      ) : isError ? (
        <div role="alert" className="desk-panel rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
          Appointments could not be loaded. If this is the first time, make sure the latest database migration
          (20260917000001_admin_appointments.sql) has been run.
          <Button variant="outline" size="sm" className="ml-3" onClick={() => void refetch()}>Retry</Button>
        </div>
      ) : data.length === 0 ? (
        <div className="desk-panel rounded-2xl border border-[var(--desk-line)] p-10 text-center text-sm text-[var(--desk-muted)]">
          No appointments in this view.
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((c) => {
            const when = new Date(c.scheduled_at)
            const busy = pendingId === c.id
            const open = ['requested', 'scheduled', 'confirmed'].includes(c.status)
            return (
              <li key={c.id} className="desk-panel rounded-2xl border border-[var(--desk-line)] p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const statusConf = STATUS_CONFIG[c.status] || STATUS_CONFIG.requested
                        const StatusIcon = statusConf.icon
                        return (
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize shadow-2xs ${statusConf.style}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} aria-hidden="true" />
                            <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {c.status.replace('_', ' ')}
                          </span>
                        )
                      })()}
                      <span className="text-[11px] font-medium text-[var(--desk-muted)]">{sourceLabel(c)}</span>
                      <span className="text-[11px] text-[var(--desk-muted)]">
                        · booked {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="font-semibold text-[var(--desk-navy)]">{c.client_name || 'Unnamed visitor'}</p>
                    <p className="flex items-center gap-1.5 text-sm text-[var(--desk-navy)]">
                      <CalendarClock className="h-4 w-4 text-[var(--desk-gold)]" aria-hidden="true" />
                      <time dateTime={c.scheduled_at}>{format(when, 'EEE d MMM yyyy, h:mm a')}</time>
                      <span className="text-[var(--desk-muted)]">· {c.duration_minutes || 30} min · <span className="capitalize">{meetingLabel(c)}</span></span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--desk-muted)]">
                      {c.client_phone && (
                        <a href={`tel:${c.client_phone}`} className="inline-flex items-center gap-1 hover:text-[var(--desk-navy)]">
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />{c.client_phone}
                        </a>
                      )}
                      {c.client_email && (
                        <a href={`mailto:${c.client_email}`} className="inline-flex items-center gap-1 hover:text-[var(--desk-navy)]">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />{c.client_email}
                        </a>
                      )}
                      {c.preferred_country && <span>Country: {c.preferred_country}</span>}
                      {c.assigned_officer_name && <span>Officer: {c.assigned_officer_name}</span>}
                    </div>
                    {typeof c.user_notes?.notes === 'string' && c.user_notes.notes.trim() && (
                      <p className="mt-1 rounded-lg bg-[var(--desk-ivory)] px-3 py-2 text-xs text-[var(--desk-navy)]">
                        “{c.user_notes.notes}”
                      </p>
                    )}
                  </div>

                  {open && (
                    <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                      {c.status !== 'confirmed' && (
                        <Button size="sm" disabled={busy} onClick={() => void updateStatus(c, 'confirmed')} className="gap-1.5">
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                          Confirm
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void updateStatus(c, 'completed')}>
                        Mark completed
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void updateStatus(c, 'no_show')}>
                        No-show
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setCancelTarget(c)} className="gap-1.5 text-red-700 hover:bg-red-50">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(openState) => { if (!openState) setCancelTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.client_name || 'The client'}
              {cancelTarget ? ` · ${format(new Date(cancelTarget.scheduled_at), 'EEE d MMM, h:mm a')}` : ''}. The client will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTarget) void updateStatus(cancelTarget, 'cancelled')
                setCancelTarget(null)
              }}
            >
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
