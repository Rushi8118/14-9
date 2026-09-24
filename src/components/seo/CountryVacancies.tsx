import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { ArrowUpRight, Briefcase, Clock, MapPin, Users, Wallet } from 'lucide-react'
import { isFallbackRequirement, usePublicUrgentRequirements } from '@/hooks/useUrgentRequirements'

type CountryVacanciesProps = {
  /** Country name as stored on the urgent requirement rows, e.g. "Malta". */
  country: string
}

/**
 * Current openings for one country, read from the `urgent_requirements` table.
 *
 * Every figure shown here — vacancy count, salary, working hours, employer,
 * city — is admin-entered operational data the business owns. Nothing on this
 * component is generated, inferred or padded: a field that is empty in the
 * database is simply not rendered. That matters because these pages were
 * previously 94-97% identical across 40 countries, and real listings are the
 * one thing that genuinely differentiates them.
 *
 * The section states honestly which of three situations applies, so a country
 * with no current openings never reads as though it has some.
 */
export function CountryVacancies({ country }: CountryVacanciesProps) {
  const { requirements, isLoading } = usePublicUrgentRequirements()

  const openings = useMemo(() => {
    const target = country.trim().toLowerCase()
    // Placeholder rows are dropped: if Supabase is unreachable the hook serves
    // sample listings with invented salaries and vacancy counts, and those must
    // never reach a visitor as a real opening — including baked into the
    // prerendered HTML if the database is down during a build.
    return requirements.filter(
      (r) => !isFallbackRequirement(r) && r.country?.trim().toLowerCase() === target,
    )
  }, [requirements, country])

  // Render nothing at all while loading: the prerenderer snapshots the DOM, and
  // a skeleton baked into static HTML would ship to crawlers as page content.
  if (isLoading) return null

  return (
    <section
      aria-labelledby="current-openings"
      className="border-t border-border/40 py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2
          id="current-openings"
          className="font-serif text-2xl font-semibold text-foreground md:text-3xl"
        >
          {openings.length ? `Current ${country} openings` : `${country} vacancies`}
        </h2>

        {openings.length ? (
          <>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              These are live roles we are recruiting for right now. Details come from the
              employer requirement and change as positions fill.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openings.map((job) => (
                <Link
                  key={job.id}
                  to={`/urgent-requirements/${job.slug}`}
                  className="group rounded-2xl border border-border/60 bg-card/60 p-5 transition hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-foreground group-hover:text-primary">
                      {job.title}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </div>

                  <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {job.vacancies > 0 ? (
                      <Fact icon={Users} label="Vacancies">
                        {job.vacancies}
                      </Fact>
                    ) : null}
                    {job.city ? (
                      <Fact icon={MapPin} label="Location">
                        {job.city}
                      </Fact>
                    ) : null}
                    {job.salary ? (
                      <Fact icon={Wallet} label="Salary">
                        {job.salary}
                      </Fact>
                    ) : null}
                    {job.working_hours ? (
                      <Fact icon={Clock} label="Hours">
                        {job.working_hours}
                      </Fact>
                    ) : null}
                    {job.contract_type ? (
                      <Fact icon={Briefcase} label="Contract">
                        {job.contract_type}
                      </Fact>
                    ) : null}
                  </dl>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              <Link to="/contact" className="font-medium text-primary hover:underline">
                Book a free eligibility check
              </Link>{' '}
              before applying — we will tell you honestly whether your profile fits one of
              these roles.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              We have no urgent {country} openings listed at the moment. We do place
              candidates in {country} as employer requirements come in, so it is worth
              registering your profile now — you will be contacted when a matching role
              opens.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Register your profile
              </Link>
              <Link
                to="/urgent-requirements"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40"
              >
                See openings in other countries
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
