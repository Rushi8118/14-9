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
 *   sitemap-content.xml   written here too, as a build-time snapshot queried
 *                         straight from Supabase.
 *
 * READ THIS BEFORE BELIEVING docs/dynamic-sitemap.md
 *
 * That document describes the content shard as served per request by the
 * `sitemap` Edge Function, so that publishing a post reaches the sitemap with no
 * build and no upload. That is NOT what production does today, for two reasons
 * that compound:
 *
 *   1. The `sitemap` Edge Function is not deployed. The project answers
 *      /functions/v1/sitemap with NOT_FOUND.
 *   2. public/.htaccess only redirects /sitemap-content.xml to the function when
 *      the file is absent (`RewriteCond %{REQUEST_FILENAME} !-f`). Because this
 *      script writes a static snapshot into dist/, the uploaded file always
 *      wins and the function would never be reached even once deployed.
 *
 * The snapshot is correct XML and keeps the shard from dangling, but it freezes
 * at build time: a post published in the admin panel is reachable for visitors
 * immediately and absent from the sitemap until the next build and upload.
 *
 * To restore the documented live behaviour: deploy the function
 * (`supabase functions deploy sitemap`), then stop writing CONTENT_SITEMAP here
 * — keep it in the index, omit it from `outputs` — so the !-f rule can fire.
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
import { CONTENT_SOURCES, loadRecords } from '../supabase/functions/_shared/sitemap-sources.mjs'

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

const env = loadEnv('production', root, '')
const supabaseUrl = env.VITE_SUPABASE_URL ?? ''
const supabaseKey = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

let contentXml = null
let contentLastmod = undefined
let dynamicRecordCount = 0
if (supabaseUrl && supabaseKey) {
  try {
    const { records: contentRecords } = await loadRecords({ baseUrl: supabaseUrl, key: supabaseKey })
    if (contentRecords && contentRecords.length > 0) {
      dynamicRecordCount = contentRecords.length
      const { files: contentFiles, stats: contentStats } = buildSitemap({
        baseUrl: SITE_URL,
        records: contentRecords,
      })
      contentXml = contentFiles[0].xml
      contentLastmod = contentStats.lastmod
    }
  } catch (err) {
    console.warn(`Could not query dynamic content from Supabase: ${err.message}`)
  }
}

/**
 * The index.
 *
 * The content shard is listed ONLY when this run actually produced it. Listing
 * it unconditionally used to ship an index naming a shard that no file and no
 * deployed function answered: Apache's `RewriteCond %{REQUEST_FILENAME} !-f`
 * sends /sitemap-content.xml to the Edge Function when the file is absent, so a
 * build without Supabase credentials — or with the function undeployed —
 * submitted a sitemap index pointing at a 404. A short index is recoverable; a
 * dangling shard is an error in Search Console on every fetch.
 */
const indexItems = [{ loc: `${SITE_URL}/${PAGES_SITEMAP}`, lastmod: stats.lastmod }]
if (contentXml) {
  indexItems.push({
    loc: `${SITE_URL}/${CONTENT_SITEMAP}`,
    ...(contentLastmod ? { lastmod: contentLastmod } : {}),
  })
} else {
  console.warn(
    `\nWARNING: ${CONTENT_SITEMAP} was not produced, so sitemap.xml does not list it.\n` +
      '  Database-driven URLs (/blog, /urgent-requirements, /services, /jobs) are NOT submitted.\n' +
      '  Cause: VITE_SUPABASE_URL / key unset, the query failed, or no published rows.',
  )
}
const indexXml = renderSitemapIndex(indexItems)

const outputs = [
  [PAGES_SITEMAP, pagesXml],
  ['sitemap.xml', indexXml],
]
if (contentXml) {
  outputs.push([CONTENT_SITEMAP, contentXml])
}

/**
 * dist/ only.
 *
 * These three files are build output. Writing them into public/ as well put
 * three generated, committed files in the repository that every build rewrote,
 * so each build produced a spurious git diff and a stale snapshot could be
 * uploaded by hand without the build that justified it. public/ is copied into
 * dist/ by `vite build`, which runs BEFORE this script, so the public/ copies
 * were never read by anything — they were overwritten moments later.
 */
const dirs = [path.join(root, 'dist')]
try {
  await access(dirs[0])
} catch {
  console.error(
    'dist/ does not exist. Run `vite build && node scripts/prerender.mjs` first — ' +
      '`npm run build` does this in order.',
  )
  process.exit(1)
}

for (const dir of dirs) {
  await mkdir(dir, { recursive: true })
  for (const [name, xml] of outputs) {
    await writeFile(path.join(dir, name), xml, 'utf8')
  }
}

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
    `${CONTENT_SITEMAP} carries them (${dynamicRecordCount} record(s) read from Supabase).`,
)
console.log(
  `  ${CONTENT_SITEMAP} is a BUILD-TIME SNAPSHOT, not served live: the sitemap Edge\n` +
    '  Function is not deployed, and this static file would shadow it anyway. A post\n' +
    '  published after this build will not be in the sitemap until the next build and\n' +
    '  upload. See the status note at the top of docs/dynamic-sitemap.md.',
)

if (htaccessState.startsWith('TOKEN NOT FILLED')) {
  console.error(
    '\nERROR: dist/.htaccess still contains %%SITEMAP_FUNCTION_ORIGIN%%, so ' +
      `${CONTENT_SITEMAP} would 404 and every database-driven URL would drop out ` +
      'of the sitemap. Set VITE_SUPABASE_URL and rebuild.',
  )
  process.exit(1)
}
