import { Link } from 'react-router-dom'
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Files, MessageCircle } from 'lucide-react'

const ACTIONS = [
  { label: 'My applications', helper: 'Track progress and outcomes', to: '/dashboard/applications', icon: BriefcaseBusiness },
  { label: 'Documents', helper: 'Upload and fix requested files', to: '/dashboard/documents', icon: Files },
  { label: 'Appointments', helper: 'Manage consultation slots', to: '/dashboard/appointments', icon: CalendarDays },
  { label: 'Messages', helper: 'Talk to your case officer', to: '/dashboard/chat', icon: MessageCircle },
]

export default function DashboardQuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="desk-display mb-3 text-lg font-semibold text-[var(--desk-navy)]">
        Quick actions
      </h2>
      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map(({ label, helper, to, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="desk-card desk-card-interactive group flex min-h-[4.5rem] items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--desk-navy)] text-[var(--desk-gold-soft)]">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--desk-navy)]">{label}</span>
                <span className="block truncate text-xs text-[var(--desk-muted)]">{helper}</span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-[var(--desk-muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--desk-gold)]"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
