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
    'Practical visa guides from Surat: Canada, UK and Australia requirements, Japan SSW, IELTS and post-study work comparisons.',
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
    title: 'Australia Student Visa Requirements (Subclass 500)',
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
      'Compare post-study work routes in Canada, the UK, Australia and the USA: how long each lasts, what it depends on, and where to verify before you enrol.',
    keywords:
      'post study work visa comparison, PGWP vs Graduate Route, post study work Australia USA',
    heroDescription:
      'How the main post-study work routes differ, with the official source for each. Immigration rules change; every figure below links to the government page that states it.',
    datePublished: '2026-08-31',
    dateModified: '2026-09-29',
    attribution: {
      lastReviewed: '2026-09-29',
      sources: [
        { label: 'GOV.UK / Graduate visa', url: 'https://www.gov.uk/graduate-visa' },
        { label: 'IRCC / About the post-graduation work permit', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/about.html' },
        { label: 'IRCC / PGWP field of study requirement', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility/field-of-study.html' },
        { label: 'Australian Department of Home Affairs / Temporary Graduate visa (subclass 485)', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-graduate-485' },
        { label: 'USCIS / Optional Practical Training for F-1 students', url: 'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students' },
      ],
    },
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Guides', to: '/guides' },
      { label: 'Post-study comparison' },
    ],
    sections: [
      {
        heading: 'The four routes at a glance',
        body: [
          'Each destination handles post-study work differently. Two of them tie the length of your permission directly to what and where you studied, which means the decision that determines your post-study options is the one you make before you enrol, not after you graduate.',
          'The table below states only what the official source says, with the date it was checked. Where a figure could not be confirmed from the government page at the time of review, the cell says so rather than guessing.',
        ],
        table: {
          caption: 'Post-study work routes, checked against official sources on 29 September 2026.',
          columns: ['Route', 'How long', 'What it depends on', 'Official source'],
          rows: [
            [
              'Canada: Post-Graduation Work Permit (PGWP)',
              '8 months to 3 years',
              'The length of your program. A program of at least 2 years, or a master’ degree shorter than 2 years, can attract a 3-year permit. The program itself must have been at least 8 months (900 hours in Quebec).',
              'IRCC',
            ],
            [
              'UK: Graduate route',
              '2 years, falling to 18 months',
              'The reduction applies to applications made on or after 1 January 2027. Apply on or before 31 December 2026 and the 2-year length still applies. PhD graduates continue to get 3 years.',
              'GOV.UK',
            ],
            [
              'Australia: Temporary Graduate visa (subclass 485)',
              'Confirm on the official site',
              'Length and age limits vary by stream and qualification, and have changed more than once. The Department of Home Affairs page is the only reliable statement of the current settings.',
              'Home Affairs',
            ],
            [
              'USA: Optional Practical Training (OPT)',
              'Confirm on the official site',
              'OPT is authorised employment tied to F-1 status rather than a separate visa, and STEM fields are treated differently. Check current USCIS guidance for your field.',
              'USCIS',
            ],
          ],
        },
      },
      {
        heading: 'Canada: your program decides your permit',
        body: [
          'The PGWP is unusual in that its length is a function of your study program rather than a fixed term. IRCC states a permit may be valid from 8 months up to 3 years. A program of at least two years at a PGWP-eligible designated learning institution can attract a three-year permit, and so can a master’ degree shorter than two years. To qualify at all, the program must have been at least eight months long, or 900 hours in Quebec.',
          'There is also a field-of-study condition, and it does not apply to everyone. IRCC states there is no field-of-study requirement for graduates of bachelor’, master’ or doctoral degrees. Students in non-degree programs do face one: the program must be in an eligible field linked to long-term shortages, and that rule applies to students who applied for a study permit on or after 1 November 2024.',
          'The practical consequence is that the institution and program you choose can change your post-study permission by years. Confirm both the PGWP eligibility of the institution and the field-of-study position for your specific program before you accept an offer, using the government list rather than the institution’ own prospectus.',
        ],
      },
      {
        heading: 'UK: the January 2027 date matters if you are planning ahead',
        body: [
          'The Graduate route currently allows two years in the UK after you successfully complete your course. GOV.UK states this is being reduced to 18 months for applications made on or after 1 January 2027. If you apply on or before 31 December 2026, the two-year length still applies. PhD graduates are unaffected and continue to receive three years.',
          'If you are choosing an intake now, map that date against your expected completion date. A course finishing in late 2026 and one finishing in early 2027 can attract different lengths of post-study permission for otherwise identical study.',
        ],
      },
      {
        heading: 'What to check before you enrol',
        body: [
          'Post-study work rules change often, and they change more often than university marketing material is updated. These checks stay useful regardless of which way the rules move.',
        ],
        bullets: [
          'Confirm the institution and the specific program are eligible for the post-study route you are counting on, using the government list rather than the institution’ prospectus.',
          'Check the rule as it will stand on the date you will apply, not the date you enrol. Several routes have announced changes with future commencement dates.',
          'Check whether your qualification level changes the answer. Degree and non-degree programs, and doctoral versus taught degrees, are frequently treated differently.',
          'Treat post-study work permission as temporary permission to work, not as a pathway to residence. Whether it leads further depends on separate criteria such as occupation, salary and language.',
          'Verify anything you are told verbally against the official page, and keep a dated copy. A rule that changed after you were advised is still the rule that will be applied to you.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Which country is best for PR after study?',
        answer:
          'There is no universal answer, and anyone who gives you one without looking at your profile is guessing. Post-study work permission is not the same as a residence pathway. Your age, qualification, occupation, language scores and finances usually matter more than the destination itself.',
      },
      {
        question: 'Is the UK Graduate route being shortened?',
        answer:
          'Yes. GOV.UK states the Graduate route reduces from 2 years to 18 months for applications made on or after 1 January 2027. Applications made on or before 31 December 2026 keep the 2-year length, and PhD graduates continue to receive 3 years.',
      },
      {
        question: 'How long a PGWP will I get in Canada?',
        answer:
          'It depends on your program rather than on a fixed term. IRCC states a PGWP may be valid from 8 months up to 3 years, that graduates of programs of at least 2 years can be eligible for a 3-year permit, and that graduates of master’ programs shorter than 2 years can also be eligible for 3 years. The program must have been at least 8 months long, or 900 hours in Quebec.',
      },
      {
        question: 'Does my field of study affect my Canadian PGWP?',
        answer:
          'Only for some applicants. IRCC states there is no field-of-study requirement for graduates of bachelor’, master’ or doctoral degrees. Students in non-degree programs must have studied in an eligible field, and that condition applies to those who applied for a study permit on or after 1 November 2024.',
      },
      {
        question: 'Why does this page not give exact figures for Australia and the USA?',
        answer:
          'Because those figures could not be confirmed from the official government pages when this page was last reviewed, and publishing an unverified number about your immigration options is worse than publishing none. The official links are listed above so you can check the current position directly.',
      },
    ],
    related: [
      { label: 'Post-study work page', to: '/post-study-work-visa' },
      { label: 'Study destinations', to: '/study-visa' },
      { label: 'Canada PGWP to PR pathway', to: '/pathways/canada-pgwp-to-pr' },
      { label: 'UK Graduate visa to Skilled Worker', to: '/pathways/uk-graduate-visa-to-skilled-worker-visa' },
    ],
  }),
]

export const GUIDES_BY_PATH = Object.fromEntries(guideArticles.map((g) => [g.path, g])) as Record<
  string,
  DestinationContent
>

/**
 * Make sure every guide is reachable from another guide.
 *
 * Each guide hand-writes its own `related` array, which is better than the
 * pathways had -- but crawled from production on 2026-09-30, only three of the
 * eight guides were the target of any sibling link. The other five, including
 * /guides/ielts-requirements-for-study-abroad and
 * /guides/post-study-work-visa-comparison, had a single inbound internal link
 * from the /guides index and nothing else. Both were in the set Search Console
 * reported as "Discovered - currently not indexed".
 *
 * This appends siblings as a cycle -- guide i gets the next two, wrapping
 * around -- so every guide receives exactly two inbound links regardless of
 * what the hand-written arrays happen to cover. The editorial links stay first,
 * because a link someone chose is worth more than one a loop generated.
 */
const GUIDE_SIBLING_LINKS = 2

guideArticles.forEach((guide, i) => {
  const siblings = []
  for (let k = 1; k <= GUIDE_SIBLING_LINKS && k < guideArticles.length; k++) {
    const sibling = guideArticles[(i + k) % guideArticles.length]
    siblings.push({
      label: sibling.title,
      to: sibling.path,
      description: sibling.heroDescription,
    })
  }

  const seen = new Set<string>()
  guide.related = [...guide.related, ...siblings].filter((link) => {
    if (link.to === guide.path || seen.has(link.to)) return false
    seen.add(link.to)
    return true
  })
})
