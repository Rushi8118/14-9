import { Navigate, useParams } from 'react-router-dom'
import { DestinationPage } from '@/components/seo/DestinationPage'
import { PATHWAYS_BY_SLUG } from '@/content/pathways'

export default function PathwayPage() {
  const { slug = '' } = useParams()
  const content = PATHWAYS_BY_SLUG[slug]
  if (!content) return <Navigate to="/pathways" replace />
  return <DestinationPage content={content} />
}
