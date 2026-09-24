import { getAllWorkVisaPaths } from '@/content/work-countries'

/** Public routes that should be indexed, sitemapped, and prerendered. */

const CORE_ROUTES: Array<{
  path: string
  changefreq: 'weekly' | 'monthly' | 'yearly'
  priority: number
}> = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/visa-consultants-in-surat', changefreq: 'weekly', priority: 0.95 },
  { path: '/study-visa', changefreq: 'weekly', priority: 0.95 },
  { path: '/work-visa', changefreq: 'weekly', priority: 0.95 },
  { path: '/countries', changefreq: 'weekly', priority: 0.9 },
  { path: '/study-in-uk', changefreq: 'weekly', priority: 0.9 },
  { path: '/study-in-france', changefreq: 'weekly', priority: 0.9 },
  { path: '/study-in-germany', changefreq: 'weekly', priority: 0.9 },
  { path: '/study-in-spain', changefreq: 'weekly', priority: 0.9 },
  { path: '/study-in-dubai', changefreq: 'weekly', priority: 0.9 },
  { path: '/study-in-singapore', changefreq: 'weekly', priority: 0.9 },
  { path: '/study-in-canada', changefreq: 'weekly', priority: 0.85 },
  { path: '/study-in-australia', changefreq: 'weekly', priority: 0.85 },
  { path: '/study-in-usa', changefreq: 'weekly', priority: 0.85 },
  { path: '/study-in-ireland', changefreq: 'weekly', priority: 0.8 },
  { path: '/study-in-new-zealand', changefreq: 'weekly', priority: 0.8 },
  { path: '/post-study-work-visa', changefreq: 'weekly', priority: 0.85 },
  { path: '/guides', changefreq: 'weekly', priority: 0.85 },
  { path: '/guides/canada-student-visa-requirements', changefreq: 'monthly', priority: 0.8 },
  { path: '/guides/canada-study-visa-documents', changefreq: 'monthly', priority: 0.8 },
  { path: '/guides/uk-student-visa-requirements', changefreq: 'monthly', priority: 0.8 },
  { path: '/guides/australia-student-visa-requirements', changefreq: 'monthly', priority: 0.8 },
  { path: '/guides/japan-ssw-visa-guide', changefreq: 'monthly', priority: 0.8 },
  { path: '/guides/visa-rejection-reasons', changefreq: 'monthly', priority: 0.8 },
  { path: '/guides/ielts-requirements-for-study-abroad', changefreq: 'monthly', priority: 0.8 },
  { path: '/guides/post-study-work-visa-comparison', changefreq: 'monthly', priority: 0.8 },
  { path: '/success-stories', changefreq: 'monthly', priority: 0.75 },
  { path: '/services', changefreq: 'monthly', priority: 0.75 },
  { path: '/about', changefreq: 'monthly', priority: 0.7 },
  { path: '/reviews', changefreq: 'monthly', priority: 0.7 },
  { path: '/contact', changefreq: 'monthly', priority: 0.8 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.2 },
  { path: '/terms', changefreq: 'yearly', priority: 0.2 },
]

/**
 * Not imported by the app — sitemap.xml is built by scripts/seo-routes.mjs.
 * Keep it anyway: scripts/build-keyword-map.mjs regex-scans this file for
 * `path: '...'` to learn which pages exist before mapping keywords onto them.
 */
export const PUBLIC_SEO_ROUTES = [
  ...CORE_ROUTES,
  ...getAllWorkVisaPaths().map((path) => ({
    path,
    changefreq: 'weekly' as const,
    priority: 0.82,
  })),
]

export const STUDY_NAV = [
  { label: 'UK', to: '/study-in-uk' },
  { label: 'France', to: '/study-in-france' },
  { label: 'Germany', to: '/study-in-germany' },
  { label: 'Spain', to: '/study-in-spain' },
  { label: 'Dubai', to: '/study-in-dubai' },
  { label: 'Singapore', to: '/study-in-singapore' },
]

export const WORK_NAV = [
  { label: 'Japan', to: '/work-visa/japan' },
  { label: 'Germany', to: '/work-visa/germany' },
  { label: 'UK', to: '/work-visa/uk' },
  { label: 'Canada', to: '/work-visa/canada' },
  { label: 'Australia', to: '/work-visa/australia' },
  { label: 'Singapore', to: '/work-visa/singapore' },
  { label: 'All countries', to: '/work-visa' },
]
