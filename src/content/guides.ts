import type { DestinationContent } from './destination-types'

/**
 * The date this guides collection first shipped, taken from the first commit that
 * added this file (`git log --diff-filter=A -- src/content/guides.ts`). It is the
 * fallback only. The previous value was `2026-08-25`, six days before the file
 * existed, and it was applied *after* the spread — so it overwrote any date a
 * guide set for itself and every guide claimed the same invented publication
 * date in its Article schema.
 *
 * Give a guide its own `datePublished` (and `dateModified`) when it is written or
 * substantially revised; do not backdate one.
 */
const GUIDES_FIRST_PUBLISHED = '2026-08-31'

function guide(
  input: Omit<DestinationContent, 'kind' | 'serviceType' | 'highlights' | 'processSteps'> & {
    highlights?: DestinationContent['highlights']
  },
): DestinationContent {
  return {
    highlights: input.highlights ?? [],
    processSteps: undefined,
    datePublished: GUIDES_FIRST_PUBLISHED,
    ...input,
    kind: 'guide',
    serviceType: 'Visa guidance',
  }
}

export const guidesIndexMeta = {
  title: 'Visa Guides for Indian Students & Professionals',
  description:
    'Practical visa guides from Siddhivinayak Overseas, Surat — Canada/UK/Australia requirements, Japan SSW, IELTS, rejection reasons and post-study work comparisons.',
}

export const guideArticles: DestinationContent[] = [
  guide({
    path: '/guides/canada-student-visa-requirements',
    eyebrow: 'Canada guide',
    h1: 'Canada Student Visa Requirements (India → Canada)',
    title: 'Canada Student Visa Requirements from India | 2026 Guide',
    description:
      'Canada student visa requirements for Indian applicants: admission, funds, SDS basics, biometrics, medicals and common mistakes — explained by Surat consultants.',
    keywords:
      'Canada student visa requirements, Canada study visa requirements India, SDS requirements, study permit checklist',
    heroDescription:
      'A practical checklist of what Indian students typically need for a Canada study permit, with notes on SDS vs regular streams.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'Canada student visa requirements' },
    ],
    sections: [
      {
        heading: 'Core requirements',
        body: [
          'Most Indian applicants need a Letter of Acceptance from a DLI, proof of funds, identity documents, English evidence (or institutional alternative), and may need biometrics and a medical exam. SDS applicants must meet additional stream-specific conditions.',
        ],
        bullets: [
          'Valid passport',
          'Letter of Acceptance / offer',
          'Proof of funds / GIC / tuition receipts as applicable',
          'Academic documents and SOP/study plan',
          'Biometrics and medicals when requested',
        ],
      },
      {
        heading: 'SDS vs non-SDS (high level)',
        body: [
          'SDS can be faster when you qualify, but the financial and language evidence rules are stricter. If you do not qualify, a well-prepared regular study-permit file is better than forcing SDS.',
        ],
      },
      {
        heading: 'How Siddhivinayak Overseas helps',
        body: [
          'From our Surat office we verify intake-specific checklists, review SOPs, and pack financial evidence so the story stays consistent across forms and supporting documents.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is IELTS mandatory for Canada study visa?',
        answer:
          'Institutions and visa streams often expect English proof. Some admits allow waivers or alternative tests. Your offer letter and stream rules decide the minimum.',
      },
    ],
    related: [
      { label: 'Canada study visa documents', to: '/guides/canada-study-visa-documents' },
      { label: 'Study in Canada', to: '/study-in-canada' },
      { label: 'Book counselling', to: '/contact' },
    ],
  }),
  guide({
    path: '/guides/canada-study-visa-documents',
    eyebrow: 'Canada guide',
    h1: 'Canada Study Visa Documents Checklist',
    title: 'Canada Study Visa Documents Checklist for Indian Students',
    description:
      'Document checklist for Canada study visa from India — academics, finances, GIC, SOP, medicals and sponsor proofs.',
    keywords: 'Canada study visa documents, Canada student visa checklist, GIC documents Canada',
    heroDescription: 'Use this as a working checklist, then customise it for SDS or non-SDS with a counsellor.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'Canada documents' },
    ],
    sections: [
      {
        heading: 'Document groups',
        body: [
          'Keep originals and clear scans. Names, dates and spellings must match your passport. Inconsistent sponsor stories are a frequent refusal trigger.',
        ],
        bullets: [
          'Identity: passport, photos, civil docs if asked',
          'Academics: marksheets, degree, backlog summary',
          'Language: IELTS/PTE/TOEFL scorecard',
          'Finance: bank statements, loan letters, GIC, tuition receipt',
          'Study purpose: SOP, resume, work experience letters',
        ],
      },
    ],
    documents: [
      'Passport bio page',
      'Letter of Acceptance',
      'Tuition payment / GIC evidence',
      'Bank statements and sponsor affidavit',
      'Academic transcripts',
      'English test result',
      'SOP / study plan',
    ],
    faqs: [
      {
        question: 'How many months of bank statements do I need?',
        answer:
          'It depends on stream and source of funds. We recommend preparing a clean 4–6 month history and explaining large deposits.',
      },
    ],
    related: [
      { label: 'Canada requirements', to: '/guides/canada-student-visa-requirements' },
      { label: 'Study in Canada', to: '/study-in-canada' },
    ],
  }),
  guide({
    path: '/guides/uk-student-visa-requirements',
    eyebrow: 'UK guide',
    h1: 'UK Student Visa Requirements for Indian Students',
    title: 'UK Student Visa Requirements from India | CAS, Funds & TB',
    description:
      'UK Student Route requirements for Indian applicants: CAS, maintenance funds, English, TB test and credibility interview basics.',
    keywords: 'UK student visa requirements, UK study visa India, CAS requirements, UKVI student route',
    heroDescription: 'What you typically need after receiving a UK offer and before booking your visa appointment.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'UK student visa requirements' },
    ],
    sections: [
      {
        heading: 'Key UKVI building blocks',
        body: [
          'A CAS from a licensed sponsor, maintenance funds for the required period, English language evidence, and a TB test (for India) are central. Credibility interviews test whether your course choice and funding make sense.',
        ],
      },
    ],
    eligibility: [
      'CAS issued by a licensed sponsor',
      'Funds meeting current maintenance levels',
      'English requirement satisfied',
      'TB certificate where required',
    ],
    faqs: [
      {
        question: 'When should I pay the deposit?',
        answer:
          'Usually after you are confident about the university and can fund the deposit without weakening visa maintenance evidence. Ask us before moving large amounts.',
      },
    ],
    related: [
      { label: 'Study in UK', to: '/study-in-uk' },
      { label: 'Contact', to: '/contact' },
    ],
  }),
  guide({
    path: '/guides/australia-student-visa-requirements',
    eyebrow: 'Australia guide',
    h1: 'Australia Student Visa Requirements (Subclass 500)',
    title: 'Australia Student Visa Requirements from India | Subclass 500',
    description:
      'Australia Subclass 500 requirements for Indian students: CoE, OSHC, Genuine Student evidence, funds and English.',
    keywords: 'Australia student visa requirements, Subclass 500 requirements, Genuine Student Australia',
    heroDescription: 'A clear overview of Subclass 500 building blocks for Indian applicants counselling from Surat.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'Australia student visa requirements' },
    ],
    sections: [
      {
        heading: 'What Immigration looks for',
        body: [
          'Beyond CoE and OSHC, officers assess whether you genuinely intend to study. Course progression, funding and ties should be explained with evidence, not copy-paste statements.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is GTE still used?',
        answer:
          'Australia has moved emphasis toward Genuine Student (GS) settings. Always follow the current ImmiAccount document list for your application.',
      },
    ],
    related: [
      { label: 'Study in Australia', to: '/study-in-australia' },
      { label: 'Rejection reasons', to: '/guides/visa-rejection-reasons' },
    ],
  }),
  guide({
    path: '/guides/japan-ssw-visa-guide',
    eyebrow: 'Japan guide',
    h1: 'Japan SSW Visa Guide for Indian Candidates',
    title: 'Japan SSW Visa Guide from India | Specified Skilled Worker',
    description:
      'Japan Specified Skilled Worker (SSW) guide for Indians — sectors, language, skill tests, documents and realistic expectations.',
    keywords: 'Japan SSW visa guide, Specified Skilled Worker India, Japan work visa SSW',
    heroDescription: 'A no-hype overview of Japan SSW for workers exploring opportunities through Surat counsellors.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'Japan SSW guide' },
    ],
    sections: [
      {
        heading: 'What SSW is (and is not)',
        body: [
          'SSW is a skills-based work pathway for specified industries. It is not a tourist visa and not a guaranteed job offer. Candidates usually need language and skills-test results, plus an employing organisation in Japan.',
        ],
      },
      {
        heading: 'Preparation roadmap',
        body: [
          'Confirm sector fit → language plan → skill test → documents → interviews → contract/visa paperwork. Skip agents who demand large upfront fees without transparent milestones.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which sectors are under SSW?',
        answer:
          'Notified sectors have included caregiving, food service, manufacturing-related fields and others. The list can be updated — verify the sector before coaching investments.',
      },
    ],
    related: [
      { label: 'Japan work visa page', to: '/work-visa/japan' },
      { label: 'Work visa hub', to: '/work-visa' },
    ],
  }),
  guide({
    path: '/guides/visa-rejection-reasons',
    eyebrow: 'Risk guide',
    h1: 'Common Study & Work Visa Rejection Reasons',
    title: 'Common Visa Rejection Reasons for Indian Applicants',
    description:
      'Frequent study and work visa refusal reasons — weak funds, poor SOP, inconsistent documents, credibility issues — and how to reduce risk.',
    keywords: 'visa rejection reasons, study visa refused, why visa rejected India',
    heroDescription: 'Understand refusal patterns before you file. Prevention is cheaper than a re-application.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'Rejection reasons' },
    ],
    sections: [
      {
        heading: 'Top refusal themes',
        body: [
          'Unexplained deposits, weak academic progression, generic SOPs, mismatched work history, and unclear home ties appear across Canada, UK, Australia and US refusals. Work visas fail when job offers look non-genuine or salary/occupation rules are ignored.',
        ],
        bullets: [
          'Funds not traceable or recently parked',
          'Course does not match previous studies/work',
          'Inconsistent dates across forms and certificates',
          'Interview answers contradict documents',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can a refused visa be fixed?',
        answer:
          'Sometimes, by addressing the exact refusal grounds with stronger evidence. Re-filing the same weak file usually fails again.',
      },
    ],
    related: [
      { label: 'Free consultation', to: '/contact' },
      { label: 'Study visa hub', to: '/study-visa' },
    ],
  }),
  guide({
    path: '/guides/ielts-requirements-for-study-abroad',
    eyebrow: 'Language guide',
    h1: 'IELTS Requirements for Study Abroad',
    title: 'IELTS Requirements for Study Abroad from India',
    description:
      'Typical IELTS score expectations for Canada, UK, Australia and USA admissions, plus when PTE/TOEFL can work instead.',
    keywords: 'IELTS requirements study abroad, IELTS for Canada UK Australia, PTE vs IELTS',
    heroDescription: 'Score targets vary by institution and visa stream. Use this as orientation, then confirm for your course.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'IELTS requirements' },
    ],
    sections: [
      {
        heading: 'How to think about language scores',
        body: [
          'Universities set admission minimums; some visa streams also expect specific evidence. A 6.0 overall may work for some diplomas, while competitive master’s programs often want higher bands with no weak module.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is PTE accepted?',
        answer:
          'Widely, yes — but your university and visa stream must accept it. Never assume interchangeability without checking.',
      },
    ],
    related: [
      { label: 'Study visa consultants', to: '/study-visa' },
      { label: 'Canada study', to: '/study-in-canada' },
    ],
  }),
  guide({
    path: '/guides/post-study-work-visa-comparison',
    eyebrow: 'Comparison guide',
    h1: 'Post-Study Work Visa Comparison (Canada, UK, Australia, USA)',
    title: 'Post-Study Work Visa Comparison for Indian Students',
    description:
      'Compare post-study work options after studying in Canada, UK, Australia and the USA — high-level differences for planning.',
    keywords:
      'post study work visa comparison, PGWP vs Graduate Route, post study work Australia USA',
    heroDescription: 'A planning overview — not legal advice. Policies change; confirm before you enrol.',
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'Post-study comparison' },
    ],
    sections: [
      {
        heading: 'Quick comparison lens',
        body: [
          'Canada’s PGWP, the UK Graduate Route, Australia’s Temporary Graduate settings, and US OPT/CPT rules each have different eligibility, duration and employer requirements. Choose a study destination for education quality first, then validate post-study options for your intake year.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which country is best for PR after study?',
        answer:
          'There is no universal answer. Canada is often discussed for PR pathways, but your age, language, occupation and budget matter more than forum opinions.',
      },
    ],
    related: [
      { label: 'Post-study work page', to: '/post-study-work-visa' },
      { label: 'Study destinations', to: '/study-visa' },
    ],
  }),
]

export const GUIDES_BY_PATH = Object.fromEntries(guideArticles.map((g) => [g.path, g])) as Record<
  string,
  DestinationContent
>
