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
  title: 'Germany Work Visa from India | EU Blue Card & Chancenkarte',
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
    {
      heading: 'Germany work permit eligibility: what is actually checked',
      body: [
        'Eligibility for a German work permit turns on qualification recognition before anything else. Your degree or vocational training must be recognised as equivalent, which is checked against the anabin database; regulated professions such as nursing and medicine need a separate licence step that adds months. A degree that is excellent in India can still be classed as only partially comparable, and that classification decides which route is open to you.',
        'The second check is the role itself. For an EU Blue Card the job must match your qualification and pay at or above a threshold set annually, with a lower figure for shortage occupations. For the general skilled worker permit the Federal Employment Agency may also assess the employment conditions.',
      ],
    },
    {
      heading: 'Germany work visa processing time and costs',
      body: [
        'Processing time is driven less by the visa decision than by the steps before it. Qualification recognition commonly takes two to four months, and a consulate appointment in India can itself be booked weeks ahead. Once filed, a national visa decision typically takes several weeks, though this varies by consulate and season.',
        'Plan on the whole sequence rather than the final stage. Anyone quoting a single short turnaround for the entire process is describing the visa decision alone, not recognition and appointment waiting.',
      ],
      bullets: [
        'Qualification recognition: usually the longest single step',
        'Consulate appointment availability varies by city and time of year',
        'Regulated professions need licensing before the visa stage',
        'Fees are itemised in writing before any work begins',
      ],
    },
    {
      heading: 'Germany work visa documents required',
      body: [
        'German consulates are strict about document form, not just content. Degree certificates and transcripts usually need attestation, translations must be by a sworn translator, and the employment contract has to state the role, salary and working hours clearly enough for the authorities to assess it.',
      ],
      bullets: [
        'Passport valid well beyond the intended stay',
        'Degree certificates, transcripts and anabin recognition evidence',
        'Employment contract or binding job offer stating salary and duties',
        'Proof of health insurance valid from your start date',
        'Language certificates where the occupation requires them',
        'Certified translations by a sworn translator',
      ],
    },
    {
      heading: 'Common Germany work visa rejection reasons',
      body: [
        'Most refusals we see are avoidable and administrative rather than a judgement on the applicant. The recurring causes are a qualification that was never formally recognised, a salary just under the current threshold, an employment contract too vague for the authorities to assess, and gaps in health insurance cover.',
        'A refusal is not always final, but reapplying without fixing the underlying cause usually repeats the outcome. We check these points before filing rather than after.',
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
    {
      question: 'How long does a Germany work visa take from India?',
      answer:
        'Budget for the whole sequence, not just the decision. Qualification recognition commonly takes two to four months, consulate appointments can be booked weeks ahead, and the visa decision itself usually takes several weeks. Regulated professions take longer because of licensing.',
    },
    {
      question: 'What salary is required for a Germany work visa?',
      answer:
        'The EU Blue Card has a gross annual salary threshold that is revised each year, with a lower figure for shortage occupations such as IT, engineering and medicine. Check the current amount on the Federal Office for Migration and Refugees website for the date you apply.',
    },
    {
      question: 'What is the difference between a Germany work permit and the EU Blue Card?',
      answer:
        'The EU Blue Card is for qualified specialists meeting a salary threshold and can lead to settlement faster. The general skilled worker permit covers a wider range of recognised qualifications, including vocational training, at different conditions.',
    },
    {
      question: 'Can I go to Germany to look for a job without an offer?',
      answer:
        'The points-based Opportunity Card allows entry to search for qualified work without a job offer, subject to points, funds and insurance. See our Opportunity Card guide for how the points test works.',
    },
    {
      question: 'Why are Germany work visas rejected?',
      answer:
        'Most often because the qualification was never formally recognised, the salary fell below the current threshold, the employment contract was too vague to assess, or health insurance cover had gaps. These are checkable before filing.',
    },
    {
      question: 'Can you guarantee a job or a visa in Germany?',
      answer:
        'No. We introduce suitable candidates to employers who are recruiting, and the employer decides who to hire. The German authorities decide the visa. Anyone guaranteeing either is not being straight with you.',
    },
  ],
})

export const workCanada: DestinationContent = workPage({
  path: '/work-visa/canada',
  country: 'Canada',
  eyebrow: 'Canada work visa · Surat',
  h1: 'Canada Work Visa Consultants in Surat',
  title: 'Canada Work Visa from India | LMIA & Express Entry',
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
    {
      heading: 'Canada work permit eligibility and the LMIA',
      body: [
        'Most employer-led work permits depend on a Labour Market Impact Assessment. The employer applies to Employment and Social Development Canada and has to show that hiring you will not displace a Canadian or permanent resident. You cannot obtain an LMIA yourself, and you should not pay for one - the employer applies and the employer pays the processing fee.',
        'Some roles are LMIA-exempt, including intra-company transfers and positions under international agreements. These are genuinely faster, but the exemption has to fit your actual situation rather than being asserted on the application.',
      ],
      bullets: [
        'Your role is classified under a NOC code, and the code has to match your real duties',
        'An employer-specific permit ties you to that employer; an open permit does not',
        'Selling an LMIA to a candidate is a warning sign, not a service',
        'A work permit is temporary and is not the same thing as permanent residence',
      ],
    },
    {
      heading: 'Canada work visa processing time',
      body: [
        'The visible processing time is only the last stage. An LMIA application takes its own weeks before you can apply at all, and an Educational Credential Assessment for a foreign degree typically adds several more. Biometrics have to be given in person at a visa application centre, and appointment availability varies by city.',
        'Immigration, Refugees and Citizenship Canada publishes current processing times by application type and country of residence. Check those for your own category on the day you apply, rather than relying on a figure quoted in an older guide.',
      ],
    },
    {
      heading: 'Canada work visa documents required',
      body: [
        'Canadian officers read employment letters closely. A letter that omits your hours per week, or describes duties that do not match the NOC code claimed, is one of the most common reasons an application stalls.',
      ],
      bullets: [
        'Passport valid for the intended period of work',
        'Job offer or LMIA-backed offer of employment, where required',
        'Employment reference letters stating duties, hours per week and dates',
        'Educational Credential Assessment for foreign qualifications, where required',
        'Language test results - IELTS General, CELPIP or TEF for French',
        'Proof of funds where the stream requires it, plus police and medical checks when asked',
      ],
    },
    {
      heading: 'Common Canada work visa rejection reasons',
      body: [
        'For temporary permits, the most frequent refusal ground is that the officer is not satisfied you will leave Canada at the end of your stay. That is a judgement about your ties, your funds and the consistency of your history, not about whether your paperwork is neat.',
        'The other recurring causes are employment letters that do not support the NOC code claimed, language scores below the category minimum, and an offer that does not look genuine on examination. We check these before filing.',
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
    {
      question: 'What is an LMIA and do I need one?',
      answer:
        'A Labour Market Impact Assessment is the employer showing Employment and Social Development Canada that hiring you will not displace a Canadian worker. The employer applies and pays. Some roles are exempt, such as intra-company transfers. A candidate cannot buy one, and anyone offering to sell you an LMIA should be avoided.',
    },
    {
      question: 'How long does a Canada work permit take?',
      answer:
        'Count the whole sequence: the LMIA, credential assessment if your degree is foreign, biometrics, then the permit decision. IRCC publishes current processing times by application type and country of residence - check yours on the day you apply.',
    },
    {
      question: 'What is the difference between a Canada work permit and PR?',
      answer:
        'A work permit is temporary and often tied to one employer. Permanent residence through Express Entry or a Provincial Nominee Program lets you live and work anywhere in Canada indefinitely. Many people use a work permit to build Canadian experience that improves a later PR application.',
    },
    {
      question: 'Why are Canada work permit applications refused?',
      answer:
        'Most often because the officer is not satisfied the applicant will leave at the end of the authorised stay, or because employment letters do not support the NOC code claimed. Language scores below the minimum and offers that do not appear genuine are the next most common.',
    },
    {
      question: 'Can you guarantee a job or a visa in Canada?',
      answer:
        'No. Employers decide who they hire and IRCC decides visas. We assess eligibility honestly and prepare a complete application. Anyone guaranteeing either outcome is not being straight with you.',
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
    {
      heading: 'UK work permit eligibility: sponsor licence and salary',
      body: [
        'The UK system is built around the employer. Your prospective employer must hold a sponsor licence and appear on the Home Office register of licensed sponsors, which is published and which you can search yourself before accepting any offer. An employer who is not on that register cannot sponsor you, whatever they promise.',
        'Salary is tested twice. There is a general threshold for the route, and a separate going rate for your specific occupation code, and your pay normally has to meet the higher of the two. A salary that clears the general threshold can still fail because the going rate for that occupation code is higher.',
      ],
      bullets: [
        'Check the employer on the public register of licensed sponsors before paying anyone',
        'Your occupation code determines the going rate, so the code matters as much as the salary',
        'English is normally required at CEFR B1, by approved test or a degree taught in English',
        'The Health and Care Worker route has different fees and conditions from the standard route',
      ],
    },
    {
      heading: 'UK work visa processing time and the real cost',
      body: [
        'Once a Certificate of Sponsorship is assigned, the visa decision itself is usually one of the faster parts, with a priority service available at extra cost. What takes longer is everything before it: the employer assigning the CoS, your TB test appointment, and biometrics at a visa application centre.',
        'The cost surprises more applicants than the timeline. Alongside the visa fee there is the Immigration Health Surcharge, which is charged per year of the visa and is normally paid upfront for the whole period. For a family this becomes the largest single item, so budget for it before you accept an offer.',
      ],
    },
    {
      heading: 'UK work visa documents required',
      body: [
        'A Certificate of Sponsorship is not a paper document. It is an electronic record with a reference number that your employer assigns to you, and it has to be used within a limited window after assignment or it lapses.',
      ],
      bullets: [
        'Passport or valid travel document',
        'Certificate of Sponsorship reference number from your employer',
        'Proof of English at the required level, or an exempting qualification',
        'TB test certificate from a clinic approved by the Home Office, required for applicants from India',
        'Evidence of maintenance funds held for the required period, unless your sponsor certifies maintenance',
        'Criminal record certificate for certain occupations, including healthcare and education',
      ],
    },
    {
      heading: 'Common UK work visa rejection reasons',
      body: [
        'The refusals we see most often are mechanical. Salary below the going rate for the specific occupation code is the leading cause, followed by maintenance funds that were not held for the full qualifying period before applying - a balance that dipped mid-period will fail even if the closing figure is fine.',
        'Others are an English test taken with a provider not approved for UKVI purposes, and a TB certificate from a clinic that is not on the approved list. All of these are checkable in advance.',
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
    {
      question: 'How do I check if a UK employer can sponsor me?',
      answer:
        'The Home Office publishes a register of licensed sponsors. Search the employer name there before accepting an offer or paying any fee. An employer not on that register cannot sponsor a Skilled Worker visa, whatever they tell you.',
    },
    {
      question: 'What salary is required for a UK Skilled Worker visa?',
      answer:
        'There is a general threshold for the route and a separate going rate for your specific occupation code, and you normally need the higher of the two. Because both are revised, check the current figures for your occupation code on GOV.UK for the date you apply.',
    },
    {
      question: 'How long does a UK work visa take?',
      answer:
        'After the Certificate of Sponsorship is assigned, the decision is usually among the faster stages, with a priority service at additional cost. Allow longer for the employer to assign the CoS, and for TB test and biometric appointments.',
    },
    {
      question: 'What is the Immigration Health Surcharge?',
      answer:
        'A charge for access to the NHS, payable per year of your visa and normally paid upfront for the whole period, for each family member. It is separate from the visa fee and is often the largest single cost. Check the current rate on GOV.UK before accepting an offer.',
    },
    {
      question: 'Why are UK work visas refused?',
      answer:
        'Most commonly a salary below the going rate for the specific occupation code, or maintenance funds not held for the full qualifying period. An English test from a provider not approved by UKVI, or a TB certificate from an unapproved clinic, are also frequent.',
    },
  ],
})

export const workAustralia: DestinationContent = workPage({
  path: '/work-visa/australia',
  country: 'Australia',
  eyebrow: 'Australia work visa · Surat',
  h1: 'Australia Work Visa Consultants in Surat',
  title: 'Australia Work Visa from India | 482 & Skilled Routes',
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
    {
      heading: 'Australia work visa eligibility: the skills assessment',
      body: [
        'Australia differs from most systems in one decisive way: a skills assessment is normally mandatory, and it is carried out by an assessing authority specific to your occupation rather than by the Department of Home Affairs. Engineers, IT professionals, trades and accountants each go to a different body, and each applies its own evidence rules.',
        'Your occupation also has to appear on the relevant list for the visa you want, and those lists are revised. An occupation that qualified last year may not this year, so both the occupation list and the assessing authority should be confirmed before you plan around this route.',
      ],
      bullets: [
        'The assessment is occupation-specific - the right authority depends on your ANZSCO code',
        'A negative assessment, or one in the wrong occupation, ends the application',
        'Occupation lists are revised, so confirm yours is current before applying',
        'Employer-sponsored routes additionally require the employer to be an approved sponsor',
      ],
    },
    {
      heading: 'Australia work visa processing time',
      body: [
        'The skills assessment is usually the longest stage and commonly runs to several months, depending on the authority and how complete your evidence is. Points-tested routes then add an invitation round: you submit an Expression of Interest through SkillSelect and wait to be invited, which is not guaranteed and depends on your score against others in the same occupation.',
        'The Department of Home Affairs publishes current processing times by visa subclass. Treat those as the final stage only, not as the total timeline.',
      ],
    },
    {
      heading: 'Australia work visa documents required',
      body: [
        'Australian assessing authorities are strict about evidence of employment. Reference letters generally need to state your duties in enough detail to match the ANZSCO occupation, along with hours worked and exact dates, and payslips or tax records are often requested to corroborate them.',
      ],
      bullets: [
        'Passport and identity documents',
        'Qualification certificates and academic transcripts',
        'Positive skills assessment from the authority for your occupation',
        'Detailed employment references stating duties, hours and dates',
        'English test results at the level your stream requires - IELTS, PTE Academic or equivalent',
        'Police clearance certificates and health examination results',
      ],
    },
    {
      heading: 'Common Australia work visa rejection reasons',
      body: [
        'The most common failure is at the skills assessment rather than the visa stage: evidence that does not demonstrate the claimed occupation, or an application lodged with the wrong assessing authority. Because the assessment precedes the visa, this stops the process early and the fee is not recoverable.',
        'After that, the recurring causes are an English score below the level the stream requires, an occupation no longer on the applicable list at the time of application, and for sponsored routes a nomination that was not approved. Health and character requirements apply throughout.',
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
    {
      question: 'Do I need a skills assessment for an Australian work visa?',
      answer:
        'For most skilled routes, yes, and it is normally the first substantial step. The assessing authority depends on your occupation - a different body handles IT, engineering, trades and accounting - and each has its own evidence requirements.',
    },
    {
      question: 'How long does an Australian skilled visa take?',
      answer:
        'The skills assessment is usually the longest stage and commonly runs to several months. Points-tested routes then depend on receiving an invitation, which is not guaranteed. Home Affairs publishes processing times for the visa decision itself, which is the final stage only.',
    },
    {
      question: 'What English score do I need for Australia?',
      answer:
        'It depends on the visa and the stream, and higher scores also earn points on points-tested routes. Check the requirement for your specific subclass on the Department of Home Affairs website, and note that test results must be current when you apply.',
    },
    {
      question: 'Why are Australian skilled visa applications refused?',
      answer:
        'Most often the skills assessment fails first - evidence that does not demonstrate the claimed occupation, or the wrong assessing authority. After that: English below the required level, an occupation no longer on the applicable list, or a nomination that was not approved.',
    },
    {
      question: 'Can you guarantee a job or a visa in Australia?',
      answer:
        'No. Employers decide who they hire and the Department of Home Affairs decides visas. We check eligibility honestly, including whether your occupation is currently listed, and prepare a complete application.',
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
