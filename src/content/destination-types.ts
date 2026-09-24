import type { FaqItem } from '@/lib/seo/schema'
import type { RelatedLink } from '@/components/seo/RelatedLinks'

export type ContentSection = {
  heading: string
  body: string[]
  bullets?: string[]
}

export type DestinationContent = {
  path: string
  kind: 'study' | 'work' | 'local' | 'guide' | 'hub'
  country?: string
  eyebrow: string
  h1: string
  title: string
  description: string
  keywords: string
  heroDescription: string
  processingTime?: string
  breadcrumbs: Array<{ label: string; to?: string }>
  highlights: Array<{ title: string; desc: string }>
  sections: ContentSection[]
  processSteps?: Array<{ title: string; desc: string }>
  documents?: string[]
  eligibility?: string[]
  faqs: FaqItem[]
  related: RelatedLink[]
  serviceType: string
  datePublished?: string
  /**
   * Keep the page live and crawlable but out of the index, for pages that do
   * not yet have enough verified, country-specific content to deserve a
   * ranking. Set from `contentTier === 'thin'` in work-countries.ts; also
   * keeps the page out of sitemap.xml (see scripts/seo-routes.mjs).
   */
  noindex?: boolean
}
