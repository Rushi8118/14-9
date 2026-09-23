import type { DestinationContent } from './destination-types'

/**
 * The country's own post-study work page. Students finishing a course are the highest-intent
 * visitors these pages get, so they are pointed at the specific route, not the generic hub.
 */
const POST_STUDY_ROUTE: Record<string, { label: string; to: string; description: string }> = {
  '/study-in-canada': {
    label: 'Canada Post-Study Work Visa: PGWP to PR',
    to: '/pathways/canada-pgwp-to-pr',
    description: 'Finishing your course? Your work visa options after graduation.',
  },
  '/study-in-uk': {
    label: 'UK Post-Study Work Visa: Graduate Route',
    to: '/pathways/uk-graduate-visa-to-skilled-worker-visa',
    description: 'Finishing your course? How to stay and work in the UK.',
  },
  '/study-in-australia': {
    label: 'Australia Post-Study Work Visa: Subclass 485',
    to: '/pathways/australia-485-to-employer-sponsored-visa',
    description: 'Finishing your course? Your work visa options after graduation.',
  },
  '/study-in-new-zealand': {
    label: 'New Zealand Post-Study Work Visa: AEWV',
    to: '/pathways/new-zealand-accredited-employer-work-visa',
    description: 'Finishing your course? How to move to an accredited employer.',
  },
}

const sharedStudyRelated = (current: string) =>
  [
    { label: 'Study Visa Consultants in Surat', to: '/study-visa', description: 'All study destinations we support.' },
    { label: 'Visa Consultants in Surat', to: '/visa-consultants-in-surat', description: 'Local office, counselling and documentation support.' },
    { label: 'Post-Study Work Visas', to: '/post-study-work-visa', description: 'Compare PGWP, Graduate Route and more.' },
    { label: 'Visa Guides', to: '/guides', description: 'Requirements, documents and IELTS guidance.' },
    { label: 'Free Consultation', to: '/contact', description: 'Book a profile assessment with our team.' },
  ].filter((link) => link.to !== current)

function studyPage(input: Omit<DestinationContent, 'kind' | 'serviceType' | 'related'> & { relatedExtra?: DestinationContent['related'] }): DestinationContent {
  return {
    ...input,
    kind: 'study',
    serviceType: 'Study visa consultancy',
    related: [
      ...(POST_STUDY_ROUTE[input.path] ? [POST_STUDY_ROUTE[input.path]] : []),
      ...(input.relatedExtra ?? []),
      ...sharedStudyRelated(input.path),
    ],
  }
}

export const studyCanada: DestinationContent = studyPage({
  path: '/study-in-canada',
  country: 'Canada',
  eyebrow: 'Canada study visa · Surat',
  h1: 'Canada Study Visa Consultants in Surat',
  title: 'Canada Study Visa Consultant in Surat | Study in Canada from India',
  description:
    'Canada study visa consultants in Surat for SDS/non-SDS applications, university admissions, GIC, scholarships and PGWP guidance. Free counselling at Siddhivinayak Overseas.',
  keywords:
    'Canada study visa consultant in Surat, study in Canada from India, Canada student visa Surat, SDS visa consultants, Canada education consultants Surat, PGWP Canada',
  heroDescription:
    'End-to-end Canada study guidance from our Surat office — course shortlisting, offer letters, SDS documentation, GIC/tuition planning, and post-study work counselling.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in Canada' },
  ],
  highlights: [
    { title: 'SDS & non-SDS filing', desc: 'Document checklists tailored to your intake and college type.' },
    { title: 'University shortlisting', desc: 'Program fit based on academics, budget and PR goals.' },
    { title: 'PGWP pathway', desc: 'Study choices mapped to post-graduation work permit eligibility.' },
    { title: 'Surat counselling', desc: 'In-person or online guidance with dedicated case follow-up.' },
  ],
  sections: [
    {
      heading: 'Why study in Canada from India?',
      body: [
        'Canada remains one of the strongest study-abroad choices for Indian students because of its mix of recognised universities, comparatively manageable tuition, and a clear post-study work route through the Post-Graduation Work Permit (PGWP). For many families in Surat and across Gujarat, Canada also offers a practical long-term plan: study, gain Canadian work experience, then explore permanent residence options such as Express Entry or provincial pathways.',
        'As of 2026, applicants should treat policy as dynamic. Intake caps, provincial attestation letters (PAL/TAL where applicable), financial proof rules, and SDS criteria can change. Our counsellors review the latest IRCC and institution requirements before you commit fees.',
      ],
      bullets: [
        'English-taught degrees with strong STEM, business, healthcare and skilled-trades options',
        'Opportunity to work part-time during studies (subject to permit conditions)',
        'PGWP of up to 3 years for eligible programs and institutions',
        'Multicultural cities with established Indian student communities',
      ],
    },
    {
      heading: 'Canada student visa process (high-level)',
      body: [
        'A typical Canada study journey from Surat includes profile assessment, shortlisting, applications, offer/LOA, financial preparation (tuition + GIC where required), medicals, biometrics, and study-permit filing. Timelines vary by intake (Jan/May/Sep), college vs university, and whether your file is SDS or non-SDS.',
      ],
    },
    {
      heading: 'Fees & financial planning (guidance only)',
      body: [
        'Budget planning should cover tuition, living costs, health insurance, airfare, and contingency. Exact figures depend on city and program. We help you build a realistic funding plan and organise bank statements, sponsor documents, and GIC/tuition receipts so the visa file stays consistent.',
        'Never rely on “guaranteed approval” claims. Strong academics, genuine intent, correct finances, and clean documentation matter more than shortcuts.',
      ],
    },
    {
      heading: 'Common rejection reasons we help you avoid',
      body: [
        'Weak study purpose, inconsistent finances, unclear program progression, incomplete forms, and poor travel history explanations are common refusal themes. We pressure-test your SOP/study plan and document set before filing.',
      ],
    },
  ],
  eligibility: [
    'Offer of admission from a designated learning institution (DLI)',
    'Proof of funds for tuition + living costs (as per current IRCC guidance)',
    'English proficiency (IELTS/PTE/TOEFL or institution waiver where accepted)',
    'Clean medical and police clearance where required',
    'Genuine temporary resident intent with a coherent academic plan',
  ],
  documents: [
    'Valid passport and photographs',
    'Letter of Acceptance / offer letter',
    'Academic transcripts, marksheets and degree certificates',
    'English test scorecard',
    'Proof of funds / GIC / tuition fee receipt',
    'SOP / study plan and sponsor affidavit where applicable',
    'Medical exam and biometrics instructions as issued',
  ],
  processSteps: [
    { title: 'Profile review', desc: 'Academics, budget, backlog/gap analysis and country fit.' },
    { title: 'Applications', desc: 'College/university shortlist, SOPs and offer follow-up.' },
    { title: 'Visa file', desc: 'SDS/non-SDS checklist, finances, forms and biometrics.' },
    { title: 'Pre-departure', desc: 'Accommodation guidance, packing and landing checklist.' },
  ],
  faqs: [
    {
      question: 'Do I need IELTS for a Canada study visa?',
      answer:
        'Most colleges and universities require proof of English. Some pathways accept PTE/TOEFL or offer conditional admission. Visa officers also assess language readiness as part of overall credibility.',
    },
    {
      question: 'What is SDS for Canada?',
      answer:
        'SDS (Student Direct Stream) is a faster study-permit processing route for eligible countries including India, with specific financial and document requirements. Eligibility and rules can change, so we verify current criteria before filing.',
    },
    {
      question: 'Can I get PR after studying in Canada?',
      answer:
        'Many graduates use PGWP work experience toward Express Entry or provincial programs. PR is never automatic — it depends on age, language, occupation, CRS score and program rules at the time you apply.',
    },
    {
      question: 'How long does Canada study visa processing take?',
      answer:
        'Processing times fluctuate by visa office and season. SDS files are often faster than regular streams, but biometrics, medicals and incomplete documents can extend timelines.',
    },
  ],
  relatedExtra: [
    { label: 'Canada student visa requirements guide', to: '/guides/canada-student-visa-requirements' },
    { label: 'Canada study visa documents checklist', to: '/guides/canada-study-visa-documents' },
  ],
})

export const studyUK: DestinationContent = studyPage({
  path: '/study-in-uk',
  country: 'United Kingdom',
  eyebrow: 'UK study visa · Surat',
  h1: 'UK Study Visa Consultants in Surat',
  title: 'UK Study Visa Consultant in Surat | Study in UK from India',
  description:
    'UK study visa consultants in Surat for university admissions, Student Route visas, CAS support, scholarships and Graduate Route guidance.',
  keywords:
    'UK study visa consultant in Surat, study in UK from India, UK student visa Surat, CAS UK, Graduate Route UK, UK education consultants Surat',
  heroDescription:
    'From shortlisting UK universities to CAS and Student Route filing — practical counselling for Indian students from our Surat office.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in UK' },
  ],
  highlights: [
    { title: 'University & college fit', desc: 'Rankings matter less than course outcomes and budget fit.' },
    { title: 'CAS readiness', desc: 'Deposit, credibility interview prep and document alignment.' },
    { title: 'Graduate Route', desc: 'Plan study choices with post-study work options in mind.' },
    { title: 'Scholarship search', desc: 'Merit and university awards where you genuinely qualify.' },
  ],
  sections: [
    {
      heading: 'Why study in the UK?',
      body: [
        'The UK offers shorter master’s programs (often 1 year), globally recognised degrees, and the Graduate Route for eligible students after completion. Indian applicants from Surat commonly choose business, data, healthcare, engineering and creative courses.',
        'As of 2026, dependants rules, financial maintenance amounts, and credibility interview practices should be verified for your intake. We keep your file aligned with current UKVI guidance.',
      ],
    },
    {
      heading: 'UK Student Route overview',
      body: [
        'You generally need a Confirmation of Acceptance for Studies (CAS) from a licensed sponsor, proof of funds for a set period, English language evidence, and TB test results where required. Credibility interviews assess whether your study plan is genuine.',
      ],
    },
  ],
  eligibility: [
    'Unconditional/conditional offer leading to CAS from a licensed sponsor',
    'English language requirement met (IELTS/PTE or approved equivalent)',
    'Maintenance funds as per current UKVI levels',
    'TB test certificate if applying from India (where required)',
    'Clear academic progression and genuine student intent',
  ],
  documents: [
    'Passport, photos, academic documents',
    'CAS statement',
    'Financial evidence (bank statements / education loan)',
    'English test results',
    'TB certificate',
    'Consent/sponsor letters where applicable',
  ],
  processSteps: [
    { title: 'Shortlist', desc: 'Course, city, tuition and career outcome mapping.' },
    { title: 'Admit + deposit', desc: 'Applications, SOP/LOR support and offer acceptance.' },
    { title: 'CAS + visa', desc: 'Interview prep, funds evidence and Student Route filing.' },
    { title: 'Travel ready', desc: 'Pre-departure briefing and arrival checklist.' },
  ],
  faqs: [
    {
      question: 'Is a 1-year UK master’s worth it?',
      answer:
        'It can be, if the course matches your career goal and budget. Shorter duration lowers living cost exposure, but you must still meet academic and visa requirements.',
    },
    {
      question: 'What is the UK Graduate Route?',
      answer:
        'An unsponsored post-study work route for eligible graduates. Duration and rules can change — we explain the current position during counselling.',
    },
    {
      question: 'Do UK universities interview students?',
      answer:
        'Many do credibility or academic interviews, especially via agents or for certain risk profiles. We help you prepare clear answers about course choice, funds and career plans.',
    },
  ],
  relatedExtra: [
    { label: 'UK student visa requirements', to: '/guides/uk-student-visa-requirements' },
  ],
})

export const studyAustralia: DestinationContent = studyPage({
  path: '/study-in-australia',
  country: 'Australia',
  eyebrow: 'Australia study visa · Surat',
  h1: 'Australia Study Visa Consultants in Surat',
  title: 'Australia Study Visa Consultant in Surat | Study in Australia from India',
  description:
    'Australia study visa consultants in Surat for GTE/GS guidance, university admissions, Subclass 500 visas and post-study work planning.',
  keywords:
    'Australia study visa consultant in Surat, study in Australia from India, Subclass 500 Surat, Australia education consultants, GTE GS Australia',
  heroDescription:
    'Practical Australia study counselling from Surat — admissions, Genuine Student assessment support, visa filing and Temporary Graduate pathway orientation.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in Australia' },
  ],
  highlights: [
    { title: 'Genuine Student focus', desc: 'Study plan and evidence aligned to current GS settings.' },
    { title: 'Course packaging advice', desc: 'Avoid risky packaging that weakens visa credibility.' },
    { title: 'City & cost planning', desc: 'Sydney, Melbourne, Brisbane, Adelaide and regional options.' },
    { title: 'Post-study orientation', desc: 'Understand Temporary Graduate pathways after study.' },
  ],
  sections: [
    {
      heading: 'Why study in Australia?',
      body: [
        'Australia attracts Indian students with strong universities, research options, and post-study work potential in major and regional cities. Success depends on choosing a course that matches your background and presenting a credible Genuine Student case.',
      ],
    },
    {
      heading: 'Subclass 500 study visa essentials',
      body: [
        'A Confirmation of Enrolment (CoE), OSHC health cover, financial capacity, English evidence, and a coherent study rationale are core pieces. Policy settings around GS/GTE-style assessments evolve — we update your checklist per intake.',
      ],
    },
  ],
  eligibility: [
    'Offer and CoE from a CRICOS-registered provider',
    'OSHC for the visa duration',
    'English and academic requirements for the course',
    'Funds to cover tuition and living costs',
    'Genuine Student criteria satisfied',
  ],
  documents: [
    'Passport and identity documents',
    'Offer letter and CoE',
    'Academic and English evidence',
    'Financial documents and sponsor proofs',
    'OSHC certificate',
    'GS statement / supporting evidence',
  ],
  processSteps: [
    { title: 'Assess', desc: 'Academics, gaps, budget and preferred cities.' },
    { title: 'Apply', desc: 'Institution applications and offer negotiation.' },
    { title: 'CoE + GS', desc: 'Enrolment, OSHC and Genuine Student file building.' },
    { title: 'Visa lodge', desc: 'Subclass 500 submission and biometrics if required.' },
  ],
  faqs: [
    {
      question: 'What is the Genuine Student requirement?',
      answer:
        'It is the current framework used to assess whether you genuinely intend to study. You should show clear reasons for course choice, provider, and how the qualification helps your career.',
    },
    {
      question: 'Can I work while studying in Australia?',
      answer:
        'Student visa work conditions apply and can change. We advise based on the visa grant and current hour limits — never exceed permitted work conditions.',
    },
  ],
  relatedExtra: [
    { label: 'Australia student visa requirements', to: '/guides/australia-student-visa-requirements' },
  ],
})

export const studyUSA: DestinationContent = studyPage({
  path: '/study-in-usa',
  country: 'United States',
  eyebrow: 'USA study visa · Surat',
  h1: 'USA Study Visa Consultants in Surat',
  title: 'USA Study Visa Consultant in Surat | Study in USA from India',
  description:
    'USA study visa consultants in Surat for university applications, I-20 support, SEVIS fee guidance and F-1 visa interview preparation.',
  keywords:
    'USA study visa consultant in Surat, study in USA from India, F1 visa Surat, USA education consultants, I-20 F1 interview',
  heroDescription:
    'US admissions and F-1 interview prep from Surat — university shortlisting, SOP/LOR support, I-20 guidance and consular interview practice.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in USA' },
  ],
  highlights: [
    { title: 'University strategy', desc: 'Safe / target / ambitious lists based on your profile.' },
    { title: 'Strong SOP story', desc: 'Academic purpose without generic templates.' },
    { title: 'F-1 interview prep', desc: 'Mock interviews focused on ties, funds and course fit.' },
    { title: 'SEVIS readiness', desc: 'I-20, DS-160 and fee sequencing explained clearly.' },
  ],
  sections: [
    {
      heading: 'Why study in the USA?',
      body: [
        'The USA offers unmatched program variety, research exposure and flexible curricula. It is also competitive: visas hinge on academic clarity, financial readiness and convincing non-immigrant intent at interview.',
      ],
    },
    {
      heading: 'F-1 process from India',
      body: [
        'Typical flow: applications → admit → I-20 → SEVIS fee → DS-160 → visa fee → interview. We help you keep documents consistent across university and consular stages.',
      ],
    },
  ],
  eligibility: [
    'Admission and valid I-20 from a SEVP-certified school',
    'Proof of funds for tuition and living costs',
    'English proficiency as required by the institution',
    'Ability to demonstrate non-immigrant intent at interview',
  ],
  documents: [
    'Passport, DS-160 confirmation, fee receipts',
    'I-20 and SEVIS payment proof',
    'Academic transcripts and test scores',
    'Financial affidavits and bank evidence',
    'SOP / resume and interview supporting papers',
  ],
  processSteps: [
    { title: 'Profile + tests', desc: 'SAT/ACT/GRE/GMAT/IELTS planning where needed.' },
    { title: 'Applications', desc: 'University list, essays, LORs and deadlines.' },
    { title: 'I-20 stage', desc: 'Deposit, financial verification and SEVIS fee.' },
    { title: 'Visa interview', desc: 'Mock sessions and document organisation.' },
  ],
  faqs: [
    {
      question: 'Is the USA F-1 visa difficult from India?',
      answer:
        'It is interview-driven. Strong admits help, but refusal risk rises with weak finances, unclear course purpose, or inconsistent answers. Preparation matters.',
    },
    {
      question: 'Can I work on an F-1 visa?',
      answer:
        'On-campus work and later CPT/OPT have strict rules. Unauthorised work can harm status. We explain lawful options only.',
    },
  ],
})

export const studyGermany: DestinationContent = studyPage({
  path: '/study-in-germany',
  country: 'Germany',
  eyebrow: 'Germany study visa · Surat',
  h1: 'Germany Study Visa Consultants in Surat',
  title: 'Germany Study Visa Consultant in Surat | Study in Germany from India',
  description:
    'Germany study visa consultants in Surat for public university applications, blocked account guidance, APS support and student residence permit prep.',
  keywords:
    'Germany study visa consultant in Surat, study in Germany from India, APS Germany Surat, blocked account Germany, German student visa',
  heroDescription:
    'Affordable public-university pathways, APS/document guidance, blocked-account planning and visa file support for Indian students from Surat.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in Germany' },
  ],
  highlights: [
    { title: 'Low-tuition focus', desc: 'Public university options with semester contributions.' },
    { title: 'APS guidance', desc: 'Document authentication pathway support for Indian students.' },
    { title: 'Blocked account help', desc: 'Funding setup aligned to current embassy expectations.' },
    { title: 'German + English tracks', desc: 'Course language fit and prep planning.' },
  ],
  sections: [
    {
      heading: 'Why study in Germany?',
      body: [
        'Germany is popular for engineering, automotive, IT and applied sciences, with many public universities charging limited tuition. Students must still budget for living costs and meet language or English-taught program criteria.',
      ],
    },
    {
      heading: 'What to expect in the process',
      body: [
        'Applications may involve uni-assist or direct portals, APS (for many Indian applicants), admission letter, blocked account/finances, health insurance and national visa appointment documentation.',
      ],
    },
  ],
  eligibility: [
    'Recognised academic qualifications for the chosen program',
    'Admission/offer from a German institution',
    'Proof of financial means (e.g. blocked account where required)',
    'Language proficiency (German and/or English) as per course',
    'Health insurance coverage',
  ],
  documents: [
    'Passport, photos, academic transcripts',
    'APS certificate where applicable',
    'Admission letter',
    'Blocked account / financial proof',
    'Insurance documents',
    'Motivation letter and CV',
  ],
  processSteps: [
    { title: 'Course match', desc: 'Public vs private, language and intake planning.' },
    { title: 'Applications', desc: 'Portal strategy and document attestation support.' },
    { title: 'Finance + APS', desc: 'Blocked account and authentication sequencing.' },
    { title: 'Visa appointment', desc: 'File review and interview/document readiness.' },
  ],
  faqs: [
    {
      question: 'Is studying in Germany free?',
      answer:
        'Many public universities have low or no tuition, but semester fees and living costs still apply. Private universities charge tuition. Always budget the full cost of living.',
    },
    {
      question: 'Do I need German language?',
      answer:
        'English-taught programs exist, especially at master’s level. German helps daily life and some careers. Requirements depend on the course.',
    },
  ],
})

export const studyIreland: DestinationContent = studyPage({
  path: '/study-in-ireland',
  country: 'Ireland',
  eyebrow: 'Ireland study visa · Surat',
  h1: 'Ireland Study Visa Consultants in Surat',
  title: 'Ireland Study Visa Consultant in Surat | Study in Ireland from India',
  description:
    'Ireland study visa consultants in Surat for university admissions, study visa documentation and post-study stay back orientation.',
  keywords:
    'Ireland study visa consultant in Surat, study in Ireland from India, Ireland education consultants Surat, Ireland student visa',
  heroDescription:
    'Ireland university shortlisting, applications and study-visa documentation support for Indian students counselling from Surat.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in Ireland' },
  ],
  highlights: [
    { title: 'English-speaking EU hub', desc: 'Strong for IT, pharma and business programs.' },
    { title: 'Stay-back orientation', desc: 'Understand post-study permission options after graduation.' },
    { title: 'Compact cities', desc: 'Dublin and beyond — cost and lifestyle planning.' },
    { title: 'Visa file clarity', desc: 'Funds, insurance and academic purpose documentation.' },
  ],
  sections: [
    {
      heading: 'Why study in Ireland?',
      body: [
        'Ireland attracts students seeking English-taught degrees in a European setting, with industry presence in technology and life sciences. Competition for seats and visas rewards clean finances and a focused study plan.',
      ],
    },
  ],
  eligibility: [
    'Offer from a recognised Irish higher-education provider',
    'Proof of funds and medical insurance',
    'English language evidence',
    'Academic eligibility for the program',
  ],
  documents: [
    'Passport and academic records',
    'Offer letter',
    'Financial evidence',
    'English test scores',
    'Insurance and visa forms',
  ],
  processSteps: [
    { title: 'Shortlist', desc: 'Program and tuition fit.' },
    { title: 'Apply', desc: 'Admissions and SOP support.' },
    { title: 'Visa docs', desc: 'Funds and insurance packing.' },
    { title: 'Travel', desc: 'Pre-departure briefing.' },
  ],
  faqs: [
    {
      question: 'Is Ireland good for Indian IT students?',
      answer:
        'Yes for many computer science and data profiles, but outcomes still depend on skills, networking and the labour market. We avoid overselling job guarantees.',
    },
  ],
})

export const studyNewZealand: DestinationContent = studyPage({
  path: '/study-in-new-zealand',
  country: 'New Zealand',
  eyebrow: 'New Zealand study visa · Surat',
  h1: 'New Zealand Study Visa Consultants in Surat',
  title: 'New Zealand Study Visa Consultant in Surat | Study in NZ from India',
  description:
    'New Zealand study visa consultants in Surat for university and institute admissions, Fee Paying Student visas and pathway planning.',
  keywords:
    'New Zealand study visa consultant in Surat, study in New Zealand from India, NZ student visa Surat, New Zealand education consultants',
  heroDescription:
    'NZ course selection, offer letters and student-visa documentation guidance for Indian students from our Surat consultancy.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in New Zealand' },
  ],
  highlights: [
    { title: 'Pathway programs', desc: 'Diploma-to-degree routes where academically suitable.' },
    { title: 'Lifestyle + safety', desc: 'Popular with families seeking a calm study environment.' },
    { title: 'Visa evidence', desc: 'Funds, ties and study purpose presented clearly.' },
    { title: 'Honest advising', desc: 'No inflated job or PR promises.' },
  ],
  sections: [
    {
      heading: 'Why study in New Zealand?',
      body: [
        'New Zealand offers quality education in a smaller, high-quality-of-life setting. Immigration and post-study settings can change, so we separate study decisions from speculative PR claims.',
      ],
    },
  ],
  eligibility: [
    'Offer of place from an approved NZ provider',
    'Sufficient funds and tuition payment evidence',
    'English language requirement met',
    'Health and character requirements',
  ],
  documents: [
    'Passport and photos',
    'Offer of place',
    'Academic and English documents',
    'Financial evidence',
    'Medical/chest X-ray if requested',
  ],
  processSteps: [
    { title: 'Assess', desc: 'Budget and program level matching.' },
    { title: 'Admit', desc: 'Applications and offer follow-up.' },
    { title: 'Visa', desc: 'Fee Paying Student visa file.' },
    { title: 'Depart', desc: 'Travel and arrival checklist.' },
  ],
  faqs: [
    {
      question: 'Is PR easy after studying in New Zealand?',
      answer:
        'No pathway is “easy” or guaranteed. Post-study work and residence options depend on current immigration instructions, occupation and job outcomes.',
    },
  ],
})

export const studyFrance: DestinationContent = studyPage({
  path: '/study-in-france',
  country: 'France',
  eyebrow: 'France study visa · Surat',
  h1: 'France Study Visa Consultants in Surat',
  title: 'France Study Visa Consultant in Surat | Study in France from India',
  description:
    'France study visa consultants in Surat for university/campus France applications, Campus France steps, and long-stay student visa counselling.',
  keywords:
    'France study visa consultant in Surat, study in France from India, Campus France Surat, France student visa',
  heroDescription:
    'Study in France with Surat-based counselling — course shortlisting, Campus France orientation and student visa documentation support.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in France' },
  ],
  highlights: [
    { title: 'Public & private options', desc: 'Engineering, business, hospitality and design pathways.' },
    { title: 'Campus France guidance', desc: 'Step-by-step orientation for the application flow.' },
    { title: 'French / English tracks', desc: 'Language fit based on the chosen program.' },
    { title: 'Visa file support', desc: 'Funds, accommodation and academic purpose documents.' },
  ],
  sections: [
    {
      heading: 'Why study in France?',
      body: [
        'France attracts Indian students for affordable public tuition in many tracks, strong engineering/business schools, and a European study experience. Process discipline around Campus France and visa evidence is essential.',
      ],
    },
  ],
  eligibility: [
    'Admission / acceptance for an eligible French program',
    'Proof of funds and accommodation plan',
    'Language requirement for the course (French and/or English)',
    'Academic eligibility and complete documentation',
  ],
  documents: [
    'Passport and photographs',
    'Academic transcripts and degree certificates',
    'Admission evidence / Campus France documents',
    'Financial proofs',
    'Language scores where required',
  ],
  processSteps: [
    { title: 'Shortlist', desc: 'Course, city and language matching.' },
    { title: 'Apply', desc: 'Institution / Campus France flow support.' },
    { title: 'Visa docs', desc: 'Funds, housing and forms.' },
    { title: 'Interview prep', desc: 'Where appointments require it.' },
  ],
  faqs: [
    {
      question: 'Do I need French language?',
      answer:
        'English-taught programs exist, but many courses need French. We map language needs before you pay deposits.',
    },
  ],
})

export const studySpain: DestinationContent = studyPage({
  path: '/study-in-spain',
  country: 'Spain',
  eyebrow: 'Spain study visa · Surat',
  h1: 'Spain Study Visa Consultants in Surat',
  title: 'Spain Study Visa Consultant in Surat | Study in Spain from India',
  description:
    'Spain study visa consultants in Surat for university admissions, student residence authorisation and documentation counselling.',
  keywords:
    'Spain study visa consultant in Surat, study in Spain from India, Spain student visa Surat',
  heroDescription:
    'Study in Spain with practical counselling from Surat — admissions support, student visa paperwork and pre-departure guidance.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in Spain' },
  ],
  highlights: [
    { title: 'EU study base', desc: 'Spanish and English-taught program options.' },
    { title: 'Cost planning', desc: 'Tuition and living estimates by city.' },
    { title: 'Visa evidence', desc: 'Funds, insurance and admission proofs.' },
    { title: 'Student-first advice', desc: 'No inflated job promises.' },
  ],
  sections: [
    {
      heading: 'Why study in Spain?',
      body: [
        'Spain offers a European education experience with growing English-taught options in business, tourism, design and tech-related fields. Visa success depends on clear admission, funds and insurance documentation.',
      ],
    },
  ],
  eligibility: [
    'Offer from a recognised Spanish institution',
    'Proof of financial means',
    'Health insurance coverage',
    'Language readiness for the program',
  ],
  documents: [
    'Passport and photos',
    'Admission letter',
    'Academic records',
    'Financial evidence',
    'Insurance certificate',
  ],
  processSteps: [
    { title: 'Assess', desc: 'Academics, budget and language.' },
    { title: 'Apply', desc: 'University applications and SOP support.' },
    { title: 'Visa', desc: 'Student authorisation file.' },
    { title: 'Travel', desc: 'Pre-departure checklist.' },
  ],
  faqs: [
    {
      question: 'Is Spain good for Indian students?',
      answer:
        'It can be a strong fit for the right course and budget. We assess whether Spain matches your goals versus UK, France, Germany or Singapore.',
    },
  ],
})

export const studyDubai: DestinationContent = studyPage({
  path: '/study-in-dubai',
  country: 'Dubai (UAE)',
  eyebrow: 'Dubai study visa · Surat',
  h1: 'Dubai Study Visa Consultants in Surat',
  title: 'Dubai Study Visa Consultant in Surat | Study in Dubai / UAE from India',
  description:
    'Dubai study visa consultants in Surat for UAE university admissions, student residence and documentation guidance.',
  keywords:
    'Dubai study visa consultant in Surat, study in Dubai from India, UAE student visa Surat, study in UAE consultants',
  heroDescription:
    'Study in Dubai / UAE with Surat counselling — university shortlisting, admission support and student visa paperwork guidance.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in Dubai' },
  ],
  highlights: [
    { title: 'International campuses', desc: 'Branch campuses and UAE universities.' },
    { title: 'Career proximity', desc: 'Business, hospitality, aviation and tech options.' },
    { title: 'Visa clarity', desc: 'Student residence linked to enrolment.' },
    { title: 'Family planning', desc: 'Cost and lifestyle counselling for parents.' },
  ],
  sections: [
    {
      heading: 'Why study in Dubai?',
      body: [
        'Dubai and the wider UAE attract Indian students seeking international campuses close to home, with strong business and hospitality ecosystems. Admission quality and visa compliance should be verified carefully for each institution.',
      ],
    },
  ],
  eligibility: [
    'Offer from an approved UAE education provider',
    'Proof of funds / fee payment as required',
    'Academic and English eligibility',
    'Medical and Emirates ID steps after arrival where applicable',
  ],
  documents: [
    'Passport',
    'Academic transcripts',
    'Offer / fee receipts',
    'Photos and forms',
    'English test scores where required',
  ],
  processSteps: [
    { title: 'Shortlist', desc: 'Campus and program fit.' },
    { title: 'Admit', desc: 'Applications and offers.' },
    { title: 'Visa', desc: 'Student residence paperwork.' },
    { title: 'Travel', desc: 'Arrival and compliance briefing.' },
  ],
  faqs: [
    {
      question: 'Is Dubai study expensive?',
      answer:
        'Tuition and living costs vary widely by campus. We build a realistic budget before you commit.',
    },
  ],
})

export const studySingapore: DestinationContent = studyPage({
  path: '/study-in-singapore',
  country: 'Singapore',
  eyebrow: 'Singapore study visa · Surat',
  h1: 'Singapore Study Visa Consultants in Surat',
  title: 'Singapore Study Visa Consultant in Surat | Study in Singapore from India',
  description:
    'Singapore study visa consultants in Surat for university/polytechnic admissions, Student Pass guidance and documentation counselling.',
  keywords:
    'Singapore study visa consultant in Surat, study in Singapore from India, ICA Student Pass Surat',
  heroDescription:
    'Study in Singapore with Surat-based counselling — admissions strategy, Student Pass orientation and document readiness.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'Study Visa', to: '/study-visa' },
    { label: 'Study in Singapore' },
  ],
  highlights: [
    { title: 'Competitive admits', desc: 'Universities and private education institutions.' },
    { title: 'Student Pass focus', desc: 'Enrolment-linked pass process orientation.' },
    { title: 'Strong academics', desc: 'STEM, business and hospitality pathways.' },
    { title: 'Honest screening', desc: 'We flag weak profiles early.' },
  ],
  sections: [
    {
      heading: 'Why study in Singapore?',
      body: [
        'Singapore is a premium Asian education hub with rigorous admissions and clear Student Pass processes for eligible enrolled students. Competition is high — preparation and document accuracy matter.',
      ],
    },
  ],
  eligibility: [
    'Offer from an eligible Singapore institution',
    'Academic and English requirements met',
    'Financial capacity as required',
    'Student Pass application after enrolment steps',
  ],
  documents: [
    'Passport',
    'Academic records',
    'English scores',
    'Offer letter / enrolment proofs',
    'Financial documents',
  ],
  processSteps: [
    { title: 'Assess', desc: 'Profile vs Singapore competitiveness.' },
    { title: 'Apply', desc: 'Institution applications.' },
    { title: 'Pass stage', desc: 'Student Pass documentation support.' },
    { title: 'Depart', desc: 'Pre-departure briefing.' },
  ],
  faqs: [
    {
      question: 'Is Singapore harder than the UK for admission?',
      answer:
        'Often yes for top institutions. We compare UK, France, Germany, Spain, Dubai and Singapore against your grades and budget.',
    },
  ],
})

export const STUDY_DESTINATIONS = {
  canada: studyCanada,
  uk: studyUK,
  australia: studyAustralia,
  usa: studyUSA,
  germany: studyGermany,
  ireland: studyIreland,
  'new-zealand': studyNewZealand,
  france: studyFrance,
  spain: studySpain,
  dubai: studyDubai,
  singapore: studySingapore,
} as const

/** Primary study destinations Siddhivinayak Overseas actively promotes */
export const PRIMARY_STUDY_DESTINATIONS = [
  studyUK,
  studyFrance,
  studyGermany,
  studySpain,
  studyDubai,
  studySingapore,
] as const
