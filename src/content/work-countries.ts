import type { DestinationContent } from "./destination-types"

export type WorkCountryMeta = {
  slug: string
  name: string
  flag: string
  region: string
  visa: string
  summary: string
}

export const WORK_COUNTRY_GROUPS: Array<{ region: string; subtitle: string; slugs: string[] }> = [
  { region: "Europe", subtitle: "Healthcare, engineering, hospitality, logistics and skilled trades", slugs: ["albania", "armenia", "austria", "belarus", "croatia", "denmark", "finland", "france", "germany", "hungary", "ireland", "italy", "malta", "moldova", "netherlands", "norway", "poland", "portugal", "romania", "slovakia", "spain", "sweden", "switzerland", "uk"] },
  { region: "Asia", subtitle: "Japan, Singapore, Malaysia, Israel and Central Asia opportunities", slugs: ["azerbaijan", "israel", "japan", "kazakhstan", "malaysia", "maldives", "qatar", "russia", "saudi-arabia", "singapore"] },
  { region: "Oceania", subtitle: "Australia and New Zealand work pathways", slugs: ["australia", "new-zealand"] },
  { region: "North America", subtitle: "Canada and USA employment routes", slugs: ["canada", "usa"] },
  { region: "Regional coverage", subtitle: "Broader Africa and Gulf employer pathways", slugs: ["africa", "gulf"] },
]

export const WORK_COUNTRIES: WorkCountryMeta[] = [
  { slug: "albania", name: "Albania", flag: "🇦🇱", region: "Europe", visa: "Work / Employment Permit", summary: "Work permit and employment-visa counselling for Albania from our Surat office." },
  { slug: "armenia", name: "Armenia", flag: "🇦🇲", region: "Europe", visa: "Work Permit", summary: "Work permit and employment-visa counselling for Armenia from our Surat office." },
  { slug: "austria", name: "Austria", flag: "🇦🇹", region: "Europe", visa: "Red-White-Red Card", summary: "Work permit and employment-visa counselling for Austria from our Surat office." },
  { slug: "belarus", name: "Belarus", flag: "🇧🇾", region: "Europe", visa: "Work Visa", summary: "Work permit and employment-visa counselling for Belarus from our Surat office." },
  { slug: "croatia", name: "Croatia", flag: "🇭🇷", region: "Europe", visa: "Work & Residence Permit", summary: "Work permit and employment-visa counselling for Croatia from our Surat office." },
  { slug: "denmark", name: "Denmark", flag: "🇩🇰", region: "Europe", visa: "Positive List / Work Permit", summary: "Work permit and employment-visa counselling for Denmark from our Surat office." },
  { slug: "finland", name: "Finland", flag: "🇫🇮", region: "Europe", visa: "Residence Permit for Work", summary: "Work permit and employment-visa counselling for Finland from our Surat office." },
  { slug: "france", name: "France", flag: "🇫🇷", region: "Europe", visa: "Talent Passport / Work Permit", summary: "Talent Passport and salaried work authorisation routes." },
  { slug: "germany", name: "Germany", flag: "🇩🇪", region: "Europe", visa: "EU Blue Card / Opportunity Card", summary: "EU Blue Card, skilled worker and Opportunity Card style pathways for eligible profiles." },
  { slug: "hungary", name: "Hungary", flag: "🇭🇺", region: "Europe", visa: "Guest Worker / Work Permit", summary: "Work permit and employment-visa counselling for Hungary from our Surat office." },
  { slug: "ireland", name: "Ireland", flag: "🇮🇪", region: "Europe", visa: "Critical Skills Employment Permit", summary: "Critical Skills and General Employment Permit guidance." },
  { slug: "italy", name: "Italy", flag: "🇮🇹", region: "Europe", visa: "Work / Decreto Flussi routes", summary: "Work permit and employment-visa counselling for Italy from our Surat office." },
  { slug: "malta", name: "Malta", flag: "🇲🇹", region: "Europe", visa: "Single Permit", summary: "Work permit and employment-visa counselling for Malta from our Surat office." },
  { slug: "moldova", name: "Moldova", flag: "🇲🇩", region: "Europe", visa: "Work Permit", summary: "Work permit and employment-visa counselling for Moldova from our Surat office." },
  { slug: "netherlands", name: "Netherlands", flag: "🇳🇱", region: "Europe", visa: "Highly Skilled Migrant", summary: "Work permit and employment-visa counselling for Netherlands from our Surat office." },
  { slug: "norway", name: "Norway", flag: "🇳🇴", region: "Europe", visa: "Skilled Worker Residence", summary: "Work permit and employment-visa counselling for Norway from our Surat office." },
  { slug: "poland", name: "Poland", flag: "🇵🇱", region: "Europe", visa: "Type D National Work Visa", summary: "Work permit and employment-visa counselling for Poland from our Surat office." },
  { slug: "portugal", name: "Portugal", flag: "🇵🇹", region: "Europe", visa: "D1 / Work Visa", summary: "Work permit and employment-visa counselling for Portugal from our Surat office." },
  { slug: "romania", name: "Romania", flag: "🇷🇴", region: "Europe", visa: "Long-stay Work Visa", summary: "Work permit and employment-visa counselling for Romania from our Surat office." },
  { slug: "slovakia", name: "Slovakia", flag: "🇸🇰", region: "Europe", visa: "Temporary Residence for Employment", summary: "Work permit and employment-visa counselling for Slovakia from our Surat office." },
  { slug: "spain", name: "Spain", flag: "🇪🇸", region: "Europe", visa: "Work Authorization / Residence", summary: "Work permit and employment-visa counselling for Spain from our Surat office." },
  { slug: "sweden", name: "Sweden", flag: "🇸🇪", region: "Europe", visa: "Work Permit", summary: "Work permit and employment-visa counselling for Sweden from our Surat office." },
  { slug: "switzerland", name: "Switzerland", flag: "🇨🇭", region: "Europe", visa: "Long-stay Work Permit", summary: "Work permit and employment-visa counselling for Switzerland from our Surat office." },
  { slug: "uk", name: "United Kingdom", flag: "🇬🇧", region: "Europe", visa: "Skilled Worker / Health & Care", summary: "Skilled Worker and Health & Care sponsor-led pathways." },
  { slug: "azerbaijan", name: "Azerbaijan", flag: "🇦🇿", region: "Asia", visa: "Work Visa", summary: "Work permit and employment-visa counselling for Azerbaijan from our Surat office." },
  { slug: "israel", name: "Israel", flag: "🇮🇱", region: "Asia", visa: "B/1 Work Visa", summary: "Work permit and employment-visa counselling for Israel from our Surat office." },
  { slug: "japan", name: "Japan", flag: "🇯🇵", region: "Asia", visa: "SSW / Engineer Visa", summary: "Specified Skilled Worker (SSW) and professional Engineer routes with language planning." },
  { slug: "kazakhstan", name: "Kazakhstan", flag: "🇰🇿", region: "Asia", visa: "Work Visa", summary: "Work permit and employment-visa counselling for Kazakhstan from our Surat office." },
  { slug: "malaysia", name: "Malaysia", flag: "🇲🇾", region: "Asia", visa: "Employment Pass", summary: "Work permit and employment-visa counselling for Malaysia from our Surat office." },
  { slug: "maldives", name: "Maldives", flag: "🇲🇻", region: "Asia", visa: "Employment Approval", summary: "Work permit and employment-visa counselling for Maldives from our Surat office." },
  { slug: "qatar", name: "Qatar", flag: "🇶🇦", region: "Asia", visa: "Work Residence Permit", summary: "Work residence permit documentation counselling." },
  { slug: "russia", name: "Russia", flag: "🇷🇺", region: "Asia", visa: "Work / HQS Visa", summary: "Work permit and employment-visa counselling for Russia from our Surat office." },
  { slug: "saudi-arabia", name: "Saudi Arabia", flag: "🇸🇦", region: "Asia", visa: "Iqama Work Permit", summary: "Employer-sponsored Iqama work residence support." },
  { slug: "singapore", name: "Singapore", flag: "🇸🇬", region: "Asia", visa: "Employment Pass / S Pass", summary: "Employment Pass / S Pass counselling for qualified candidates." },
  { slug: "australia", name: "Australia", flag: "🇦🇺", region: "Oceania", visa: "TSS 482 / Skilled Pathways", summary: "Employer-sponsored and skilled migration orientation." },
  { slug: "new-zealand", name: "New Zealand", flag: "🇳🇿", region: "Oceania", visa: "AEWV / Work Visa", summary: "Work permit and employment-visa counselling for New Zealand from our Surat office." },
  { slug: "canada", name: "Canada", flag: "🇨🇦", region: "North America", visa: "Work Permit / LMIA / PR pathways", summary: "Employer work permits and PR-oriented planning where eligible." },
  { slug: "usa", name: "United States", flag: "🇺🇸", region: "North America", visa: "H-1B / EB categories (case-by-case)", summary: "Specialty occupation and employment-based categories assessed case by case." },
  { slug: "africa", name: "Africa (Regional)", flag: "🌍", region: "Africa", visa: "Country-specific work permits", summary: "Selected African work-permit destinations based on role and employer demand." },
  { slug: "gulf", name: "Gulf Region", flag: "🏜️", region: "Gulf", visa: "Employment / Residence work visas", summary: "Gulf employment visa guidance across GCC-oriented employer pathways." },
]

export const WORK_COUNTRY_BY_SLUG = Object.fromEntries(
  WORK_COUNTRIES.map((c) => [c.slug, c]),
) as Record<string, WorkCountryMeta>

function relatedFor(slug: string) {
  const others = WORK_COUNTRIES.filter((c) => c.slug !== slug).slice(0, 4)
  return [
    { label: "All work visa countries", to: "/work-visa", description: "Browse every destination we support." },
    ...others.map((c) => ({ label: `${c.name} work visa`, to: `/work-visa/${c.slug}`, description: c.visa })),
    { label: "Free consultation in Surat", to: "/contact", description: "Profile assessment with our counsellors." },
    { label: "Visa consultants in Surat", to: "/visa-consultants-in-surat" },
  ]
}

export function buildWorkCountryContent(slug: string): DestinationContent | null {
  const c = WORK_COUNTRY_BY_SLUG[slug]
  if (!c) return null
  const isRegion = c.region === "Africa" || c.region === "Gulf"
  const processingTime = c.slug === "uk"
    ? "Approximately 8 weeks"
    : "Approximately 5–6 months"
  return {
    path: `/work-visa/${c.slug}`,
    kind: "work",
    country: c.name,
    serviceType: "Work visa consultancy",
    eyebrow: `${c.name} work visa · Surat`,
    // Mirrors how Indians actually search (Google India autocomplete): "<country> work permit for indian",
    // plus cost / processing time / documents required / age limit modifiers.
    h1: isRegion
      ? `${c.name} Work Visa for Indians — Consultants in Surat`
      : `${c.name} Work Permit for Indians — Visa Consultants in Surat`,
    title: `${c.name} Work Permit for Indians: Process, Cost & Documents`,
    description: `Apply for a ${c.name} work permit from India: eligibility, documents required, processing time, cost and age limit explained by visa consultants in Surat.`,
    keywords: `${c.name} work permit for indian, ${c.name} work visa for indians, ${c.name} work permit cost, ${c.name} work permit processing time in India, ${c.name} work visa documents required, ${c.name} work visa age limit, ${c.name} job visa for indians, ${c.name} work visa consultant in Surat, ${c.visa}`,
    heroDescription: c.summary,
    processingTime,
    breadcrumbs: [
      { label: "Home", to: "/" },
      { label: "Work Visa", to: "/work-visa" },
      { label: c.name },
    ],
    highlights: [
      { title: "Pathway focus", desc: c.visa },
      { title: "Surat counselling", desc: "In-person or online profile assessment." },
      { title: "Document readiness", desc: "Clean certificates, experience letters and forms." },
      { title: "Honest advising", desc: "No fake job guarantees — only realistic options." },
    ],
    sections: [
      {
        heading: `Why consider ${c.name}?`,
        body: [
          `${c.name} is one of the work-permit destinations we counsel for from Surat. Demand, salary thresholds, language rules and employer sponsorship requirements vary — we start with eligibility, not sales.`,
          `Typical route label we discuss: ${c.visa}. Exact categories depend on your occupation, qualifications, age and language scores.`,
        ],
      },
      {
        heading: `${c.name} work permit for Indians: step-by-step process`,
        body: [
          `Most Indians get a ${c.name} work visa in the same order: an employer or sponsor approves the role, the work permit or authorisation is issued, and then the visa is filed from India with your documents, biometrics and (where needed) an embassy appointment.`,
          `We check which of these stages applies to your occupation before you pay anyone, so you know the real ${c.name} work permit processing time from India and every cost involved.`,
        ],
      },
      {
        heading: `${c.name} work visa cost, salary and age limit`,
        body: [
          `The total ${c.name} work permit cost for Indian applicants is made up of government visa fees, document translation and attestation, medicals, travel and service charges. Fees change, so we give you a written, itemised breakdown for your case — never a vague package price.`,
          `Salary depends on the role, your experience and local wage rules. ${c.name} does not usually set one fixed legal age limit for work visas; employers and specific programmes may prefer certain age bands, which we explain during your assessment.`,
        ],
        bullets: [
          "Beware of agents promising a free visa or a guaranteed job — genuine employers still require documents and checks",
          "Never pay large amounts before seeing a verifiable job offer or permit",
          "Ask for fee receipts and written terms",
        ],
      },
      {
        heading: "How Siddhivinayak Overseas helps",
        body: [
          "We map your profile to a suitable work pathway, explain documents and timelines, and prepare a clean file. Employer hiring decisions remain with licensed employers/sponsors.",
        ],
        bullets: [
          "Eligibility screening for the target country",
          "Document checklist and quality control",
          "Interview / profile presentation guidance",
          "Visa-stage paperwork counselling",
        ],
      },
    ],
    eligibility: [
      "Relevant education or trade skills for the role",
      "Experience letters matching your claimed duties",
      "Language score where the country/role requires it",
      "Valid passport and clean supporting documents",
      "Job offer / sponsorship where the pathway requires it",
    ],
    documents: [
      "Passport and photographs",
      "Education certificates and transcripts",
      "Experience letters on company letterhead",
      "Updated CV / bio-data",
      "Language test results (if required)",
      "Police / medical documents when requested",
    ],
    processSteps: [
      { title: "Assess", desc: "Occupation fit and country shortlist." },
      { title: "Prepare", desc: "Documents, language and skill gaps." },
      { title: "Employer stage", desc: "Interview/profile support where applicable." },
      { title: "Visa file", desc: "Checklist and submission readiness." },
    ],
    faqs: [
      {
        question: `Do you guarantee a job in ${c.name}?`,
        answer: "No ethical consultancy can guarantee overseas employment. We provide counselling and documentation support; hiring rests with employers.",
      },
      {
        question: `What is the ${c.name} work permit processing time from India?`,
        answer: `It depends on the employer approval stage, permit authorities and embassy appointment availability. As a guide it is ${processingTime.toLowerCase()}, and we give a case-specific estimate after checking your documents.`,
      },
      {
        question: `How much does a ${c.name} work visa cost for Indians?`,
        answer: "The cost includes visa and permit fees, translations, medicals, travel and consultancy charges. Government fees change, so we share an itemised written quote for your profile.",
      },
      {
        question: `What documents are required for a ${c.name} work visa?`,
        answer: "Usually a valid passport, photographs, education certificates, experience letters, CV, job offer or contract, police clearance and medical reports. Some roles also need language scores or skill assessments.",
      },
      {
        question: `Is there an age limit for a ${c.name} work visa for Indians?`,
        answer: "Most work permits do not set a single legal age limit, but employer requirements and specific programmes can. We tell you honestly if your age affects your chances.",
      },
      {
        question: "Are free visa jobs abroad genuine?",
        answer: "Be careful. Genuine employers may cover some costs, but offers that promise a free visa and a guaranteed job without interviews or documents are a common scam. Verify the employer and permit before paying.",
      },
      {
        question: "Can I apply from Surat?",
        answer: "Yes. Most counselling, document checks and filing guidance can be done from our Surat office or online.",
      },
    ],
    related: relatedFor(c.slug),
  }
}

export function getAllWorkVisaPaths(): string[] {
  return WORK_COUNTRIES.map((c) => `/work-visa/${c.slug}`)
}
