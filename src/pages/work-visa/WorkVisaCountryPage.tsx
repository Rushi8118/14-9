import { useParams } from 'react-router-dom'
import { Suspense, lazy, useMemo } from 'react'
import { DestinationPage } from '@/components/seo/DestinationPage'
import { buildWorkCountryContent } from '@/content/work-countries'
import { isFallbackRequirement, usePublicUrgentRequirements } from '@/hooks/useUrgentRequirements'
import {
  workAustralia,
  workCanada,
  workGermany,
  workJapan,
  workUK,
} from '@/content/work-destinations'
import { useAdminCountries } from '@/hooks/useAdminCountries'

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const DETAILED = {
  japan: workJapan,
  germany: workGermany,
  canada: workCanada,
  uk: workUK,
  australia: workAustralia,
} as const

export default function WorkVisaCountryPage() {
  const { slug = '' } = useParams()
  const { countries } = useAdminCountries()
  const { requirements } = usePublicUrgentRequirements()
  const normalized = slug === 'united-kingdom' ? 'uk' : slug
  const detailed = DETAILED[normalized as keyof typeof DETAILED]
  const baseContent = detailed ?? buildWorkCountryContent(normalized)
  const baseCountry = baseContent?.country

  const liveContent = useMemo(() => {
    if (!baseContent) return null
    
    // Find matching country edited from Admin Panel
    const matchedAdmin = countries.find(
      (c) =>
        c.slug === slug ||
        c.slug === normalized ||
        c.name.toLowerCase() === baseCountry?.toLowerCase()
    )

    if (!matchedAdmin) return baseContent

    const workRules =
      matchedAdmin.work_eligibility_criteria?.length > 0
        ? matchedAdmin.work_eligibility_criteria
        : matchedAdmin.eligibility_criteria

    return {
      ...baseContent,
      heroDescription: matchedAdmin.why_work || matchedAdmin.description || baseContent.heroDescription,
      processingTime: matchedAdmin.avg_processing_days
        ? `Approximately ${matchedAdmin.avg_processing_days} days`
        : baseContent.processingTime,
      eligibility: workRules && workRules.length > 0 ? [...workRules] : baseContent.eligibility,
    }
  }, [baseContent, countries, slug, normalized])

  // A boilerplate page earns its place in the index once it carries live
  // vacancies, because those listings are real content unique to this country.
  // scripts/seo-routes.mjs applies the same rule when building sitemap.xml.
  // Placeholder rows do not count: a page must not be indexed on the strength
  // of sample listings served because the database was unreachable.
  const hasOpenings = useMemo(() => {
    const target = baseCountry?.trim().toLowerCase()
    return (
      Boolean(target) &&
      requirements.some(
        (r) => !isFallbackRequirement(r) && r.country?.trim().toLowerCase() === target,
      )
    )
  }, [requirements, baseCountry])

  // An unknown slug must not redirect: a 200 that lands on /work-visa reads as a
  // soft 404. Render the noindex 404 instead, as PathwayPage does.
  if (!liveContent) {
    return (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    )
  }

  return (
    <DestinationPage
      content={{ ...liveContent, noindex: liveContent.noindex && !hasOpenings }}
    />
  )
}
