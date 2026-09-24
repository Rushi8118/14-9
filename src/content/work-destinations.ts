import type { DestinationContent } from './destination-types'

const shared = (path: string) =>
  [
    { label: 'Work Visa Consultants in Surat', to: '/work-visa', description: 'All work pathways we support.' },
    { label: 'Visa Consultants in Surat', to: '/visa-consultants-in-surat', description: 'Visit our Pragti IT Park office.' },
    { label: 'Japan SSW guide', to: '/guides/japan-ssw-visa-guide', description: 'Specified Skilled Worker overview.' },
    { label: 'Free consultation', to: '/contact', description: 'Profile assessment with our counsellors.' },
  ].filter((l) => l.to !== path)

function workPage(
  input: Omit<DestinationContent, 'kind' | 'serviceType' | 'related'> & {
    relatedExtra?: DestinationContent['related']
  },
): DestinationContent {
  const allLinks = [...(input.relatedExtra ?? []), ...shared(input.path)]
  // Deduplicate by 'to' field, keeping first occurrence
  const uniqueLinks = Array.from(
    new Map(allLinks.map((link) => [link.to, link])).values()
  )
  return {
    ...input,
    kind: 'work',
    serviceType: 'Work visa consultancy',
    // `processingTime` is deliberately not set here. It used to be
    // `path.endsWith('/uk') ? '8 weeks' : '5-6 months'` — one unsourced figure
    // applied to every other country. Processing times are published per route
    // by each government and change often. Set it on an individual page only
    // once it has been checked against the official source, with the source in
    // a comment next to it.
    related: uniqueLinks,
  }
}

export const workJapan: DestinationContent = workPage({
  path: '/work-visa/japan',
  country: 'Japan',
  eyebrow: 'Japan work visa · Surat',
  h1: 'Japan Work Visa Consultants in Surat (SSW & Engineer)',
  title: 'Japan Work Visa Consultant in Surat | SSW Visa from India',
  description:
    'Japan SSW and Engineer work visa consultants in Surat. Language pathway guidance, employer coordination support and documentation counselling for Indian candidates.',
  keywords:
    'Japan work visa consultant in Surat, Japan SSW visa from India, Specified Skilled Worker Surat, Japan Engineer visa consultants',
  heroDescription:
    'Guidance for Japan Specified Skilled Worker (SSW) and professional Engineer pathways — eligibility checks, language planning and document readiness from Surat.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Work Visa', to: '/work-visa' },
    { label: 'Japan' },
  ],
  highlights: [
    { title: 'SSW sectors', desc: 'Caregiving, food, manufacturing and other notified fields.' },
    { title: 'Language roadmap', desc: 'JLPT / JFT planning based on role requirements.' },
    { title: 'Document discipline', desc: 'Clean bio-data, certificates and experience proofs.' },
    { title: 'Honest timelines', desc: 'No fake “guaranteed job” promises.' },
  ],
  sections: [
    {
      heading: 'Japan work pathways for Indian candidates',
      body: [
        'Japan’s Specified Skilled Worker program and professional Engineer/Specialist in Humanities roles are among the most searched work options from India. Requirements differ by sector, skill test, and Japanese language level.',
        'We help you understand whether you are a fit before you spend on coaching or deposits. Employer hiring is market-driven; we support documentation and counselling rather than selling unverifiable placements.',
      ],
    },
    {
      heading: 'What usually matters',
      body: [
        'Age profile, relevant experience, skill exams (where required), Japanese language, medical fitness, and clean documentation. Process steps and quotas can change — we verify current rules during counselling.',
      ],
    },
  ],
  eligibility: [
    'Relevant skills/experience for the target occupation',
    'Language score as required for the pathway (often JLPT/JFT for SSW)',
    'Skill test clearance where mandated for the sector',
    'Medical and character suitability',
    'Valid passport and complete experience proofs',
  ],
  documents: [
    'Passport and photographs',
    'Educational and experience certificates',
    'Language scorecards',
    'Skill test results (if applicable)',
    'Resume / bio-data in required format',
  ],
  processSteps: [
    { title: 'Eligibility screen', desc: 'Sector fit, language and experience check.' },
    { title: 'Prep plan', desc: 'Tests, coaching timeline and document gaps.' },
    { title: 'File readiness', desc: 'Certificates, translations and bio-data polish.' },
    { title: 'Employer stage', desc: 'Interview prep and paperwork coordination support.' },
  ],
  faqs: [
    {
      question: 'Do I need Japanese for SSW?',
      answer:
        'Most SSW sectors require a basic Japanese language credential, with caregiving often needing a higher level. Exact requirements depend on the occupation.',
    },
    {
      question: 'Can you guarantee a Japan job?',
      answer:
        'No ethical consultant can guarantee overseas employment. We provide counselling, preparation and documentation support. Hiring decisions rest with employers.',
    },
  ],
  relatedExtra: [{ label: 'Full Japan SSW guide', to: '/guides/japan-ssw-visa-guide' }],
})

export const workGermany: DestinationContent = workPage({
  path: '/work-visa/germany',
  country: 'Germany',
  eyebrow: 'Germany work visa · Surat',
  h1: 'Germany Work Visa Consultants in Surat',
  title: 'Germany Work Visa Consultant in Surat | EU Blue Card & Opportunity Card',
  description:
    'Germany work visa consultants in Surat for EU Blue Card, skilled worker routes and Opportunity Card orientation for eligible Indian professionals.',
  keywords:
    'Germany work visa consultant in Surat, EU Blue Card India, Germany Opportunity Card Surat, German work permit consultants',
  heroDescription:
    'Profile assessment for German skilled work routes — qualification recognition basics, language planning and document counselling from Surat.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Work Visa', to: '/work-visa' },
    { label: 'Germany' },
  ],
  highlights: [
    { title: 'Blue Card orientation', desc: 'For qualified specialists meeting salary/contract thresholds.' },
    { title: 'Opportunity Card intro', desc: 'Points-based job-seeker style pathways where eligible.' },
    { title: 'Qualification checks', desc: 'Understand recognition needs early.' },
    { title: 'Language planning', desc: 'German A1–B1 roadmap based on route.' },
  ],
  sections: [
    {
      heading: 'Germany work options from India',
      body: [
        'Germany faces shortages in engineering, IT, healthcare and skilled trades. Routes include employer-sponsored skilled worker visas, EU Blue Card, and newer job-seeker style opportunities for eligible candidates. Rules and point thresholds change — counselling starts with your degree, experience and language.',
      ],
    },
  ],
  eligibility: [
    'Recognised or recognisable qualification for the target role',
    'Job offer / salary threshold for Blue Card or skilled worker routes (where applicable)',
    'German or English language as required',
    'Financial and health insurance readiness for the chosen pathway',
  ],
  documents: [
    'Passport, degree certificates, transcripts',
    'Experience letters',
    'Language certificates',
    'Employment contract / offer (if sponsored)',
    'CV in Europass or employer format',
  ],
  processSteps: [
    { title: 'Profile score', desc: 'Education, age, language and occupation fit.' },
    { title: 'Route select', desc: 'Blue Card vs skilled worker vs Opportunity Card.' },
    { title: 'Docs', desc: 'Recognition and attestation guidance.' },
    { title: 'Filing prep', desc: 'Embassy/consular checklist readiness.' },
  ],
  faqs: [
    {
      question: 'Is German language mandatory?',
      answer:
        'It depends on the occupation and visa type. Many healthcare and trade roles need German; some IT roles hire in English. We map language needs to your target route.',
    },
  ],
})

export const workCanada: DestinationContent = workPage({
  path: '/work-visa/canada',
  country: 'Canada',
  eyebrow: 'Canada work visa · Surat',
  h1: 'Canada Work Visa Consultants in Surat',
  title: 'Canada Work Visa Consultant in Surat | LMIA & Express Entry Guidance',
  description:
    'Canada work visa consultants in Surat for employer-driven work permits, LMIA orientation and Express Entry / PR pathway counselling.',
  keywords:
    'Canada work visa consultant in Surat, LMIA work permit India, Express Entry Surat, Canada PR consultants Surat',
  heroDescription:
    'Clear guidance on Canada work permits and PR-oriented pathways — profile evaluation, document readiness and realistic timeline counselling in Surat.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Work Visa', to: '/work-visa' },
    { label: 'Canada' },
  ],
  highlights: [
    { title: 'Work permit vs PR', desc: 'We separate temporary work options from permanent residence.' },
    { title: 'CRS reality check', desc: 'Express Entry scores explained without hype.' },
    { title: 'Job-offer caution', desc: 'Avoid risky LMIA job offers that look non-genuine.' },
    { title: 'Study+work planning', desc: 'Connect with Canada study pathways where relevant.' },
  ],
  sections: [
    {
      heading: 'Canada work pathways explained simply',
      body: [
        'Some candidates need an employer-supported work permit; others compete in Express Entry using age, language, education and experience. Mixing these paths incorrectly causes refusals and wasted money. We start with a blunt eligibility read.',
      ],
    },
  ],
  eligibility: [
    'Skilled work experience and education credentials',
    'Language scores (IELTS/CELPIP/TEF as applicable)',
    'Job offer / LMIA where required for the chosen work permit',
    'Proof of funds for PR streams that require it',
  ],
  documents: [
    'Passport and civil documents',
    'Education credentials / ECA where needed',
    'Experience letters with duties and hours',
    'Language test results',
    'Police and medicals when requested',
  ],
  processSteps: [
    { title: 'Evaluate', desc: 'NOC fit, CRS estimate and work-permit options.' },
    { title: 'Improve', desc: 'Language retakes, credential plans, gap fixes.' },
    { title: 'Prepare', desc: 'Document bundle and timeline.' },
    { title: 'Submit', desc: 'Support for the chosen application type.' },
  ],
  faqs: [
    {
      question: 'Can I get a Canada work visa without a job offer?',
      answer:
        'Some PR pathways do not need a job offer, but most temporary work permits do. Express Entry is points-based and competitive. We will tell you which category you actually fit.',
    },
  ],
  relatedExtra: [{ label: 'Study in Canada', to: '/study-in-canada' }],
})

export const workUK: DestinationContent = workPage({
  path: '/work-visa/uk',
  country: 'United Kingdom',
  eyebrow: 'UK work visa · Surat',
  h1: 'UK Work Visa Consultants in Surat',
  title: 'UK Work Visa Consultant in Surat | Skilled Worker Visa Guidance',
  description:
    'UK Skilled Worker and Health & Care visa consultants in Surat. COS-linked pathway counselling and document preparation for Indian professionals.',
  keywords:
    'UK work visa consultant in Surat, UK Skilled Worker visa India, Health and Care visa Surat, UK work permit consultants',
  heroDescription:
    'Skilled Worker orientation for candidates with a genuine UK job offer and sponsor licence pathway — documentation and interview-ready counselling from Surat.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Work Visa', to: '/work-visa' },
    { label: 'UK' },
  ],
  highlights: [
    { title: 'Sponsor-led routes', desc: 'Most work visas need a licensed UK sponsor.' },
    { title: 'SOC code checks', desc: 'Role must fit eligible occupations and salary rules.' },
    { title: 'English & TB', desc: 'Standard requirements explained upfront.' },
    { title: 'No fake CoS', desc: 'We do not deal in unverifiable certificates of sponsorship.' },
  ],
  sections: [
    {
      heading: 'UK Skilled Worker basics',
      body: [
        'A UK Skilled Worker visa generally requires a Certificate of Sponsorship from a licensed employer, an eligible occupation, salary thresholds, English language, and other UKVI requirements. We help you validate whether an offer looks structurally sound before you pay anyone.',
      ],
    },
  ],
  eligibility: [
    'Job offer from a Home Office licensed sponsor',
    'Eligible occupation and salary threshold met',
    'English language requirement',
    'Maintenance funds unless exempt',
  ],
  documents: [
    'Passport',
    'Certificate of Sponsorship details',
    'English evidence',
    'TB test if required',
    'Bank statements unless certificate maintains you',
  ],
  processSteps: [
    { title: 'Offer review', desc: 'Sponsor licence and role credibility check.' },
    { title: 'Docs', desc: 'Identity, English, TB and funds.' },
    { title: 'Application', desc: 'Online forms and biometrics.' },
    { title: 'Travel', desc: 'Grant conditions explained.' },
  ],
  faqs: [
    {
      question: 'Can I apply for a UK work visa without a job?',
      answer:
        'Standard Skilled Worker routes are employer-sponsored. Be cautious of agents selling “visa without job” narratives.',
    },
  ],
})

export const workAustralia: DestinationContent = workPage({
  path: '/work-visa/australia',
  country: 'Australia',
  eyebrow: 'Australia work visa · Surat',
  h1: 'Australia Work Visa Consultants in Surat',
  title: 'Australia Work Visa Consultant in Surat | 482 / Skilled Pathway Guidance',
  description:
    'Australia work visa consultants in Surat for employer-sponsored and skilled migration orientation, including TSS 482-style pathways where eligible.',
  keywords:
    'Australia work visa consultant in Surat, 482 visa India, Australia skilled migration Surat, TSS visa consultants',
  heroDescription:
    'Employer-sponsored and skilled-work orientation for Australia — occupation fit, skills assessment basics and document counselling from Surat.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Work Visa', to: '/work-visa' },
    { label: 'Australia' },
  ],
  highlights: [
    { title: 'Occupation lists', desc: 'Check whether your role is actually in demand.' },
    { title: 'Skills assessment', desc: 'Many skilled routes need assessing-authority approval.' },
    { title: 'Sponsor caution', desc: 'Only work with verifiable employer pathways.' },
    { title: 'Study link', desc: 'Some clients are better suited to study-first strategies.' },
  ],
  sections: [
    {
      heading: 'Australia work migration — stay realistic',
      body: [
        'Australia offers employer-sponsored temporary visas and points-tested permanent skilled visas. Each has different English, age, experience and assessment rules. We focus on eligibility truth over marketing slogans.',
      ],
    },
  ],
  eligibility: [
    'Occupation on a relevant list for the chosen visa',
    'Skills assessment where required',
    'English language score meeting stream requirements',
    'Employer sponsorship for temporary employer-led visas',
  ],
  documents: [
    'Passport and identity documents',
    'Qualification and experience proofs',
    'Skills assessment outcome (if applicable)',
    'English test results',
    'Employment contract / nomination papers for sponsored visas',
  ],
  processSteps: [
    { title: 'Occupation map', desc: 'ANZSCO fit and stream options.' },
    { title: 'Assessment plan', desc: 'Authority, English and evidence gaps.' },
    { title: 'Sponsorship / EOI', desc: 'Route-specific next steps.' },
    { title: 'Visa stage', desc: 'Checklist and submission support.' },
  ],
  faqs: [
    {
      question: 'Is the 482 visa available from India?',
      answer:
        'Employer-sponsored temporary skill shortage style visas exist, but you need a genuine sponsoring employer and to meet stream criteria. We will not invent job offers.',
    },
  ],
  relatedExtra: [{ label: 'Study in Australia', to: '/study-in-australia' }],
})

export const WORK_DESTINATIONS = {
  japan: workJapan,
  germany: workGermany,
  canada: workCanada,
  uk: workUK,
  australia: workAustralia,
} as const
