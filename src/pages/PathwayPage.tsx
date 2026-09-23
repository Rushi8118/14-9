import { Suspense, lazy } from 'react'
import { useParams } from 'react-router-dom'
import { DestinationPage } from '@/components/seo/DestinationPage'
import { PATHWAYS_BY_SLUG } from '@/content/pathways'

// Lazy so a valid pathway page does not ship the 404 page's bundle.
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function PathwayPage() {
  const { slug = '' } = useParams()
  const content = PATHWAYS_BY_SLUG[slug]
  // A redirect here would answer 200 and read as a soft 404; render the noindex 404 instead.
  if (!content) {
    return (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    )
  }
  return <DestinationPage content={content} />
}
