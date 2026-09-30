import { Suspense, lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { DestinationPage } from '@/components/seo/DestinationPage'
import { BUSINESS_PAGES_BY_PATH } from '@/content/business'

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/** Renders the B2B content pages. Matched on pathname, as LocationPage is. */
export default function BusinessPage() {
  const { pathname } = useLocation()
  const content = BUSINESS_PAGES_BY_PATH[pathname.replace(/\/+$/, '') || pathname]

  if (!content) {
    return (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    )
  }
  return <DestinationPage content={content} />
}
