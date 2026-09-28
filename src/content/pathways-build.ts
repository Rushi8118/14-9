import type { DestinationContent, ContentSection } from './destination-types'

/**
 * Shared builder for pathway pages.
 *
 * This lives apart from pathways.ts because the page lists import it: keeping
 * it here avoids a circular import in which `build` is hoisted but the
 * constants it closes over (HOW_WE_HELP, FRAUD_WARNING, RELATED_BASE) are
 * still in the temporal dead zone when a child module calls it.
 */

export type PathwayInput = {
  slug: string
  destination: string
  eyebrow: string
  h1: string
  title: string
  description: string
  keywords: string
  heroDescription: string
  highlights: DestinationContent['highlights']
  sections: ContentSection[]
  eligibility: string[]
  documents: string[]
  faqs: DestinationContent['faqs']
}

/** How we help — identical promise on every route, so it can't drift into guarantees. */
const HOW_WE_HELP: ContentSection = {
  heading: 'How Siddhivinayak Overseas helps',
  body: [
    'We check your profile against the route, explain what the official rules require, and help you prepare a complete, accurate application. We also introduce suitable candidates to employers registered in the destination country that are recruiting for genuine roles.',
    'The employer interviews you and decides whether to hire you, and the government decides your visa. Where the destination country requires immigration advice to come from a registered or authorised professional, that advice is given by our partner lawyers.',
  ],
  bullets: [
    'Eligibility check against current official rules',
    'Introductions to registered employers with genuine vacancies — you are never charged for a job offer',
    'CV, document checklist and application preparation',
    'Interview preparation for employer and visa stages',
    'Written, itemised fees before you pay anything',
  ],
}

const FRAUD_WARNING: ContentSection = {
  heading: 'Protect yourself from visa and job fraud',
  body: [
    'A job offer or offer letter does not extend your visa by itself. You still need a genuine employer, a real role and a successful application through the official government process.',
  ],
  bullets: [
    'Never pay anyone to "buy" a job offer, sponsorship certificate or visa',
    'Check the employer on the official register or company registry of that country',
    'Be wary of offers with no interview, no contract, or pressure to pay quickly',
    'Never submit false, altered or backdated documents — refusals and bans can follow',
  ],
}

const RELATED_BASE = [
  { label: 'All pathway guides', to: '/pathways', description: 'Study-to-work, country moves and home-country routes.' },
  { label: 'Book an eligibility consultation', to: '/contact', description: 'Online or at our Surat office.' },
  { label: 'Immigration disclaimer', to: '/immigration-disclaimer' },
]

export function build(p: PathwayInput): DestinationContent {
  return {
    path: `/pathways/${p.slug}`,
    kind: 'work',
    country: p.destination,
    serviceType: 'Immigration guidance and application support',
    eyebrow: p.eyebrow,
    h1: p.h1,
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    heroDescription: p.heroDescription,
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Pathways', to: '/pathways' },
      { label: p.h1 },
    ],
    highlights: p.highlights,
    sections: [...p.sections, FRAUD_WARNING, HOW_WE_HELP],
    eligibility: p.eligibility,
    documents: p.documents,
    processSteps: [
      { title: 'Eligibility check', desc: 'We review your current visa, qualifications, experience and English.' },
      { title: 'Plan', desc: 'Suitable routes, official requirements, realistic timelines and costs.' },
      { title: 'Employer stage', desc: 'Applications and interviews with registered employers, where the route needs one.' },
      { title: 'Application', desc: 'Complete documents, submitted through the official process.' },
    ],
    faqs: p.faqs,
    related: RELATED_BASE,
    datePublished: '2026-09-17',
  }
}
