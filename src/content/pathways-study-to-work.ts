import type { DestinationContent } from './destination-types'
import { build } from './pathways-build'

/**
 * Additional study-to-work routes, kept in their own file so pathways.ts stays
 * readable as the set grows.
 *
 * Each page here describes a system that genuinely works differently from the
 * others — Germany is authority-led with no sponsor register, the Chancenkarte
 * is points-based with no job offer at all, and the Australian 485 turns on an
 * age cut-off and a study-duration test. Where a threshold changes annually
 * (Blue Card salary, Chancenkarte funds, 485 age limit) the page says so and
 * points at the official source instead of hardcoding a figure that will rot.
 */
export const studyToWorkPathways: DestinationContent[] = [
  build({
    slug: 'germany-student-visa-to-work-visa',
    destination: 'Germany',
    eyebrow: 'Germany · study to work',
    h1: 'Germany Student Visa to Work Visa: Staying On After Your Degree',
    title: 'Germany Student Visa to Work Visa After Study',
    description:
      'How graduates of German universities can stay to look for work and move onto an EU Blue Card or skilled worker residence permit.',
    keywords:
      'germany student visa to work visa, job seeker residence permit germany after study, eu blue card germany requirements, stay in germany after graduation, germany job seeking permit',
    heroDescription:
      'Germany lets graduates of German universities stay on to look for qualified work. The permit is applied for locally, and the process is different from the UK or Canada.',
    highlights: [
      { title: 'Job-seeking permit', desc: 'Graduates of German universities can apply for a residence permit to look for qualified work.' },
      { title: 'Apply locally', desc: 'The application goes to your local Ausländerbehörde, not to an embassy abroad.' },
      { title: 'EU Blue Card', desc: 'A qualifying offer above the current salary threshold can lead to an EU Blue Card.' },
      { title: 'Work while searching', desc: 'The job-seeking permit generally allows work while you look.' },
    ],
    sections: [
      {
        heading: 'What happens when your German degree finishes',
        body: [
          'Your student residence permit is tied to your studies, so it does not simply continue once you graduate. Graduates of a German higher-education institution can apply for a residence permit to seek employment appropriate to their qualification. You apply at the Ausländerbehörde covering the district where you live, and you should start before your student permit expires rather than after it lapses.',
          'This is a genuinely different system from the UK or Canada. There is no central online application, no sponsor licence register to check an employer against, and decisions are made by your local authority. Processing times and document expectations vary noticeably between cities, which is why securing the appointment matters as much as the paperwork itself.',
        ],
      },
      {
        heading: 'EU Blue Card and the skilled worker permit',
        body: [
          'Once you hold a qualifying job offer, the two routes most graduates use are the EU Blue Card and the skilled worker residence permit. The Blue Card requires a recognised degree and a gross annual salary at or above a threshold that is set each year, with a lower threshold for shortage occupations such as IT, engineering and medicine.',
          'Because those thresholds are revised annually, check the figure that applies on the date you apply rather than a number quoted in an older guide. Accepting a salary just below the current line is one of the more common reasons a Blue Card application does not proceed.',
        ],
        bullets: [
          'Your degree must be recognised in Germany — check the anabin database',
          'The salary threshold is set annually and is lower for shortage occupations',
          'The Blue Card can lead to settlement faster than some other permits',
          'German is not always legally required, but it strongly affects who will interview you',
        ],
      },
      {
        heading: 'Practical steps that decide the outcome',
        body: [
          'Two administrative details cause most delays, and neither is about your qualifications. Ausländerbehörde appointments in larger cities can be booked out for weeks, so the appointment should be secured early. Separately, your health insurance must be continuous — a gap between student cover and employee cover is a problem the authority will raise.',
        ],
        bullets: [
          'Book the Ausländerbehörde appointment well before your permit expires',
          'Keep health insurance continuous across the change of status',
          'Keep your address registration (Meldebescheinigung) current',
          'Have your degree checked on anabin before applying',
        ],
      },
    ],
    eligibility: [
      'A completed degree from a recognised German higher-education institution',
      'A valid student residence permit at the time you apply',
      'Proof you can support yourself during the search period',
      'Health insurance that covers you continuously',
      'For a Blue Card: a qualifying job offer at or above the current salary threshold',
    ],
    documents: [
      'Passport and current residence permit',
      'Degree certificate or official completion confirmation',
      'Proof of health insurance',
      'Proof of funds or a signed employment contract',
      'Registration certificate (Meldebescheinigung)',
      'Completed application form for your local Ausländerbehörde',
    ],
    faqs: [
      { question: 'Can I stay in Germany after my studies to look for a job?', answer: 'Graduates of German universities can apply for a residence permit to seek qualified employment. Apply at your local Ausländerbehörde before your student permit expires.' },
      { question: 'Can I work while looking for a qualified job?', answer: 'The job-seeking permit generally allows employment while you search, which differs from several other countries. Confirm the conditions written on your own permit.' },
      { question: 'Do I need to speak German?', answer: 'Many EU Blue Card roles, particularly in IT and engineering, are English-speaking, and language is not a legal requirement for the card itself. In practice German substantially widens which employers will interview you.' },
      { question: 'What salary do I need for an EU Blue Card?', answer: 'A threshold is set each year, with a reduced figure for shortage occupations. Check the current amount on the Federal Office for Migration and Refugees website for the date you apply, because it changes annually.' },
      { question: 'Can you guarantee me a job in Germany?', answer: 'No. We introduce suitable candidates to employers who are recruiting, and the employer decides. The residence permit is decided by the German authorities.' },
    ],
  }),

  build({
    slug: 'germany-opportunity-card-chancenkarte',
    destination: 'Germany',
    eyebrow: 'Germany · points-based',
    h1: 'Germany Opportunity Card (Chancenkarte): Points-Based Job Search',
    title: 'Germany Opportunity Card (Chancenkarte) Explained',
    description:
      'The Chancenkarte lets qualified people enter Germany to look for work without a job offer. How the points system and funding proof work.',
    keywords:
      'germany opportunity card, chancenkarte germany, germany opportunity card points, germany job seeker visa without job offer, chancenkarte requirements',
    heroDescription:
      'The Opportunity Card is a points-based route that lets you enter Germany to look for work before you have a job offer — a different model from every sponsor-led system.',
    highlights: [
      { title: 'No job offer needed', desc: 'Unlike sponsor-led routes, you can enter to search first.' },
      { title: 'Points based', desc: 'Qualification, experience, language, age and German connection all score.' },
      { title: 'Prove your funds', desc: 'You must show you can support yourself, usually via a blocked account.' },
      { title: 'Limited side work', desc: 'Part-time work and trial employment are allowed within set limits.' },
    ],
    sections: [
      {
        heading: 'How the Chancenkarte points system works',
        body: [
          'The Opportunity Card was introduced as part of Germany’s skilled immigration reform and works on a points test rather than employer sponsorship. You first need a baseline: either a qualification fully recognised in Germany, or a foreign degree or vocational qualification of at least two years together with language ability.',
          'Points are then awarded across factors including how well your qualification is recognised, years of relevant professional experience, German and English language levels, your age, and previous stays in Germany. A spouse or partner applying with you can also add a point. You need to reach the required total on the date you apply.',
        ],
      },
      {
        heading: 'What the card does and does not let you do',
        body: [
          'The card gives you a defined period in Germany to find qualified work. During it you can work part-time up to a weekly limit, and take trial employment with a prospective employer. That is a meaningful difference from job-seeker visas elsewhere that forbid work entirely.',
          'What it does not do is guarantee a job or convert automatically into a work permit. Once you have a suitable offer you must apply to change to the appropriate residence permit, such as an EU Blue Card or a skilled worker permit. If you do not find qualified work within the period allowed, you are expected to leave.',
        ],
        bullets: [
          'Part-time work is permitted up to a set weekly hour limit',
          'Trial employment with a potential employer is allowed',
          'You must switch to a work permit once you have a qualifying offer',
          'The card does not lead to settlement by itself',
        ],
      },
      {
        heading: 'Proving you can support yourself',
        body: [
          'Funding proof is the requirement applicants most often underestimate. The usual method is a blocked account (Sperrkonto) holding a set monthly amount for the duration of the card, though a formal declaration of commitment from someone in Germany can be accepted instead.',
          'The monthly figure is reviewed periodically, so confirm the current amount before opening the account. Part-time earnings in Germany do not substitute for this proof at the application stage.',
        ],
      },
    ],
    eligibility: [
      'A recognised qualification, or a foreign degree or two-year vocational qualification',
      'Language ability at the level required for your route into the points test',
      'Enough points across qualification, experience, language, age and German connection',
      'Proof of funds for the full period, usually a blocked account',
      'Health insurance valid in Germany',
    ],
    documents: [
      'Passport valid for the full period',
      'Degree or vocational qualification certificates',
      'Qualification recognition evidence (anabin or a formal assessment)',
      'Language certificates for German and/or English',
      'Proof of professional experience',
      'Blocked account confirmation or declaration of commitment',
      'Health insurance certificate',
    ],
    faqs: [
      { question: 'Can I get the Opportunity Card without a job offer?', answer: 'Yes — that is the purpose of the route. You enter to look for work, then switch to a work permit once you have a qualifying offer.' },
      { question: 'How many points do I need?', answer: 'You must reach the required total from qualification recognition, experience, language, age, previous German stays and an accompanying partner. Check the current threshold and scoring on the official Make it in Germany portal, as the scheme has been adjusted since launch.' },
      { question: 'Can I work full time on the Opportunity Card?', answer: 'No. Part-time work up to a weekly limit and trial employment are allowed. Full-time qualified work requires switching to the appropriate residence permit.' },
      { question: 'How much money do I need to show?', answer: 'A set monthly amount for the duration of the card, normally held in a blocked account. The figure is revised periodically, so confirm the current amount before you open one.' },
      { question: 'What happens if I do not find a job?', answer: 'The card is time-limited. If you have not obtained qualified employment and switched to a work permit by the end of it, you are expected to leave Germany.' },
    ],
  }),

  build({
    slug: 'australia-student-visa-to-485-graduate-visa',
    destination: 'Australia',
    eyebrow: 'Australia · study to work',
    h1: 'Australia Student Visa to 485 Temporary Graduate Visa',
    title: 'Australia Student Visa to Subclass 485 Graduate Visa',
    description:
      'Moving from a Subclass 500 student visa to the Subclass 485 Temporary Graduate visa: age limit, the Australian study requirement, English and application timing.',
    keywords:
      'subclass 485 temporary graduate visa, australia student visa to 485, 485 visa requirements, post study work visa australia, australian study requirement',
    heroDescription:
      'The Subclass 485 lets eligible graduates stay and work in Australia after study. Its age and timing limits are stricter than most applicants expect.',
    highlights: [
      { title: 'Age limit applies', desc: 'There is a maximum age at time of application, with limited exemptions.' },
      { title: 'Australian study requirement', desc: 'Your course must meet CRICOS and minimum duration rules.' },
      { title: 'Apply from in Australia', desc: 'You generally must hold an eligible visa and be onshore.' },
      { title: 'Time-limited', desc: 'Stay length depends on your qualification level; it is not open-ended.' },
    ],
    sections: [
      {
        heading: 'What the Subclass 485 requires',
        body: [
          'The Temporary Graduate visa is for people who have recently graduated from an Australian institution. The central test is the Australian study requirement: your qualification must come from a CRICOS-registered course, taught in English, and completed over a minimum period of study in Australia. Courses completed largely online, or compressed below the minimum duration, can fail this test even when the degree itself is perfectly genuine.',
          'You must also apply within a set window after your course completion date, hold an eligible visa at the time, and generally be in Australia when you apply. Missing the application window is one of the most common and least recoverable errors on this route.',
        ],
      },
      {
        heading: 'Age limit, English and health cover',
        body: [
          'There is a maximum age at the time of application, and that limit was tightened in recent policy changes, with narrow exemptions for certain applicants. Because the cut-off has moved, check the current figure against your own date of birth rather than relying on older guidance, or on what a classmate was told a year earlier.',
          'You will also need English at the required level with a test taken within the accepted validity period, adequate health insurance for your stay, and police and health checks.',
        ],
        bullets: [
          'Confirm the current maximum age before you plan around this route',
          'English test results must be recent enough to still be accepted',
          'Health insurance must cover the full period of stay',
          'Apply within the window after your course completion date',
        ],
      },
      {
        heading: 'Where the 485 leads',
        body: [
          'The 485 is temporary and cannot be extended indefinitely. Most graduates use the time to gain skilled work experience and then move to employer sponsorship such as the Skills in Demand visa, or to a points-tested skilled visa. Both usually require a skills assessment in your occupation, which can take months, so it is worth starting that assessment during the 485 rather than at the end of it.',
        ],
      },
    ],
    eligibility: [
      'Recent graduation meeting the Australian study requirement',
      'Under the maximum age at time of application, unless exempt',
      'Holding an eligible visa and generally onshore when applying',
      'English at the required level with a valid test result',
      'Adequate health insurance for the period of stay',
    ],
    documents: [
      'Passport and current visa details',
      'Completion letter and academic transcript',
      'English test results within the accepted validity period',
      'Health insurance policy documents',
      'Australian Federal Police check',
      'Health examination results',
    ],
    faqs: [
      { question: 'What is the age limit for the 485 visa?', answer: 'There is a maximum age at time of application, and it has been reduced in recent policy changes, with limited exemptions. Check the current limit on the Department of Home Affairs website against your own date of birth.' },
      { question: 'How long can I stay on a Subclass 485?', answer: 'The period depends on your qualification level and, for some applicants, where you studied. It is fixed and time-limited, not open-ended.' },
      { question: 'Can I apply for the 485 from outside Australia?', answer: 'Applicants generally need to be in Australia holding an eligible visa. Confirm your situation against current Home Affairs guidance before leaving the country.' },
      { question: 'Does the 485 lead to permanent residence?', answer: 'Not by itself. It gives you time to gain experience and move to employer-sponsored or points-tested skilled routes, most of which need a skills assessment.' },
      { question: 'Can you guarantee a job or a 485 grant?', answer: 'No. Employers decide who they hire and the Department of Home Affairs decides visas. We help you check eligibility and prepare a complete, accurate application.' },
    ],
  }),

  build({
    slug: 'student-visa-to-work-visa-with-job-and-salary',
    destination: 'United Kingdom, Canada, Australia, Germany & New Zealand',
    eyebrow: 'Study to Work · Fixed Job & Salary',
    h1: 'Student Visa to Work Visa: Employer Sponsorship & Sponsor Switch',
    title: 'Student Visa to Work Visa Transition with Fixed Job & Salary',
    description:
      'How students in the UK, Canada, Australia, Germany and the USA move from a study visa to a work visa once they have a qualifying job offer.',
    keywords:
      'student visa to work visa with job and salary, convert study visa to work visa, renew student visa on work visa, international student work visa transition, uk student visa to skilled worker with salary, canada pgwp lmia job with salary, australia 485 to employer sponsorship, germany student to blue card fixed job, study abroad graduate job placement',
    heroDescription:
      'Is your study visa expiring or nearing completion? Transition lawfully to an employer-sponsored work visa in your study destination with a verified employer, a binding fixed salary contract, and standard company benefits.',
    highlights: [
      { title: 'For graduating students', desc: 'Designed specifically for students currently on study visas or post-study work permits abroad.' },
      { title: 'Verified sponsor employers', desc: 'Introductions to employers on official registers (UK CoS sponsors, Canada LMIA, Australia SID).' },
      { title: 'Fixed salary contracts', desc: 'Offers structured to meet or exceed official government salary thresholds with full transparency.' },
      { title: 'Full company benefits', desc: 'Statutory health coverage, pension/superannuation, paid leave, and relocation terms.' },
    ],
    sections: [
      {
        heading: 'Why international students must plan the work visa switch early',
        body: [
          'If you travelled abroad from Gujarat, Punjab, Maharashtra, Delhi, or any of India’s 28 states — or from Nepal, Bangladesh, Sri Lanka, or Pakistan — on a study visa, your study period will soon reach its end. When classes finish, your student visa expiry clock starts ticking.',
          'Remaining in the country legally requires transitioning onto a lawful work visa before your current permission expires. A standard tourist or visitor visa will not give you full-time working rights, and overstaying damages your future immigration record irreparably. We connect graduating students with genuine employers on approved government sponsorship registers who issue valid employment contracts with fixed salaries and full statutory benefits.',
        ],
      },
      {
        heading: 'Country-by-country transition rules and salary standards',
        body: [
          'Every destination country has distinct rules for switching from a student visa to an employer-sponsored work visa. Here is how the key destinations work:',
        ],
        bullets: [
          'United Kingdom: Switch from a Student Visa or Graduate Visa to a Skilled Worker Visa. The employer must hold a Home Office Sponsor Licence and issue a Certificate of Sponsorship (CoS). Salary must meet the relevant standard or new-entrant threshold (e.g. £38,700 base or discounted new-entrant rates for recent UK graduates).',
          'Canada: International graduates holding a Post-Graduation Work Permit (PGWP) or completing DLI studies can transition into employer-supported LMIA work permits, Provincial Nominee Programs (PNP), or Express Entry Canadian Experience Class (CEC) with a defined NOC code and prevailing wage.',
          'Australia: Move from a Subclass 500 Student Visa to a Subclass 485 Temporary Graduate Visa, and subsequently onto a Subclass 482 (Skills in Demand / TSS) employer-sponsored work visa with a fixed annual salary meeting the TSMIT threshold ($73,150+ AUD).',
          'Germany: University graduates are entitled to an 18-month job-seeker residence permit, switching directly into an EU Blue Card or skilled worker permit once a qualified contract matching annual statutory salary thresholds is secured.',
          'New Zealand: Transition from a Post-Study Work Visa to an Accredited Employer Work Visa (AEWV) with a contract meeting the official median wage threshold.',
        ],
      },
      {
        heading: 'Fixed job contract, statutory salary floors and employee benefits',
        body: [
          'A genuine employer sponsorship requires a formal employment contract detailing your exact job title, assigned SOC/NOC occupation code, hours per week, fixed annual gross salary, and company benefits. We check that every employer introduction meets the destination\u2019s compliance rules, so your filing is not exposed to the wage-undercutting and sham-role grounds that cause refusals. The decision itself always rests with the authorities.',
        ],
        bullets: [
          'Contractually verified gross annual or monthly salary meeting statutory minimums',
          'National health insurance / NHS / private employer health cover registration',
          'Statutory annual leave, paid sick leave, and public holidays',
          'Company pension or retirement superannuation contributions',
          'Clear workplace protection under local employment legislation',
        ],
      },
      {
        heading: 'Support for students originating from all Indian states & South Asia',
        body: [
          'Whether you completed your earlier schooling or bachelor’s degree in Gujarat, Punjab, Kerala, Tamil Nadu, Andhra Pradesh, Uttar Pradesh, West Bengal, Maharashtra, or in Dhaka, Lahore, Kathmandu, or Colombo, our counsellors assess your complete academic background, previous visa documentation, and target country timelines.',
          'All consultations are conducted remotely via WhatsApp, phone, or video call directly with you abroad, or in person with your family at our Surat head office.',
        ],
      },
    ],
    eligibility: [
      'Currently holding a valid student visa or post-study work permit with at least 60-90 days validity remaining',
      'Completed or close to completing an accredited degree or diploma from a recognised institution in the host country',
      'Academic transcripts, completion letter, or provisional degree certificate ready',
      'English language proficiency satisfying work visa threshold (often met by your host country qualification)',
      'Clean immigration and compliance record in the destination country',
    ],
    documents: [
      'Valid passport and current biometric residence permit (BRP / eVisa / study permit / visa grant letter)',
      'University completion letter and official academic transcripts',
      'Updated CV / resume tailored to host country format',
      'Bank statements showing necessary maintenance funds if required by immigration rules',
      'Police clearance certificates (host country and origin country if applicable)',
      'National ID / Aadhaar card / Citizenship card from home country',
    ],
    faqs: [
      {
        question: 'When should I start the transition process before my student visa expires?',
        answer:
          'You should start at least 3 to 6 months before your course completion or visa expiry date. Employer interviewing, Certificate of Sponsorship / LMIA assignment, and visa processing typically take 6 to 12 weeks.',
      },
      {
        question: 'Does Siddhivinayak Overseas provide fixed job and salary sponsorship?',
        answer:
          'We introduce qualified international students directly to vetted, licensed sponsor employers who have active, verified vacancies. The employer issues an official employment contract with a fixed salary meeting government thresholds and company benefits. We then handle your complete visa switch documentation.',
      },
      {
        question: 'What happens if my student visa expires while my work visa application is processing?',
        answer:
          'In countries like the UK (Section 3C Leave), Canada (Maintained Status), and Australia (Bridging Visa A), submitting a valid work visa application before your current visa expires lawfully extends your right to remain while the authority decides your case.',
      },
      {
        question: 'Can I apply if my family is back in India, Nepal, Bangladesh, or Pakistan?',
        answer:
          'Yes. We handle remote files daily for students located across London, Toronto, Sydney, Melbourne, Berlin, Dublin, Auckland, etc., and can coordinate with your parents or sponsors back home if required.',
      },
      {
        question: 'Do you charge for job offers or Certificates of Sponsorship?',
        answer:
          'No. Selling job offers or certificates of sponsorship is strictly illegal under international immigration laws. Our charges are for profile assessment, employer matching coordination, legal documentation, and visa filing support.',
      },
    ],
  }),

  build({
    slug: 'switch-countries-with-job-and-salary',
    destination: 'UK, Australia, Canada, New Zealand & Europe',
    eyebrow: 'Country Relocation · Job & Salary',
    h1: 'Switching Countries After Study: Relocation with Fixed Job, Salary & Benefits',
    title: 'Switch Countries on Study Visa: Relocation with Job & Salary',
    description:
      'How to move lawfully from the UK, Canada, Australia, Europe or Cyprus to another country with verified employer sponsorship.',
    keywords:
      'switch countries on study visa, move from uk to australia work visa, move from canada to australia with job, move from europe to uk with salary, international student country transfer, relocate to another country after study, work visa in another country with fixed job and salary',
    heroDescription:
      'Already living abroad on a student visa or post-study permit and want to move to a different country? Relocate lawfully through employer sponsorship, with a written salary contract and employee company benefits.',
    highlights: [
      { title: 'Cross-border mobility', desc: 'Designed for international students currently abroad wishing to relocate to a stronger economic or PR market.' },
      { title: 'Secured employer sponsorship', desc: 'Connecting you with registered employers in the target country who can sponsor overseas talent.' },
      { title: 'Salary thresholds explained', desc: 'How host-country skilled worker salary floors work. Employment terms are set by the employer and applicable law.' },
      { title: 'Relocation benefits', desc: 'Assistance with flight allowances, temporary accommodation, and health insurance transfers.' },
    ],
    sections: [
      {
        heading: 'Why students and graduates choose to switch countries',
        body: [
          'Many students who went abroad to the UK, Canada, Australia, Cyprus, Poland, Malaysia, or Georgia find that local immigration rules shift during their degree, PR pathways become heavily congested, or salaries fail to match expectations.',
          'Rather than returning home or remaining in a country where long-term residency is uncertain, students with international degrees can leverage their overseas education and English fluency to qualify for work visas in other top economies — such as moving from the UK to Australia, Canada to Australia, or Europe to the UK or Germany.',
        ],
      },
      {
        heading: 'Top relocation corridors for international graduates',
        body: [
          'We specialize in helping international students and professionals cross over between major global markets:',
        ],
        bullets: [
          'United Kingdom to Australia: With UK degree credentials, graduates can qualify for Australia’s Skills in Demand (subclass 482) visa or Working Holiday / Graduate pathways with verified sponsor employers offering $75,000+ AUD salaries.',
          'United Kingdom to Canada: Leverage UK bachelor’s or master’s qualifications for Canadian LMIA employer-sponsored work permits or high CRS scores in Express Entry.',
          'Canada to Australia or New Zealand: Canadian graduates facing PGWP expiration or tightened PR draws can transition smoothly into Australian or New Zealand accredited employer routes.',
          'Europe / Cyprus / Poland to UK or Germany: Transition from initial European study locations to higher-paying economies like Germany (via Opportunity Card or EU Blue Card) or the UK (Skilled Worker route).',
        ],
      },
      {
        heading: 'What we provide: Job placement, salary security & company benefits',
        body: [
          'Moving across borders requires careful synchronization so you never lose legal status. We coordinate both sides of your transition:',
        ],
        bullets: [
          'Credential assessment and equivalence mapping for the new target country',
          'Introduction to licensed sponsor employers willing to sponsor from overseas',
          'Legally binding employment contract with a fixed salary exceeding local statutory minimums',
          'Full employee company benefits: health insurance, statutory annual leave, pension contributions',
          'End-to-end visa filing and biometrics coordination in your current country of residence',
        ],
      },
    ],
    eligibility: [
      'Currently residing legally abroad on a valid student visa, graduate visa, or work permit',
      'Completed at least 1-2 years of higher education or hold a recognised university degree',
      'English proficiency meeting target country requirements (IELTS, PTE, or host university MOI)',
      'Clean immigration and compliance history in your current country of residence',
    ],
    documents: [
      'Current passport with at least 12 months validity',
      'Current host country visa / BRP / study permit / eVisa',
      'Academic degrees and official transcripts from home country and current country of study',
      'Updated international CV highlighting current overseas experience',
      'Police clearance certificates from both your home country and current country of residence',
      'Bank statements verifying maintenance funds where required',
    ],
    faqs: [
      {
        question: 'Do I have to return to India, Nepal, Pakistan, or Bangladesh before moving to the new country?',
        answer:
          'In most cases, no! If you hold legal residency status (such as a valid student visa or post-study work permit) in your current country, you can give your biometrics and submit your visa application for the new country at a local visa application centre (VFS / VAC) right where you live.',
      },
      {
        question: 'Will I know my salary and company benefits before I commit?',
        answer:
          'Yes, in writing and before you sign or file. You receive the licensed sponsor employer\u2019s written offer setting out your job title, gross salary, working hours and benefits. On sponsored routes that salary also has to meet the destination\u2019s statutory minimum for the occupation, which is a legal floor set by that government rather than a promise from us. What nobody can guarantee is that a particular employer will hire you, or that the visa will be granted \u2014 those decisions belong to the employer and the authorities.',
      },
      {
        question: 'Which country is easiest to move to from the UK right now?',
        answer:
          'Australia and New Zealand are popular destinations for UK international graduates due to high mutual recognition of qualifications, strong demand for skilled professionals, and competitive salary packages in healthcare, IT, construction, and engineering.',
      },
    ],
  }),
]

