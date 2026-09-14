import { Link } from 'react-router-dom'
import { CalendarClock, CalendarPlus, Globe2, MapPin, Phone, Video } from 'lucide-react'
import type { Appointment } from '@/hooks/useAppointments'
import type { Consultation } from '@/hooks/useConsultations'
import { Button } from '@/components/ui/button'
import { SkeletonTable } from './SkeletonCard'
import { StatusPill, type PillTone } from './StatusPill'
import { formatTime, humanize } from './dashboard-utils'

type Deadline = {
  id: string
  title: string
  date: Date
  status: string
  tone: PillTone
  mode: string
  icon: typeof Video
}

const MODE_ICONS: Record<Appointment['appointment_type'], typeof Video> = {
  'Video Call': Video,
  'Phone Call': Phone,
  'In-Person': MapPin,
}

export function getUpcomingDeadlines(appointments: Appointment[], consultations: Consultation[]): Deadline[] {
  const now = Date.now()
  const byId = new Map<string, Deadline>()

  for (const appt of appointments) {
    const date = new Date(appt.scheduled_at)
    if (appt.status !== 'Scheduled' || date.getTime() < now) continue
    byId.set(appt.id, {
      id: appt.id,
      title: `${appt.appointment_type} consultation`,
      date,
      status: 'Scheduled',
      tone: 'success',
      mode: appt.appointment_type,
      icon: MODE_ICONS[appt.appointment_type] ?? Video,
    })
  }

  for (const consultation of consultations) {
    const date = new Date(consultation.scheduled_at)
    if (!['requested', 'scheduled', 'confirmed'].includes(consultation.status) || date.getTime() < now) continue
    const requested = consultation.status === 'requested'
    byId.set(consultation.id, {
      id: consultation.id,
      title: humanize(consultation.consultation_type),
      date,
      status: requested ? 'Awaiting confirmation' : humanize(consultation.status),
      tone: requested ? 'gold' : 'success',
      mode: consultation.preferred_country ? `Target: ${consultation.preferred_country}` : 'Consultation',
      icon: Globe2,
    })
  }

  return [...byId.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
}

export default function UpcomingDeadlinesCard({
  appointments,
  consultations,
  isLoading,
}: {
  appointments: Appointment[]
  consultations: Consultation[]
  isLoading: boolean
}) {
  const deadlines = getUpcomingDeadlines(appointments, consultations).slice(0, 3)

  return (
    <section aria-labelledby="deadlines-heading" className="desk-card flex h-full flex-col p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-[18px] w-[18px] text-[var(--desk-gold)]" aria-hidden="true" />
        <h2 id="deadlines-heading" className="text-sm font-semibold text-[var(--desk-navy)]">
          Upcoming deadlines
        </h2>
      </div>

      <div className="mt-4 flex-1">
        {isLoading ? (
          <SkeletonTable rows={2} />
        ) : deadlines.length === 0 ? (
          <div className="flex h-full flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-4">
            <p className="text-sm font-medium text-[var(--desk-navy)]">No upcoming appointments</p>
            <Button asChild variant="outline" className="min-h-11 rounded-full border-[var(--desk-line)] text-[var(--desk-navy)]">
              <Link to="/dashboard/appointments">
                <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Book an appointment
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {deadlines.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id} className="flex gap-3 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-3">
                  <time
                    dateTime={item.date.toISOString()}
                    className="grid w-12 shrink-0 place-items-center rounded-lg bg-[var(--desk-navy)] py-1.5 text-center text-[#fff8e7]"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-[var(--desk-gold-soft)]">
                      {item.date.toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="desk-display text-lg font-semibold leading-none">{item.date.getDate()}</span>
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--desk-navy)]">{item.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--desk-muted)]">
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {formatTime(item.date)} · {item.mode}
                      </span>
                    </p>
                    <StatusPill tone={item.tone} className="mt-1.5">
                      {item.status}
                    </StatusPill>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
