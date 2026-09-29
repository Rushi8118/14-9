/**
 * Writes sitemap.xml from dist/prerender-manifest.json.
 *
 * The manifest — not the route list — is the source of truth, which is the whole
 * point: a URL reaches the sitemap only if the prerenderer actually produced a
 * verified static file for it. Submitting a URL that resolves to the app shell,
 * to a loading skeleton, or to nothing at all is worse than not submitting it,
 * and generating the sitemap from the *intended* route list (what this used to
 * do, and before the prerender step had even run) could not tell the difference.
 *
 * A URL is listed only when all of these hold:
 *   published      — it came from the public route list (published rows only)
 *   prerendered    — a file was written and passed every check in prerender.mjs
 *   !noindex       — neither the route list nor the page's own robots tag says no
 *   selfCanonical  — the page's canonical points at itself
 *
 * `lastmod` is emitted only when a real modification date is known.
 *
 * Run order matters: `vite build && prerender && generate-sitemap`. Running this
 * without a manifest is an error rather than a silent fallback, because a
 * silently stale sitemap is exactly the failure this file exists to prevent.
 */
import { mkdir, writeFile, access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL } from './seo-routes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'dist', 'prerender-manifest.json')

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

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

const listed = candidates.filter(
  (r) => r.published && r.prerendered && !r.noindex && r.selfCanonical,
)

/** Every withheld URL, with the specific reason, so nothing disappears quietly. */
const withheld = candidates
  .filter((r) => !listed.includes(r))
  .map((r) => {
    if (!r.prerendered) return { route: r.route, reason: `not prerendered — ${r.reason ?? 'unknown'}` }
    if (r.noindex) return { route: r.route, reason: 'page declares noindex' }
    if (!r.selfCanonical) return { route: r.route, reason: `canonical points elsewhere (${r.canonical ?? 'none'})` }
    return { route: r.route, reason: 'not published' }
  })

const body = listed
  .map(({ route, lastmod }) => {
    const loc = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`
  })
  .join('\n')
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`

const targets = [path.join(root, 'public', 'sitemap.xml')]
try {
  await access(path.join(root, 'dist'))
  targets.push(path.join(root, 'dist', 'sitemap.xml'))
} catch {
  // dist not built yet; public/ copy is enough
}
for (const target of targets) {
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, xml, 'utf8')
}

console.log(
  `sitemap.xml: ${listed.length} URLs -> ${targets.map((t) => path.relative(root, t)).join(', ')}`,
)
if (withheld.length) {
  console.log(`\n${withheld.length} public URL(s) withheld from the sitemap:`)
  for (const { route, reason } of withheld) console.log(`  ${route} — ${reason}`)
}
