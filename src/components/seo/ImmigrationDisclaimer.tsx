import { ExternalLink, ShieldAlert } from 'lucide-react'
import { officialSourcesFor } from '@/lib/seo/official-sources'

type ImmigrationDisclaimerProps = {
  /** Destination country name, used to pick official government links. */
  country?: string
  /** ISO date (YYYY-MM-DD) the page content was last updated. */
  updated?: string
  /** Pages listing job openings also explain that hiring is the employer's decision. */
  jobs?: boolean
}

/** Shown on every immigration, study and work-visa page. */
export function ImmigrationDisclaimer({ country, updated = CONTENT_LAST_UPDATED, jobs = false }: ImmigrationDisclaimerProps) {
  const sources = officialSourcesFor(country)
  const updatedLabel = new Date(`${updated}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section aria-labelledby="immigration-disclaimer-heading" className="px-4 py-10 md:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 md:p-6">
        <h2 id="immigration-disclaimer-heading" className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden="true" />
          Important information
        </h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            Siddhivinayak Overseas provides information, counselling and application-preparation support for applicants
            exploring lawful study, work and migration pathways.
          </p>
          <p>
            Eligibility, required documents, fees and processing times depend on the destination government&apos;s current
            official rules and your individual circumstances, and every decision is made by the relevant authority.
            {jobs ? ' Hiring decisions are made only by the employer; we never sell job offers, offer letters or sponsorship.' : ''}{' '}
          </p>
        </div>

        {sources.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Official sources</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {source.label}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Page last updated: {updatedLabel}
        </p>
      </div>
    </section>
  )
}

/** Bump when the static country/visa content is revised. */
export const CONTENT_LAST_UPDATED = '2026-09-17'
