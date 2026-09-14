import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, CalendarPlus, Compass, RotateCw, SearchX } from 'lucide-react'
import type { Application } from '@/hooks/useApplications'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import ApplicationProgressCard from './ApplicationProgressCard'
import EmptyState from './EmptyState'
import InlineError from './InlineError'
import { SkeletonTable } from './SkeletonCard'
import { APPLICATION_STATUS_FILTERS, APPLICATION_STATUS_LABELS } from './dashboard-utils'

const VISIBLE_LIMIT = 5

export default function ActiveApplicationsCard({
  applications,
  isLoading,
  isError,
  isRefreshing,
  onRefresh,
  onBook,
}: {
  applications: Application[]
  isLoading: boolean
  isError: boolean
  isRefreshing: boolean
  onRefresh: () => void
  onBook: () => void
}) {
  const [status, setStatus] = useState('all')
  const [country, setCountry] = useState('all')

  const countries = useMemo(
    () =>
      [...new Set(applications.map((app) => app.countries?.name).filter((name): name is string => !!name))].sort(),
    [applications],
  )

  const filtered = applications.filter(
    (app) => (status === 'all' || app.status === status) && (country === 'all' || app.countries?.name === country),
  )

  const triggerClass = 'h-11 w-full rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-sm sm:w-40'

  return (
    <section aria-labelledby="active-applications-heading" className="desk-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[var(--desk-line)] pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="active-applications-heading" className="desk-display text-xl font-semibold text-[var(--desk-navy)]">
            Active applications
          </h2>
          <p className="mt-1 text-sm text-[var(--desk-muted)]">Track your current visa pathways and application progress.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="application-status-filter">
            Filter by status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="application-status-filter" className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {APPLICATION_STATUS_FILTERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {APPLICATION_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="sr-only" htmlFor="application-country-filter">
            Filter by country
          </label>
          <Select value={country} onValueChange={setCountry} disabled={countries.length === 0}>
            <SelectTrigger id="application-country-filter" className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh applications"
              className="h-11 w-11 rounded-xl border-[var(--desk-line)]"
            >
              <RotateCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden="true" />
            </Button>
            <Link
              to="/dashboard/applications"
              className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-[#8a6a1a] hover:text-[var(--desk-navy)]"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4" aria-live="polite" aria-busy={isLoading || isRefreshing}>
        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : isError ? (
          <InlineError title="We could not load your applications." onRetry={onRefresh} isRetrying={isRefreshing} />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title="No applications yet"
            description="Start your overseas journey by exploring destinations or booking a consultation."
            actions={
              <>
                <Button asChild variant="outline" className="min-h-11 rounded-full border-[var(--desk-line)] text-[var(--desk-navy)]">
                  <Link to="/countries">
                    <Compass className="mr-2 h-4 w-4" aria-hidden="true" />
                    Browse countries
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={onBook}
                  className="min-h-11 rounded-full bg-[var(--desk-navy)] text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Book consultation
                </Button>
              </>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={SearchX}
            title="No applications match these filters"
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatus('all')
                  setCountry('all')
                }}
                className="min-h-11 rounded-full border-[var(--desk-line)] text-[var(--desk-navy)]"
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <ul className="space-y-3">
              {filtered.slice(0, VISIBLE_LIMIT).map((app) => (
                <li key={app.id}>
                  <ApplicationProgressCard application={app} />
                </li>
              ))}
            </ul>
            {filtered.length > VISIBLE_LIMIT && (
              <p className="mt-3 text-center text-xs text-[var(--desk-muted)]">
                Showing {VISIBLE_LIMIT} of {filtered.length}.{' '}
                <Link to="/dashboard/applications" className="font-semibold text-[#8a6a1a] underline-offset-2 hover:underline">
                  See every application
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
