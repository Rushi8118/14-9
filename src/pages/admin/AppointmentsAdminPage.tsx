import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { CalendarClock, CheckCircle2, Loader2, Mail, Phone, RefreshCw, Search, XCircle } from 'lucide-react'
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

type View = 'upcoming' | 'requested' | 'all' | 'completed' | 'cancelled'

const VIEWS: { id: View; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'requested', label: 'New requests' },
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

const STATUS_STYLE: Record<Consultation['status'], string> = {
  requested: 'bg-amber-100 text-amber-900 border-amber-300',
  scheduled: 'bg-sky-100 text-sky-900 border-sky-300',
  confirmed: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  completed: 'bg-slate-100 text-slate-800 border-slate-300',
  cancelled: 'bg-red-50 text-red-800 border-red-200',
  no_show: 'bg-red-50 text-red-800 border-red-200',
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
  const [view, setView] = useState<View>('upcoming')
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
        <div role="tablist" aria-label="Filter appointments" className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={`min-h-9 rounded-full border px-3.5 text-xs font-semibold transition ${
                view === v.id
                  ? 'border-[var(--desk-gold)] bg-[var(--desk-gold)]/15 text-[var(--desk-navy)]'
                  : 'border-[var(--desk-line)] text-[var(--desk-muted)] hover:bg-[var(--desk-gold)]/10'
              }`}
            >
              {v.label}
            </button>
          ))}
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
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[c.status] ?? ''}`}>
                        {c.status.replace('_', ' ')}
                      </span>
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
