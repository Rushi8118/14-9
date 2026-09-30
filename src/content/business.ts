/**
 * B2B pages: overseas employers, and recruitment partners in Indian states.
 *
 * The site speaks entirely to individual applicants. Two other audiences already
 * reach this business and have nowhere to land: employers abroad who want
 * candidates from South Asia, and agents in other Indian states who want a
 * partner to handle documentation and visa filing.
 *
 * These are genuinely different pages for genuinely different readers, which is
 * why they are safe to add to a site that is already carrying too many
 * template-generated location pages. Nobody searching "recruitment partner
 * programme India" is served by a study-visa page.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 * No commission rate, no partner count, no employer names, no placement volume,
 * no processing time, no success rate, no licence or registration number. None
 * of that was supplied, and a B2B page is exactly where an invented commercial
 * term does damage -- a partner who signs on the strength of a number that was
 * made up has a real grievance, and on a site in a regulated sector it is worse
 * than an SEO problem.
 *
 * Placeholders like "[BUSINESS INPUT REQUIRED]" were considered and rejected:
 * they would be visible to real visitors and read as an unfinished site. The
 * pages instead say what is true and invite the conversation where the terms
 * belong. The missing facts are listed for the business separately.
 *
 * On regulation: overseas recruitment from India is subject to Indian emigration
 * law. These pages neither claim a registration nor state what any particular
 * arrangement requires, because both would be assertions this project has no
 * verified basis for. They say the position is confirmed before a partnership
 * starts, which is the honest thing to promise.
 */
import type { DestinationContent, ContentSection } from './destination-types'
import { NAP } from '@/lib/seo/site'

/** Shared, so the anti-guarantee position cannot drift between B2B pages. */
const HONESTY: ContentSection = {
  heading: 'What we will not offer you',
  body: [
    'It is worth being direct about this, because the sector is full of the opposite. We do not sell job offers, we do not guarantee visa outcomes, and we do not promise placement volumes we have not delivered.',
    'A visa decision belongs to the immigration authority of the destination country. A hiring decision belongs to the employer. Any partner or employer who is told otherwise by anyone in this industry is being sold something that cannot be delivered.',
  ],
  bullets: [
    'No payment taken from a candidate in exchange for a job offer',
    'No guaranteed approval rates, because no one controls them',
    'No falsified, altered or backdated documents, on any file, ever',
    'Written terms before anything starts',
  ],
}

const REGULATION: ContentSection = {
  heading: 'Regulation and compliance',
  body: [
    'Overseas recruitment from India is subject to Indian emigration law, and the requirements differ by destination country, by visa route and by the structure of the arrangement.',
    'We will not tell you on a web page what applies to a partnership we have not discussed. Before anything begins, we confirm the current position for the specific arrangement you are proposing, and we put in writing what each side is responsible for. If an arrangement needs an approval that is not in place, that is a conversation before the work, not after it.',
  ],
}

const CONTACT_SECTION = (who: string): ContentSection => ({
  heading: `Talking to us`,
  body: [
    `${who} Write to ${NAP.email} or message ${NAP.phoneINDisplay} on WhatsApp with what you are looking for, and we will tell you plainly whether it is something we can do.`,
    `Our office is at ${NAP.fullAddress}. We are a single-office business — that is worth knowing up front, because it shapes what we can take on and how quickly.`,
  ],
})

export const businessHub: DestinationContent = {
  path: '/for-business',
  kind: 'hub',
  serviceType: 'Business partnership and recruitment services',
  eyebrow: 'For businesses',
  h1: 'For Businesses: Employers and Recruitment Partners',
  title: 'For Businesses | Employers & Recruitment Partners',
  description:
    'Work with Siddhivinayak Overseas as an employer hiring from South Asia, or as a recruitment partner in your state. Documentation and visa filing support.',
  keywords:
    'overseas recruitment partner india, recruitment agency partnership india, hire workers from india, recruitment partner gujarat, b2b visa consultancy india, sub agent partnership visa consultancy, overseas manpower partner surat',
  heroDescription:
    'Two kinds of business work with us: employers abroad who need candidates from South Asia, and agents in other Indian states who need a partner for documentation and visa filing.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'For businesses' },
  ],
  highlights: [
    { title: 'Employers', desc: 'Candidate sourcing and visa documentation from South Asia.' },
    { title: 'State agents', desc: 'Partner on files you would otherwise turn away.' },
    { title: 'Written terms', desc: 'Scope and responsibilities agreed before work starts.' },
    { title: 'Single office', desc: `Surat, Gujarat. ${NAP.phoneINDisplay}.` },
  ],
  sections: [
    {
      heading: 'Who this is for',
      body: [
        'Most of this website speaks to individual applicants. These pages are for the other two conversations we have: with employers abroad, and with consultancies and agents elsewhere in India.',
      ],
      bullets: [
        'Employers hiring from India, Nepal, Bangladesh, Pakistan or Sri Lanka',
        'Recruitment consultancies and agents in other Indian states',
        'Institutions and training providers whose candidates need visa support',
      ],
    },
    {
      heading: 'What we actually do',
      body: [
        'We assess candidates against a route honestly, prepare complete and accurate documentation, and manage the application through the official process. We introduce suitable candidates to employers registered in the destination country that are recruiting for genuine roles.',
        'What we do not do is decide outcomes. The employer interviews and hires. The government decides the visa. Our value is in the part between those two, which is where most applications are lost.',
      ],
    },
    HONESTY,
    REGULATION,
    CONTACT_SECTION('Tell us what you need and we will tell you whether we are the right fit.'),
  ],
  faqs: [
    {
      question: 'Do you work with agents in other states?',
      answer:
        'Yes. Agents across India send us files where they want documentation and visa filing handled by a specialist. Terms are agreed in writing for each arrangement rather than set by a standard rate card on a website.',
    },
    {
      question: 'Can you guarantee placements or visa approvals to a partner?',
      answer:
        'No. Anyone in this industry who guarantees either is misrepresenting what they control. Hiring belongs to the employer and the visa decision to the immigration authority.',
    },
    {
      question: 'What are your commission terms?',
      answer:
        'They depend on the route, the volume and who does which part of the work, so we set them per arrangement and put them in writing before anything starts. Contact us with what you are proposing.',
    },
  ],
  related: [
    { label: 'For recruitment partners', to: '/for-business/recruitment-partners', description: 'Agents and consultancies in other Indian states.' },
    { label: 'For employers', to: '/for-business/employers', description: 'Hiring from India, Nepal, Bangladesh, Pakistan and Sri Lanka.' },
    { label: 'Talk to us', to: '/for-business/contact' },
    { label: 'Where we work in India', to: '/regional-coverage' },
    { label: 'For individual applicants', to: '/services' },
  ],
  datePublished: '2026-09-30',
}

export const recruitmentPartners: DestinationContent = {
  path: '/for-business/recruitment-partners',
  kind: 'hub',
  serviceType: 'Recruitment partnership',
  eyebrow: 'For businesses · Partners',
  h1: 'Recruitment Partner Programme for Agents Across India',
  title: 'Recruitment Partners | Agent Partnership Across India',
  description:
    'For consultancies and agents in any Indian state: partner with us on documentation, employer introductions and visa filing. Terms agreed per arrangement.',
  keywords:
    'recruitment partner india, visa consultancy partnership, sub agent visa consultancy india, agent partnership overseas jobs, franchise visa consultancy india, associate partner overseas education, recruitment tie up india, state agent partnership visa',
  heroDescription:
    'If you advise candidates in your state but do not want to build documentation and visa filing in-house, that is the part we do.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'For businesses', to: '/for-business' },
    { label: 'Recruitment partners' },
  ],
  highlights: [
    { title: 'Any state', desc: 'Partners work with us from across India.' },
    { title: 'You keep the client', desc: 'The relationship in your city stays yours.' },
    { title: 'We do the filing', desc: 'Documentation, checks and submission.' },
    { title: 'Terms in writing', desc: 'Agreed per arrangement, before work starts.' },
  ],
  sections: [
    {
      heading: 'The problem this solves',
      body: [
        'Most agents lose files not because the candidate was ineligible, but because the documentation was wrong — an inconsistency between a transcript and a form, a funds history that does not support the claim, a statement that contradicts the application. Building that capability in-house means hiring people who have seen enough refusals to recognise the patterns.',
        'The alternative is to keep the counselling relationship you already have in your city, and hand the documentation and filing to someone who does only that.',
      ],
      bullets: [
        'You do counselling, candidate sourcing and the local relationship',
        'We do eligibility review, documentation, employer introductions where a route needs one, and filing',
        'You stay the point of contact for your candidate unless you want otherwise',
      ],
    },
    {
      heading: 'What we ask of a partner',
      body: [
        'Very little procedurally, and one thing absolutely. Procedurally: accurate candidate information, documents in the state they actually exist in, and realistic expectations set before a file reaches us.',
        'Absolutely: no candidate is charged for a job offer, and no document is altered. A partner who does either is not a partner we keep, regardless of volume. That is not a policy for a web page — it is the thing that ends a consultancy when a pattern of it is found.',
      ],
    },
    {
      heading: 'How an arrangement starts',
      body: [
        'A conversation, then a small number of real files, then written terms that reflect what each side actually did. We would rather agree terms after we have both seen how the work runs than publish a rate card that fits nobody.',
      ],
    },
    HONESTY,
    REGULATION,
    CONTACT_SECTION('If you run a consultancy or advise candidates in your state, we are interested in the conversation.'),
  ],
  processSteps: [
    { title: 'Introduction', desc: 'What you do, where, and which routes your candidates want.' },
    { title: 'Trial files', desc: 'A few real cases, so both sides see how the work runs.' },
    { title: 'Written terms', desc: 'Scope, responsibilities and commercials, agreed in writing.' },
    { title: 'Ongoing', desc: 'You keep the local relationship; we handle documentation and filing.' },
  ],
  faqs: [
    {
      question: 'Which states do you accept partners from?',
      answer:
        'Any. We are based in Surat and work with applicants across India already — the regional pages on this site set out the document and submission routes state by state.',
    },
    {
      question: 'Is there a joining fee or a franchise fee?',
      answer:
        'Contact us to discuss terms for your proposal. We set commercials per arrangement rather than publishing a standard fee, because what each side does varies too much for one number to be honest.',
    },
    {
      question: 'Do you take over our client?',
      answer:
        'No. The relationship in your city is yours. Where a route needs us to speak to the candidate directly, we say so first.',
    },
    {
      question: 'Can you guarantee placements for our candidates?',
      answer:
        'No. We can tell you honestly and early whether a candidate is a realistic fit for a route, which is more useful than a guarantee nobody can keep.',
    },
  ],
  related: [
    { label: 'For businesses', to: '/for-business' },
    { label: 'For employers', to: '/for-business/employers' },
    { label: 'Start the conversation', to: '/for-business/contact' },
    { label: 'Where we work in India', to: '/regional-coverage' },
  ],
  datePublished: '2026-09-30',
}

export const forEmployers: DestinationContent = {
  path: '/for-business/employers',
  kind: 'hub',
  serviceType: 'International recruitment support',
  eyebrow: 'For businesses · Employers',
  h1: 'For Employers Hiring from India and South Asia',
  title: 'For Employers | Hiring from India & South Asia',
  description:
    'Sourcing and visa documentation support for employers recruiting from India, Nepal, Bangladesh, Pakistan and Sri Lanka. No placement guarantees.',
  keywords:
    'hire workers from india, recruit from south asia, international recruitment india, overseas manpower supply india, hire skilled workers from india, recruitment agency india for employers, source candidates from nepal bangladesh',
  heroDescription:
    'We source and prepare candidates from India, Nepal, Bangladesh, Pakistan and Sri Lanka, and handle the documentation their visa route requires.',
  breadcrumbs: [
    { label: 'Home', to: '/' },
    { label: 'For businesses', to: '/for-business' },
    { label: 'Employers' },
  ],
  highlights: [
    { title: 'Five countries', desc: 'India, Nepal, Bangladesh, Pakistan, Sri Lanka.' },
    { title: 'Documentation', desc: 'Prepared to the route’s requirements, not approximately.' },
    { title: 'You decide', desc: 'You interview and you hire. We do not screen you out of that.' },
    { title: 'Written scope', desc: 'Agreed before work starts.' },
  ],
  sections: [
    {
      heading: 'What we do for an employer',
      body: [
        'We identify candidates who genuinely match a role and a visa route, prepare their documentation to what that route requires, and manage the application through the official process. Where a route requires the employer to hold a specific status — a sponsor licence, an accreditation, a registration — we work to what that route actually requires rather than around it.',
        'You interview and you hire. We do not present a shortlist as a decision.',
      ],
      bullets: [
        'Candidate sourcing against a defined role and route',
        'Document preparation, verification and attestation routing',
        'Interview coordination across time zones',
        'Visa application preparation and submission through official channels',
      ],
    },
    {
      heading: 'What it costs and how long it takes',
      body: [
        'Both depend on the country, the route and the volume, and we will not publish a number that would be wrong for most readers. Processing times in particular are set by the destination government and change; anyone quoting you a fixed timeline for a visa decision is quoting something they do not control.',
        'Tell us the role, the country and roughly how many people, and we will give you a realistic answer for that case.',
      ],
    },
    HONESTY,
    REGULATION,
    CONTACT_SECTION('Tell us the role and the country and we will tell you whether we can help.'),
  ],
  faqs: [
    {
      question: 'Which countries do you recruit from?',
      answer: 'India, Nepal, Bangladesh, Pakistan and Sri Lanka.',
    },
    {
      question: 'How quickly can you supply candidates?',
      answer:
        'It depends entirely on the role, the route and the country, so we answer that for a specific case rather than in general. Visa processing time is set by the destination government and is not something we or anyone else controls.',
    },
    {
      question: 'Do you charge the candidate?',
      answer:
        'Candidates are never charged for a job offer. Where a candidate pays for visa and documentation services, that is itemised in writing and separate from any hiring decision.',
    },
    {
      question: 'Can you guarantee a candidate will get a visa?',
      answer:
        'No. The decision belongs to the immigration authority. We can prepare an application that is complete, accurate and consistent, which is the part that is actually in anyone’s control.',
    },
  ],
  related: [
    { label: 'For businesses', to: '/for-business' },
    { label: 'For recruitment partners', to: '/for-business/recruitment-partners' },
    { label: 'Start the conversation', to: '/for-business/contact' },
    { label: 'Current vacancies we are filling', to: '/urgent-requirements' },
  ],
  datePublished: '2026-09-30',
}

export const businessPages: DestinationContent[] = [businessHub, recruitmentPartners, forEmployers]

export const BUSINESS_PAGES_BY_PATH = Object.fromEntries(
  businessPages.map((p) => [p.path, p]),
) as Record<string, DestinationContent>
