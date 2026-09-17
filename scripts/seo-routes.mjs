/**
 * Single source of truth for public, indexable URLs.
 * Used by the sitemap generator and the prerender step so the two never drift apart.
 */
import { loadEnv } from 'vite'

export const SITE_URL = 'https://siddhivinayakoverseas.com'

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
  ...[
    'albania', 'armenia', 'austria', 'belarus', 'croatia', 'denmark', 'finland', 'france', 'germany', 'hungary',
    'ireland', 'italy', 'malta', 'moldova', 'netherlands', 'norway', 'poland', 'portugal', 'romania', 'slovakia',
    'spain', 'sweden', 'switzerland', 'uk', 'azerbaijan', 'israel', 'japan', 'kazakhstan', 'malaysia', 'maldives',
    'qatar', 'russia', 'saudi-arabia', 'singapore', 'australia', 'new-zealand', 'canada', 'usa', 'africa', 'gulf',
  ].map((slug) => `/work-visa/${slug}`),
  '/post-study-work-visa',
  '/guides',
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

/** @returns {Promise<Array<{ path: string, lastmod?: string }>>} */
export async function getPublicRoutes(root) {
  const env = loadEnv('production', root, '')
  const [countries, posts, requirements] = await Promise.all([
    fetchPublicSlugs(env, 'countries', 'is_active=eq.true', ['description']),
    fetchPublicSlugs(env, 'blog_posts', 'status=eq.published', ['canonical_url']),
    fetchPublicSlugs(env, 'urgent_requirements', 'status=eq.active'),
  ])
  const dynamic = [
    // Thin country profiles are noindexed by CountryPage, so they stay out of the sitemap too.
    ...countries
      .filter((row) => (row.description ?? '').trim().length >= 150)
      .map((row) => ({ path: `/countries/${row.slug}`, lastmod: isoDate(row.updated_at) })),
    // Posts that declare a canonical on another URL are not listed as their own page.
    ...posts
      .filter((row) => !row.canonical_url || (row.canonical_url.endsWith('/') ? row.canonical_url.slice(0, -1) : row.canonical_url) === `${SITE_URL}/blog/${row.slug}`)
      .map((row) => ({ path: `/blog/${row.slug}`, lastmod: isoDate(row.updated_at) })),
    ...requirements.map((row) => ({ path: `/urgent-requirements/${row.slug}`, lastmod: isoDate(row.updated_at) })),
  ]
  const seen = new Set()
  return [...STATIC_ROUTES.map((path) => ({ path })), ...dynamic].filter(({ path }) => {
    if (seen.has(path)) return false
    seen.add(path)
    return true
  })
}
