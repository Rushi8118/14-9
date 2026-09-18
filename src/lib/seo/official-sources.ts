export type OfficialSource = { label: string; url: string }

const EU_PORTAL: OfficialSource = { label: 'EU Immigration Portal', url: 'https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal_en' }

const BY_COUNTRY: Record<string, OfficialSource[]> = {
  canada: [{ label: 'Immigration, Refugees and Citizenship Canada', url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html' }],
  uk: [{ label: 'GOV.UK — Visas and immigration', url: 'https://www.gov.uk/browse/visas-immigration' }],
  'united kingdom': [{ label: 'GOV.UK — Visas and immigration', url: 'https://www.gov.uk/browse/visas-immigration' }],
  australia: [{ label: 'Australian Department of Home Affairs', url: 'https://immi.homeaffairs.gov.au/' }],
  usa: [{ label: 'U.S. Department of State — Visas', url: 'https://travel.state.gov/content/travel/en/us-visas.html' }],
  'united states': [{ label: 'U.S. Department of State — Visas', url: 'https://travel.state.gov/content/travel/en/us-visas.html' }],
  'new zealand': [{ label: 'Immigration New Zealand', url: 'https://www.immigration.govt.nz/' }],
  germany: [{ label: 'Make it in Germany (Federal Government portal)', url: 'https://www.make-it-in-germany.com/en/' }, EU_PORTAL],
  ireland: [{ label: 'Irish Immigration Service', url: 'https://www.irishimmigration.ie/' }, EU_PORTAL],
  france: [{ label: 'France-Visas (official)', url: 'https://france-visas.gouv.fr/' }, EU_PORTAL],
  japan: [{ label: 'Ministry of Foreign Affairs of Japan — Visas', url: 'https://www.mofa.go.jp/j_info/visit/visa/index.html' }],
  singapore: [{ label: 'Ministry of Manpower Singapore', url: 'https://www.mom.gov.sg/' }],
}

const EUROPE = new Set([
  'albania', 'armenia', 'austria', 'croatia', 'denmark', 'finland', 'hungary', 'italy', 'malta', 'moldova',
  'netherlands', 'norway', 'poland', 'portugal', 'romania', 'slovakia', 'spain', 'sweden', 'switzerland',
])

/** Official government links for a destination. */
export function officialSourcesFor(country?: string): OfficialSource[] {
  const key = (country ?? '').trim().toLowerCase()
  const specific = BY_COUNTRY[key] ?? (EUROPE.has(key) ? [EU_PORTAL] : [])
  return specific
}
