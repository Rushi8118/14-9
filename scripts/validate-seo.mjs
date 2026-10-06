/**
 * Build-time SEO validator.
 *
 * Runs against the generated HTML in dist/ — never against a live browser DOM.
 * What a crawler is served is the only thing that counts, and the two differ:
 * before this existed, the site looked correct in DevTools while shipping
 * duplicate canonicals, invisible FAQ answers and one shared title across 25
 * URLs.
 *
 * Exit code 1 on any ERROR. WARNs are printed and do not fail the build.
 *
 * Usage:
 *   node scripts/validate-seo.mjs          # fail on errors
 *   node scripts/validate-seo.mjs --report # print everything, never fail
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL } from './seo-routes.mjs'
import { CONTENT_SOURCES } from '../supabase/functions/_shared/sitemap-sources.mjs'

/**
 * Route prefixes served live by the sitemap Edge Function rather than written
 * at build time. Derived from the function's own source list so the validator
 * and the function cannot disagree about which URLs are build-time.
 */
const DYNAMIC_PREFIXES = CONTENT_SOURCES.map((source) => `${source.prefix}/`)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const REPORT_ONLY = process.argv.includes('--report')

const errors = []
const warnings = []
const error = (route, message) => errors.push(`${route}: ${message}`)
const warn = (route, message) => warnings.push(`${route}: ${message}`)

// ---------------------------------------------------------------- helpers

/** Attribute-order-independent tag reader. `<meta property="og:x" data-y content="z">` works. */
function attr(html, tag, selector, wanted) {
  const found = html.match(new RegExp(`<${tag}\\b[^>]*\\b${selector}[^>]*>`, 'i'))
  if (!found) return null
  const got = found[0].match(new RegExp(`\\b${wanted}\\s*=\\s*"([^"]*)"`, 'i'))
  return got ? got[1] : null
}

function allTags(html, tag, selector) {
  return html.match(new RegExp(`<${tag}\\b[^>]*\\b${selector}[^>]*>`, 'gi')) ?? []
}

const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))

/** Visible text of the document body, with script/style/noscript removed. */
function visibleText(html) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html
  return decodeEntities(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

/** Loose containment test — punctuation and whitespace differences must not matter. */
const normalise = (s) => decodeEntities(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Words that turn a guarantee phrase into a disclaimer, a warning about scam
 * agents, or a question being answered "no". Checked in a window around each
 * match; if any appears, the match is honest copy rather than a claim.
 *
 * Tuned to be generous, because a false positive here is expensive: it would
 * flag the site's own consumer-protection copy and make the check ignorable.
 * A genuine marketing claim ("Guaranteed job placement in Germany") has none of
 * these nearby.
 */
const NEGATED = new RegExp(
  [
    '\\bno\\b', '\\bnot\\b', '\\bnever\\b', '\\bnobody\\b', '\\bnone\\b',
    "\\bcannot\\b", "\\bcan't\\b", "\\bcan not\\b", '\\bdoes not\\b', "\\bdoesn't\\b",
    '\\bavoid\\b', '\\bbeware\\b', '\\bwarning\\b', '\\bwary\\b', '\\bcareful\\b',
    '\\bscam\\b', '\\bfake\\b', '\\bfraud', '\\bmisleading\\b', '\\bred flag\\b',
    '\\bpromising\\b', '\\bclaims? to\\b', '\\bwithout\\b', '\\brather than\\b',
    '\\bmyth\\b', '\\bsubject to\\b', '\\bdepends on\\b', '\\bis a warning sign\\b',
    '\\bcan you guarantee\\b', '\\bdo you guarantee\\b', '\\bis (there|the)\\b.{0,40}\\?',
    '\\bethical\\b', '\\bhonest\\b', '\\bstraight with you\\b', '\\bovers(ell|elling)\\b',
  ].join('|'),
  'i',
)

// --------------------------------------------- guarantee-claim patterns

/**
 * Read straight out of src/lib/ai/guardrails.ts so hand-written copy is held to
 * the same rules as AI-generated copy and the two cannot drift apart.
 */
async function loadClaimPatterns() {
  const source = await readFile(path.join(root, 'src/lib/ai/guardrails.ts'), 'utf8')
  const block = source.match(/UNSAFE_CLAIM_PATTERNS:\s*RegExp\[\]\s*=\s*\[([\s\S]*?)\n\]/)?.[1]
  if (!block) throw new Error('[validate-seo] Could not find UNSAFE_CLAIM_PATTERNS in guardrails.ts')
  const patterns = [...block.matchAll(/^\s*\/(.+)\/([a-z]*),\s*$/gm)].map(
    ([, body, flags]) => new RegExp(body, flags.includes('i') ? flags : `${flags}i`),
  )
  if (patterns.length < 5) {
    throw new Error(
      `[validate-seo] Parsed only ${patterns.length} guarantee patterns from guardrails.ts. ` +
      'A silent miss here would let guaranteed-outcome claims ship.',
    )
  }
  return patterns
}

// ------------------------------------------------------------- collection

async function findHtmlFiles(dir, acc = []) {
  for (const entry of await readdir(dir)) {
    const full = path.join(dir, entry)
    if ((await stat(full)).isDirectory()) await findHtmlFiles(full, acc)
    else if (entry === 'index.html') acc.push(full)
  }
  return acc
}

function routeForFile(file) {
  const rel = path.relative(distDir, file).replace(/\\/g, '/').replace(/\/?index\.html$/, '')
  return rel === '' ? '/' : `/${rel}`
}

// ------------------------------------------------------------ page checks

function checkPage(route, rawHtml, claimPatterns) {
  // Comments are stripped before anything is parsed. index.html's comments are
  // copied into every prerendered page, and one that merely *mentions* a tag —
  // "the <title> below is a fallback" — made every page look like it had two
  // titles and made two pages look like they shared one.
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '')
  const text = visibleText(html)

  const titles = html.match(/<title[^>]*>([\s\S]*?)<\/title>/gi) ?? []
  if (titles.length === 0) error(route, 'no <title>')
  else if (titles.length > 1) error(route, `${titles.length} <title> elements`)
  const title = decodeEntities(titles[0]?.replace(/<\/?title[^>]*>/gi, '').trim() ?? '')
  if (title.length > 65) warn(route, `title is ${title.length} chars, Google truncates past ~60: "${title}"`)

  const rawDescription = attr(html, 'meta', 'name="description"', 'content')
  const description = rawDescription ? decodeEntities(rawDescription) : null
  if (!description) error(route, 'no meta description')
  else if (description.length > 165) warn(route, `meta description is ${description.length} chars`)
  else if (description.length < 70) warn(route, `meta description is only ${description.length} chars`)

  const canonicals = allTags(html, 'link', 'rel="canonical"')
  if (canonicals.length === 0) error(route, 'no canonical')
  else if (canonicals.length > 1) error(route, `${canonicals.length} canonical tags — Google ignores all of them`)
  const canonical = attr(html, 'link', 'rel="canonical"', 'href')
  if (canonical && !canonical.startsWith('https://')) error(route, `canonical is not absolute HTTPS: ${canonical}`)
  if (canonical && /[?#]/.test(canonical)) error(route, `canonical carries a query or fragment: ${canonical}`)
  if (canonical && canonical !== `${SITE_URL}/` && canonical.endsWith('/')) {
    error(route, `canonical has a trailing slash, which .htaccess strips: ${canonical}`)
  }

  const robots = attr(html, 'meta', 'name="robots"', 'content')
  if (!robots) error(route, 'no robots directive')
  const noindex = /\bnoindex\b/i.test(robots ?? '')

  for (const prop of ['og:type', 'og:url', 'og:title', 'og:description', 'og:image']) {
    if (!attr(html, 'meta', `property="${prop}"`, 'content')) error(route, `no ${prop}`)
  }
  const ogUrl = attr(html, 'meta', 'property="og:url"', 'content')
  if (ogUrl && canonical && ogUrl !== canonical) {
    error(route, `og:url (${ogUrl}) disagrees with canonical (${canonical})`)
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!attr(html, 'meta', `name="${name}"`, 'content')) error(route, `no ${name}`)
  }
  for (const prop of ['og:url', 'og:title', 'og:description', 'og:image']) {
    const count = allTags(html, 'meta', `property="${prop}"`).length
    if (count > 1) error(route, `${count} ${prop} tags`)
  }

  if (!/<html[^>]*\blang\s*=/i.test(html)) error(route, 'no <html lang>')

  const h1s = html.match(/<h1\b/gi) ?? []
  if (h1s.length !== 1) error(route, `${h1s.length} <h1> elements, expected exactly 1`)

  // --- JSON-LD
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  const ids = new Map()
  let faqEntities = []
  for (const [, raw] of blocks) {
    let parsed
    try {
      parsed = JSON.parse(raw.replace(/\\u003c/g, '<'))
    } catch (err) {
      error(route, `JSON-LD does not parse: ${err.message}`)
      continue
    }
    const nodes = parsed['@graph'] ?? (Array.isArray(parsed) ? parsed : [parsed])
    for (const node of nodes) {
      if (node && node['@id']) ids.set(node['@id'], (ids.get(node['@id']) ?? 0) + 1)
      if (node && node['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
        faqEntities = faqEntities.concat(node.mainEntity)
      }
    }
  }
  if (blocks.length > 2) {
    warn(route, `${blocks.length} JSON-LD blocks — one @graph per page is the target`)
  }
  for (const [id, count] of ids) {
    if (count > 1) error(route, `JSON-LD @id "${id}" appears ${count} times on one page`)
  }

  // Google's structured-data policy: markup must describe content visible on the
  // page. An answer that only exists inside JSON-LD is a violation, and it was
  // the site's single most widespread one (147 of 159 answers).
  const haystack = normalise(text)
  for (const entity of faqEntities) {
    const question = entity?.name
    const answer = entity?.acceptedAnswer?.text
    if (question && !haystack.includes(normalise(question).slice(0, 60))) {
      error(route, `FAQ question is in JSON-LD but not visible on the page: "${String(question).slice(0, 70)}"`)
    }
    if (answer) {
      const stripped = normalise(String(answer).replace(/<[^>]+>/g, ' '))
      if (stripped && !haystack.includes(stripped.slice(0, 60))) {
        error(route, `FAQ answer is in JSON-LD but not visible on the page: "${String(answer).replace(/<[^>]+>/g, ' ').slice(0, 70)}…"`)
      }
    }
  }

  // --- guaranteed-outcome claims
  //
  // The patterns alone are not enough. This site's honest copy discusses
  // guarantees constantly and correctly — "No fake job guarantees", "Beware of
  // agents promising a guaranteed job", "Can you guarantee a job? No." — and a
  // naive match flags all of it. Flagging correct warnings would train everyone
  // to ignore this check, so each hit is tested for a negating or cautionary
  // context before it counts.
  //
  // Metadata and headings fail the build: they are short, they are what Google
  // shows, and they have no room for the surrounding caveat that makes a
  // guarantee phrase legitimate.
  //
  // Body text only warns. Some honest copy cannot be distinguished from a claim
  // by any window size — a scam-warning table lists "large payments requested for
  // guaranteed employment" as a red flag, with the column header that says so far
  // outside any reasonable context window. Failing the build on that would be
  // wrong, so these are surfaced for a human to read instead.
  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)].map(([, h]) =>
    decodeEntities(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(),
  )
  for (const pattern of claimPatterns) {
    for (const [label, field] of [['title', title], ['meta description', description], ...headings.map((h) => ['heading', h])]) {
      const hit = field?.match(pattern)
      if (hit && !NEGATED.test(field)) {
        error(route, `guaranteed-outcome claim in ${label}: "${hit[0]}" — in "${field.slice(0, 90)}"`)
      }
    }
    for (const hit of text.matchAll(new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`))) {
      const context = text.slice(Math.max(0, hit.index - 160), hit.index + hit[0].length + 160)
      if (NEGATED.test(context)) continue
      warn(route, `possible guaranteed-outcome claim: "${hit[0]}" — in: "…${context.trim().slice(0, 180)}…"`)
    }
  }

  return { title, description, canonical, noindex }
}

// ------------------------------------------------------------------ main

const claimPatterns = await loadClaimPatterns()

let files
try {
  files = await findHtmlFiles(distDir)
} catch {
  console.error('dist/ not found. Run `npm run build` first.')
  process.exit(1)
}

/** @type {Map<string, {title: string, description: string, canonical: string, noindex: boolean}>} */
const pages = new Map()
for (const file of files) {
  const route = routeForFile(file)
  if (route === '/app-shell') continue
  const html = await readFile(file, 'utf8')
  pages.set(route, checkPage(route, html, claimPatterns))
}

// --- cross-page uniqueness (indexable pages only; a noindex page may repeat)
const indexable = [...pages.entries()].filter(([, p]) => !p.noindex)
for (const [field, label] of [['title', 'title'], ['description', 'meta description']]) {
  const byValue = new Map()
  for (const [route, page] of indexable) {
    const value = page[field]
    if (!value) continue
    byValue.set(value, [...(byValue.get(value) ?? []), route])
  }
  for (const [value, routes] of byValue) {
    if (routes.length > 1) {
      // Naming the remedy matters: the usual cause is the same vacancy published
      // both as a blog post and as an urgent requirement.
      //
      // Editing the blog post's Meta title in the admin panel is the fix that
      // works today. Pointing the post's canonical at the other URL would also
      // work — seo-routes.mjs keeps such a post rendering while dropping it from
      // the sitemap — but there is no UI for it: the blog editor hardcodes
      // canonical_path to `/blog/${slug}` on every save, so a canonical set by
      // hand in SQL is overwritten the next time the post is edited.
      error(
        routes.join(', '),
        `share the same ${label}: "${value.slice(0, 70)}…". ` +
        `Give one a distinct ${label} — for a blog post, the Meta title field in the admin panel.`,
      )
    }
  }
}

// --- sitemap <-> manifest <-> generated files must all agree
let manifest
try {
  manifest = JSON.parse(await readFile(path.join(distDir, 'prerender-manifest.json'), 'utf8'))
} catch {
  error('build', 'dist/prerender-manifest.json is missing — the prerender step did not run')
}

if (manifest) {
  // sitemap.xml is an index now, so the URLs to cross-check live in the pages
  // shard. The other half (sitemap-content.xml) is generated from the database
  // on request and has no build-time file to read — by design, since that is
  // what lets publishing reach the sitemap without a build. Its URLs are
  // verified by the Edge Function's own tests, not here.
  const sitemapXml = await readFile(path.join(distDir, 'sitemap-pages.xml'), 'utf8').catch(() => '')
  if (!sitemapXml) {
    error('build', 'dist/sitemap-pages.xml is missing — the sitemap step did not run')
  }
  const sitemapUrls = new Set([...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u))
  const byRoute = new Map(manifest.routes.map((r) => [r.route, r]))

  // The index itself must name both halves, or one of them is unreachable.
  const indexXml = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8').catch(() => '')
  if (!indexXml.includes('<sitemapindex')) {
    error('build', 'dist/sitemap.xml is not a sitemap index — the sitemap step did not run')
  } else {
    for (const shard of ['sitemap-pages.xml', 'sitemap-content.xml']) {
      if (!indexXml.includes(`${SITE_URL}/${shard}`)) {
        error('build', `dist/sitemap.xml does not list ${shard}`)
      }
    }
  }

  for (const url of sitemapUrls) {
    const route = url === `${SITE_URL}/` ? '/' : url.replace(SITE_URL, '')
    const record = byRoute.get(route)
    if (!record) error(route, 'is in sitemap-pages.xml but not in the prerender manifest')
    else if (!record.prerendered) error(route, `is in sitemap-pages.xml but was not prerendered (${record.reason ?? 'no reason recorded'})`)
    else if (record.noindex) error(route, 'is in sitemap-pages.xml but declares noindex')
    if (!pages.has(route)) error(route, 'is in sitemap-pages.xml but no HTML file was generated for it')
  }

  for (const record of manifest.routes) {
    if (record.route === '/404') continue
    // A database-driven route belongs to the live shard; its absence from the
    // build-time file is correct and must not fail the build.
    if (DYNAMIC_PREFIXES.some((prefix) => record.route.startsWith(prefix))) continue
    const url = record.route === '/' ? `${SITE_URL}/` : `${SITE_URL}${record.route}`
    if (record.prerendered && !record.noindex && record.selfCanonical && !sitemapUrls.has(url)) {
      error(record.route, 'was prerendered and is indexable but is missing from sitemap-pages.xml')
    }
    // A published page that did not render is a real problem, but it still works
    // for visitors through app-shell.html, so it does not fail the build unless
    // it also leaked into the sitemap (checked above).
    if (!record.prerendered) {
      warn(record.route, `published but not prerendered, so it is not submitted to Google: ${record.reason ?? 'unknown'}`)
    }
  }
}

// ---------------------------------------------------------------- output

console.log(`Checked ${pages.size} generated pages.\n`)
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`)
  for (const w of warnings) console.log(`  ${w}`)
  console.log('')
}
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`)
  for (const e of errors) console.log(`  ${e}`)
  console.log('')
}

if (!errors.length && !warnings.length) console.log('No issues found.')

if (errors.length && !REPORT_ONLY) {
  console.error(`SEO validation failed with ${errors.length} error(s).`)
  process.exit(1)
}
