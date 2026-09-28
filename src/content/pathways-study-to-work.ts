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
      'How graduates of German universities can stay to look for work and move onto an EU Blue Card or skilled worker residence permit, and what the Ausländerbehörde checks.',
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
      'The Chancenkarte lets qualified people enter Germany to look for work without a job offer first. How the points system works, funding proof, and what the card does not allow.',
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
]
