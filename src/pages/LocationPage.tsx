import { Suspense, lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { DestinationPage } from '@/components/seo/DestinationPage'
import { LOCATION_PAGES_BY_PATH } from '@/content/regional-pages'

// Lazy so a valid location page does not ship the 404 page's bundle.
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/**
 * Renders the state and Gujarat-city pages from regional-pages.ts.
 *
 * Matched on the full pathname rather than a slug param because the URLs are
 * /visa-consultants-in-<place>, which keeps them consistent with the existing
 * hand-written /visa-consultants-in-surat page and matches how people search
 * ("visa consultants in rajkot") rather than how the data happens to nest.
 *
 * /visa-consultants-in-surat is declared as its own static route before this
 * one, so React Router's static-over-dynamic ranking keeps that page on its
 * bespoke component; nothing here shadows it.
 */
export default function LocationPage() {
  const { pathname } = useLocation()
  const content = LOCATION_PAGES_BY_PATH[pathname.replace(/\/+$/, '') || pathname]

  // A redirect would answer 200 and read as a soft 404; render the noindex 404.
  if (!content) {
    return (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    )
  }

  return <DestinationPage content={content} />
}
