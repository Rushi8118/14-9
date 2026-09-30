/**
 * Location pages for Indian states and Gujarat cities.
 *
 * WHY THESE EXIST, AND WHY THERE ARE ~30 OF THEM AND NOT ~220
 *
 * People search locally: "visa consultant Rajkot", "study abroad consultants
 * Punjab". regional-coverage.ts already holds the research for that -- every
 * state and union territory, 199 cities, the RPO and VFS centre each state's
 * applicants actually use, the universities whose transcripts need verifying,
 * and the destination mix that state leans towards. All of it rendered on one
 * page, so none of it could rank for anything.
 *
 * The obvious move is a page per city. It is also the move that would damage
 * this site. Google's doorway-page policy names exactly that pattern -- many
 * near-identical pages varying only by place name, funnelling to one service --
 * and this site is already exposed: 51 template country pages, five work-visa
 * pages measured at 82-92% similarity to each other. Adding 199 more clones
 * would put roughly three quarters of the site into that category and risk the
 * 89 pages that currently work.
 *
 * So: one page per state/region, where the dataset gives each page genuinely
 * different substance -- Kerala routes through NORKA ROOTS and Kochi VFS,
 * Telangana through JNTUH transcripts and the Hyderabad US Consulate, Punjab
 * through GNDU and Jalandhar. Those are real differences between the pages, not
 * a place name swapped in a template. City-level intent is served by naming
 * every city inside its state's page, which is what a single genuinely useful
 * page does better than twenty thin ones.
 *
 * Gujarat cities get their own pages because that is where the business
 * actually operates.
 *
 * WHAT THESE PAGES MUST NOT SAY
 *
 * There is one office, in Surat. No page here claims a branch, a local team or
 * an address anywhere else -- every one states the service model plainly:
 * counselling from the Surat office, online for applicants elsewhere. Inventing
 * a local presence would be both a doorway signal and, on a YMYL immigration
 * site, a false claim about the business.
 *
 * No page here states a fee, a processing time, a success rate or an official
 * requirement. The administrative details come from regional-coverage.ts, which
 * is existing site content, and are phrased as where applications are typically
 * routed rather than as rules. Every page carries the standard immigration
 * disclaimer through DestinationPage.
 */
import type { DestinationContent, ContentSection } from './destination-types'
import { INDIAN_STATES_DATA, type RegionalLocation } from './regional-coverage'
import { NAP } from '@/lib/seo/site'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const regionPath = (name: string) => `/visa-consultants-in-${slugify(name)}`

/** Surat has its own hand-written page; nothing here should duplicate it. */
const SURAT_PATH = '/visa-consultants-in-surat'

/** Strips the "(Head Office)" annotation the dataset carries on Surat. */
const cityName = (city: string) => city.replace(/\s*\(.*?\)\s*/g, '').trim()

/**
 * The service model, stated the same way on every page so it cannot drift into
 * implying an office that does not exist.
 */
const serviceModelSection = (place: string): ContentSection => ({
  heading: `How we work with applicants in ${place}`,
  body: [
    `Siddhivinayak Overseas has one office, at ${NAP.fullAddress}. We do not have a branch in ${place}, and we would rather say so than imply otherwise.`,
    `Applicants in ${place} work with us by video consultation, phone and WhatsApp, with documents shared digitally and originals handled by courier where a step needs them. Counselling is available in Gujarati, Hindi or English. If you can travel to Surat, you are welcome at the office — call ahead so a counsellor is free.`,
  ],
  bullets: [
    'Video or phone consultation, at a time that suits you',
    `WhatsApp updates on ${NAP.phoneINDisplay} through every stage`,
    'Documents reviewed digitally before anything is submitted',
    'In-person counselling at the Surat office if you prefer',
  ],
})

/** Identical on every page, so the anti-fraud advice cannot drift into a claim. */
const FRAUD_SECTION: ContentSection = {
  heading: 'Protect yourself when choosing a consultant',
  body: [
    'Distance makes verification harder, so it matters more. A genuine consultancy will put its fees in writing before you pay, will not sell you a job offer, and will not promise a visa outcome — no one can, because the decision belongs to the immigration authority.',
  ],
  bullets: [
    'Never pay to "buy" a job offer, sponsorship certificate or visa approval',
    'Ask for itemised fees in writing before any payment',
    'Be wary of anyone guaranteeing a visa, a job or a salary',
    'Never submit false, altered or backdated documents — refusals and bans follow',
  ],
}

function destinationLinks(destinations: string[]) {
  const STUDY: Record<string, string> = {
    'United Kingdom': '/study-in-uk',
    Canada: '/study-in-canada',
    Australia: '/study-in-australia',
    Germany: '/study-in-germany',
    'United States': '/study-in-usa',
    USA: '/study-in-usa',
    'New Zealand': '/study-in-new-zealand',
    Ireland: '/study-in-ireland',
    France: '/study-in-france',
    Singapore: '/study-in-singapore',
  }
  const WORK: Record<string, string> = {
    'United Kingdom': '/work-visa/uk',
    Canada: '/work-visa/canada',
    Australia: '/work-visa/australia',
    Germany: '/work-visa/germany',
    Japan: '/work-visa/japan',
    'New Zealand': '/work-visa/new-zealand',
  }
  const links: Array<{ label: string; to: string }> = []
  for (const d of destinations) {
    if (WORK[d]) links.push({ label: `${d} work visa`, to: WORK[d] })
    else if (STUDY[d]) links.push({ label: `Study in ${d}`, to: STUDY[d] })
  }
  return links.slice(0, 4)
}

function buildRegionPage(region: RegionalLocation): DestinationContent {
  const place = region.name
  const cities = region.majorCities.map(cityName)
  const cityList = cities.slice(0, 8).join(', ')
  const dests = region.popularDestinations
  const isGujarat = place === 'Gujarat'

  return {
    path: regionPath(place),
    kind: 'local',
    serviceType: 'Visa consultancy',
    eyebrow: `Study & work visas · ${place}`,
    h1: `Study & Work Visa Consultants for ${place}`,
    title: `Visa Consultants for ${place} | Study & Work Visa Support`.slice(0, 60),
    description:
      `Study and work visa guidance for applicants from ${place} — ${cities.slice(0, 3).join(', ')} and more. ` +
      `Online consultation from our Surat office.`,
    // The dataset's hand-written keywords, plus a city-intent set generated for
    // every city in the region. People search the way they think -- "visa
    // consultants in rajkot", "study abroad consultants nagpur" -- not by state
    // name. The hand-written ones come first because they were chosen; the
    // generated ones make sure no city in the region is unrepresented.
    keywords: [
      ...region.primaryKeywords,
      ...cities.flatMap((c) => {
        const city = c.toLowerCase()
        return [
          `visa consultants in ${city}`,
          `study visa consultant ${city}`,
          `work visa consultant ${city}`,
          `study abroad consultants ${city}`,
        ]
      }),
      `visa consultants in ${place.toLowerCase()}`,
      `study abroad consultants ${place.toLowerCase()}`,
      `work visa agent ${place.toLowerCase()}`,
    ].join(', '),
    heroDescription: isGujarat
      ? `We are a Gujarat consultancy, based in Surat. Eligibility checks, documentation and visa filing support for applicants across ${cityList}.`
      : `Honest eligibility checks, documentation and visa filing support for applicants in ${place}, delivered online from our Surat office.`,
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Regional coverage', to: '/regional-coverage' },
      { label: place },
    ],
    highlights: [
      { title: 'Cities covered', desc: cities.slice(0, 4).join(', ') },
      { title: 'Where files are submitted', desc: region.regionalHub },
      { title: 'Common destinations', desc: dests.slice(0, 4).join(', ') },
      {
        title: isGujarat ? 'Surat office' : 'Consultation',
        desc: isGujarat ? 'Pragti IT Park, Kiran Chowk–Yogi Chowk Road.' : 'Video, phone or WhatsApp — plus the Surat office if you travel.',
      },
    ],
    sections: [
      {
        heading: `Study and work visa support for applicants from ${place}`,
        body: [
          `Applicants from ${place} come to us with the same three needs: an honest assessment of whether a route is realistic, a plan matched to their budget rather than to a sales target, and documentation that survives scrutiny. Where a destination is a poor fit, we say so — that conversation is cheaper than a refusal.`,
          // Every city by name, not the first eight. These names are the
          // page's most distinguishing tokens: they are what separates the
          // Bihar page from the Odisha page, for a reader and for a crawler.
          `We work with applicants across ${place}${region.capital ? `, from ${region.capital} and` : ' —'} ${cities.join(', ')}.`,
        ],
        bullets: [
          'Study visas: course and country choice, funds planning, SOP and interview preparation',
          'Work visas: eligibility against the route, employer introductions where the route needs one',
          'Document checklists built around what refusals are actually caused by',
          'File tracking through to a decision',
        ],
      },
      {
        heading: `Documents from ${place}: verification and attestation`,
        body: [
          `Where your documents were issued changes the steps before they can be submitted. For ${place}, applications are typically routed through: ${region.localDocumentNotes}`,
          'Requirements change, and they differ by destination country and visa route. Confirm the current process on the issuing authority’s official page before paying any fee — we will tell you which page that is for your route.',
        ],
      },
      {
        heading: `Where ${place} applicants submit biometrics and applications`,
        body: [
          `${place} applicants generally submit through ${region.regionalHub}. Which centre applies depends on the destination country and where your passport was issued, so confirm on the official visa application centre site before you travel to one.`,
        ],
      },
      {
        heading: `Destinations ${place} applicants most often ask about`,
        body: [
          `The routes we are asked about most from ${place} are ${dests.join(', ')}. That mix reflects what people from the region tend to pursue — it is not a ranking, and it is not a recommendation for your profile. Which route suits you depends on your qualifications, experience, English level and budget.`,
        ],
      },
      serviceModelSection(place),
      FRAUD_SECTION,
    ],
    processSteps: [
      { title: 'Free consultation', desc: 'Share your academics, experience, budget and target country.' },
      { title: 'Honest assessment', desc: 'Which routes are realistic for your profile, and which are not.' },
      { title: 'Preparation', desc: 'Applications, documents and interview readiness.' },
      { title: 'Visa stage', desc: 'Submission through the official process, then follow-up.' },
    ],
    faqs: [
      {
        question: `Do you have an office in ${place}?`,
        answer: isGujarat
          ? `Our office is in Surat, at ${NAP.fullAddress}. We work with applicants across Gujarat from there, in person or online.`
          : `No. We have one office, in Surat, Gujarat. Applicants in ${place} work with us by video consultation, phone and WhatsApp. We would rather tell you that than imply a branch we do not have.`,
      },
      {
        question: `Can you help if my documents are from ${place}?`,
        answer: `Yes. ${region.localDocumentNotes} We will confirm the current requirement for your specific route against the official source before you act on it.`,
      },
      {
        question: 'Can you guarantee my visa will be approved?',
        answer:
          'No, and nobody can. The decision rests with the immigration authority of the destination country, and hiring decisions rest with the employer. What we can do is check your eligibility honestly and prepare a complete, accurate application.',
      },
      {
        question: 'How do I start?',
        answer: `Call or WhatsApp ${NAP.phoneINDisplay}, email ${NAP.email}, or use the contact form on this site. The first consultation is free.`,
      },
    ],
    related: [
      ...destinationLinks(dests),
      { label: 'Study visa services', to: '/study-visa' },
      { label: 'Work visa services', to: '/work-visa' },
      { label: 'All regions we cover', to: '/regional-coverage' },
      { label: 'Book a consultation', to: '/contact' },
    ],
    datePublished: '2026-09-30',
  }
}

function buildGujaratCityPage(city: string, gujarat: RegionalLocation): DestinationContent {
  const dests = gujarat.popularDestinations
  return {
    path: `/visa-consultants-in-${slugify(city)}`,
    kind: 'local',
    /**
     * Live and crawlable, deliberately out of the index.
     *
     * Measured on the first build of these pages: the nine Gujarat city pages
     * scored 0.877-0.889 pairwise similarity, every one of them exactly 1442
     * words. That is not a near-miss, it is the signature of a template with the
     * city name swapped -- the doorway pattern these pages were designed to
     * avoid, and worse than the 0.82-0.92 work-visa pages already flagged as a
     * problem on this site.
     *
     * The cause is that regional-coverage.ts holds no per-city facts. Everything
     * that differs between Rajkot and Mehsana on these pages is the name.
     *
     * They stay live because they are genuinely useful to someone who lands on
     * one, and noindex keeps them out of sitemap.xml automatically (see
     * scripts/seo-routes.mjs). Remove this flag per city once that city's page
     * carries something true and specific to it -- which Regional Passport
     * Office has jurisdiction, which university its colleges affiliate to,
     * travel to the Surat office -- rather than sooner.
     */
    noindex: true,
    serviceType: 'Visa consultancy',
    eyebrow: `Visa consultants · ${city}`,
    h1: `Visa Consultants for ${city} — Study & Work Abroad`,
    title: `Visa Consultants in ${city} | Study & Work Visa Guidance`.slice(0, 60),
    description:
      `Study and work visa guidance for applicants from ${city}, Gujarat. Counselling at our Surat office or online. Free first consultation.`,
    keywords: [
      `visa consultants in ${city.toLowerCase()}`,
      `study visa consultant ${city.toLowerCase()}`,
      `work visa consultant ${city.toLowerCase()}`,
      `abroad education consultant ${city.toLowerCase()}`,
      `${city.toLowerCase()} to canada study visa`,
      `${city.toLowerCase()} work visa agent`,
      'visa consultants in gujarat',
    ].join(', '),
    heroDescription: `We are a Gujarat consultancy based in Surat, working with students and professionals from ${city} on study and work visa routes.`,
    breadcrumbs: [
      { label: 'Home', to: '/' },
      { label: 'Gujarat', to: regionPath('Gujarat') },
      { label: city },
    ],
    highlights: [
      { title: 'Same state', desc: `Surat office, a short trip from ${city}.` },
      { title: 'Study + work', desc: 'One team for student visas and overseas work routes.' },
      { title: 'Gujarati counselling', desc: 'Gujarati, Hindi or English — your choice.' },
      { title: 'Document route', desc: 'GTU / Gujarat University verification, Gandhinagar attestation.' },
    ],
    sections: [
      {
        heading: `Study and work visa guidance for ${city}`,
        body: [
          `If you are searching for a visa consultant in ${city}, you are usually weighing three things: whether you are actually eligible, which country fits your budget, and whether your documents will hold up. We start with the first, because the other two do not matter if the answer is no.`,
          `${city} is in Gujarat, so you can reach our Surat office in a single day if you would rather sit across a desk. Most of the work — document review, applications, interview preparation — happens online either way.`,
        ],
        bullets: [
          'Study visas: Canada, UK, Australia, USA, Germany, Ireland, New Zealand',
          'Work visas: Japan SSW, Germany, Canada, UK and Australia routes',
          'SOP, GTE/GS statement and interview preparation',
          'File tracking through to a decision',
        ],
      },
      {
        heading: `Documents issued in ${city}`,
        body: [
          `Gujarat-issued documents follow a known route: ${gujarat.localDocumentNotes}`,
          `Degrees from ${city} colleges are usually verified through their affiliating university. Confirm the current process on the university's and the destination country's official pages before paying any fee — rules change, and they differ by route.`,
        ],
      },
      {
        heading: 'Where Gujarat applicants submit applications',
        body: [
          `Gujarat applicants generally submit through ${gujarat.regionalHub}. Which centre applies depends on the destination country, so check the official visa application centre site before travelling to one.`,
        ],
      },
      {
        heading: `Why applicants from ${city} come to us`,
        body: [
          'Gujarat academic profiles have recognisable patterns — study gaps, backlogs, medium-of-instruction questions, family sponsor structures. Generic advice handles those badly. A counsellor who has seen the same pattern a hundred times will tell you quickly whether it is a problem for your route or not.',
        ],
      },
      FRAUD_SECTION,
    ],
    processSteps: [
      { title: 'Free consultation', desc: 'In Surat or online — academics, budget, target country.' },
      { title: 'Honest assessment', desc: 'What is realistic for your profile, and what is not.' },
      { title: 'Preparation', desc: 'Applications, SOP and document quality control.' },
      { title: 'Visa stage', desc: 'Submission through the official process, then follow-up.' },
    ],
    faqs: [
      {
        question: `Do you have an office in ${city}?`,
        answer: `No. Our office is in Surat, at ${NAP.fullAddress} — the same state, and reachable in a day from ${city}. Most applicants from ${city} work with us online and visit once, or not at all.`,
      },
      {
        question: `Which countries do you handle for applicants from ${city}?`,
        answer: `The routes we are asked about most from Gujarat are ${dests.slice(0, 6).join(', ')}. Which one suits you depends on your profile, not on where you live.`,
      },
      {
        question: 'Can you guarantee a visa or a job?',
        answer:
          'No. Visa decisions rest with the immigration authority and hiring with the employer. Anyone promising either is worth walking away from.',
      },
      {
        question: 'How do I book?',
        answer: `Call or WhatsApp ${NAP.phoneINDisplay}, email ${NAP.email}, or use the contact form. The first consultation is free.`,
      },
    ],
    related: [
      { label: 'Visa consultants in Gujarat', to: regionPath('Gujarat') },
      { label: 'Visa consultants in Surat', to: SURAT_PATH },
      { label: 'Study visa services', to: '/study-visa' },
      { label: 'Work visa services', to: '/work-visa' },
      { label: 'Book a consultation', to: '/contact' },
    ],
    datePublished: '2026-09-30',
  }
}

const indianRegions = INDIAN_STATES_DATA.filter((r) => r.country === 'India')

export const regionPages: DestinationContent[] = indianRegions.map(buildRegionPage)

const gujarat = indianRegions.find((r) => r.name === 'Gujarat')

/** Gujarat city pages, excluding Surat, which has its own hand-written page. */
export const gujaratCityPages: DestinationContent[] = gujarat
  ? gujarat.majorCities
      .map(cityName)
      .filter((c) => c.toLowerCase() !== 'surat')
      .map((c) => buildGujaratCityPage(c, gujarat))
  : []

export const allLocationPages: DestinationContent[] = [...regionPages, ...gujaratCityPages]

export const LOCATION_PAGES_BY_PATH = Object.fromEntries(
  allLocationPages.map((p) => [p.path, p]),
) as Record<string, DestinationContent>

/**
 * Cross-link the location pages to each other, for the same reason the pathways
 * needed it: a page linked only from a hub is a page Google reports as
 * "Discovered - currently not indexed". Assigned as a cycle so every page
 * receives as many inbound links as it gives out.
 */
const LOCATION_SIBLINGS = 3

regionPages.forEach((page, i) => {
  const siblings = []
  for (let k = 1; k <= LOCATION_SIBLINGS && k < regionPages.length; k++) {
    const s = regionPages[(i + k) % regionPages.length]
    siblings.push({ label: s.h1, to: s.path, description: s.description })
  }
  const seen = new Set<string>()
  page.related = [...siblings, ...page.related].filter((l) => {
    if (l.to === page.path || seen.has(l.to)) return false
    seen.add(l.to)
    return true
  })
})

gujaratCityPages.forEach((page, i) => {
  const siblings = []
  for (let k = 1; k <= 2 && k < gujaratCityPages.length; k++) {
    const s = gujaratCityPages[(i + k) % gujaratCityPages.length]
    siblings.push({ label: s.h1, to: s.path, description: s.description })
  }
  const seen = new Set<string>()
  page.related = [...siblings, ...page.related].filter((l) => {
    if (l.to === page.path || seen.has(l.to)) return false
    seen.add(l.to)
    return true
  })
})

/**
 * Gujarat links down to its city pages.
 *
 * The city pages already link up to Gujarat through their breadcrumb and
 * related list, but without this the link is one-way: the city pages would
 * depend entirely on the /regional-coverage hub for discovery, which is the
 * single-inbound-link pattern Google reports as "Discovered - currently not
 * indexed". It is also what a reader on the Gujarat page actually wants next.
 */
const gujaratPage = regionPages.find((p) => p.path === regionPath('Gujarat'))

if (gujaratPage) {
  const cityLinks = gujaratCityPages.map((c) => ({
    label: c.h1.replace(' — Study & Work Abroad', ''),
    to: c.path,
  }))
  const seen = new Set<string>()
  gujaratPage.related = [
    { label: 'Visa consultants in Surat', to: SURAT_PATH, description: 'Our office — counselling in person.' },
    ...cityLinks,
    ...gujaratPage.related,
  ].filter((l) => {
    if (l.to === gujaratPage.path || seen.has(l.to)) return false
    seen.add(l.to)
    return true
  })
}
