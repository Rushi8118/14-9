/**
 * Turns Supabase tables into sitemap records.
 *
 * WHY PLAIN REST AND NOT supabase-js
 *
 * This runs on every /sitemap.xml request. The REST endpoint is one fetch with
 * no client construction, which keeps the Edge Function cold start low; the
 * query shapes needed here are a filter and a column list, which is all the
 * client would have added. scripts/seo-routes.mjs already reads these tables the
 * same way, so the two agree on what "public" means.
 *
 * WHY EVERY SOURCE DEGRADES INSTEAD OF FAILING
 *
 * Two of these tables (services, job_listings) ship in a migration that is
 * applied by hand on this project, and the SEO columns on the older tables were
 * added over time. A sitemap that 500s because one table is missing is worse
 * than one that serves the content it could read: the first loses every URL,
 * the second loses one type and says so in the response headers and logs. This
 * is the same fallback discipline the log-environment work uses — the client is
 * written to survive the absence of its migration.
 *
 * The one thing that is NOT degraded: a source that errors is reported, and the
 * caller marks the response uncacheable so a partial sitemap cannot be frozen
 * at the edge. Silently caching a sitemap that is missing every blog post for
 * an hour is exactly the failure this file is meant to prevent.
 *
 * WHY THE PRERENDERED STATIC PAGES ARE NOT READ HERE
 *
 * They are not in the database, and putting them there would need the build to
 * write to Supabase — which it cannot do, because the build environment holds
 * only the publishable key and RLS rejects the write. Listing them inside this
 * function instead would reintroduce the drift dist/prerender-manifest.json
 * exists to prevent: a route listed by hand but never built is a URL submitted
 * to Google that serves an empty shell, which has already happened here to 25
 * URLs.
 *
 * So the two halves stay separate and sitemap.xml unions them as an index:
 * public/sitemap-pages.xml is written by the build from the manifest (static
 * pages need a build to exist at all, so a build-time file costs nothing), and
 * this function serves the content types, which change without a build. See
 * docs/dynamic-sitemap.md.
 */

/** Columns every source would like, in the order we degrade through. */
const SELECT_SHAPES = [
  'slug,updated_at,published_at,status,canonical_url,robots,is_indexable,deleted_at',
  'slug,updated_at,published_at,status,canonical_url,expires_at',
  'slug,updated_at,published_at,status,canonical_url',
  // For `urgent_requirements`, which has `expires_at` but no `published_at` or
  // `canonical_url`. Without this shape it degrades straight past the expiry
  // column to `slug,updated_at,status`, and an opening whose expires_at has
  // passed stays in the sitemap. The page itself goes noindex at that point
  // (UrgentRequirementDetailPage sets noindex={isClosed}), so the two halves
  // would disagree about whether the URL is indexable.
  //
  // Measured against production on 2026-10-09: blog_posts accepts shape 3
  // (it has published_at and canonical_url, no expires_at), urgent_requirements
  // accepts this one, job_listings falls through to slug,updated_at,status.
  'slug,updated_at,status,expires_at',
  'slug,updated_at,status',
  'slug,status',
  'slug',
]

/**
 * PostgREST error codes that mean "this schema object does not exist here",
 * as opposed to a transient failure. These are the ones we treat as an absent
 * migration rather than an outage.
 */
const MISSING_SCHEMA_CODES = new Set([
  '42P01', // undefined_table
  '42703', // undefined_column
  'PGRST204', // column not found in schema cache
  'PGRST205', // table not found in schema cache
])

function isMissingSchema(body) {
  if (!body) return false
  if (MISSING_SCHEMA_CODES.has(body.code)) return true
  return /does not exist|not found in the schema cache/i.test(String(body.message ?? ''))
}

/**
 * Reads one table, degrading the column list until PostgREST accepts it.
 *
 * @returns {Promise<{ rows: object[] } | { missing: true } | { error: string }>}
 */
async function readTable({ baseUrl, key, table, filter, limit = 50000, fetchImpl = fetch }) {
  let lastError = 'no select shape succeeded'

  for (const select of SELECT_SHAPES) {
    const query = new URLSearchParams()
    query.set('select', select)
    query.set('limit', String(limit))
    const url = `${baseUrl}/rest/v1/${table}?${query}${filter ? `&${filter}` : ''}`

    let response
    try {
      response = await fetchImpl(url, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      })
    } catch (err) {
      // A network failure is not a schema problem: do not keep trying narrower
      // column lists, the next one will fail the same way.
      return { error: `${table}: ${err?.message ?? 'fetch failed'}` }
    }

    if (response.ok) return { rows: await response.json() }

    let body = null
    try {
      body = await response.json()
    } catch {
      // non-JSON error body; fall through to the generic message
    }

    if (isMissingSchema(body)) {
      // A missing column means "try fewer columns"; a missing table means stop.
      if (body?.code === '42P01' || body?.code === 'PGRST205') return { missing: true }
      lastError = `${table}: ${body?.message ?? response.status}`
      continue
    }

    return { error: `${table}: ${response.status} ${body?.message ?? response.statusText}` }
  }

  return { error: lastError }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * The content types served from the database, and the URL each one lives at.
 *
 * `status` filters are pushed into the query so a draft never crosses the
 * network, but sitemap.mjs re-checks every record anyway: the filter is an
 * optimisation, the core is the guarantee. `urgent_requirements` uses `active`
 * where everything else uses `published`, which is why the filter is per-source
 * rather than global.
 *
 * `serve: false` means "declared, not emitted". A source is only served once a
 * ROUTE EXISTS for its prefix. A sitemap's job is to submit URLs that resolve;
 * a type whose table has rows but whose prefix 404s turns the sitemap into a
 * generator of crawl errors, and no amount of correct XML fixes that. The flag
 * is here rather than the entries being deleted so that re-enabling one is a
 * single word next to the reason it was off.
 *
 * Checked against production on 2026-10-09 (status codes from live requests,
 * row counts and columns from the REST API as the anon role):
 *
 *   blog          blog_posts           11 published rows   /blog/<slug> resolves
 *   requirements  urgent_requirements  14 active rows      /urgent-requirements/<slug> resolves
 *   services      services             table absent (PGRST205)
 *   jobs          job_listings         1 active row
 *
 * Why `jobs` is off, specifically — three faults that currently cancel out:
 *
 *   1. The filter asked for `status=eq.published`; the table uses `active`, as
 *      `urgent_requirements` does. So it reads 0 rows and looks empty.
 *   2. There is no `/jobs` route. React Router declares none and public/.htaccess
 *      app-shells only `blog|urgent-requirements`, so `/jobs/<slug>` falls to the
 *      404 rule. Verified live: 404.
 *   3. Its single row's slug, `hotel-jobs-australia-overseas-workers`, is ALSO an
 *      active `urgent_requirements` slug and is already submitted as
 *      /urgent-requirements/hotel-jobs-australia-overseas-workers. Serving it
 *      under /jobs would submit a second URL for the same content.
 *
 * So "fixing" the filter alone — the obvious next edit — would start submitting a
 * duplicate URL that 404s. Turn `serve` on in the same change that adds the route
 * and resolves the slug collision, not before.
 *
 * `services` is off for the same reason minus the data: `/services/<slug>` 404s
 * too (verified live). `/services` itself is a real prerendered page and stays in
 * sitemap-pages.xml — the prefix match is on `/services/`, so it is unaffected.
 */
export const CONTENT_SOURCES = Object.freeze([
  { type: 'blog', table: 'blog_posts', prefix: '/blog', filter: 'status=eq.published' },
  {
    type: 'requirements',
    table: 'urgent_requirements',
    prefix: '/urgent-requirements',
    filter: 'status=eq.active',
  },
  {
    type: 'services',
    table: 'services',
    prefix: '/services',
    filter: 'status=eq.published',
    serve: false,
  },
  {
    type: 'jobs',
    table: 'job_listings',
    prefix: '/jobs',
    // Left as `published` deliberately: the table uses `active`, and correcting
    // this without also adding the route and fixing the slug collision above
    // would submit a duplicate 404. See the comment on CONTENT_SOURCES.
    filter: 'status=eq.published',
    serve: false,
  },
])

/**
 * The sources actually emitted. Both halves of the sitemap derive their split
 * from this, not from CONTENT_SOURCES: the build claims every prefix the
 * function does not serve, so the two halves stay exactly complementary whatever
 * the flags say, and no URL can land in both or neither.
 */
export const servedSources = () => CONTENT_SOURCES.filter((source) => source.serve !== false)

/** Maps a content row onto the record shape sitemap.mjs expects. */
function toRecord(row, { type, prefix }) {
  if (typeof row?.slug !== 'string' || !SLUG.test(row.slug)) return null
  return {
    type,
    path: `${prefix}/${row.slug}`,
    status: row.status,
    updated_at: row.updated_at,
    published_at: row.published_at,
    expires_at: row.expires_at,
    deleted_at: row.deleted_at,
    canonical_url: row.canonical_url,
    robots: row.robots,
    isIndexable: row.is_indexable,
  }
}

/**
 * Collects every sitemap record from the database.
 *
 * @returns {Promise<{
 *   records: object[],
 *   errors: string[],
 *   missing: string[],
 *   counts: Record<string, number>,
 * }>}
 */
export async function loadRecords({ baseUrl, key, fetchImpl = fetch, sources = servedSources() }) {
  if (!baseUrl || !key) {
    return {
      records: [],
      errors: ['SUPABASE_URL or SUPABASE_ANON_KEY is not set'],
      missing: [],
      counts: {},
    }
  }

  const records = []
  const errors = []
  const missing = []
  const counts = {}

  const results = await Promise.all(
    sources.map((source) =>
      readTable({ baseUrl, key, table: source.table, filter: source.filter, fetchImpl }).then(
        (result) => ({ source, result }),
      ),
    ),
  )

  for (const { source, result } of results) {
    if ('rows' in result) {
      const mapped = result.rows.map((row) => toRecord(row, source)).filter(Boolean)
      records.push(...mapped)
      counts[source.type] = mapped.length
    } else if ('missing' in result) {
      missing.push(source.table)
    } else {
      errors.push(result.error)
    }
  }

  return { records, errors, missing, counts }
}
