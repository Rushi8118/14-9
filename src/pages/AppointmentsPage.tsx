import React, { useEffect, useId, useRef, useState } from 'react'
import { useAppointments, Appointment } from '@/hooks/useAppointments'
import {
  Clock,
  Video,
  Phone,
  UserCheck,
  XCircle,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThemeDatePicker } from '@/components/ui/theme-date-picker'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ud-copper)] focus-visible:ring-offset-2'

export default function AppointmentsPage() {
  const { appointments, bookAppointment, bookLoading, cancelAppointment } = useAppointments()

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [meetingType, setMeetingType] = useState<'Video Call' | 'In-Person' | 'Phone Call'>('Video Call')
  const [notes, setNotes] = useState<string>('')
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const cancelDialogRef = useRef<HTMLDivElement>(null)
  const formId = useId()
  const dateId = `${formId}-date`
  const notesId = `${formId}-notes`

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  ]

  useEffect(() => {
    if (!cancelTargetId) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelDialogRef.current?.querySelector<HTMLElement>('button')?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setCancelTargetId(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [cancelTargetId])

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return

    bookAppointment(
      {
        type: meetingType,
        date: new Date(selectedDate),
        timeSlot: selectedSlot,
        notes,
      },
      {
        onSuccess: () => {
          setSelectedDate('')
          setSelectedSlot('')
          setNotes('')
        },
      },
    )
  }

  const upcoming = appointments.filter(
    (a) => a.status === 'Scheduled' && new Date(a.scheduled_at) > new Date(),
  )

  const history = appointments.filter(
    (a) => a.status !== 'Scheduled' || new Date(a.scheduled_at) <= new Date(),
  )

  const getMeetingTypeIcon = (type: Appointment['appointment_type']) => {
    switch (type) {
      case 'Video Call':
        return <Video className="h-4 w-4 text-blue-700" aria-hidden="true" />
      case 'Phone Call':
        return <Phone className="h-4 w-4 text-emerald-700" aria-hidden="true" />
      default:
        return <UserCheck className="h-4 w-4 text-[var(--ud-copper)]" aria-hidden="true" />
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <section
          className="lg:col-span-7 bg-card border border-border/50 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm space-y-5"
          aria-labelledby="schedule-heading"
        >
          <h3 id="schedule-heading" className="font-serif text-base font-bold text-[var(--ud-ink)] border-b border-border/30 pb-3">
            Schedule a Consultation
          </h3>

          <form onSubmit={handleBook} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor={dateId} className="text-xs font-bold text-foreground/75 uppercase tracking-wide flex items-center justify-between">
                <span>1. Choose Date</span>
                {selectedDate && (
                  <span className="text-[11px] font-semibold text-[var(--ud-copper)]">
                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </label>
              <ThemeDatePicker
                id={dateId}
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date(Date.now() + 86400000)}
                placeholder="Choose consultation date..."
                variant="dashboard"
                showShortcuts={true}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-foreground/75 uppercase tracking-wide">
                2. Select Hour Slot
              </legend>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="group" aria-label="Time slots">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    aria-pressed={selectedSlot === slot}
                    className={`min-h-11 py-2 px-3 text-xs font-bold rounded-xl border transition ${focusRing} ${
                      selectedSlot === slot
                        ? 'bg-[var(--ud-ink)] border-[var(--ud-ink)] text-[var(--ud-canvas)] shadow-sm'
                        : 'bg-card border-border/65 text-[var(--ud-ink)] hover:border-[var(--ud-copper)]/35 hover:bg-[var(--ud-canvas)]/25'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-foreground/75 uppercase tracking-wide">
                3. Meeting Channel
              </legend>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { label: 'Video Call', icon: Video, color: 'text-blue-700' },
                    { label: 'Phone Call', icon: Phone, color: 'text-emerald-700' },
                    { label: 'In-Person', icon: UserCheck, color: 'text-[var(--ud-copper)]' },
                  ] as const
                ).map((medium) => {
                  const Icon = medium.icon
                  return (
                    <button
                      key={medium.label}
                      type="button"
                      onClick={() => setMeetingType(medium.label)}
                      aria-pressed={meetingType === medium.label}
                      className={`min-h-[4.5rem] py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${focusRing} ${
                        meetingType === medium.label
                          ? 'border-[var(--ud-copper)] bg-[var(--ud-copper)]/5 font-semibold text-[var(--ud-ink)]'
                          : 'bg-card border-border/65 text-foreground/65 hover:text-[var(--ud-ink)] hover:border-[var(--ud-copper)]/30'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${medium.color}`} aria-hidden="true" />
                      <span className="text-[11px]">{medium.label}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor={notesId} className="text-xs font-bold text-foreground/75 uppercase tracking-wide">
                4. Description Notes
              </label>
              <Textarea
                id={notesId}
                placeholder="Mention any specific queries regarding destination studies or work visa approvals..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm h-20 border-border/60 bg-[var(--ud-canvas)]/20 focus-visible:ring-[var(--ud-copper)] resize-none rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={bookLoading || !selectedDate || !selectedSlot}
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 btn-glow h-11 text-sm font-bold"
            >
              Confirm Booking Slot
            </Button>
          </form>
        </section>

        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          <section
            className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4"
            aria-labelledby="upcoming-heading"
          >
            <h3 id="upcoming-heading" className="font-serif text-base font-bold text-[var(--ud-ink)] border-b border-border/30 pb-3">
              Upcoming Sessions
            </h3>

            {upcoming.length === 0 ? (
              <div className="py-10 text-center bg-[var(--ud-canvas)]/10 rounded-xl border border-dashed border-border/60">
                <Clock className="h-8 w-8 text-foreground/25 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-foreground/65 font-semibold">No active sessions booked</p>
                <p className="text-xs text-foreground/55 mt-0.5">Use the scheduler to claim a calendar slot.</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {upcoming.map((appt) => (
                  <li
                    key={appt.id}
                    className="p-3.5 rounded-xl border border-border/50 bg-[var(--ud-canvas)]/15 flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="p-1 rounded bg-[var(--ud-ink)]/5 shrink-0">
                            {getMeetingTypeIcon(appt.appointment_type)}
                          </span>
                          <span className="text-xs font-bold text-[var(--ud-ink)]">{appt.appointment_type}</span>
                          {appt.raw_status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Confirmed
                            </span>
                          ) : appt.raw_status === 'requested' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                              Awaiting Confirmation
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-foreground/65 leading-tight space-y-0.5">
                          <p className="font-semibold text-[var(--ud-ink)]">
                            Date:{' '}
                            {new Date(appt.scheduled_at).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="font-medium">
                            Time:{' '}
                            {new Date(appt.scheduled_at).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            ({appt.duration_minutes} mins)
                          </p>
                        </div>
                        {appt.notes && (
                          <p className="text-[11px] text-foreground/55 italic">
                            &ldquo;{appt.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setCancelTargetId(appt.id)}
                        className={`p-2 min-h-10 min-w-10 text-foreground/55 hover:text-red-700 rounded-full hover:bg-red-50 shrink-0 transition ${focusRing}`}
                        aria-label="Cancel appointment"
                      >
                        <XCircle className="h-4.5 w-4.5" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Consultant Reply / Instructions Card */}
                    {appt.consultant_notes && (
                      <div className="w-full rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50/90 to-teal-50/80 p-3 text-xs text-emerald-950 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                          <span>Consultant Reply & Instructions:</span>
                        </div>
                        <p className="whitespace-pre-wrap text-emerald-900 leading-relaxed font-sans pl-5">
                          {appt.consultant_notes}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4"
            aria-labelledby="history-heading"
          >
            <h3 id="history-heading" className="font-serif text-base font-bold text-[var(--ud-ink)] border-b border-border/30 pb-3">
              Consultation Log History
            </h3>

            {history.length === 0 ? (
              <p className="text-sm text-foreground/60 italic text-center py-4">
                No past consultations recorded.
              </p>
            ) : (
              <ul className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {history.slice(0, 5).map((appt) => (
                  <li
                    key={appt.id}
                    className="p-2.5 rounded-xl border border-border/40 bg-[var(--ud-canvas)]/10 text-sm space-y-1.5"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="leading-tight space-y-0.5 min-w-0">
                        <h4 className="font-semibold text-[var(--ud-ink)] truncate">{appt.appointment_type}</h4>
                        <p className="text-xs text-foreground/60">
                          {new Date(appt.scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-bold border rounded-full px-2.5 py-1 shrink-0 ${
                          appt.status === 'Cancelled'
                            ? 'bg-red-600/15 text-red-800 border-red-600/30'
                            : appt.status === 'Completed'
                              ? 'bg-emerald-600/15 text-emerald-800 border-emerald-600/30'
                              : 'bg-muted text-foreground/70 border-border'
                        }`}
                      >
                        {appt.status.toUpperCase()}
                      </span>
                    </div>

                    {appt.consultant_notes && (
                      <div className="text-[11px] text-foreground/80 bg-white/60 dark:bg-black/20 rounded-lg p-2 border border-border/30">
                        <span className="font-semibold text-foreground/90">Note: </span>
                        {appt.consultant_notes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {cancelTargetId && (
        <div
          className="fixed inset-0 bg-[var(--ud-ink)]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          role="presentation"
          onClick={() => setCancelTargetId(null)}
        >
          <div
            ref={cancelDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
            aria-describedby="cancel-dialog-desc"
            className="bg-card border border-border/60 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-3 bg-red-100 text-red-700 rounded-full inline-flex items-center justify-center"
              aria-hidden="true"
            >
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 id="cancel-dialog-title" className="font-serif text-lg font-bold text-[var(--ud-ink)]">
                Cancel Appointment?
              </h3>
              <p id="cancel-dialog-desc" className="text-sm text-foreground/65 leading-normal">
                This action is permanent and frees up this calendar slot for other visa applicants.
              </p>
            </div>
            <div className="flex gap-3.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setCancelTargetId(null)}
                className="flex-1 rounded-xl h-11 text-sm font-semibold"
              >
                No, Keep it
              </Button>
              <Button
                onClick={() => {
                  cancelAppointment(cancelTargetId)
                  setCancelTargetId(null)
                }}
                className="flex-1 rounded-xl h-11 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold"
              >
                Cancel Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
