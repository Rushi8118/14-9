import { fetchTrendingKeywords } from '@/lib/ai/providers'
import { containsUnsafeClaims } from '@/lib/ai/guardrails'
import { hasPageKeywords, loadPageKeywords } from '@/content/keyword-files'

/**
 * Keyword suggestions for an urgent requirement, from two sources:
 *
 * - `google`: what people are typing right now, from Google autocomplete
 *   (the `keyword_trends` feature of the ai-generate edge function) for
 *   seeds built from the job and country.
 * - `plan`: the country's keywords from docs/seo/keyword-strategy.csv, as
 *   mapped to its /work-visa page by scripts/build-keyword-map.mjs.
 *
 * Neither source has search volumes, so none are claimed.
 */

export type UrgentKeywordInput = {
  title: string
  country: string
  category?: string
  visaType?: string
  city?: string
}

export type KeywordSuggestions = {
  google: string[]
  plan: string[]
  /** Google failed (edge function down, not signed in as admin…). */
  googleError?: string
}

/** Country names as typed in the admin form → the /work-visa/<slug> page. */
const COUNTRY_ALIASES: Array<[RegExp, string]> = [
  [/\b(uk|u\.k\.|united kingdom|britain|great britain|england|scotland|wales)\b/i, 'uk'],
  [/\b(usa|u\.s\.a?\.?|united states|america)\b/i, 'usa'],
  [/\b(uae|u\.a\.e\.|united arab emirates|dubai|abu dhabi|oman|kuwait|bahrain|gulf)\b/i, 'gulf'],
  [/\b(nz|new zealand)\b/i, 'new-zealand'],
  [/\b(saudi|ksa)\b/i, 'saudi-arabia'],
  [/\b(czechia)\b/i, 'czech-republic'],
  [/\b(korea)\b/i, 'south-korea'],
]

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function workVisaPathFor(country: string): string | null {
  const name = country.trim()
  if (!name) return null
  for (const [pattern, slug] of COUNTRY_ALIASES) {
    if (pattern.test(name)) return `/work-visa/${slug}`
  }
  const path = `/work-visa/${slugify(name)}`
  return hasPageKeywords(path) ? path : null
}

/** Claims the warning list in docs/seo/keyword-strategy.md rules out. */
const BLOCKED =
  /\b(guarantee\w*|100 ?%|free visa|cheap|cheapest|fake|without (any )?documents?|no (ielts|interview) guaranteed|same day|24 hours?|licensed|government approved|official agent)\b/i

const clean = (k: string) => k.replace(/\s+/g, ' ').trim()
const isSafe = (k: string) => k.length >= 3 && k.length <= 90 && !BLOCKED.test(k) && !containsUnsafeClaims(k)

/** "Urgent Requirement: 25 NHS Care Workers (UK)" → "nhs care workers". */
export function jobTermFrom(input: UrgentKeywordInput): string {
  const source = input.category?.trim() && !/^(work visa|general|other)$/i.test(input.category.trim())
    ? input.category
    : input.title
  return clean(
    source
      .replace(/urgent(ly)?\s*(requirement|hiring|vacanc(y|ies)|opening)s?\s*:?/gi, '')
      .replace(/\([^)]*\)/g, ' ')
      .replace(new RegExp(`\\b${input.country.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), ' ')
      .replace(/\b(in|for|at|to)\s*$/i, ' ')
      .replace(/\d+/g, ' ')
      .replace(/[^a-z\s&/-]/gi, ' '),
  ).toLowerCase()
}

function seedsFor(input: UrgentKeywordInput): string[] {
  const country = input.country.trim().toLowerCase()
  const job = jobTermFrom(input)
  const seeds = [
    job && `${job} jobs in ${country}`,
    job && `${country} ${job} visa`,
    `${country} work visa`,
    input.visaType?.trim() && `${country} ${input.visaType.trim().toLowerCase()}`,
  ]
  return [...new Set(seeds.filter((s): s is string => Boolean(s)))].slice(0, 4)
}

/** "United Kingdom work visa" and "UK work visa" are one search for our purposes. */
const variantKey = (k: string) =>
  k.toLowerCase()
    .replace(/\bunited kingdom\b/g, 'uk')
    .replace(/\bunited states\b/g, 'usa')
    .replace(/\bnew zealand\b/g, 'nz')
    .replace(/\bunited arab emirates\b/g, 'uae')

/** Words too generic to tell one job from another. */
const GENERIC_JOB_WORDS = new Set([
  'service', 'services', 'staff', 'worker', 'workers', 'job', 'jobs', 'work', 'visa', 'and', 'the',
  'general', 'helper', 'helpers', 'vacancy', 'vacancies', 'hiring', 'needed', 'required', 'ssw',
])
const jobWordsOf = (job: string) => job.split(/\s+/).filter((w) => w.length > 2 && !GENERIC_JOB_WORDS.has(w))
const hasWord = (text: string, word: string) =>
  new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text)

/** Higher = more useful for a job listing aimed at applicants in India. */
function planScore(k: string, job: string, countryLabels: Set<string>): number {
  const lower = k.toLowerCase()
  let score = 0
  if (/\b(india|indians|surat|gujarat)\b/.test(lower)) score += 3
  if (/\b(skilled worker|work permit|work visa|job|jobs|salary|documents|processing time|requirements?|eligibility)\b/.test(lower)) score += 2
  if (jobWordsOf(job).some((w) => hasWord(lower, w))) score += 4
  // City-to-city pairs ("Surat to Munich") have next to no searches.
  const pair = lower.match(/\b(?:surat|ahmedabad|vadodara|rajkot|navsari|anand|bharuch|valsad) to ([a-z ]+?) work/)
  if (pair && !countryLabels.has(pair[1].trim())) score -= 6
  // Other origin countries and cities the office doesn't serve locally.
  if (/\b(pakistan|nepal|bangladesh|sri lanka|mumbai|delhi|pune|bengaluru|hyderabad|chennai|kochi|jaipur|chandigarh)\b/.test(lower)) score -= 3
  // Route-specific terms that only fit some listings.
  if (/\b(seasonal|job seeker)\b/.test(lower) && !/\b(seasonal|farm|harvest|agri|fruit|picker)/.test(job)) score -= 6
  if (/\b(student|study)\b/.test(lower)) score -= 4
  return score
}

/** The country's keyword-plan terms, most useful first. */
async function planKeywordsFor(country: string, job: string): Promise<string[]> {
  const path = workVisaPathFor(country)
  const name = country.trim().toLowerCase()
  const all = path
    ? (await loadPageKeywords(path)).flatMap((t) => t.keywords)
    : // No country page yet: its keywords sit on the /work-visa hub.
      (await loadPageKeywords('/work-visa')).flatMap((t) => t.keywords).filter((k) => k.toLowerCase().includes(name))
  // How the plan names this country ("uk", "united kingdom", "uae"…), read
  // from its head terms such as "UK work visa".
  const labels = new Set(
    all.map((k) => k.toLowerCase().match(/^(.+) work visa$/)?.[1]).filter((v): v is string => Boolean(v)),
  )
  labels.add(name)
  const seen = new Set<string>()
  return all
    .map((k, i) => ({ k, i, score: planScore(k, job, labels) }))
    .filter(({ k, score }) => {
      const key = variantKey(k)
      if (score < 0 || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ k }) => k)
}

function uniq(list: string[], exclude: Set<string> = new Set()): string[] {
  const seen = new Set(exclude)
  const out: string[] = []
  for (const raw of list) {
    const k = clean(raw)
    const key = k.toLowerCase()
    if (!isSafe(k) || seen.has(key)) continue
    seen.add(key)
    out.push(k)
  }
  return out
}

export async function suggestUrgentKeywords(input: UrgentKeywordInput): Promise<KeywordSuggestions> {
  if (!input.country.trim()) return { google: [], plan: [] }

  const job = jobTermFrom(input)
  let firstGoogleError: string | undefined
  const [googleResult, planResult] = await Promise.allSettled([
    Promise.all(
      seedsFor(input).map((seed) =>
        fetchTrendingKeywords(seed).catch((err: unknown) => {
          firstGoogleError ??= err instanceof Error ? err.message : 'Could not reach Google suggestions.'
          return [] as string[]
        }),
      ),
    ),
    planKeywordsFor(input.country, job),
  ])

  const jobWords = jobWordsOf(job)
  const relevance = (k: string) => jobWords.filter((w) => hasWord(k, w)).length

  let google: string[] = []
  let googleError: string | undefined
  if (googleResult.status === 'fulfilled') {
    const flat = googleResult.value.flat()
    // Keep Google's order within a seed, but lift phrases that mention the job.
    google = uniq(flat.map((k, i) => ({ k, i })).sort((a, b) => relevance(b.k) - relevance(a.k) || a.i - b.i).map((x) => x.k))
    if (!flat.length) googleError = firstGoogleError ?? 'Google returned no suggestions for this job and country.'
  } else {
    googleError = googleResult.reason instanceof Error ? googleResult.reason.message : 'Could not reach Google suggestions.'
  }

  const plan = planResult.status === 'fulfilled'
    ? uniq(planResult.value, new Set(google.map((k) => k.toLowerCase())))
    : []

  return { google: google.slice(0, 40), plan: plan.slice(0, 60), googleError }
}

/** Short phrases are "related", five words or more are "long-tail". */
export function splitByLength(keywords: string[]): { related: string[]; longTail: string[] } {
  const related: string[] = []
  const longTail: string[] = []
  for (const k of keywords) (k.split(' ').length >= 5 ? longTail : related).push(k)
  return { related, longTail }
}

/**
 * The set added automatically after AI generation: the strongest Google
 * searches first, topped up from the keyword plan.
 */
export function pickAutoKeywords(s: KeywordSuggestions, limit = { related: 10, longTail: 8 }) {
  const google = splitByLength(s.google)
  const plan = splitByLength(s.plan)
  return {
    related: [...google.related, ...plan.related].slice(0, limit.related),
    longTail: [...google.longTail, ...plan.longTail].slice(0, limit.longTail),
  }
}

export function mergeKeywords(current: string[], added: string[]): string[] {
  const seen = new Set(current.map((k) => k.toLowerCase()))
  return [...current, ...added.filter((k) => !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))]
}
