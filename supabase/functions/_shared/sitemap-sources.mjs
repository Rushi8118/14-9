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
  'slug,updated_at,published_at,status,canonical_url',
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
 */
export const CONTENT_SOURCES = Object.freeze([
  { type: 'blog', table: 'blog_posts', prefix: '/blog', filter: 'status=eq.published' },
  {
    type: 'requirements',
    table: 'urgent_requirements',
    prefix: '/urgent-requirements',
    filter: 'status=eq.active',
  },
  { type: 'services', table: 'services', prefix: '/services', filter: 'status=eq.published' },
  { type: 'jobs', table: 'job_listings', prefix: '/jobs', filter: 'status=eq.published' },
])

/** Maps a content row onto the record shape sitemap.mjs expects. */
function toRecord(row, { type, prefix }) {
  if (typeof row?.slug !== 'string' || !SLUG.test(row.slug)) return null
  return {
    type,
    path: `${prefix}/${row.slug}`,
    status: row.status,
    updated_at: row.updated_at,
    published_at: row.published_at,
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
export async function loadRecords({ baseUrl, key, fetchImpl = fetch, sources = CONTENT_SOURCES }) {
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
