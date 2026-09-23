#!/usr/bin/env node
/**
 * Maps every keyword in docs/seo/keyword-strategy.csv onto a page that
 * actually exists on the site, then writes:
 *
 *   src/content/keyword-map.generated.ts  – the 12 keywords each page shows
 *                                            first in "Popular searches"
 *   src/content/keywords/*.json           – every keyword for each page, by
 *                                            topic, loaded only on that page
 *   docs/seo/keyword-coverage.md          – where all 7,800+ keywords landed
 *
 * The CSV suggests ~3,000 URLs (one per city / origin / question). The SEO
 * docs warn that building those as separate thin pages gets a site filtered
 * (doorway pages, soft 404s), so this script folds each keyword into the
 * strongest existing page for its destination and service instead.
 *
 * Run with `npm run keywords` after editing either CSV or adding a page.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')

/** Shown per page. More than this reads as a keyword dump, not help. */
const MAX_SHOWN = 12

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else field += ch
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

// ── Pages that exist today ────────────────────────────────────────────────
const workSlugs = new Set(
  [...read('src/content/work-countries.ts').matchAll(/slug: "([a-z-]+)"/g)].map((m) => m[1]),
)
const staticRoutes = new Set(
  [...read('src/lib/seo/routes.ts').matchAll(/path: '([^']+)'/g)].map((m) => m[1]),
)
for (const m of read('src/content/pathways.ts').matchAll(/slug: '([a-z0-9-]+)'/g)) {
  staticRoutes.add(`/pathways/${m[1]}`)
}
const exists = (path) => staticRoutes.has(path) || (path.startsWith('/work-visa/') && workSlugs.has(path.slice(11)))

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const WORK_ALIAS = {
  'united-kingdom': 'uk',
  'united-states': 'usa',
  'united-arab-emirates': 'gulf',
  dubai: 'gulf',
}
const STUDY_ALIAS = {
  'united-kingdom': 'uk',
  'united-states': 'usa',
  'united-arab-emirates': 'dubai',
}
/** Post-study searches go to the pathway guides (audit C3, option A). */
const POST_STUDY = {
  'united-kingdom': '/pathways/uk-graduate-visa-to-skilled-worker-visa',
  canada: '/pathways/canada-pgwp-to-pr',
  australia: '/pathways/australia-485-to-employer-sponsored-visa',
  'new-zealand': '/pathways/new-zealand-accredited-employer-work-visa',
}

function targetFor(row) {
  const suggested = row['Suggested URL slug']
  if (exists(suggested)) return suggested

  const dest = slugify(row['Destination location'] || '-')
  switch (row.Service) {
    case 'Post-study work visa':
      return POST_STUDY[dest] ?? '/post-study-work-visa'
    case 'Study visa': {
      const path = `/study-in-${STUDY_ALIAS[dest] ?? dest}`
      return exists(path) ? path : '/study-visa'
    }
    case 'Work visa':
    case 'Work permit': {
      const path = `/work-visa/${WORK_ALIAS[dest] ?? dest}`
      return exists(path) ? path : '/work-visa'
    }
    default:
      return suggested.startsWith('/visa-consultants-in-surat') ? '/visa-consultants-in-surat' : '/'
  }
}

// ── What is fit to show on a page ─────────────────────────────────────────
// Everything is mapped; only these are hidden from the visible section.
const HIDDEN_NOTE = /misspell|risky|do not build|don't build|only use if|only publish where|check the route exists|subjective|never self|typo/i
const HIDDEN_WORD =
  /\b(cheap|cheapest|guarantee\w*|urgent|fast|fastest|quick|instant|easy|best|top|top-rated|trusted|no\.? ?1|number one|100%|free visa|licensed|registered|certified|approved|success rate)\b/i
const SHOWN_ORIGINS = new Set([
  '-', 'India', 'Pakistan', 'Nepal', 'Bangladesh', 'Sri Lanka', 'Abroad (on a student visa)',
  'Surat', 'Surat / Gujarat', 'Ahmedabad', 'Vadodara', 'Rajkot', 'Navsari',
])
const isShowable = (row) =>
  !['Brand', 'Variation'].includes(row['Keyword category']) &&
  !HIDDEN_NOTE.test(row.Notes) &&
  !HIDDEN_WORD.test(row.Keyword) &&
  SHOWN_ORIGINS.has(row['Origin location'])

const HUBS = new Set(['/work-visa', '/study-visa', '/post-study-work-visa'])
/** Countries a hub genuinely covers (the /post-study-work-visa comparison table). */
const HUB_COVERS = { '/post-study-work-visa': new Set(['Germany', 'Ireland']) }
const PRIORITY = { High: 0, Medium: 1, Low: 2 }
const CATEGORY = { Service: 0, Question: 1, Comparison: 2, Local: 3, Location: 4 }

// ── Build ─────────────────────────────────────────────────────────────────
const rows = parseCsv(read('docs/seo/keyword-strategy.csv'))
const byPage = new Map()
for (const [index, row] of rows.entries()) {
  const path = targetFor(row)
  if (!byPage.has(path)) byPage.set(path, [])
  // A keyword for a country the site has no page for lands on a hub. It is
  // kept out of the hub's top 12 (the hub does not cover that country) but
  // still listed under "See all".
  const dest = row['Destination location']
  const fallback = dest !== '-' && HUBS.has(path) && !HUB_COVERS[path]?.has(dest)
  byPage.get(path).push({ ...row, index, fallback })
}

// Near-duplicates ("uk …" / "united kingdom …", the same phrase for each
// nearby city or origin country) collapse to one entry, so a page shows a
// spread of different searches rather than twelve spellings of one.
const VARIANT = [
  [/\bunited kingdom\b/g, 'uk'],
  [/\bunited states\b/g, 'usa'],
  [/\bnew zealand\b/g, 'nz'],
  [/\bunited arab emirates\b/g, 'uae'],
  [/\b(surat|ahmedabad|vadodara|rajkot|navsari)\b/g, '{city}'],
  [/\b(india|pakistan|nepal|bangladesh|sri lanka)\b/g, '{origin}'],
]
const variantKey = (k) => VARIANT.reduce((s, [re, to]) => s.replace(re, to), k.toLowerCase())
const ORIGIN_RANK = { Surat: 0, 'Surat / Gujarat': 0, India: 1, '-': 1, 'Abroad (on a student visa)': 1 }

// CSV keywords are lower-case search queries; show them as readable phrases.
const ACRONYMS = ['uk', 'usa', 'nz', 'uae', 'eu', 'pgwp', 'pr', 'aewv', 'ielts', 'ssw', 'lmia', 'gcc', 'psw']
const PROPER = [
  ...new Set(
    rows
      .flatMap((r) => [r['Destination location'], r['Origin location']])
      .flatMap((v) => v.split(' / '))
      .filter((v) => /^[A-Z]/.test(v) && !v.startsWith('Abroad')),
  ),
  'Gujarat', 'Europe', 'Schengen', 'Blue Card', 'Opportunity Card', 'Graduate Route',
  'Indians', 'Indian', 'Shree Siddhivinayak Overseas', 'Siddhivinayak Overseas', 'Siddhi Vinayak Overseas',
].sort((a, b) => b.length - a.length)
const escape = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function display(keyword) {
  let out = keyword.trim()
  for (const name of PROPER) out = out.replace(new RegExp(`\\b${escape(name.toLowerCase())}\\b`, 'g'), name)
  out = out.replace(new RegExp(`\\b(${ACRONYMS.join('|')})\\b`, 'g'), (m) => m.toUpperCase())
  out = out.replace(/\bi\b/g, 'I')
  return out.charAt(0).toUpperCase() + out.slice(1)
}

const shown = {}
for (const [path, list] of byPage) {
  const seen = new Set()
  const buckets = new Map()
  list
    .filter((r) => isShowable(r) && !r.fallback)
    .sort(
      (a, b) =>
        PRIORITY[a.Priority] - PRIORITY[b.Priority] ||
        (ORIGIN_RANK[a['Origin location']] ?? 2) - (ORIGIN_RANK[b['Origin location']] ?? 2) ||
        a.index - b.index,
    )
    .forEach((r) => {
      const key = variantKey(r.Keyword.trim())
      if (seen.has(key)) return
      seen.add(key)
      const cat = r['Keyword category']
      if (!buckets.has(cat)) buckets.set(cat, [])
      buckets.get(cat).push(display(r.Keyword))
    })
  // Round-robin across categories: service terms, questions, comparisons, routes.
  const queues = [...buckets.entries()]
    .sort((a, b) => (CATEGORY[a[0]] ?? 9) - (CATEGORY[b[0]] ?? 9))
    .map(([, q]) => q)
  const picked = []
  while (picked.length < MAX_SHOWN && queues.some((q) => q.length)) {
    for (const q of queues) if (q.length && picked.length < MAX_SHOWN) picked.push(q.shift())
  }
  if (picked.length) shown[path] = picked
}

// ── Every keyword, per page ───────────────────────────────────────────────
// Only misspellings are left out: printed on the site they read as typos.
const TOPIC = {
  Service: 'Visa services',
  Question: 'Questions',
  Location: 'Routes, costs and requirements',
  Local: 'Local searches',
  Comparison: 'Choosing a consultant',
  Brand: 'About Siddhivinayak Overseas',
  Variation: 'Other ways people search',
}
const TYPO = /misspell|typo/i
const keywordFileId = (path) => (path === '/' ? 'home' : path.slice(1).replace(/\//g, '--'))

const KEYWORD_DIR = resolve(ROOT, 'src/content/keywords')
rmSync(KEYWORD_DIR, { recursive: true, force: true })
mkdirSync(KEYWORD_DIR, { recursive: true })
let allCount = 0
let typoCount = 0
for (const [path, list] of byPage) {
  const seen = new Set()
  const groups = new Map(Object.values(TOPIC).map((t) => [t, []]))
  for (const r of list) {
    if (TYPO.test(r.Notes)) {
      typoCount++
      continue
    }
    const key = r.Keyword.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    groups.get(TOPIC[r['Keyword category']] ?? TOPIC.Variation).push(display(r.Keyword))
  }
  const topics = [...groups].filter(([, k]) => k.length).map(([topic, keywords]) => ({ topic, keywords }))
  allCount += seen.size
  writeFileSync(resolve(KEYWORD_DIR, `${keywordFileId(path)}.json`), `${JSON.stringify(topics, null, 1)}\n`)
}

const sortedPaths = Object.keys(shown).sort()
const ts = `// Generated by scripts/build-keyword-map.mjs from docs/seo/keyword-strategy.csv.
// Do not edit by hand — run \`npm run keywords\`.

/** Searches each page answers, strongest first. Rendered by <KeywordTopics />. */
export const KEYWORD_MAP: Record<string, readonly string[]> = {
${sortedPaths.map((p) => `  ${JSON.stringify(p)}: ${JSON.stringify(shown[p])},`).join('\n')}
}
`
writeFileSync(resolve(ROOT, 'src/content/keyword-map.generated.ts'), ts)

// ── Coverage report ───────────────────────────────────────────────────────
const unbuilt = new Map()
for (const row of rows) {
  const dest = row['Destination location']
  const service = row.Service
  const target = targetFor(row)
  if (dest !== '-' && (target === '/work-visa' || target === '/study-visa' || target === '/post-study-work-visa')) {
    const key = `${dest} — ${service}`
    unbuilt.set(key, (unbuilt.get(key) ?? 0) + 1)
  }
}

const pageRows = [...byPage.entries()]
  .map(([path, list]) => ({
    path,
    total: list.length,
    high: list.filter((r) => r.Priority === 'High').length,
    shown: shown[path]?.length ?? 0,
  }))
  .sort((a, b) => b.total - a.total)

const md = `# Keyword coverage

Generated by \`scripts/build-keyword-map.mjs\` — do not edit by hand. Run \`npm run keywords\` to refresh.

All **${rows.length.toLocaleString('en-US')}** keywords in \`keyword-strategy.csv\` are assigned to one of **${byPage.size}** live pages.

## How keywords are placed

The CSV proposes ~3,000 separate URLs: one per city, origin country, question and cost query. Building those as separate pages would produce thousands of near-identical pages, which Google treats as doorway pages, and the soft-404 history in \`technical-audit.md\` (C3) shows it has already happened once here. So each keyword is folded into the strongest existing page for its destination and service:

| Keyword is about | It goes to |
|---|---|
| A page that already exists (exact slug) | that page |
| Work visa / work permit for a country | \`/work-visa/{country}\` (UK → \`uk\`, USA → \`usa\`, UAE/Dubai → \`gulf\`) |
| Study visa for a country | \`/study-in-{country}\` |
| Post-study work visa | the matching \`/pathways/*\` guide, else \`/post-study-work-visa\` |
| Brand, consultancy and Surat searches | \`/\` or \`/visa-consultants-in-surat\` |
| A country with no page yet | the \`/work-visa\`, \`/study-visa\` or \`/post-study-work-visa\` hub |

Every keyword is printed on its page, in a **Popular searches** section. The first ${MAX_SHOWN} are shown as highlighted chips and the rest sit under **See all N searches**, grouped by topic. Each page loads only its own list (\`src/content/keywords/*.json\`).

The only keywords not printed are the ${typoCount} misspellings (for example "stydy visa consultant surat"), which would read as typos on the page.

The highlighted ${MAX_SHOWN} leave out brand terms, keywords the notes flag as risky, superlatives and speed claims the warning list in \`keyword-strategy.md\` cautions against (best, top, trusted, fast, urgent and similar), and cities outside Surat and its neighbouring districts. Those keywords still appear in the full list.

## Keywords per page

| Page | Keywords mapped | High priority | Highlighted |
|---|---:|---:|---:|
${pageRows.map((r) => `| \`${r.path}\` | ${r.total} | ${r.high} | ${r.shown} |`).join('\n')}

## Destinations with no page yet

These keywords fall back to a hub page. Build a country page only when you have real, specific content for it.

| Destination — service | Keywords |
|---|---:|
${[...unbuilt.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${n} |`).join('\n')}
`
writeFileSync(resolve(ROOT, 'docs/seo/keyword-coverage.md'), md)

console.log(
  `Mapped ${rows.length} keywords onto ${byPage.size} pages; ${allCount} unique per-page keywords written to src/content/keywords/.`,
)
