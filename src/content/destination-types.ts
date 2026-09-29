import type { FaqItem } from '@/lib/seo/schema'
import type { RelatedLink } from '@/components/seo/RelatedLinks'

export type ContentSection = {
  heading: string
  body: string[]
  bullets?: string[]
  /**
   * An optional comparison table. Sections could previously only be prose and
   * bullets, which is why the site has no tables at all — and comparison
   * questions ("Canada vs Australia post-study work") are exactly the shape that
   * gets quoted in AI answers and featured snippets.
   *
   * `rows` must all have the same length as `columns`. Only add one where the
   * figures are verified; an empty table is better than a guessed one.
   */
  table?: {
    caption?: string
    columns: string[]
    rows: string[][]
  }
}

/**
 * Attribution for a page, rendered only when real values exist. Nothing here is
 * ever defaulted or inferred: an invented author or review date is worse for
 * E-E-A-T than none, and on immigration content it is a factual claim about who
 * checked the advice.
 */
export type PageAttribution = {
  /** Full name of the person who reviewed the page, or an accurate team label. */
  reviewedBy?: string
  /** That person's role, e.g. "Senior Visa Counsellor". Omit if unknown. */
  reviewerRole?: string
  /** ISO date (YYYY-MM-DD) the page was last checked against current rules. */
  lastReviewed?: string
  /** Official sources the page's factual claims rest on. */
  sources?: Array<{ label: string; url: string }>
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
  /** ISO date of the last substantive edit. Feeds Article `dateModified`. */
  dateModified?: string
  /** Page-specific social/preview image. Falls back to the site default. */
  image?: string
  /** Author/reviewer attribution. See PageAttribution — never defaulted. */
  attribution?: PageAttribution
  /**
   * Keep the page live and crawlable but out of the index, for pages that do
   * not yet have enough verified, country-specific content to deserve a
   * ranking. Set from `contentTier === 'thin'` in work-countries.ts; also
   * keeps the page out of sitemap.xml (see scripts/seo-routes.mjs).
   */
  noindex?: boolean
}
