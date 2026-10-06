/**
 * TEST 8 — hydration must not leave duplicate metadata.
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT
 *
 * This runs the REAL src/lib/seo/server-metadata.ts — compiled with esbuild, not
 * reimplemented — against the REAL HTML the Worker produces, in a REAL Chromium
 * DOM, after tags have been added the way React 19 adds them. So the handoff
 * mechanism itself is genuinely verified: exactly one title, one canonical, one
 * of each meta, one JSON-LD block.
 *
 * What it does not do is boot the actual React app. That needs Supabase
 * credentials to fetch a post, and this worktree has none; a BlogPostPage with no
 * data never renders SeoHead at all, so the test would prove nothing. The gap is
 * narrow and specific: React 19's exact hoisting order is emulated here rather
 * than observed. It is emulated pessimistically — React is assumed to *add* its
 * tags without removing the existing ones, which is the documented behaviour and
 * the behaviour that caused the double-<title> bug in this repo. If React were
 * smarter than that, this test would still pass.
 *
 * The end-to-end check against a live post is listed in the report as a
 * post-deployment step with the exact curl command.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'
import { chromium } from 'playwright'
import { blogMetadata, renderHeadTags, renderTitleTag } from '../src/metadata.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..', '..')
const SITE_URL = 'https://siddhivinayakoverseas.com'

const ROW = {
  slug: 'published-post',
  status: 'published',
  title: 'Malta Welder Jobs',
  meta_desc: 'Welding vacancies in Malta with EU work visa support.',
  featured_image: `${SITE_URL}/img/malta.webp`,
  image_alt: 'Welders at work',
  published_at: '2026-10-01T08:00:00Z',
  created_at: '2026-09-30T08:00:00Z',
  updated_at: '2026-10-02T09:00:00Z',
}

let browser
let workDir
/** The real handoff module, compiled to something a browser can import. */
let handoffJs

before(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), 'seo-hydration-'))

  const source = path.join(repoRoot, 'src', 'lib', 'seo', 'server-metadata.ts')
  const built = await esbuild.build({
    entryPoints: [source],
    bundle: true,
    format: 'iife',
    globalName: 'ServerMetadata',
    write: false,
    platform: 'browser',
  })
  handoffJs = built.outputFiles[0].text

  browser = await chromium.launch()
})

after(async () => {
  if (browser) await browser.close()
  if (workDir) await rm(workDir, { recursive: true, force: true })
})

/**
 * Builds the page exactly as a visitor's browser would receive it: the app shell
 * with the Worker's injected, marked tags in <head>.
 */
function injectedShell(meta) {
  return `<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8" />
    <meta name="x-app-shell" content="1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${renderTitleTag(meta)}
    ${renderHeadTags(meta)}
  </head>
  <body><div id="root"></div></body>
</html>`
}

/**
 * Adds the tags React 19 would hoist, the way it does: appended to <head>
 * without removing matching existing ones. Mirrors what SeoHead.tsx renders.
 */
const REACT_HOISTS = (meta) => `
  (function reactHoist() {
    const head = document.head
    const add = (html) => { const t = document.createElement('template'); t.innerHTML = html; head.append(...t.content.childNodes) }
    add('<title>' + ${JSON.stringify(meta.title)} + '</title>')
    add('<meta name="description" content="' + ${JSON.stringify(meta.description)} + '">')
    add('<link rel="canonical" href="' + ${JSON.stringify(meta.canonical)} + '">')
    add('<meta name="robots" content="' + ${JSON.stringify(meta.robots)} + '">')
    add('<meta property="og:type" content="article">')
    add('<meta property="og:url" content="' + ${JSON.stringify(meta.canonical)} + '">')
    add('<meta property="og:title" content="' + ${JSON.stringify(meta.title)} + '">')
    add('<meta property="og:description" content="' + ${JSON.stringify(meta.description)} + '">')
    add('<meta property="og:image" content="' + ${JSON.stringify(meta.image)} + '">')
    add('<meta name="twitter:card" content="summary_large_image">')
    add('<meta name="twitter:title" content="' + ${JSON.stringify(meta.title)} + '">')
    add('<meta name="twitter:description" content="' + ${JSON.stringify(meta.description)} + '">')
    add('<meta name="twitter:image" content="' + ${JSON.stringify(meta.image)} + '">')
    add('<script type="application/ld+json" data-json-ld="">{"@context":"https://schema.org","@type":"Article"}<\\/script>')
  })()
`

/** Counts of every metadata element currently in the document. */
const TALLY = `({
  title: document.querySelectorAll('title').length,
  canonical: document.querySelectorAll('link[rel="canonical"]').length,
  description: document.querySelectorAll('meta[name="description"]').length,
  robots: document.querySelectorAll('meta[name="robots"]').length,
  ogType: document.querySelectorAll('meta[property="og:type"]').length,
  ogUrl: document.querySelectorAll('meta[property="og:url"]').length,
  ogTitle: document.querySelectorAll('meta[property="og:title"]').length,
  ogDescription: document.querySelectorAll('meta[property="og:description"]').length,
  ogImage: document.querySelectorAll('meta[property="og:image"]').length,
  twitterCard: document.querySelectorAll('meta[name="twitter:card"]').length,
  twitterTitle: document.querySelectorAll('meta[name="twitter:title"]').length,
  twitterDescription: document.querySelectorAll('meta[name="twitter:description"]').length,
  twitterImage: document.querySelectorAll('meta[name="twitter:image"]').length,
  jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
  shellMarker: document.querySelectorAll('meta[name="x-app-shell"]').length,
  documentTitle: document.title,
  canonicalHref: document.querySelector('link[rel="canonical"]')?.href ?? null,
})`

async function openPage(html) {
  const page = await browser.newPage()
  const file = path.join(workDir, `page-${Math.random().toString(36).slice(2)}.html`)
  await writeFile(file, html, 'utf8')
  await page.goto(`file://${file.replace(/\\/g, '/')}`)
  return page
}

test('TEST 8: after React hoists its tags, the handoff leaves exactly one of each', async () => {
  const meta = blogMetadata(ROW, SITE_URL)
  const page = await openPage(injectedShell(meta))

  // 1. What a JS-less crawler sees: the Worker's tags, one of each.
  const beforeHydration = await page.evaluate(TALLY)
  assert.equal(beforeHydration.title, 1, 'raw HTML must have exactly one title')
  assert.equal(beforeHydration.canonical, 1)
  assert.equal(beforeHydration.jsonLd, 1)
  assert.equal(beforeHydration.documentTitle, 'Malta Welder Jobs | Siddhivinayak Overseas')
  assert.equal(beforeHydration.canonicalHref, `${SITE_URL}/blog/published-post`)

  // 2. React hydrates and adds its own. This is the duplicated state.
  await page.evaluate(REACT_HOISTS(meta))
  const duplicated = await page.evaluate(TALLY)
  assert.equal(duplicated.title, 2, 'the duplication this mechanism exists to fix')
  assert.equal(duplicated.canonical, 2)
  assert.equal(duplicated.jsonLd, 2)

  // 3. The real handoff runs, as SeoHead's effect would.
  await page.addScriptTag({ content: handoffJs })
  const removed = await page.evaluate('ServerMetadata.claimServerRenderedMetadata()')
  assert.ok(removed > 0, 'the handoff must actually remove something')

  const after = await page.evaluate(TALLY)
  for (const [key, value] of Object.entries(after)) {
    if (key === 'documentTitle' || key === 'canonicalHref' || key === 'shellMarker') continue
    assert.equal(value, 1, `${key} should appear exactly once after hydration, got ${value}`)
  }

  // The shell marker is cleaned up too.
  assert.equal(after.shellMarker, 0)

  // And the surviving copy is React's, with the right values.
  assert.equal(after.documentTitle, 'Malta Welder Jobs | Siddhivinayak Overseas')
  assert.equal(after.canonicalHref, `${SITE_URL}/blog/published-post`)

  const survivorsAreReacts = await page.evaluate(
    `document.querySelectorAll('[data-seo-source="cloudflare"]').length`,
  )
  assert.equal(survivorsAreReacts, 0, 'no edge-injected tag may survive')

  await page.close()
})

test('TEST 8b: on a prerendered page the handoff is a no-op and removes nothing', async () => {
  const page = await openPage(`<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8" />
    <title>Malta Welder Jobs | Siddhivinayak Overseas</title>
    <meta name="description" content="Already prerendered description." />
    <link rel="canonical" href="${SITE_URL}/blog/prerendered-post" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
  </head>
  <body><div id="root"></div></body>
</html>`)

  await page.addScriptTag({ content: handoffJs })
  const removed = await page.evaluate('ServerMetadata.claimServerRenderedMetadata()')
  assert.equal(removed, 0, 'a prerendered page has nothing marked to remove')

  const after = await page.evaluate(TALLY)
  assert.equal(after.title, 1)
  assert.equal(after.canonical, 1)
  assert.equal(after.jsonLd, 1)
  assert.equal(after.documentTitle, 'Malta Welder Jobs | Siddhivinayak Overseas')

  await page.close()
})

test('the handoff selector in the TypeScript matches the Worker marker', async () => {
  // Parity guard: these are two files that must agree on one string, and
  // nothing else would catch a rename.
  const ts = await readFile(path.join(repoRoot, 'src', 'lib', 'seo', 'server-metadata.ts'), 'utf8')
  const worker = await readFile(path.join(here, '..', 'src', 'metadata.mjs'), 'utf8')

  assert.match(ts, /data-seo-source="cloudflare"/)
  assert.match(worker, /SEO_SOURCE_ATTR = 'data-seo-source'/)
  assert.match(worker, /SEO_SOURCE_VALUE = 'cloudflare'/)
  assert.match(ts, /meta\[name="x-app-shell"\]/)
})
