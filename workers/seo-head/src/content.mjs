/**
 * Reads one published row from Supabase for the SEO Worker.
 *
 * WHY PostgREST DIRECTLY AND NOT supabase-js
 *
 * This runs on a request path with a 10 ms CPU budget on the Workers Free plan.
 * One `fetch` with no client construction and no bundled library is the whole
 * requirement here. It is also the same access pattern the sitemap already uses
 * (supabase/functions/_shared/sitemap-sources.mjs), so both agree on what
 * "public" means.
 *
 * WHY THE PUBLISHABLE KEY AND NOTHING STRONGER
 *
 * The Worker is read-only and only ever serves pages that are already public, so
 * it needs no more authority than an anonymous browser has. Using the
 * publishable key means RLS is the backstop: even a bug in the status filter
 * cannot read a row that RLS would not hand to a visitor. The service-role key
 * must never be bound to this Worker — it would turn a metadata injector into an
 * unauthenticated read of every table.
 *
 * COLUMNS ARE LISTED EXPLICITLY
 *
 * `select=*` would pull each post's full `content` HTML on every shell request —
 * tens of kilobytes to build a <title> from. The lists below are the exact
 * fields metadata.mjs reads, confirmed against BlogPostPage.tsx and
 * UrgentRequirementDetailPage.tsx.
 */

/** Exactly the columns metadata.mjs reads, per table. */
const COLUMNS = Object.freeze({
  blog_posts: [
    'slug',
    'status',
    'title',
    'meta_title',
    'meta_desc',
    'excerpt',
    'canonical_url',
    'featured_image',
    'image_alt',
    'published_at',
    'created_at',
    'updated_at',
  ],
  urgent_requirements: [
    'slug',
    'status',
    'title',
    'seo_title',
    'meta_description',
    'summary',
    'country',
    'city',
    'employer',
    'salary',
    'currency',
    'contract_type',
    'expires_at',
    'detail_image_url',
    'image_url',
    'created_at',
    'updated_at',
  ],
})

/**
 * Fetches the row for one slug.
 *
 * @returns {Promise<
 *   | { row: object }
 *   | { notFound: true }
 *   | { error: string }
 * >}
 *
 * The three outcomes are distinct because the Worker treats them differently:
 * a row is injected, a `notFound` is passed through so the React app renders its
 * own not-found state, and an `error` is passed through *unmodified* — a
 * Supabase outage must degrade to the current behaviour (client-rendered
 * metadata), never to a broken page or an error page.
 */
export async function fetchRow({ supabaseUrl, supabaseKey, table, slug, fetchImpl = fetch, signal }) {
  const columns = COLUMNS[table]
  if (!columns) return { error: `no column list for table ${table}` }
  if (!supabaseUrl || !supabaseKey) return { error: 'SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is unset' }

  const base = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl
  const query = new URLSearchParams()
  query.set('select', columns.join(','))
  query.set('slug', `eq.${slug}`)
  query.set('limit', '1')

  let response
  try {
    response = await fetchImpl(`${base}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
      signal,
    })
  } catch (err) {
    return { error: `${table}: ${err?.message ?? 'fetch failed'}` }
  }

  if (!response.ok) {
    let detail = String(response.status)
    try {
      const body = await response.json()
      if (body?.message) detail = `${response.status} ${body.message}`
    } catch {
      // non-JSON error body
    }
    return { error: `${table}: ${detail}` }
  }

  let rows
  try {
    rows = await response.json()
  } catch (err) {
    return { error: `${table}: response was not JSON (${err?.message})` }
  }

  if (!Array.isArray(rows) || rows.length === 0) return { notFound: true }
  return { row: rows[0] }
}
