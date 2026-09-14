import { Link } from 'react-router-dom'
import {
  BriefcaseBusiness,
  CalendarCheck,
  CalendarPlus,
  FileWarning,
  FileX2,
  History,
  MessageCircle,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import type { UserProfile } from '@/hooks/use-auth'
import type { Application } from '@/hooks/useApplications'
import type { Appointment } from '@/hooks/useAppointments'
import type { ChatMessage } from '@/hooks/useChat'
import type { Consultation } from '@/hooks/useConsultations'
import type { DocumentRow } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'
import EmptyState from './EmptyState'
import { SkeletonTable } from './SkeletonCard'
import { APPLICATION_STATUS_LABELS, formatDateTime, humanize } from './dashboard-utils'

type Tone = 'gold' | 'success' | 'info' | 'warning' | 'danger' | 'navy'

export type ActivityItem = {
  id: string
  title: string
  description: string
  timestamp: string
  icon: LucideIcon
  tone: Tone
  href?: string
}

const TONES: Record<Tone, string> = {
  gold: 'bg-[#c49a2b]/15 text-[#8a6a1a]',
  success: 'bg-emerald-100 text-[#20875a]',
  info: 'bg-sky-100 text-[#2876b8]',
  warning: 'bg-amber-100 text-[#a66a00]',
  danger: 'bg-red-100 text-[#b42318]',
  navy: 'bg-[#1a2340] text-[#e8b84b]',
}

export function buildRecentActivity({
  userId,
  profile,
  applications,
  consultations,
  appointments,
  documents,
  messages,
}: {
  userId: string
  profile: UserProfile | null
  applications: Application[]
  consultations: Consultation[]
  appointments: Appointment[]
  documents: DocumentRow[]
  messages: ChatMessage[]
}): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const app of applications.slice(0, 4)) {
    const country = app.countries?.name ?? 'Your'
    const pathway = humanize(app.application_type).toLowerCase()
    const isDraft = app.status === 'draft'
    items.push({
      id: `app-${app.id}`,
      title: isDraft ? 'Application draft saved' : 'Application status updated',
      description: isDraft
        ? `${country} ${pathway} application saved as a draft`
        : `${country} ${pathway} application moved to ${APPLICATION_STATUS_LABELS[app.status]}`,
      timestamp: app.updated_at,
      icon: BriefcaseBusiness,
      tone: app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'gold',
      href: '/dashboard/applications',
    })
  }

  for (const consultation of consultations.slice(0, 3)) {
    items.push({
      id: `consultation-${consultation.id}`,
      title: 'Consultation requested',
      description: `${humanize(consultation.consultation_type)}${
        consultation.preferred_country ? ` for ${consultation.preferred_country}` : ''
      }`,
      timestamp: consultation.created_at,
      icon: CalendarPlus,
      tone: 'info',
      href: '/dashboard/appointments',
    })
  }

  const now = Date.now()
  for (const appt of appointments.filter((a) => a.status === 'Scheduled' && new Date(a.scheduled_at).getTime() > now).slice(0, 2)) {
    items.push({
      id: `appointment-${appt.id}`,
      title: 'Appointment scheduled',
      description: `${appt.appointment_type} on ${formatDateTime(appt.scheduled_at)}`,
      timestamp: appt.created_at,
      icon: CalendarCheck,
      tone: 'success',
      href: '/dashboard/appointments',
    })
  }

  for (const doc of documents.filter((d) => d.status === 'Missing' || d.status === 'Rejected').slice(0, 3)) {
    const rejected = doc.status === 'Rejected'
    items.push({
      id: `document-${doc.id}`,
      title: rejected ? 'Document rejected' : 'Document requested',
      description: doc.name,
      timestamp: doc.updated_at,
      icon: rejected ? FileX2 : FileWarning,
      tone: rejected ? 'danger' : 'warning',
      href: '/dashboard/documents',
    })
  }

  for (const message of messages.filter((m) => m.receiver_id === userId && m.sender_id !== userId).slice(-2)) {
    items.push({
      id: `message-${message.id}`,
      title: 'New officer message',
      description: message.message.length > 80 ? `${message.message.slice(0, 80)}…` : message.message,
      timestamp: message.created_at,
      icon: MessageCircle,
      tone: 'navy',
      href: '/dashboard/chat',
    })
  }

  if (profile && profile.updated_at !== profile.created_at) {
    items.push({
      id: 'profile-updated',
      title: 'Profile updated',
      description: 'Your personal details were saved.',
      timestamp: profile.updated_at,
      icon: UserRoundCheck,
      tone: 'gold',
      href: '/dashboard/profile',
    })
  }

  return items
    .filter((item) => !Number.isNaN(new Date(item.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)
}

export default function RecentActivityTimeline({ items, isLoading }: { items: ActivityItem[]; isLoading: boolean }) {
  return (
    <section aria-labelledby="recent-activity-heading" className="desk-card h-full p-5 sm:p-6">
      <div className="border-b border-[var(--desk-line)] pb-4">
        <h2 id="recent-activity-heading" className="desk-display text-xl font-semibold text-[var(--desk-navy)]">
          Recent activity
        </h2>
        <p className="mt-1 text-sm text-[var(--desk-muted)]">The latest movement across your account.</p>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : items.length === 0 ? (
          <EmptyState compact icon={History} title="No recent activity" description="Your latest updates will appear here." />
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-px before:bg-[var(--desk-line)]">
            {items.map((item) => {
              const Icon = item.icon
              const body = (
                <>
                  <span className="block text-sm font-semibold text-[var(--desk-navy)]">{item.title}</span>
                  <span className="block break-words text-sm text-[var(--desk-muted)]">{item.description}</span>
                  <time dateTime={item.timestamp} className="mt-0.5 block text-xs text-[var(--desk-muted)]/90">
                    {formatDateTime(item.timestamp)}
                  </time>
                </>
              )
              return (
                <li key={item.id} className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-3">
                  <span className={cn('relative grid h-9 w-9 place-items-center rounded-full ring-4 ring-[var(--desk-surface)]', TONES[item.tone])}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {item.href ? (
                    <Link to={item.href} className="-mx-2 rounded-lg px-2 py-1 transition hover:bg-[var(--desk-surface-soft)]">
                      {body}
                    </Link>
                  ) : (
                    <div className="py-1">{body}</div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
