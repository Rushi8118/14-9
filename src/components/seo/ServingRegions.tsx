import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { regionPages } from '@/content/regional-pages'

/**
 * Links a blog post or vacancy page to the state pages it is relevant to.
 *
 * WHY
 *
 * The state pages were reachable only from /regional-coverage and from each
 * other. Content pages -- where a reader actually arrives from search -- said
 * nothing about where the reader might be applying from. That is the same
 * single-inbound-link shape Google reports as "Discovered - currently not
 * indexed", and it wastes the strongest pages on the site: a blog post that
 * ranks passes nothing to the regional pages that need the help.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not link to all 21 states. A block of 21 identical links on every
 * post is a footer link farm, it dilutes every link in it, and it helps no
 * reader. Four are shown.
 *
 * Selection is by country match first -- a post about UK work visas surfaces
 * the states whose applicants most often pursue the UK, which is real data from
 * regional-coverage.ts -- then filled deterministically from the slug so that
 * every state gets surfaced by some posts rather than the same four appearing
 * everywhere. Deterministic because the prerenderer has to emit identical HTML
 * on every build.
 *
 * No post body is edited to carry a place name. Stuffing city names into prose
 * is the thing Google penalises; a genuine navigational link is not.
 */

type Props = {
  /** Slug of the post or vacancy, used as a stable seed. */
  seed: string
  /** Destination country, when the page has one, e.g. "United Kingdom". */
  country?: string | null
  /** Heading override, so a vacancy page can phrase it as applying for a job. */
  title?: string
}

const SHOWN = 4

/** Small stable string hash. Same input, same output, every build. */
function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function ServingRegions({ seed, country, title }: Props) {
  const links = useMemo(() => {
    if (regionPages.length === 0) return []

    // Real signal first: states whose applicants most often go to this country.
    const matching = country
      ? regionPages.filter((p) =>
          p.keywords.toLowerCase().includes(country.toLowerCase()) ||
          p.description.toLowerCase().includes(country.toLowerCase()),
        )
      : []

    const picked: typeof regionPages = []
    const seen = new Set<string>()

    const take = (page: (typeof regionPages)[number]) => {
      if (picked.length >= SHOWN || seen.has(page.path)) return
      seen.add(page.path)
      picked.push(page)
    }

    matching.forEach(take)

    // Fill the rest by walking the full list from a slug-derived offset, so the
    // same four states do not appear on every page on the site.
    const start = hash(seed) % regionPages.length
    for (let i = 0; i < regionPages.length && picked.length < SHOWN; i++) {
      take(regionPages[(start + i) % regionPages.length])
    }

    return picked.map((p) => ({
      label: p.breadcrumbs[p.breadcrumbs.length - 1]?.label ?? p.h1,
      to: p.path,
    }))
  }, [seed, country])

  if (links.length === 0) return null

  return (
    <section className="border-t border-border/40 py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-medium text-foreground">
              {title ?? 'Applying from another state?'}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Document verification and where you submit differ by state. We work with applicants
            across India from our Surat office — these pages set out what applies where you are.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/regional-coverage"
              className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              All states &amp; cities
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
