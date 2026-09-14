import { Navigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { DestinationPage } from '@/components/seo/DestinationPage'
import { buildWorkCountryContent } from '@/content/work-countries'
import {
  workAustralia,
  workCanada,
  workGermany,
  workJapan,
  workUK,
} from '@/content/work-destinations'
import { useAdminCountries } from '@/hooks/useAdminCountries'

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

  if (!liveContent) {
    return <Navigate to="/work-visa" replace />
  }

  return <DestinationPage content={liveContent} />
}
