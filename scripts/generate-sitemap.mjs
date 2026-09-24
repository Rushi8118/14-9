/**
 * Writes sitemap.xml for every public, indexable URL (no trailing slashes, matching canonicals).
 * `lastmod` is only emitted when a real modification date is known.
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL, getPublicRoutes } from './seo-routes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Routes flagged `noindex` are live pages that are not ready to be submitted
// (see seo-routes.mjs). The prerenderer still renders them; only the sitemap
// leaves them out, so the two stay consistent with the page's own robots tag.
const allRoutes = await getPublicRoutes(root)
const routes = allRoutes.filter((route) => !route.noindex)
const withheld = allRoutes.length - routes.length
const body = routes
  .map(({ path: route, lastmod }) => {
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
  `sitemap.xml: ${routes.length} URLs` +
  (withheld ? ` (${withheld} noindexed pages rendered but not listed)` : '') +
  ` -> ${targets.map((t) => path.relative(root, t)).join(', ')}`,
)
