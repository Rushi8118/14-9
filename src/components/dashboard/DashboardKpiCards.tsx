import { Link } from 'react-router-dom'
import { BadgeCheck, CircleX, FilePen, Hourglass, Layers, Send, type LucideIcon } from 'lucide-react'
import type { Application } from '@/hooks/useApplications'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Tone = 'gold' | 'amber' | 'blue' | 'emerald' | 'crimson'

const TONES: Record<Tone, string> = {
  gold: 'bg-[#c49a2b]/12 text-[#8a6a1a]',
  amber: 'bg-amber-100/80 text-[#a66a00]',
  blue: 'bg-sky-100/80 text-[#2876b8]',
  emerald: 'bg-emerald-100/80 text-[#20875a]',
  crimson: 'bg-red-100/80 text-[#b42318]',
}

const KPIS: { key: Application['status'] | 'total'; label: string; description: string; icon: LucideIcon; tone: Tone }[] = [
  { key: 'total', label: 'Total applications', description: 'Across all pathways', icon: Layers, tone: 'gold' },
  { key: 'draft', label: 'Draft', description: 'Not yet submitted', icon: FilePen, tone: 'amber' },
  { key: 'submitted', label: 'Submitted', description: 'Awaiting review', icon: Send, tone: 'blue' },
  { key: 'under_review', label: 'Under review', description: 'With case officers', icon: Hourglass, tone: 'gold' },
  { key: 'approved', label: 'Approved', description: 'Positive outcomes', icon: BadgeCheck, tone: 'emerald' },
  { key: 'rejected', label: 'Rejected', description: 'Needs a new plan', icon: CircleX, tone: 'crimson' },
]

export default function DashboardKpiCards({ applications, isLoading }: { applications: Application[]; isLoading: boolean }) {
  return (
    <section aria-labelledby="kpi-heading">
      <h2 id="kpi-heading" className="sr-only">
        Application summary
      </h2>
      <ul className="desk-scroll-x -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-6">
        {KPIS.map(({ key, label, description, icon: Icon, tone }) => {
          const count = key === 'total' ? applications.length : applications.filter((app) => app.status === key).length
          return (
            <li key={key} className="w-[44%] shrink-0 snap-start min-[520px]:w-[30%] sm:w-auto">
              <Link
                to="/dashboard/applications"
                aria-label={isLoading ? `${label}: loading` : `${label}: ${count}. ${description}`}
                className="desk-card desk-card-interactive flex h-full flex-col gap-3 p-4"
              >
                <span className={cn('grid h-9 w-9 place-items-center rounded-lg', TONES[tone])}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span aria-hidden="true">
                  {isLoading ? (
                    <Skeleton className="h-7 w-10 bg-[var(--desk-line)]/60" />
                  ) : (
                    <span className="desk-display block text-2xl font-semibold tabular-nums text-[var(--desk-navy)]">
                      {count}
                    </span>
                  )}
                  <span className="mt-0.5 block text-sm font-medium text-[var(--desk-navy)]">{label}</span>
                  <span className="block text-xs text-[var(--desk-muted)]">{description}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
