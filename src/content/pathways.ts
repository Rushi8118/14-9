import type { DestinationContent, ContentSection } from './destination-types'

/**
 * Route guides for people who want to stay and work abroad after study, move
 * between countries, or move from South Asia. Each page carries information
 * specific to its route (visa names, checks, departure clearances) rather than
 * a swapped country name, and never promises a visa, job or extension.
 *
 * Rules change often: every page points to the official source and shows the
 * "last updated" date through <ImmigrationDisclaimer />.
 */

type PathwayInput = {
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

function build(p: PathwayInput): DestinationContent {
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

export const pathways: DestinationContent[] = [
  // ─── Stay and work after study ───────────────────────────────
  build({
    slug: 'uk-student-visa-to-skilled-worker-visa',
    destination: 'United Kingdom',
    eyebrow: 'UK · study to work',
    h1: 'UK Post-Study Work Visa: Switching from a Student Visa',
    title: 'UK Post-Study Work Visa: Student to Skilled Worker',
    description: 'Your UK student visa is ending. How to convert it into a post-study work visa: licensed sponsor, eligible job, salary, English and the timing rules that matter.',
    keywords: 'switch from student visa to skilled worker visa uk, how to change student visa to work visa in uk, can you switch from student visa to skilled worker visa in uk, uk skilled worker visa process, skilled worker visa sponsorship jobs london',
    heroDescription: 'Studying in London or elsewhere in the UK and want to keep working after your course? The Skilled Worker route may let you stay — if a licensed sponsor offers you an eligible job.',
    highlights: [
      { title: 'Licensed sponsor', desc: 'Only employers on the Home Office sponsor register can issue a Certificate of Sponsorship.' },
      { title: 'Eligible job', desc: 'The role and salary must meet current Skilled Worker thresholds.' },
      { title: 'Timing matters', desc: 'Students usually cannot switch before their course is completed.' },
      { title: 'Apply in the UK', desc: 'An eligible switch is usually made from inside the UK before your visa expires.' },
    ],
    sections: [
      {
        heading: 'Can you switch from a Student visa to a Skilled Worker visa?',
        body: [
          'Many students can apply to switch into the Skilled Worker route from inside the UK, but the timing rules are strict. In most cases you must have completed your course before your Skilled Worker start date; PhD students have different rules. Check the current GOV.UK guidance for your situation before accepting a start date.',
          'The key requirement is a genuine job offer from an employer that holds a sponsor licence, who assigns you a Certificate of Sponsorship (CoS) for an eligible occupation at the required salary.',
        ],
      },
      {
        heading: 'Student visa vs Graduate visa vs Skilled Worker visa',
        body: [
          'The Graduate visa lets eligible graduates stay and work for a limited period without a sponsor, but it cannot be extended and does not lead directly to settlement. The Skilled Worker visa is tied to a sponsoring employer and can count towards settlement if you continue to meet the rules.',
          'Some graduates move to the Graduate route first and look for a sponsored role while working. We compare both options for your course end date and job prospects.',
        ],
      },
      {
        heading: 'How to find genuine sponsored jobs in the UK',
        body: [
          'Search for roles in your field, then check every employer on the official "Register of licensed sponsors: workers" published on GOV.UK. A real sponsor will interview you, give you a contract and explain your salary and duties.',
        ],
        bullets: [
          'Match the job to an eligible occupation code',
          'Confirm the salary meets the current threshold for that occupation',
          'Keep your English and qualification evidence ready',
          'Note that some sectors, such as care work, have had extra restrictions — check current rules',
        ],
      },
    ],
    eligibility: [
      'A job offer from a Home Office licensed sponsor',
      'A Certificate of Sponsorship for an eligible occupation',
      'Salary at or above the current required level',
      'English language at the required level (your UK degree may count)',
      'Course completion timing that allows the switch',
    ],
    documents: [
      'Passport and current BRP / eVisa details',
      'Certificate of Sponsorship reference number',
      'Degree certificate or course completion evidence',
      'Proof of English language ability',
      'Bank statements if your sponsor does not certify maintenance',
      'Tuberculosis test certificate if required for your nationality',
    ],
    faqs: [
      { question: 'Can I switch to a Skilled Worker visa before finishing my course?', answer: 'Usually not. Most students must complete their course before their Skilled Worker employment starts. Check GOV.UK for the rule that applies to your course level.' },
      { question: 'Can you provide a sponsored job offer?', answer: 'We can introduce suitable candidates to registered employers who are recruiting. The employer interviews you and decides. We never sell job offers or Certificates of Sponsorship — buying one can lead to refusal, visa cancellation and bans.' },
      { question: 'Does a job offer extend my Student visa?', answer: 'No. You must make a new Skilled Worker application and have it approved. Until then, your current visa conditions and expiry date still apply.' },
      { question: 'How do I check if a UK employer can sponsor me?', answer: 'Search the employer name on the official Register of licensed sponsors: workers on GOV.UK.' },
    ],
  }),

  build({
    slug: 'uk-graduate-visa-to-skilled-worker-visa',
    destination: 'United Kingdom',
    eyebrow: 'UK · graduate route',
    h1: 'UK Post-Study Work Visa: Graduate Route to Skilled Worker',
    title: 'UK Post-Study Work Visa: Graduate Route to Skilled Worker',
    description: 'The UK post-study work visa explained: how the Graduate Route works, when to start job hunting, sponsor checks, and how to switch before it expires.',
    keywords: 'switching from graduate visa to skilled worker uk, uk graduate visa to skilled worker visa, uk graduate visa vs skilled worker visa, can i switch from graduate visa to skilled worker visa uk, skilled worker visa uk minimum salary',
    heroDescription: 'The Graduate visa gives you time to work in the UK, but it cannot be extended. Plan your move to a sponsored route early.',
    highlights: [
      { title: 'Not extendable', desc: 'The Graduate visa has a fixed length and ends on its expiry date.' },
      { title: 'No sponsor needed now', desc: 'Use the time to build UK experience in your field.' },
      { title: 'Switch in the UK', desc: 'Eligible graduates can usually apply for Skilled Worker from inside the UK.' },
      { title: 'Start early', desc: 'Employers need time to assign a Certificate of Sponsorship.' },
    ],
    sections: [
      {
        heading: 'Why plan early on the Graduate route',
        body: [
          'The Graduate visa is a one-time permission. When it ends you must leave or already hold another visa, so start looking for sponsoring employers well before your expiry date. The length of the Graduate route has been under review by the UK government — check GOV.UK for the period that applies to you.',
        ],
      },
      {
        heading: 'Making your current job a sponsored job',
        body: [
          'If your current employer is happy with your work, ask whether they hold a sponsor licence or would consider applying for one. The role must still meet the Skilled Worker occupation and salary rules.',
        ],
      },
      {
        heading: 'Salary and occupation checks',
        body: [
          'Skilled Worker salary thresholds and the list of eligible occupations were changed several times in 2024–2025. Some new entrants may qualify for a reduced threshold. We check the current figures for your occupation code before you accept an offer.',
        ],
      },
    ],
    eligibility: [
      'Valid Graduate visa at the time of application',
      'Job offer and Certificate of Sponsorship from a licensed sponsor',
      'Eligible occupation and salary under current rules',
      'English requirement (usually met by your UK degree)',
    ],
    documents: [
      'Passport and eVisa / BRP',
      'Certificate of Sponsorship reference',
      'UK degree certificate',
      'Payslips or contract details if requested',
    ],
    faqs: [
      { question: 'Can I extend my Graduate visa?', answer: 'No. The Graduate visa cannot be extended. You need to switch to another route, such as Skilled Worker, before it expires.' },
      { question: 'What happens if I do not find a sponsor in time?', answer: 'You would need to leave the UK or qualify for a different visa before your Graduate visa ends. We can review other routes, including moving to another country.' },
      { question: 'Is the Graduate visa better than Skilled Worker?', answer: 'They serve different purposes. Graduate gives flexibility without a sponsor for a limited time; Skilled Worker is employer-tied but can lead towards settlement.' },
    ],
  }),

  build({
    slug: 'canada-pgwp-to-pr',
    destination: 'Canada',
    eyebrow: 'Canada · study to work',
    h1: 'Canada Post-Study Work Visa: PGWP to Permanent Residence',
    title: 'Canada Post-Study Work Visa: PGWP to PR',
    description: 'How international graduates in Canada move from a Post-Graduation Work Permit (PGWP) to permanent residence through Express Entry and provincial programs.',
    keywords: 'canada pgwp to pr, canada post graduate work permit to pr, canada pgwp processing time, canada pgwp program list, canada work permit after study',
    heroDescription: 'A PGWP lets eligible graduates gain Canadian work experience. Permanent residence is a separate application through programs such as Express Entry or a Provincial Nominee Program.',
    highlights: [
      { title: 'PGWP is temporary', desc: 'It cannot usually be extended and does not become PR automatically.' },
      { title: 'Canadian experience', desc: 'Skilled work experience in Canada can make you eligible for the Canadian Experience Class.' },
      { title: 'Provincial options', desc: 'Many provinces have streams for their own graduates and workers.' },
      { title: 'Field of study rules', desc: 'PGWP eligibility for some programs now depends on field of study.' },
    ],
    sections: [
      {
        heading: 'From PGWP to permanent residence',
        body: [
          'Most graduates build skilled Canadian work experience on their PGWP, then create an Express Entry profile. The Canadian Experience Class generally needs at least one year of skilled work experience in Canada within the last few years, plus language test results.',
          'Provincial Nominee Programs (PNPs) can add a nomination for graduates or workers a province needs. Each province publishes its own criteria and invitation rounds.',
        ],
      },
      {
        heading: 'Job offers and LMIAs in Express Entry',
        body: [
          'In 2025 Canada removed extra Express Entry points for job offers. A job offer can still matter for some provincial streams and work permits, but buying a job offer or LMIA is illegal and can lead to a five-year ban for misrepresentation.',
        ],
      },
      {
        heading: 'If your PGWP is about to expire',
        body: [
          'Check whether you qualify for another work permit, a provincial stream, or a bridging option under current IRCC policy. Maintaining status matters — apply before your permit expires if you are eligible for another permit.',
        ],
      },
    ],
    eligibility: [
      'Valid PGWP or recently expired status with eligibility to restore/extend',
      'Skilled Canadian work experience (for Canadian Experience Class)',
      'Language test results at the required level (IELTS General / CELPIP / TEF / PTE Core as accepted)',
      'Education credentials (and ECA where required)',
    ],
    documents: [
      'Passport and PGWP',
      'Reference letters with duties, hours and salary',
      'Pay stubs, T4s and Notices of Assessment',
      'Language test results',
      'Police certificates and medical exam when requested',
    ],
    faqs: [
      { question: 'Does a PGWP lead directly to PR?', answer: 'No. The PGWP is a work permit. Permanent residence is a separate application through programs such as Express Entry or a PNP.' },
      { question: 'Can I extend my PGWP?', answer: 'Generally no, apart from limited policies announced by IRCC. Check the current IRCC guidance for your situation.' },
      { question: 'Can you get me an LMIA job?', answer: 'We can introduce you to registered Canadian employers who are recruiting. The employer decides and applies for any LMIA. Never pay for an LMIA or job offer — it is illegal in Canada.' },
    ],
  }),

  build({
    slug: 'australia-485-to-employer-sponsored-visa',
    destination: 'Australia',
    eyebrow: 'Australia · study to work',
    h1: 'Australia Post-Study Work Visa: Subclass 485 to Sponsorship',
    title: 'Australia Post-Study Work Visa: 485 to Sponsorship',
    description: 'Moving from Australia\'s Temporary Graduate (485) visa to an employer-sponsored visa such as Skills in Demand, or skilled migration options.',
    keywords: 'australia 485 to 482, 485 visa to skills in demand visa, australia post study work visa to pr, employer sponsored visa australia, australia temporary graduate visa next steps',
    heroDescription: 'The Temporary Graduate visa (subclass 485) gives you time to gain Australian work experience. Staying longer usually means an employer-sponsored or skilled visa.',
    highlights: [
      { title: 'Skills in Demand visa', desc: 'Replaced the Temporary Skill Shortage (482) visa for new applications from December 2024.' },
      { title: 'Approved sponsor', desc: 'Your employer must be an approved standard business sponsor.' },
      { title: 'Skills assessment', desc: 'Many occupations need a positive assessment from the relevant authority.' },
      { title: 'Registered advice', desc: 'Immigration advice in Australia must come from a registered migration agent or lawyer.' },
    ],
    sections: [
      {
        heading: 'Employer-sponsored options after a 485 visa',
        body: [
          'An approved sponsor can nominate you for an eligible occupation under the Skills in Demand visa, if you meet the skills, experience and English requirements. Permanent employer-sponsored options (such as subclass 186) may follow after working for a sponsor.',
        ],
      },
      {
        heading: 'Skilled independent and state nominated visas',
        body: [
          'Some graduates qualify for points-tested visas without a sponsor, such as subclass 189, or state nominated subclass 190 and regional 491. Points depend on age, English, experience, Australian study and other factors.',
        ],
      },
      {
        heading: 'Checking a sponsor',
        body: [
          'Ask the employer to confirm they are an approved sponsor and that the position is genuine. A genuine sponsor will interview you and cannot legally ask you to pay for sponsorship — payment for visa sponsorship is an offence in Australia.',
        ],
      },
    ],
    eligibility: [
      'Nomination by an approved sponsor for an eligible occupation',
      'Relevant work experience (usually at least one year)',
      'Skills assessment where required',
      'English at the required level',
      'Health and character requirements',
    ],
    documents: [
      'Passport and current visa grant',
      'Employment references and payslips',
      'Qualifications and skills assessment outcome',
      'English test results',
      'Police certificates and health examinations',
    ],
    faqs: [
      { question: 'Is the 482 visa still available?', answer: 'The Temporary Skill Shortage (482) visa was replaced for new applications by the Skills in Demand visa in December 2024. Check the Department of Home Affairs for current streams.' },
      { question: 'Can an employer charge me for sponsorship?', answer: 'No. It is against Australian law for anyone to ask for or receive payment in return for sponsorship.' },
      { question: 'Can you give me Australian immigration advice?', answer: 'Advice about Australian visas must come from a registered migration agent or an Australian legal practitioner. Where needed, our partner lawyers provide it.' },
    ],
  }),

  build({
    slug: 'new-zealand-accredited-employer-work-visa',
    destination: 'New Zealand',
    eyebrow: 'New Zealand · work',
    h1: 'New Zealand Post-Study Work Visa: the AEWV Explained',
    title: 'New Zealand Post-Study Work Visa: AEWV Guide',
    description: 'How the New Zealand Accredited Employer Work Visa works for students and overseas applicants: accredited employers, job checks, pay and English.',
    keywords: 'new zealand accredited employer work visa, new zealand accredited employer work visa jobs, new zealand accredited employer work visa processing time, new zealand work visa for indians, new zealand post study work visa',
    heroDescription: 'Most employer-based work visas in New Zealand go through the Accredited Employer Work Visa. The employer must be accredited and pass a job check before you apply.',
    highlights: [
      { title: 'Three-step process', desc: 'Employer accreditation, job check, then your visa application.' },
      { title: 'Pay rules', desc: 'Roles must meet the pay and conditions set for the job check.' },
      { title: 'Official job token', desc: 'You apply using the job check details your employer shares with you.' },
      { title: 'Licensed advice', desc: 'Immigration advice for New Zealand must come from a licensed adviser or lawyer.' },
    ],
    sections: [
      {
        heading: 'How the AEWV works',
        body: [
          'First the employer becomes accredited with Immigration New Zealand. Next the employer applies for a job check for the specific role. Once approved, you apply for the visa linked to that job.',
          'Students in New Zealand on a Post Study Work Visa may use it to gain experience before moving to an employer-based visa.',
        ],
      },
      {
        heading: 'Checking the employer',
        body: [
          'Immigration New Zealand publishes a list of accredited employers. Confirm the employer appears on it and that you receive a written employment agreement. It is illegal for employers to charge you a premium for a job.',
        ],
      },
    ],
    eligibility: [
      'Job offer from an accredited employer with an approved job check',
      'Qualifications or experience required for the role',
      'Health and character requirements',
      'English requirement for some roles',
    ],
    documents: [
      'Passport',
      'Job check token or reference from the employer',
      'Employment agreement',
      'Qualifications and work references',
      'Police certificates and medical certificates when required',
    ],
    faqs: [
      { question: 'Where can I find accredited employers?', answer: 'Immigration New Zealand publishes the list of accredited employers on its official website.' },
      { question: 'Can I pay for an AEWV job?', answer: 'No. Charging a worker a premium for employment is illegal in New Zealand. Report any such request.' },
      { question: 'Can I apply from India, Pakistan, Bangladesh or Sri Lanka?', answer: 'Yes, you can apply from outside New Zealand once an accredited employer has an approved job check for you.' },
    ],
  }),

  // ─── Move between countries ─────────────────────────────────
  build({
    slug: 'move-from-uk-to-australia',
    destination: 'Australia',
    eyebrow: 'UK → Australia',
    h1: 'Moving from the UK to Australia: Lawful Visa Pathways',
    title: 'Move from the UK to Australia: Visa Options',
    description: 'Visa options for people living in the UK who want to move to Australia: skilled, employer-sponsored and study routes, skills assessments and registration.',
    keywords: 'move from uk to australia, move from uk to australia jobs, moving from uk to australia as a nurse, uk to australia skilled visa, moving from uk to australia checklist',
    heroDescription: 'Living in the UK on a study or work visa and considering Australia? Your UK visa does not transfer — you apply for an Australian visa on your own eligibility.',
    highlights: [
      { title: 'No visa transfer', desc: 'UK permission has no effect on an Australian application.' },
      { title: 'Skills assessment', desc: 'Most skilled visas need your occupation assessed in Australia.' },
      { title: 'Healthcare registration', desc: 'Nurses and doctors also need Australian professional registration (AHPRA).' },
      { title: 'Apply from the UK', desc: 'You can usually apply while you still hold your UK visa.' },
    ],
    sections: [
      {
        heading: 'Main routes from the UK to Australia',
        body: [
          'Skilled workers may qualify for points-tested visas (189, 190, 491) or employer-sponsored visas such as Skills in Demand. Students can apply for an Australian Student visa for a new course. The right route depends on your occupation, age, English and experience — including experience gained in the UK.',
        ],
      },
      {
        heading: 'Moving to Australia as a nurse or healthcare worker',
        body: [
          'UK-trained nurses and doctors usually need registration with the relevant Australian board through AHPRA, as well as a visa. Registration can take months, so start it early.',
        ],
      },
      {
        heading: 'Keep your UK status while you apply',
        body: [
          'Stay within your UK visa conditions until you leave. If your UK visa ends before your Australian visa is granted, you must still comply with UK rules.',
        ],
      },
    ],
    eligibility: [
      'Occupation on the relevant skilled list (for skilled visas)',
      'Positive skills assessment where required',
      'Competent English or higher, depending on the visa',
      'Health and character requirements',
    ],
    documents: [
      'Passport and UK visa details',
      'UK and home-country employment references',
      'Qualifications and skills assessment',
      'English test results',
      'UK police certificate (ACRO) and home-country police certificates',
    ],
    faqs: [
      { question: 'Can I transfer my UK visa to Australia?', answer: 'No. Visas do not transfer between countries. You apply for an Australian visa on your own eligibility.' },
      { question: 'Does UK work experience count for Australia?', answer: 'Relevant skilled experience gained in the UK can count towards skills assessments and points, if it meets the assessing authority\'s rules.' },
      { question: 'Why do people move from the UK to Australia?', answer: 'Common reasons are career opportunities, family, lifestyle and longer-term residence options. Every route still depends on meeting Australia\'s official criteria.' },
    ],
  }),

  build({
    slug: 'move-from-uk-to-canada',
    destination: 'Canada',
    eyebrow: 'UK → Canada',
    h1: 'Moving from the UK to Canada for Work: Visa Options',
    title: 'Move from the UK to Canada for Work: Options',
    description: 'Lawful options for people in the UK who want to work in Canada: Express Entry, employer work permits, provincial programs and healthcare registration.',
    keywords: 'move from uk to canada, moving from uk to canada for work, moving from uk to canada as a nurse, uk to canada work permit, uk to canada express entry',
    heroDescription: 'Whether you are British or living in the UK on a visa, moving to Canada means qualifying for a Canadian permit or permanent residence in your own right.',
    highlights: [
      { title: 'Express Entry', desc: 'Points-based permanent residence for skilled workers, including those abroad.' },
      { title: 'Employer work permits', desc: 'Usually need an LMIA or an LMIA-exempt category.' },
      { title: 'Provincial programs', desc: 'Some provinces nominate overseas workers in demand.' },
      { title: 'Credential recognition', desc: 'Regulated jobs such as nursing need Canadian licensing.' },
    ],
    sections: [
      {
        heading: 'Routes from the UK to Canada',
        body: [
          'Skilled workers can create an Express Entry profile using the Federal Skilled Worker program if they meet its criteria, including an Educational Credential Assessment (ECA) and language results. Employer-specific work permits usually require the employer to obtain a positive LMIA unless the role is exempt.',
          'Young British citizens may also be eligible for International Experience Canada, subject to age limits and quotas. People living in the UK on a visa follow the rules for their own nationality.',
        ],
      },
      {
        heading: 'Moving to Canada as a nurse or doctor',
        body: [
          'Internationally educated nurses usually start with the National Nursing Assessment Service (NNAS) and then the provincial regulator. Doctors go through the Medical Council of Canada and provincial colleges. Professional licensing is separate from immigration.',
        ],
      },
    ],
    eligibility: [
      'Skilled work experience and education assessed for Canada',
      'Language test results (IELTS General, CELPIP, PTE Core or TEF as accepted)',
      'Proof of funds for Federal Skilled Worker unless exempt',
      'Job offer with LMIA for most employer-specific permits',
    ],
    documents: [
      'Passport and UK residence documents',
      'Educational Credential Assessment',
      'Employment reference letters',
      'Language test results',
      'Police certificates from the UK and other countries lived in',
    ],
    faqs: [
      { question: 'Can I move from the UK to Canada without a job offer?', answer: 'Express Entry does not require a job offer for eligible skilled workers, but invitations are competitive and depend on your score and draws.' },
      { question: 'Does my UK visa help my Canadian application?', answer: 'Your UK visa itself does not transfer, but skilled UK work experience may count towards Canadian program requirements.' },
    ],
  }),

  build({
    slug: 'move-from-uk-to-new-zealand',
    destination: 'New Zealand',
    eyebrow: 'UK → New Zealand',
    h1: 'Moving from the UK to New Zealand: Work and Residence Options',
    title: 'Move from the UK to New Zealand: Visa Options',
    description: 'Visa options for people in the UK moving to New Zealand: Accredited Employer Work Visa, Green List roles, skilled residence and nursing registration.',
    keywords: 'move from uk to new zealand, migrate from uk to new zealand, moving from uk to new zealand as a nurse, moving from england to new zealand, uk to new zealand work visa',
    heroDescription: 'New Zealand has employer-based work visas and Green List residence pathways for roles in demand. Your eligibility depends on your job, qualifications and registration.',
    highlights: [
      { title: 'Accredited employers', desc: 'Most work visas need an accredited employer and job check.' },
      { title: 'Green List', desc: 'Listed roles may offer a faster route to residence.' },
      { title: 'Nursing Council', desc: 'Nurses need registration with the Nursing Council of New Zealand.' },
      { title: 'Licensed advisers', desc: 'Advice on NZ immigration must come from a licensed adviser or lawyer.' },
    ],
    sections: [
      {
        heading: 'Work first, then residence',
        body: [
          'Most people moving from the UK start with an Accredited Employer Work Visa. Some roles on New Zealand\'s Green List can lead to residence directly or after a period of work, if you meet the qualification, registration and pay requirements.',
        ],
      },
      {
        heading: 'Healthcare workers',
        body: [
          'UK-registered nurses and many allied health professionals need New Zealand registration before working. Several healthcare roles have appeared on the Green List — check the current list with Immigration New Zealand.',
        ],
      },
    ],
    eligibility: [
      'Job offer from an accredited employer, or a Green List role',
      'Required qualifications and occupational registration',
      'Health and character requirements',
    ],
    documents: [
      'Passport and UK residence documents',
      'Qualifications and registration evidence',
      'Employment agreement',
      'Police certificates and medical certificates',
    ],
    faqs: [
      { question: 'Can I move to New Zealand without a job?', answer: 'Most work visas need a job offer from an accredited employer. Some skilled residence options also rely on having a job in New Zealand.' },
      { question: 'Is the Green List a guarantee of residence?', answer: 'No. It lists roles with specific pathways, but you still need to meet every requirement and have your application approved.' },
    ],
  }),

  build({
    slug: 'move-from-uk-to-europe',
    destination: 'Germany',
    eyebrow: 'UK → Europe',
    h1: 'Moving from the UK to Europe for Work: Visa Options',
    title: 'Move from the UK to Europe for Work: Options',
    description: 'Work visa options in Europe for people living in the UK: EU Blue Card, Germany Opportunity Card, national work permits and qualification recognition.',
    keywords: 'uk to europe work visa, uk to eu work visa, move from uk to europe for work, eu blue card from uk, germany opportunity card from uk',
    heroDescription: 'Each European country runs its own work permits, with the EU Blue Card available for highly qualified workers in most EU states. Your UK visa does not give you rights in the EU.',
    highlights: [
      { title: 'EU Blue Card', desc: 'For qualified workers with a job offer meeting a salary threshold.' },
      { title: 'Germany Opportunity Card', desc: 'Points-based job-search residence for eligible skilled people.' },
      { title: 'National permits', desc: 'Countries like the Netherlands, Ireland and Poland have their own routes.' },
      { title: 'Recognition', desc: 'Degrees and regulated professions may need official recognition.' },
    ],
    sections: [
      {
        heading: 'Choosing a European country',
        body: [
          'Rules differ widely. Germany offers the EU Blue Card, skilled worker visas and the Opportunity Card. Ireland uses Critical Skills and General Employment Permits. The Netherlands has a Highly Skilled Migrant scheme through recognised sponsors. We compare these for your occupation.',
        ],
      },
      {
        heading: 'Getting your qualifications recognised',
        body: [
          'Germany and several other countries require your degree to be recognised or comparable before some visas. Regulated professions such as nursing need a professional licence in that country, often with language requirements.',
        ],
      },
    ],
    eligibility: [
      'Recognised degree or vocational qualification',
      'Job offer meeting the country\'s salary and role rules (for most permits)',
      'Language skills where required',
      'Health insurance and proof of funds where required',
    ],
    documents: [
      'Passport and UK residence documents',
      'Degree and recognition certificates',
      'Employment contract or job offer',
      'CV and references',
      'Police certificates',
    ],
    faqs: [
      { question: 'Can I work in Europe with my UK visa?', answer: 'No. A UK visa does not give any right to live or work in the EU. You need a permit from the European country you move to.' },
      { question: 'Which European country is easiest to move to?', answer: 'No route is guaranteed or "easy". The best fit depends on your occupation, qualifications, language and salary offer.' },
    ],
  }),

  // ─── From South Asia ────────────────────────────────────────
  build({
    slug: 'india-to-uk-work-visa',
    destination: 'United Kingdom',
    eyebrow: 'India → UK',
    h1: 'India to UK Work Visa: Process, Cost and Requirements',
    title: 'India to UK Work Visa: Process & Requirements',
    description: 'How Indian applicants get a UK Skilled Worker visa: licensed sponsor, TB test, English, costs, processing time and eMigrate checks.',
    keywords: 'india to uk work visa, india to uk work visa cost, india to uk work visa process, india to uk work visa requirements, india to uk work visa processing time, india to london work visa',
    heroDescription: 'Most Indians working in the UK hold a Skilled Worker visa, which needs a job offer from a Home Office licensed sponsor.',
    highlights: [
      { title: 'Licensed sponsor', desc: 'The employer must hold a UK sponsor licence.' },
      { title: 'TB test', desc: 'Indian applicants need a certificate from an approved clinic.' },
      { title: 'Costs', desc: 'Visa fee plus Immigration Health Surcharge, set by the UK government.' },
      { title: 'Apply from India', desc: 'Biometrics at a visa application centre in India.' },
    ],
    sections: [
      {
        heading: 'India to UK work visa process',
        body: [
          'You receive a Certificate of Sponsorship from a licensed UK employer, apply online, pay the visa fee and Immigration Health Surcharge, and attend biometrics at a visa application centre in India. A tuberculosis test from a UKVI-approved clinic is required for applicants from India.',
        ],
      },
      {
        heading: 'India to UK work visa cost',
        body: [
          'The main costs are the visa application fee and the Immigration Health Surcharge, both set by the UK government and depending on the length of your visa. Add the TB test, English test, translations and travel. We give you an itemised list before you start.',
        ],
      },
      {
        heading: 'Checks before you leave India',
        body: [
          'If your passport has ECR (Emigration Check Required) status, overseas employment in notified countries needs emigration clearance through eMigrate. Also check that anyone recruiting you is a registered recruiting agent on eMigrate.',
        ],
      },
    ],
    eligibility: [
      'Job offer from a UK licensed sponsor with a Certificate of Sponsorship',
      'Eligible occupation and salary',
      'English at level B1 or equivalent',
      'TB test certificate',
    ],
    documents: [
      'Passport',
      'Certificate of Sponsorship reference',
      'English test (SELT) or degree taught in English with evidence',
      'TB test certificate',
      'Criminal record certificate for certain health, care and education roles',
    ],
    faqs: [
      { question: 'How long does a UK work visa take from India?', answer: 'UKVI publishes current processing times for applications made outside the UK. Priority services may be available for an extra fee. Timelines are never guaranteed.' },
      { question: 'Do I need IELTS for a UK work visa?', answer: 'You need to prove English at the required level. An approved Secure English Language Test is one option; some degrees also count.' },
      { question: 'Do you charge for UK job offers?', answer: 'No. We never charge for a job offer. Any fees are for application support and are listed in writing.' },
    ],
  }),

  build({
    slug: 'pakistan-to-uk-work-visa',
    destination: 'United Kingdom',
    eyebrow: 'Pakistan → UK',
    h1: 'Pakistan to UK Work Visa: Requirements and Process',
    title: 'Pakistan to UK Work Visa: Requirements & Cost',
    description: 'How applicants from Pakistan get a UK Skilled Worker visa: licensed sponsor, TB test, English, costs and Bureau of Emigration protector registration.',
    keywords: 'pakistan to uk work visa, pakistan to uk work visa cost, pakistan to uk work visa requirements, pakistan to uk work permit, how to get uk work visa from pakistan',
    heroDescription: 'Applicants from Pakistan usually work in the UK on a Skilled Worker visa sponsored by a Home Office licensed employer.',
    highlights: [
      { title: 'Licensed sponsor', desc: 'Check the employer on the official UK sponsor register.' },
      { title: 'TB test', desc: 'Required for UK applicants resident in Pakistan.' },
      { title: 'Protector registration', desc: 'Workers going abroad for employment register with Pakistan\'s Bureau of Emigration.' },
      { title: 'Biometrics in Pakistan', desc: 'Given at a UK visa application centre.' },
    ],
    sections: [
      {
        heading: 'How to get a UK work visa from Pakistan',
        body: [
          'Receive a Certificate of Sponsorship from a licensed UK employer, apply online, pay the visa fee and Immigration Health Surcharge, and give biometrics at a visa application centre in Pakistan. A TB test from an approved clinic is required.',
        ],
      },
      {
        heading: 'Pakistan emigration requirements',
        body: [
          'People leaving Pakistan for overseas employment are generally required to register with the Bureau of Emigration & Overseas Employment (Protector of Emigrants). Only licensed Overseas Employment Promoters may recruit workers in Pakistan — check any recruiter with the Bureau.',
        ],
      },
    ],
    eligibility: [
      'Certificate of Sponsorship from a UK licensed sponsor',
      'Eligible occupation and salary',
      'English at the required level',
      'TB test certificate',
    ],
    documents: [
      'Passport and CNIC',
      'Certificate of Sponsorship reference',
      'English language evidence',
      'TB test certificate',
      'Educational certificates attested where required',
    ],
    faqs: [
      { question: 'What does a UK work visa cost from Pakistan?', answer: 'The UK government sets the visa fee and Immigration Health Surcharge, which depend on the visa length. TB test, English test and travel are extra.' },
      { question: 'Can I get a UK work visa without a sponsor?', answer: 'The Skilled Worker visa needs a licensed sponsor. Some other UK routes do not, but they have their own strict criteria.' },
    ],
  }),

  build({
    slug: 'pakistan-to-europe-work-visa',
    destination: 'Germany',
    eyebrow: 'Pakistan → Europe',
    h1: 'Europe Work Visa for Pakistani Applicants',
    title: 'Europe Work Visa for Pakistanis: Real Options',
    description: 'Genuine European work visa options for Pakistani applicants: EU Blue Card, Germany skilled worker and Opportunity Card, national permits and scam warnings.',
    keywords: 'europe work visa for pakistani, europe work permit for pakistani, europe work visa for pakistan, europe work visa for pakistani 2026, germany work visa for pakistani',
    heroDescription: 'European countries issue work visas through their own embassies and national rules. Genuine options exist, but "free visa" offers aimed at Pakistani workers are a common scam.',
    highlights: [
      { title: 'Country-by-country', desc: 'Each Schengen country runs its own national (D) work visa.' },
      { title: 'Germany routes', desc: 'Skilled worker visa, EU Blue Card and Opportunity Card for eligible people.' },
      { title: 'Recognition', desc: 'Your qualifications may need recognition before applying.' },
      { title: 'No "free visa"', desc: 'Genuine employers still require interviews, contracts and embassy approval.' },
    ],
    sections: [
      {
        heading: 'Genuine European work routes',
        body: [
          'Qualified professionals with a job offer meeting the salary threshold may qualify for an EU Blue Card. Germany also has skilled worker visas for recognised vocational qualifications and a points-based Opportunity Card for job searching. Countries such as Poland, Romania and Croatia issue work permits requested by the employer before you apply for a visa.',
        ],
      },
      {
        heading: 'Why so many Europe visa offers are scams',
        body: [
          'Search results for "Europe free work visa for Pakistani" attract fraudsters. A work permit is issued by that country\'s authority to a real employer, and the visa is decided by the embassy. Verify the employer and permit before paying anyone, and check recruiters with the Bureau of Emigration & Overseas Employment.',
        ],
      },
    ],
    eligibility: [
      'Job offer or work permit issued for a real employer',
      'Qualifications recognised where required',
      'Language skills where the job requires them',
      'Health insurance and funds where required',
    ],
    documents: [
      'Passport and CNIC',
      'Work permit or employment contract',
      'Degrees and recognition documents',
      'Police clearance certificate',
      'Bureau of Emigration protector registration before departure',
    ],
    faqs: [
      { question: 'Is there a free work visa for Pakistanis in Europe?', answer: 'No government offers a "free visa" job scheme. Some employers pay certain costs, but anyone promising a guaranteed free visa is a warning sign.' },
      { question: 'Which European country gives work visas to Pakistanis?', answer: 'Many do, subject to national rules and a genuine job. The best option depends on your skills and qualifications.' },
    ],
  }),

  build({
    slug: 'bangladesh-to-uk-work-visa',
    destination: 'United Kingdom',
    eyebrow: 'Bangladesh → UK',
    h1: 'Bangladesh to UK Work Visa: How to Apply',
    title: 'Bangladesh to UK Work Visa: How to Apply',
    description: 'How applicants from Bangladesh get a UK Skilled Worker visa: licensed sponsor, TB test, English, BMET clearance and how to avoid recruitment fraud.',
    keywords: 'bangladesh to uk work visa, bangladesh to uk work permit, how to get uk work visa from bangladesh, uk skilled worker visa bangladesh, uk work visa requirements bangladesh',
    heroDescription: 'Applicants from Bangladesh usually need a Skilled Worker visa sponsored by a licensed UK employer, plus overseas employment clearance before departure.',
    highlights: [
      { title: 'Licensed sponsor', desc: 'The employer must be on the UK sponsor register.' },
      { title: 'TB test', desc: 'Required for applicants resident in Bangladesh.' },
      { title: 'BMET clearance', desc: 'Workers going abroad register with BMET before departure.' },
      { title: 'Biometrics in Dhaka', desc: 'Given at a UK visa application centre.' },
    ],
    sections: [
      {
        heading: 'Applying from Bangladesh',
        body: [
          'After receiving a Certificate of Sponsorship from a licensed UK employer, you apply online, pay the visa fee and Immigration Health Surcharge, take a TB test at an approved clinic, and attend biometrics at a visa application centre in Bangladesh.',
        ],
      },
      {
        heading: 'Bangladesh emigration clearance',
        body: [
          'The Bureau of Manpower, Employment and Training (BMET) handles registration and emigration clearance for Bangladeshi workers going abroad. Recruiting agencies must be licensed — check before paying anyone.',
        ],
      },
    ],
    eligibility: [
      'Certificate of Sponsorship from a UK licensed sponsor',
      'Eligible occupation and salary',
      'English at the required level',
      'TB test certificate',
    ],
    documents: [
      'Passport and national ID',
      'Certificate of Sponsorship reference',
      'English language evidence',
      'TB test certificate',
      'BMET registration / smart card before departure',
    ],
    faqs: [
      { question: 'Can I get a UK work permit from Bangladesh without IELTS?', answer: 'You must prove English at the required level. An approved English test is the common option; certain degrees taught in English may also count.' },
      { question: 'How do I know a UK job offer is real?', answer: 'Check the employer on the UK Register of licensed sponsors, insist on an interview and a written contract, and never pay for the job offer.' },
    ],
  }),

  build({
    slug: 'sri-lanka-to-canada-work-visa',
    destination: 'Canada',
    eyebrow: 'Sri Lanka → Canada',
    h1: 'Sri Lanka to Canada Work Visa: Options and Process',
    title: 'Sri Lanka to Canada Work Visa: Options & Process',
    description: 'Canadian work permit options for Sri Lankan applicants: LMIA-based work permits, Express Entry, provincial programs and SLBFE registration.',
    keywords: 'sri lanka to canada work visa, sri lanka to canada work visa price, how to apply canada work visa from sri lanka, canada work permit for sri lankans, canada express entry sri lanka',
    heroDescription: 'Most Sri Lankan workers enter Canada with an employer-specific work permit backed by a positive LMIA, or apply for permanent residence through Express Entry or a province.',
    highlights: [
      { title: 'LMIA work permits', desc: 'The Canadian employer applies for an LMIA before you apply.' },
      { title: 'Express Entry', desc: 'Points-based permanent residence for eligible skilled workers.' },
      { title: 'SLBFE registration', desc: 'Sri Lankans leaving for foreign employment register with the SLBFE.' },
      { title: 'Biometrics', desc: 'Given at a visa application centre in Sri Lanka.' },
    ],
    sections: [
      {
        heading: 'How to apply for a Canadian work visa from Sri Lanka',
        body: [
          'For an employer-specific work permit, the Canadian employer normally obtains a positive Labour Market Impact Assessment (LMIA) and sends you a job offer. You then apply online to IRCC, give biometrics and complete any medical exam. Skilled workers may also apply for permanent residence through Express Entry.',
        ],
      },
      {
        heading: 'Sri Lanka to Canada work visa price',
        body: [
          'Government costs include the work permit processing fee and biometrics fee set by IRCC, plus medicals, police certificates and travel. Employers — not workers — must pay the LMIA fee. Never pay for an LMIA or job offer.',
        ],
      },
      {
        heading: 'Before leaving Sri Lanka',
        body: [
          'The Sri Lanka Bureau of Foreign Employment (SLBFE) requires registration for citizens leaving for foreign employment, and only licensed agencies may recruit. Verify your recruiter with the SLBFE.',
        ],
      },
    ],
    eligibility: [
      'Job offer with positive LMIA, or LMIA-exempt category',
      'Qualifications and experience for the job',
      'Medical and police clearance where required',
      'Language results for Express Entry',
    ],
    documents: [
      'Passport',
      'Job offer and LMIA number',
      'Qualifications and reference letters',
      'Police certificates',
      'SLBFE registration before departure',
    ],
    faqs: [
      { question: 'Who pays for the LMIA?', answer: 'The Canadian employer pays the LMIA fee and cannot recover it from the worker.' },
      { question: 'Can I move to Canada from Sri Lanka without a job offer?', answer: 'Express Entry does not require a job offer for eligible skilled workers, but invitations depend on your score and draw results.' },
    ],
  }),
]

export const PATHWAYS_BY_SLUG = Object.fromEntries(
  pathways.map((p) => [p.path.replace('/pathways/', ''), p]),
) as Record<string, DestinationContent>

export const PATHWAY_GROUPS: Array<{ title: string; description: string; slugs: string[] }> = [
  {
    title: 'Stay and work after study',
    description: 'For students and graduates already abroad who want to keep working lawfully.',
    slugs: ['uk-student-visa-to-skilled-worker-visa', 'uk-graduate-visa-to-skilled-worker-visa', 'canada-pgwp-to-pr', 'australia-485-to-employer-sponsored-visa', 'new-zealand-accredited-employer-work-visa'],
  },
  {
    title: 'Move to another country',
    description: 'Already living abroad and considering a different country.',
    slugs: ['move-from-uk-to-australia', 'move-from-uk-to-canada', 'move-from-uk-to-new-zealand', 'move-from-uk-to-europe'],
  },
  {
    title: 'From India, Pakistan, Bangladesh and Sri Lanka',
    description: 'Route guides with home-country departure requirements.',
    slugs: ['india-to-uk-work-visa', 'pakistan-to-uk-work-visa', 'pakistan-to-europe-work-visa', 'bangladesh-to-uk-work-visa', 'sri-lanka-to-canada-work-visa'],
  },
]
