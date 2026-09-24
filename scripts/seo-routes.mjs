/**
 * Single source of truth for public URLs.
 *
 * Both the sitemap generator and the prerender step read this, but they use it
 * differently, and the difference matters:
 *
 *   prerender  – renders EVERY route, so every page stays live. Apache 404s
 *                anything that was not prerendered (public/.htaccess rule 6),
 *                so dropping a route here takes the page off the site.
 *   sitemap    – lists only routes without `noindex`. A page can be live and
 *                useful to visitors while being too thin to submit to Google.
 *
 * So "stop indexing this page" means marking it `noindex`, never removing it.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'

const execFileAsync = promisify(execFile)

export const SITE_URL = 'https://siddhivinayakoverseas.com'

/**
 * Work-visa countries and their content tier, read from the content file so
 * this list cannot drift from the one the site renders. (The same
 * read-the-TS-file approach is used by scripts/build-keyword-map.mjs.)
 */
function workCountries(root) {
  const source = readFileSync(resolve(root, 'src/content/work-countries.ts'), 'utf8')
  const found = [...source.matchAll(/\{ slug: "([a-z-]+)".*?contentTier: "(urgent|regular|thin)"/g)]
    .map(([, slug, tier]) => ({ slug, tier }))
  if (found.length < 40) {
    throw new Error(
      `[seo-routes] Parsed only ${found.length} work countries from work-countries.ts. ` +
      'Check the WORK_COUNTRIES formatting — a silent miss here would drop pages from the site.',
    )
  }
  return found
}

export const STATIC_ROUTES = [
  '/',
  '/visa-consultants-in-surat',
  '/study-visa',
  '/work-visa',
  '/countries',
  '/services',
  '/about',
  '/contact',
  '/study-in-uk',
  '/study-in-france',
  '/study-in-germany',
  '/study-in-spain',
  '/study-in-dubai',
  '/study-in-singapore',
  '/study-in-canada',
  '/study-in-australia',
  '/study-in-usa',
  '/study-in-ireland',
  '/study-in-new-zealand',
  // /work-visa/{country} routes are added by getPublicRoutes() from
  // src/content/work-countries.ts, which also carries each country's tier.
  '/post-study-work-visa',
  '/guides',
  '/pathways',
  '/pathways/uk-student-visa-to-skilled-worker-visa',
  '/pathways/uk-graduate-visa-to-skilled-worker-visa',
  '/pathways/canada-pgwp-to-pr',
  '/pathways/australia-485-to-employer-sponsored-visa',
  '/pathways/new-zealand-accredited-employer-work-visa',
  '/pathways/move-from-uk-to-australia',
  '/pathways/move-from-uk-to-canada',
  '/pathways/move-from-uk-to-new-zealand',
  '/pathways/move-from-uk-to-europe',
  '/pathways/india-to-uk-work-visa',
  '/pathways/pakistan-to-uk-work-visa',
  '/pathways/pakistan-to-europe-work-visa',
  '/pathways/bangladesh-to-uk-work-visa',
  '/pathways/sri-lanka-to-canada-work-visa',
  '/guides/canada-student-visa-requirements',
  '/guides/canada-study-visa-documents',
  '/guides/uk-student-visa-requirements',
  '/guides/australia-student-visa-requirements',
  '/guides/japan-ssw-visa-guide',
  '/guides/visa-rejection-reasons',
  '/guides/ielts-requirements-for-study-abroad',
  '/guides/post-study-work-visa-comparison',
  '/success-stories',
  '/reviews',
  '/blog',
  '/urgent-requirements',
  '/privacy',
  '/immigration-disclaimer',
  '/terms',
]

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Content file whose last commit date represents each static route. Routes that share a
 * file share a date, which is accurate: editing the file is what changes those pages.
 */
function sourceFileForRoute(route) {
  if (route.startsWith('/work-visa/')) return 'src/content/work-countries.ts'
  if (route.startsWith('/study-in-')) return 'src/content/study-destinations.ts'
  if (route.startsWith('/pathways')) return 'src/content/pathways.ts'
  if (route.startsWith('/guides')) return 'src/content/guides.ts'
  if (route === '/visa-consultants-in-surat') return 'src/content/local-surat.ts'
  return null
}

/** Last commit date for a path, as YYYY-MM-DD. Returns undefined outside a git checkout. */
async function gitLastModified(root, file) {
  try {
    const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cI', '--', file], { cwd: root })
    const value = stdout.trim()
    return value ? value.slice(0, 10) : undefined
  } catch {
    return undefined
  }
}

/** Resolves lastmod for every static route, reading each backing file's history once. */
async function staticRouteDates(root, routes) {
  const files = [...new Set(routes.map(sourceFileForRoute).filter(Boolean))]
  const dates = new Map()
  await Promise.all(
    files.map(async (file) => {
      const date = await gitLastModified(root, file)
      if (date) dates.set(file, date)
    }),
  )
  return (route) => dates.get(sourceFileForRoute(route))
}

/** Reads public rows through the Supabase REST API with the publishable key (RLS applies). */
async function fetchPublicSlugs(env, table, filter, extraFields = []) {
  const baseUrl = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
  if (!baseUrl || !key) {
    console.warn(`[seo-routes] Supabase env missing; skipping ${table}`)
    return []
  }
  const extra = extraFields.length ? `,${extraFields.join(',')}` : ''
  for (const select of [`slug,updated_at${extra}`, `slug${extra}`]) {
    try {
      const response = await fetch(`${baseUrl}/rest/v1/${table}?select=${select}&${filter}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      if (!response.ok) continue
      const rows = await response.json()
      return rows.filter((row) => typeof row.slug === 'string' && SLUG_PATTERN.test(row.slug))
    } catch {
      // try the next select shape, then give up
    }
  }
  console.warn(`[seo-routes] Could not load ${table}; its pages are left out of this build`)
  return []
}

function isoDate(value) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10)
}

/** Country name on an urgent requirement row → its /work-visa slug. */
const WORK_SLUG_ALIAS = {
  'united-kingdom': 'uk',
  'united-states': 'usa',
  usa: 'usa',
  uae: 'gulf',
  'united-arab-emirates': 'gulf',
  dubai: 'gulf',
  qatar: 'qatar',
}
const toWorkSlug = (name) => {
  const slug = String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return WORK_SLUG_ALIAS[slug] ?? slug
}

/**
 * @returns {Promise<Array<{ path: string, lastmod?: string, noindex?: boolean }>>}
 * Every public page. `noindex: true` means "render it, but keep it out of
 * sitemap.xml" — the page is live, it just is not ready to be submitted.
 */
export async function getPublicRoutes(root) {
  const env = loadEnv('production', root, '')
  const [posts, requirements] = await Promise.all([
    fetchPublicSlugs(env, 'blog_posts', 'status=eq.published', ['canonical_url']),
    fetchPublicSlugs(env, 'urgent_requirements', 'status=eq.active', ['country']),
  ])

  // A thin country page is still worth indexing when it carries live vacancies,
  // because those listings are real content unique to that country.
  // WorkVisaCountryPage applies the same rule when it sets the robots tag.
  const hiring = new Set(requirements.map((row) => toWorkSlug(row.country)))
  const workRoutes = workCountries(root).map(({ slug, tier }) => ({
    path: `/work-visa/${slug}`,
    noindex: tier === 'thin' && !hiring.has(slug),
  }))

  const dynamic = [
    // /countries/{slug} was retired: those pages duplicated /study-in-* and
    // /work-visa/* and shipped unpopulated Supabase empty states as content.
    // public/.htaccess 301s them to the stronger page. The /countries hub stays.
    // Posts that declare a canonical on another URL are not listed as their own page.
    ...posts
      .filter((row) => !row.canonical_url || (row.canonical_url.endsWith('/') ? row.canonical_url.slice(0, -1) : row.canonical_url) === `${SITE_URL}/blog/${row.slug}`)
      .map((row) => ({ path: `/blog/${row.slug}`, lastmod: isoDate(row.updated_at) })),
    ...requirements.map((row) => ({ path: `/urgent-requirements/${row.slug}`, lastmod: isoDate(row.updated_at) })),
  ]

  const staticPaths = [...STATIC_ROUTES, ...workRoutes.map((r) => r.path)]
  const lastmodFor = await staticRouteDates(root, staticPaths)
  const seen = new Set()
  return [
    ...STATIC_ROUTES.map((path) => ({ path, lastmod: lastmodFor(path) })),
    ...workRoutes.map((r) => ({ ...r, lastmod: lastmodFor(r.path) })),
    ...dynamic,
  ].filter(({ path }) => {
    if (seen.has(path)) return false
    seen.add(path)
    return true
  })
}
