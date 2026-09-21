import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Inbox,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserX,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

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
  consultant_notes: string | null
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

const QUICK_TEMPLATES = [
  { label: 'Confirm & Bring Documents', text: 'Your consultation is confirmed! Please keep your passport, academic transcripts, and resume ready for review.' },
  { label: 'Video Call Link', text: 'Confirmed for Video Consultation. The meeting link will be shared here prior to our session.' },
  { label: 'Profile Shortlisted', text: 'We have evaluated your preferences and shortlisted top universities and visa categories. Looking forward to our discussion.' },
  { label: 'Reschedule Request', text: 'Our counselors are currently in consultation sessions during this time. Please reply or select an alternative slot that works for you.' },
]

const STATUS_CONFIG: Record<
  Consultation['status'],
  { style: string; icon: React.ComponentType<{ className?: string }>; dot: string }
> = {
  requested: {
    style: 'bg-amber-50 text-amber-900 border-amber-300/80 shadow-xs shadow-amber-500/10 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/50',
    icon: Clock,
    dot: 'bg-amber-500 animate-pulse',
  },
  scheduled: {
    style: 'bg-sky-50 text-sky-900 border-sky-300/80 shadow-xs shadow-sky-500/10 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-700/50',
    icon: Calendar,
    dot: 'bg-sky-500',
  },
  confirmed: {
    style: 'bg-emerald-50 text-emerald-900 border-emerald-300/80 shadow-xs shadow-emerald-500/10 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700/50',
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
  },
  completed: {
    style: 'bg-slate-100 text-slate-800 border-slate-300/80 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-700/50',
    icon: Check,
    dot: 'bg-slate-500',
  },
  cancelled: {
    style: 'bg-red-50 text-red-800 border-red-200/80 dark:bg-red-950/40 dark:text-red-200 dark:border-red-700/50',
    icon: XCircle,
    dot: 'bg-red-500',
  },
  no_show: {
    style: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-700/50',
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

  // Reply Modal state
  const [replyTarget, setReplyTarget] = useState<Consultation | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyStatus, setReplyStatus] = useState<Consultation['status']>('confirmed')
  const [notifyClient, setNotifyClient] = useState(true)
  const [isSendingReply, setIsSendingReply] = useState(false)

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

  const handleOpenReply = (c: Consultation) => {
    setReplyTarget(c)
    setReplyMessage(c.consultant_notes || '')
    setReplyStatus(c.status === 'requested' ? 'confirmed' : c.status)
    setNotifyClient(true)
  }

  const handleSendReply = async () => {
    if (!replyTarget) return
    setIsSendingReply(true)
    try {
      const trimmedNotes = replyMessage.trim() || null

      // 1. Update consultation record
      const { error: rpcError } = await supabase.rpc('admin_update_consultation', {
        p_id: replyTarget.id,
        p_status: replyStatus,
        p_consultant_notes: trimmedNotes,
      })

      if (rpcError) {
        // Fallback to direct table update if RPC unavailable
        const { error: directError } = await supabase
          .from('consultations')
          .update({
            status: replyStatus,
            consultant_notes: trimmedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', replyTarget.id)

        if (directError) {
          logger.error('Appointment reply failed:', directError.message)
          toast.error('Failed to update appointment note. Please try again.')
          return
        }
      }

      // 2. Dispatch real-time notification to client
      if (notifyClient && replyTarget.user_id && trimmedNotes) {
        const notifTitle = replyStatus === 'confirmed' && replyTarget.status !== 'confirmed'
          ? 'Appointment Confirmed & Officer Reply'
          : 'New reply on your appointment'

        const { error: notifRpcErr } = await supabase.rpc('admin_send_notification', {
          p_target: 'user',
          p_target_id: replyTarget.user_id,
          p_type: 'consultation_reminder',
          p_title: notifTitle,
          p_message: trimmedNotes,
          p_action_url: '/dashboard/appointments',
          p_action_label: 'View Appointment',
        })

        if (notifRpcErr) {
          // Fallback direct insert into notifications
          await supabase.from('notifications').insert({
            user_id: replyTarget.user_id,
            type: 'consultation_reminder',
            title: notifTitle,
            message: trimmedNotes,
            action_url: '/dashboard/appointments',
            action_label: 'View Appointment',
            is_read: false,
          })
        }
      }

      toast.success(
        replyTarget.user_id && notifyClient && trimmedNotes
          ? 'Reply sent and client notified!'
          : 'Appointment note updated successfully.'
      )
      setReplyTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-consultations'] })
    } catch (err) {
      logger.error('handleSendReply failed:', err)
      toast.error('An unexpected error occurred while sending the reply.')
    } finally {
      setIsSendingReply(false)
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
                    : 'border-[var(--desk-line)] bg-white/60 text-[var(--desk-muted)] hover:bg-white hover:text-[var(--desk-navy)] hover:border-[var(--desk-gold)]/30 hover:shadow-2xs dark:bg-black/40'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200 group-hover:scale-110 ${
                    isSelected
                      ? 'bg-[var(--desk-gold)] text-[var(--desk-navy)] shadow-2xs'
                      : 'bg-black/[0.04] text-[var(--desk-muted)] group-hover:bg-[var(--desk-gold)]/15 group-hover:text-[var(--desk-navy)] dark:bg-white/[0.05]'
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
                  <div className="min-w-0 space-y-1.5 flex-1">
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
                      <p className="mt-1 rounded-lg bg-[var(--desk-ivory)] px-3 py-2 text-xs text-[var(--desk-navy)] dark:bg-white/[0.05]">
                        “{c.user_notes.notes}”
                      </p>
                    )}

                    {/* Consultant Reply Display */}
                    {c.consultant_notes && (
                      <div className="mt-2.5 rounded-xl border border-blue-500/25 bg-blue-50/70 p-3 text-xs dark:border-blue-500/35 dark:bg-blue-950/30">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300 mb-1">
                          <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                          <span>Staff Reply / Notes:</span>
                        </div>
                        <p className="whitespace-pre-wrap text-blue-950 dark:text-blue-100 leading-relaxed pl-5 font-sans">
                          {c.consultant_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReply(c)}
                      className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/40"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      {c.consultant_notes ? 'Edit Reply' : 'Reply to Client'}
                    </Button>

                    {open && (
                      <>
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
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => setCancelTarget(c)} className="gap-1.5 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Reply Dialog */}
      <Dialog open={!!replyTarget} onOpenChange={(open) => { if (!open) setReplyTarget(null) }}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--desk-navy)]">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Reply to Appointment Booking
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--desk-muted)]">
              Send instructions, consultation meeting links, or advice. The applicant will see this on their dashboard and receive a notification.
            </DialogDescription>
          </DialogHeader>

          {replyTarget && (
            <div className="space-y-4 py-2">
              {/* Booking preview summary */}
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground text-sm">{replyTarget.client_name || 'Visitor'}</span>
                  <span className="text-muted-foreground">{format(new Date(replyTarget.scheduled_at), 'EEE d MMM, h:mm a')}</span>
                </div>
                <p className="text-muted-foreground">
                  {replyTarget.client_email && <span>{replyTarget.client_email} · </span>}
                  {replyTarget.client_phone && <span>{replyTarget.client_phone} · </span>}
                  <span className="capitalize">{meetingLabel(replyTarget)}</span>
                  {replyTarget.preferred_country && <span> · Country: {replyTarget.preferred_country}</span>}
                </p>
                {typeof replyTarget.user_notes?.notes === 'string' && replyTarget.user_notes.notes.trim() && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <span className="font-medium text-foreground/85">Client inquiry:</span>
                    <p className="italic text-foreground/75 mt-0.5">&ldquo;{replyTarget.user_notes.notes}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Quick Response Templates */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  Quick Response Templates:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => setReplyMessage(tmpl.text)}
                      className="text-[11px] rounded-lg border border-border bg-background px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/50 transition-colors"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Message Input */}
              <div className="space-y-1.5">
                <label htmlFor="reply-message-input" className="text-xs font-semibold text-foreground">
                  Officer Reply & Instructions:
                </label>
                <Textarea
                  id="reply-message-input"
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="e.g. Appointment confirmed! Please carry original academic transcripts and passport copy. We look forward to meeting you."
                  className="text-sm resize-none"
                />
              </div>

              {/* Status selection */}
              <div className="space-y-1.5">
                <label htmlFor="reply-status-select" className="text-xs font-semibold text-foreground">
                  Appointment Status:
                </label>
                <select
                  id="reply-status-select"
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value as Consultation['status'])}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="confirmed">Confirmed (Mark as confirmed)</option>
                  <option value="scheduled">Scheduled (In progress)</option>
                  <option value="requested">Requested (Awaiting review)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Notify Client Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="notify-client-check"
                  checked={notifyClient}
                  onCheckedChange={(checked) => setNotifyClient(!!checked)}
                  disabled={!replyTarget.user_id}
                />
                <label htmlFor="notify-client-check" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  {replyTarget.user_id ? (
                    <span className="flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      Notify client immediately via notification bell & realtime popup
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      (Guest visitor without account — note will be saved internally)
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReplyTarget(null)} disabled={isSendingReply}>
              Cancel
            </Button>
            <Button onClick={() => void handleSendReply()} disabled={isSendingReply} className="gap-1.5">
              {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Reply & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
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
