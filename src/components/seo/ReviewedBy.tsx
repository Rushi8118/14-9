import { CalendarCheck, ExternalLink, UserCheck } from 'lucide-react'
import type { PageAttribution } from '@/content/destination-types'

/**
 * Editorial attribution block: who checked this page, when, and against which
 * official sources.
 *
 * This is a YMYL page — immigration advice affects money, legal status and
 * people's ability to live and work somewhere — so Google's quality guidelines
 * weight author identity and currency heavily. But the component renders
 * *nothing* unless real values are supplied. It never falls back to a placeholder
 * name, a generic byline or today's date: a fabricated reviewer is a false claim
 * about who vetted immigration advice, which is worse than having no byline.
 *
 * Correspondingly, `Person` structured data is emitted by the page only when
 * `reviewedBy` is a real name — see the callers. Nothing here is marked up that
 * is not also displayed.
 */
export function ReviewedBy({ attribution }: { attribution?: PageAttribution }) {
  if (!attribution) return null
  const { reviewedBy, reviewerRole, lastReviewed, sources } = attribution
  if (!reviewedBy && !lastReviewed && !sources?.length) return null

  const reviewedOn = lastReviewed
    ? new Date(`${lastReviewed}T00:00:00Z`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null

  return (
    <section
      aria-label="Editorial review"
      className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 text-sm"
    >
      <div className="flex flex-col gap-2 text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
        {reviewedBy ? (
          <p className="flex items-center gap-2">
            <UserCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Reviewed by <span className="font-medium text-foreground">{reviewedBy}</span>
              {reviewerRole ? `, ${reviewerRole}` : null}
            </span>
          </p>
        ) : null}
        {reviewedOn ? (
          <p className="flex items-center gap-2">
            <CalendarCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Last reviewed{' '}
              <time dateTime={lastReviewed} className="font-medium text-foreground">
                {reviewedOn}
              </time>
            </span>
          </p>
        ) : null}
      </div>

      {sources?.length ? (
        <div className="mt-3 border-t border-border/50 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Official sources
          </p>
          <ul className="mt-2 space-y-1">
            {sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {source.label}
                  <ExternalLink aria-hidden="true" className="h-3 w-3" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
