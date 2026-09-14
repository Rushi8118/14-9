import { Link } from 'react-router-dom'
import { ArrowRight, Check, Flag, Globe2, X } from 'lucide-react'
import type { Application } from '@/hooks/useApplications'
import { FlagIcon } from '@/components/flag-icon'
import { cn } from '@/lib/utils'
import { ApplicationStatusBadge, StatusPill } from './StatusPill'
import { APPLICATION_STEPS, formatDate, getApplicationStep, humanize } from './dashboard-utils'

export default function ApplicationProgressCard({ application: app }: { application: Application }) {
  const current = getApplicationStep(app)
  const country = app.countries?.name ?? 'Destination pending'
  const programme = app.visa_programs?.name ?? 'Visa programme'
  const urgentPriority = app.priority === 'high' || app.priority === 'urgent'

  const stepLabel = (index: number) => {
    if (index === 3 && app.status === 'approved') return 'Approved'
    if (index === 3 && app.status === 'rejected') return 'Rejected'
    return APPLICATION_STEPS[index]
  }

  return (
    <article className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)]/70 p-4 transition hover:border-[var(--desk-gold)]/40 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--desk-line)] bg-white text-2xl">
            {app.countries?.name ? (
              <FlagIcon country={app.countries.name} />
            ) : (
              <Globe2 className="h-5 w-5 text-[var(--desk-gold)]" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-[var(--desk-navy)]">
              {country} · {programme}
            </h3>
            <p className="truncate text-xs text-[var(--desk-muted)]">
              ID {app.application_id ?? 'pending'} · {humanize(app.application_type)} pathway
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ApplicationStatusBadge status={app.status} />
          {urgentPriority && (
            <StatusPill tone={app.priority === 'urgent' ? 'danger' : 'warning'} icon={Flag}>
              {humanize(app.priority)} priority
            </StatusPill>
          )}
        </div>
      </div>

      {app.status === 'withdrawn' ? (
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">This application was withdrawn.</p>
      ) : (
        <ol className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2" aria-label={`Progress for ${country} application`}>
          {APPLICATION_STEPS.map((_, index) => {
            const done = index < current || (index === current && index === 3)
            const isCurrent = index === current && index !== 3
            const failed = index === 3 && app.status === 'rejected'
            return (
              <li key={index} className="min-w-0">
                <span
                  className={cn(
                    'block h-1.5 rounded-full',
                    failed ? 'bg-[var(--desk-danger)]' : done || isCurrent ? 'bg-[var(--desk-gold)]' : 'bg-[var(--desk-line)]',
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'mt-1.5 flex items-start gap-1 text-[10px] leading-tight sm:text-xs',
                    done || isCurrent ? 'font-semibold text-[var(--desk-navy)]' : 'text-[var(--desk-muted)]',
                  )}
                >
                  {done &&
                    (failed ? (
                      <X className="mt-px hidden h-3 w-3 shrink-0 text-[var(--desk-danger)] sm:block" aria-hidden="true" />
                    ) : (
                      <Check className="mt-px hidden h-3 w-3 shrink-0 text-[var(--desk-gold)] sm:block" aria-hidden="true" />
                    ))}
                  <span>
                    {stepLabel(index)}
                    <span className="sr-only">{done ? ', completed' : isCurrent ? ', current step' : ', upcoming'}</span>
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--desk-line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:flex sm:gap-6">
          <div>
            <dt className="text-[var(--desk-muted)]">Submitted</dt>
            <dd className="font-medium text-[var(--desk-navy)]">{formatDate(app.submitted_at, 'Not submitted')}</dd>
          </div>
          <div>
            <dt className="text-[var(--desk-muted)]">Est. completion</dt>
            <dd className="font-medium text-[var(--desk-navy)]">{formatDate(app.estimated_completion, 'To be confirmed')}</dd>
          </div>
          {!urgentPriority && (
            <div>
              <dt className="text-[var(--desk-muted)]">Priority</dt>
              <dd className="font-medium text-[var(--desk-navy)]">{humanize(app.priority)}</dd>
            </div>
          )}
        </dl>
        <Link
          to="/dashboard/applications"
          className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-[#8a6a1a] hover:text-[var(--desk-navy)] sm:self-auto"
        >
          View details
          <span className="sr-only"> for {country} application</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
