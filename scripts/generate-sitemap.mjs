/**
 * Writes the sitemap index and the static-page shard from dist/prerender-manifest.json.
 *
 * WHAT CHANGED AND WHY
 *
 * This used to write one sitemap.xml containing every URL, which meant a blog
 * post published in the admin panel was live for visitors but absent from the
 * sitemap until someone ran a build and uploaded dist/ by hand.
 *
 * sitemap.xml is now a sitemap *index* over two disjoint halves:
 *
 *   sitemap-pages.xml     written here, from the manifest. The prerendered
 *                         pages. These only exist because a build produced
 *                         their HTML, so a build-time file costs nothing.
 *   sitemap-content.xml   NOT written here. public/.htaccess redirects it to
 *                         the sitemap Edge Function, which queries Supabase on
 *                         request. Publishing a post adds it within one cache
 *                         TTL with no build and no upload.
 *
 * The halves must stay disjoint or a URL appears in both and the index double-
 * counts it. The split is by path prefix, taken from CONTENT_SOURCES — the same
 * list the Edge Function serves — so the two cannot drift. Add a content type
 * there and this file stops claiming its URLs automatically.
 *
 * WHY THE INDEX IS AT sitemap.xml
 *
 * That is the URL in robots.txt and the one submitted to Search Console. A
 * sitemap index is a valid response there, so the switch needs no resubmission.
 *
 * WHAT THE MANIFEST STILL GUARANTEES
 *
 * For the pages half, the manifest — not the route list — remains the source of
 * truth: a URL is listed only if the prerenderer actually produced a verified
 * file for it. Generating from the *intended* route list is how 25 URLs once
 * came to serve an empty shell.
 *
 * Run order matters: `vite build && prerender && generate-sitemap`.
 */
import { mkdir, writeFile, access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { SITE_URL } from './seo-routes.mjs'
import { buildSitemap, renderSitemapIndex } from './lib/sitemap.mjs'
import { CONTENT_SOURCES } from '../supabase/functions/_shared/sitemap-sources.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'dist', 'prerender-manifest.json')

/** The name the dynamic half is reached by on the production domain. */
const CONTENT_SITEMAP = 'sitemap-content.xml'
const PAGES_SITEMAP = 'sitemap-pages.xml'

/** `/blog`, `/urgent-requirements`, ... — whatever the Edge Function serves. */
const DYNAMIC_PREFIXES = CONTENT_SOURCES.map((source) => `${source.prefix}/`)

const isDynamic = (route) => DYNAMIC_PREFIXES.some((prefix) => route.startsWith(prefix))

let manifest
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
} catch (err) {
  console.error(
    `Cannot read ${path.relative(root, manifestPath)}: ${err.message}\n` +
      'Run the prerender step first — `npm run build` does this in order.',
  )
  process.exit(1)
}

const all = manifest.routes ?? []
// /404 is rendered for Apache's ErrorDocument and is never a sitemap URL.
const candidates = all.filter((r) => r.route !== '/404')

/**
 * The pages half. A route is listed only when all of these hold — the same four
 * conditions as before:
 *   published      — it came from the public route list (published rows only)
 *   prerendered    — a file was written and passed every check in prerender.mjs
 *   !noindex       — neither the route list nor the page's own robots tag says no
 *   selfCanonical  — the page's canonical points at itself
 */
const pageCandidates = candidates.filter((r) => !isDynamic(r.route))

const listed = pageCandidates.filter(
  (r) => r.published && r.prerendered && !r.noindex && r.selfCanonical,
)

/** Every withheld URL, with the specific reason, so nothing disappears quietly. */
const withheld = pageCandidates
  .filter((r) => !listed.includes(r))
  .map((r) => {
    if (!r.prerendered) return { route: r.route, reason: `not prerendered — ${r.reason ?? 'unknown'}` }
    if (r.noindex) return { route: r.route, reason: 'page declares noindex' }
    if (!r.selfCanonical)
      return { route: r.route, reason: `canonical points elsewhere (${r.canonical ?? 'none'})` }
    return { route: r.route, reason: 'not published' }
  })

// Rendered through the shared core so the build-time file and the Edge Function
// escape, normalize, deduplicate and order URLs by exactly the same rules.
const { files, rejected, stats } = buildSitemap({
  baseUrl: SITE_URL,
  records: listed.map(({ route, lastmod }) => ({ type: 'pages', path: route, lastmod })),
})

if (rejected.length) {
  console.log(`\n${rejected.length} prerendered URL(s) rejected by the sitemap core:`)
  for (const { path: route, reason } of rejected) console.log(`  ${route} — ${reason}`)
}

const pagesXml = files[0].xml

/**
 * The index. `lastmod` is given for the pages half (the newest page we just
 * listed) and deliberately omitted for the content half: this script cannot
 * know when a blog post last changed without querying the database, and the
 * Edge Function reports it per-URL inside the shard anyway. Guessing would be
 * inventing a modification date.
 */
const indexXml = renderSitemapIndex([
  { loc: `${SITE_URL}/${PAGES_SITEMAP}`, lastmod: stats.lastmod },
  { loc: `${SITE_URL}/${CONTENT_SITEMAP}` },
])

const outputs = [
  [PAGES_SITEMAP, pagesXml],
  ['sitemap.xml', indexXml],
]

const dirs = [path.join(root, 'public')]
try {
  await access(path.join(root, 'dist'))
  dirs.push(path.join(root, 'dist'))
} catch {
  // dist not built yet; public/ copy is enough
}

for (const dir of dirs) {
  await mkdir(dir, { recursive: true })
  for (const [name, xml] of outputs) {
    await writeFile(path.join(dir, name), xml, 'utf8')
  }
}

/**
 * The redirect that makes sitemap-content.xml resolve has to name the Supabase
 * functions host, which differs per project and is not in git. public/.htaccess
 * carries a %%SITEMAP_FUNCTION_ORIGIN%% token; fill it in dist/ at build time so
 * the uploaded file is correct and the committed one stays environment-free.
 *
 * If the variable is absent the token is left in place and the build says so,
 * loudly — an .htaccess containing a literal %% token would make
 * sitemap-content.xml 404, so this must not pass quietly.
 */
const env = loadEnv('production', root, '')
const supabaseUrl = env.VITE_SUPABASE_URL ?? ''
let functionOrigin = ''
try {
  if (supabaseUrl) functionOrigin = new URL(supabaseUrl).origin
} catch {
  functionOrigin = ''
}

const htaccessPath = path.join(root, 'dist', '.htaccess')
let htaccessState = 'skipped (no dist/)'
try {
  const source = await readFile(htaccessPath, 'utf8')
  if (!source.includes('%%SITEMAP_FUNCTION_ORIGIN%%')) {
    htaccessState = 'no token to fill'
  } else if (functionOrigin) {
    await writeFile(htaccessPath, source.replaceAll('%%SITEMAP_FUNCTION_ORIGIN%%', functionOrigin), 'utf8')
    htaccessState = `token filled`
  } else {
    htaccessState = 'TOKEN NOT FILLED — VITE_SUPABASE_URL is unset'
  }
} catch {
  // no dist/.htaccess; nothing to template
}

console.log(
  `sitemap.xml: index -> ${PAGES_SITEMAP} (${files[0].urlCount} URLs), ${CONTENT_SITEMAP} (served live)`,
)
console.log(`  written to: ${dirs.map((d) => path.relative(root, d)).join(', ')}`)
console.log(`  dist/.htaccess: ${htaccessState}`)

if (withheld.length) {
  console.log(`\n${withheld.length} public page URL(s) withheld from ${PAGES_SITEMAP}:`)
  for (const { route, reason } of withheld) console.log(`  ${route} — ${reason}`)
}

const dynamicCount = candidates.filter((r) => isDynamic(r.route)).length
console.log(
  `\n${dynamicCount} database-driven URL(s) are not in ${PAGES_SITEMAP} by design — ` +
    `${CONTENT_SITEMAP} serves them from Supabase on request.`,
)

if (htaccessState.startsWith('TOKEN NOT FILLED')) {
  console.error(
    '\nERROR: dist/.htaccess still contains %%SITEMAP_FUNCTION_ORIGIN%%, so ' +
      `${CONTENT_SITEMAP} would 404 and every database-driven URL would drop out ` +
      'of the sitemap. Set VITE_SUPABASE_URL and rebuild.',
  )
  process.exit(1)
}
