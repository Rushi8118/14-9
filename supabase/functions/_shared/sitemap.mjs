/**
 * Runtime-agnostic sitemap core.
 *
 * WHY THIS IS PLAIN ESM JAVASCRIPT AND NOT TYPESCRIPT
 *
 * The same builder has to run in three places that do not share a toolchain:
 * a Node build script, a Deno Supabase Edge Function serving /sitemap.xml on
 * request, and `node --test`. Plain `.mjs` with JSDoc types is the one form all
 * three import directly with no transpile step and no new dependency. A `.ts`
 * file would need a loader in Node and a build step for the tests; the project
 * has neither and adding one to share 300 lines is a poor trade.
 *
 * WHY THE CORE IS PURE
 *
 * Nothing here opens a socket, reads a file or reads an environment variable.
 * Records go in, XML comes out, and every rejected record comes back with the
 * reason it was rejected. That is what makes the behaviour the project actually
 * cares about testable without a database: that unpublished, deleted, noindex
 * and non-self-canonical content cannot reach the file. The existing build-time
 * generator could only be verified by reading its output after a full build.
 *
 * WHY REJECTIONS ARE RETURNED RATHER THAN THROWN
 *
 * One malformed row must not empty the sitemap. A record that cannot be turned
 * into a URL is dropped and reported; the caller logs the report. This mirrors
 * `scripts/generate-sitemap.mjs`, which prints every withheld URL with its
 * reason so nothing disappears quietly.
 */

/**
 * Sitemaps.org caps a single file at 50,000 URLs and 50 MB uncompressed.
 * Above the URL cap the builder emits a sitemap index plus one file per content
 * type, which is what the spec asks for and also what keeps a single query's
 * failure from blanking the whole sitemap.
 */
export const MAX_URLS_PER_SITEMAP = 50000

/**
 * Route prefixes that must never appear in a sitemap, whatever the database
 * says. These are matched against the normalized path as a path segment, so
 * `/admin` and `/admin/blog` are excluded while `/administrative-support`
 * is not.
 *
 * `/search` is here because filtered and search-result URLs are exactly the
 * thin, infinite-surface pages the spec excludes. `/404` is here because this
 * project renders it as a real route for Apache's ErrorDocument.
 */
export const PRIVATE_SEGMENTS = Object.freeze([
  'admin',
  'dashboard',
  'auth',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'logout',
  'account',
  'api',
  'search',
  '403',
  '404',
  'app-shell.html',
])

/**
 * The five XML predefined entities. `&` must be replaced first or it would
 * double-escape the entities introduced by the later replacements.
 *
 * `'` is escaped as `&apos;` rather than left raw so the same function is safe
 * for attribute values (image titles are emitted as element text today, but a
 * helper that is only conditionally safe invites a bug later).
 */
export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Strips the characters XML 1.0 forbids outright. Control characters cannot be
 * escaped into validity — `&#x0;` is still invalid XML — so a title pasted from
 * a Word document with a stray 0x0B would produce a sitemap no parser accepts.
 * The only permitted controls are tab, newline and carriage return.
 */
export function stripInvalidXmlChars(value) {
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
}

const SAFE_PATH = /^\/[A-Za-z0-9\-._~/]*$/

/**
 * Reduces a path to the single spelling this site treats as canonical, or
 * returns null when it is not a path that may be submitted at all.
 *
 * The normalizations exist because each one is a duplicate-URL source the spec
 * names: a query string, a fragment, a trailing slash, an uppercase letter, a
 * doubled slash. Apache already 301s the trailing-slash and host variants
 * (public/.htaccess rules 1 and 2), so emitting either form here would submit a
 * URL that redirects — a crawl-budget cost and a "Page with redirect" report in
 * Search Console.
 *
 * Query strings are rejected rather than stripped. Stripping `?page=2` would
 * silently collapse paginated URLs onto page 1 and emit the same `<loc>` many
 * times; the caller should decide whether a paginated URL belongs in the
 * sitemap at all.
 */
export function normalizePath(input) {
  if (typeof input !== 'string') return null
  let path = input.trim()
  if (path === '') return null

  // An absolute URL is accepted only so adapters can pass through a stored
  // canonical; its origin is discarded here and re-applied by the caller, which
  // is what keeps the production domain in one place.
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname
    } catch {
      return null
    }
  }

  if (path.includes('?') || path.includes('#')) return null
  if (!path.startsWith('/')) path = `/${path}`
  path = path.replace(/\/{2,}/g, '/')
  if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '')
  path = path.toLowerCase()

  if (!SAFE_PATH.test(path)) return null
  // `.` and `..` segments would resolve to a different URL than they spell.
  if (path.split('/').some((segment) => segment === '.' || segment === '..')) return null
  return path
}

/** True when the path is one of the route families that must never be submitted. */
export function isPrivatePath(path) {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return false
  return PRIVATE_SEGMENTS.includes(segments[0])
}

/**
 * Formats a `lastmod` value at the precision the source actually knows.
 *
 * A row's `updated_at` is a timestamptz, so it gets a full W3C datetime. A
 * static page's date comes from a file mtime that the build only resolves to a
 * day, so it gets `YYYY-MM-DD`. Both are valid sitemap `lastmod` values, and
 * reporting a timestamp the source cannot support would be inventing precision
 * — the same reason this project omits schema properties rather than defaulting
 * them.
 *
 * A future date is dropped rather than emitted: scheduled content that has not
 * published yet has no modification date, and claiming one is a false signal.
 */
export function formatLastmod(value, now = Date.now()) {
  if (value == null || value === '') return undefined
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) || value.getTime() > now
      ? undefined
      : value.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }
  const text = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = Date.parse(`${text}T00:00:00Z`)
    if (Number.isNaN(parsed) || parsed > now) return undefined
    return text
  }
  const parsed = Date.parse(text)
  if (Number.isNaN(parsed) || parsed > now) return undefined
  return new Date(parsed).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

const CHANGEFREQ = Object.freeze([
  'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never',
])

/**
 * Statuses that mean "live for visitors". `blog_posts` uses `published` and
 * `urgent_requirements` uses `active`, so both spellings are accepted here
 * rather than forcing one table's vocabulary onto the other.
 *
 * Any other value — draft, scheduled, archived, expired, filled — is not live
 * and is rejected. The default is to reject: a status this code has never seen
 * must not end up in the sitemap on the assumption that it is harmless.
 */
export const PUBLISHED_STATUSES = Object.freeze(['published', 'active'])

/** Rejects a base URL that would produce invalid `<loc>` values. */
export function normalizeBaseUrl(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('[sitemap] A base URL is required. Set SITE_URL in the environment.')
  }
  let url
  try {
    url = new URL(input.trim())
  } catch {
    throw new Error(`[sitemap] SITE_URL is not a valid absolute URL: ${input}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`[sitemap] SITE_URL must be http or https, got ${url.protocol}`)
  }
  if (url.search || url.hash) {
    throw new Error('[sitemap] SITE_URL must not carry a query string or fragment')
  }
  return `${url.protocol}//${url.host}`
}

/**
 * Turns one record into a sitemap entry, or explains why it cannot be one.
 *
 * @returns {{ entry: object } | { reason: string }}
 */
export function toEntry(record, baseUrl, now = Date.now()) {
  if (!record || typeof record !== 'object') return { reason: 'not an object' }

  const path = normalizePath(record.path ?? record.url ?? record.slug)
  if (!path) return { reason: `unusable path (${JSON.stringify(record.path ?? record.url ?? record.slug)})` }
  if (isPrivatePath(path)) return { reason: 'private or non-indexable route family' }

  // Soft delete. A row with deletedAt set is gone from the site even if its
  // status was never changed, which is the common shape of the "deleted content
  // is still in the sitemap" bug.
  if (record.deletedAt ?? record.deleted_at) return { reason: 'soft-deleted' }

  const status = record.status
  if (status != null && !PUBLISHED_STATUSES.includes(String(status).toLowerCase())) {
    return { reason: `status is "${status}"` }
  }

  // Scheduled publishing: the row is marked published but its publish moment is
  // in the future, so it is not yet a public URL.
  const publishedAt = record.publishedAt ?? record.published_at
  if (publishedAt) {
    const at = Date.parse(String(publishedAt))
    if (!Number.isNaN(at) && at > now) return { reason: 'publish date is in the future' }
  }

  // The other end of the same window. An urgent requirement keeps
  // status = 'active' until someone closes it by hand, so expiry is what
  // actually ends it: the listing page filters on it, and the detail page goes
  // noindex once it passes (UrgentRequirementDetailPage, noindex={isClosed}).
  // Without this the sitemap would keep submitting a URL whose own page says
  // not to index it, and the build-time half — which reads the rendered robots
  // tag — would already have dropped it. An unparseable date is ignored rather
  // than treated as expired: losing a live URL to a bad timestamp is worse than
  // keeping one a little too long.
  const expiresAt = record.expiresAt ?? record.expires_at
  if (expiresAt) {
    const at = Date.parse(String(expiresAt))
    if (!Number.isNaN(at) && at <= now) return { reason: 'expired' }
  }

  if (record.isIndexable === false || record.is_indexable === false) {
    return { reason: 'isIndexable is false' }
  }

  const robots = String(record.robots ?? record.robotsDirective ?? record.robots_directive ?? '')
  if (/\bnone\b|\bnoindex\b/i.test(robots)) return { reason: `robots directive is "${robots}"` }

  const loc = `${baseUrl}${path === '/' ? '/' : path}`

  // A record that declares a canonical elsewhere is a real, live page, but it
  // is not its own canonical URL and must not be submitted as one. This is the
  // `selfCanonical` rule the build-time generator already enforces; without it
  // two posts sharing a canonical both get submitted and Search Console reports
  // "Duplicate, submitted URL not selected as canonical".
  const declared = record.canonicalUrl ?? record.canonical_url ?? record.canonical
  if (declared) {
    const canonicalPath = normalizePath(declared)
    if (!canonicalPath) return { reason: `canonical is not a usable URL (${declared})` }
    if (canonicalPath !== path) return { reason: `canonical points elsewhere (${canonicalPath})` }
  }

  const lastmod = formatLastmod(
    record.lastmod ?? record.updatedAt ?? record.updated_at ?? publishedAt,
    now,
  )

  // changefreq and priority are emitted only when a record carries one. Google
  // has stated it ignores both, and a default applied to every URL carries no
  // information while reading as a deliberate claim about the page. This project
  // has already had two fabricated schema defaults removed for the same reason.
  const changefreq = CHANGEFREQ.includes(record.changefreq) ? record.changefreq : undefined
  const priority =
    typeof record.priority === 'number' && record.priority >= 0 && record.priority <= 1
      ? record.priority.toFixed(1)
      : undefined

  const images = Array.isArray(record.images)
    ? record.images
        .map((image) => {
          const src = typeof image === 'string' ? image : image?.loc ?? image?.url
          if (typeof src !== 'string' || !/^https?:\/\//i.test(src.trim())) return null
          return {
            loc: src.trim(),
            title: image?.title ? stripInvalidXmlChars(image.title) : undefined,
            caption: image?.caption ? stripInvalidXmlChars(image.caption) : undefined,
          }
        })
        .filter(Boolean)
        .slice(0, 1000) // sitemaps.org caps images at 1,000 per URL
    : []

  return {
    entry: {
      type: typeof record.type === 'string' && record.type ? record.type : 'pages',
      path,
      loc,
      lastmod,
      changefreq,
      priority,
      images,
    },
  }
}

/**
 * Collects every eligible entry, deduplicated and deterministically ordered.
 *
 * Duplicates are resolved by keeping the most recent `lastmod` rather than the
 * first or last row seen. Two content types can legitimately produce the same
 * path (a vacancy published as both a blog post and an urgent requirement —
 * which has actually happened here for Malta and New Zealand), and in that case
 * the newer modification date is the true one.
 */
export function collectEntries({ records, baseUrl, now = Date.now() }) {
  const base = normalizeBaseUrl(baseUrl)
  const byPath = new Map()
  const rejected = []

  for (const record of records ?? []) {
    const result = toEntry(record, base, now)
    if ('reason' in result) {
      rejected.push({
        path: record?.path ?? record?.url ?? record?.slug ?? '(none)',
        type: record?.type,
        reason: result.reason,
      })
      continue
    }
    const { entry } = result
    const existing = byPath.get(entry.path)
    if (!existing) {
      byPath.set(entry.path, entry)
      continue
    }
    rejected.push({ path: entry.path, type: entry.type, reason: 'duplicate URL' })
    const keepNew = entry.lastmod && (!existing.lastmod || entry.lastmod > existing.lastmod)
    if (keepNew) byPath.set(entry.path, { ...existing, lastmod: entry.lastmod })
  }

  // Root first, then alphabetically. A stable order means two runs over
  // unchanged content produce byte-identical XML, which is what lets a caller
  // compare an ETag instead of re-sending the body.
  const entries = [...byPath.values()].sort((a, b) => {
    if (a.path === '/') return -1
    if (b.path === '/') return 1
    return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
  })

  return { entries, rejected }
}

const XML_DECL = '<?xml version="1.0" encoding="UTF-8"?>'
const URLSET_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1'

/**
 * `public/sitemap.xsl` exists so a human opening the sitemap in a browser sees
 * a table instead of raw XML. The stylesheet instruction is inert for crawlers.
 */
const DEFAULT_STYLESHEET = '/sitemap.xsl'

function stylesheetLine(href) {
  return href ? `<?xml-stylesheet type="text/xsl" href="${escapeXml(href)}"?>` : ''
}

function renderImage(image) {
  const parts = [`      <image:loc>${escapeXml(image.loc)}</image:loc>`]
  if (image.title) parts.push(`      <image:title>${escapeXml(image.title)}</image:title>`)
  if (image.caption) parts.push(`      <image:caption>${escapeXml(image.caption)}</image:caption>`)
  return `    <image:image>\n${parts.join('\n')}\n    </image:image>`
}

/**
 * Renders a `<urlset>`. The image namespace is declared only when at least one
 * URL carries an image, so a site with no image data does not ship an unused
 * namespace on every sitemap.
 */
export function renderUrlset(entries, { stylesheet = DEFAULT_STYLESHEET } = {}) {
  const hasImages = entries.some((entry) => entry.images?.length)
  const ns = hasImages ? `xmlns="${URLSET_NS}" xmlns:image="${IMAGE_NS}"` : `xmlns="${URLSET_NS}"`

  const body = entries
    .map((entry) => {
      const lines = [`    <loc>${escapeXml(entry.loc)}</loc>`]
      if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`)
      if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`)
      if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`)
      for (const image of entry.images ?? []) lines.push(renderImage(image))
      return `  <url>\n${lines.join('\n')}\n  </url>`
    })
    .join('\n')

  // filter(Boolean) drops the stylesheet line when there is no stylesheet, and
  // the body line when there are no URLs. The trailing newline is appended
  // rather than being an empty array element, which that filter removed.
  return (
    [XML_DECL, stylesheetLine(stylesheet), `<urlset ${ns}>`, body, '</urlset>']
      .filter(Boolean)
      .join('\n') + '\n'
  )
}

/** Renders a `<sitemapindex>` pointing at the shard files. */
export function renderSitemapIndex(sitemaps, { stylesheet = DEFAULT_STYLESHEET } = {}) {
  const body = sitemaps
    .map(({ loc, lastmod }) => {
      const lines = [`    <loc>${escapeXml(loc)}</loc>`]
      if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`)
      return `  <sitemap>\n${lines.join('\n')}\n  </sitemap>`
    })
    .join('\n')

  return (
    [
      XML_DECL,
      stylesheetLine(stylesheet),
      `<sitemapindex xmlns="${URLSET_NS}">`,
      body,
      '</sitemapindex>',
    ]
      .filter(Boolean)
      .join('\n') + '\n'
  )
}

/** Chunks an array into runs of at most `size`. */
function chunk(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * Builds the complete set of sitemap files for a list of records.
 *
 * Below the 50,000-URL cap this returns exactly one file, `sitemap.xml`, so the
 * URL already in robots.txt and already submitted to Search Console keeps
 * working. Above the cap, `sitemap.xml` becomes the sitemap index and the URLs
 * move into one file per content type. Putting the index at `sitemap.xml`
 * rather than at a new `sitemap-index.xml` means crossing the threshold needs
 * no resubmission and no robots.txt change — a sitemap index is a valid
 * response at that path.
 *
 * @returns {{
 *   files: Array<{ name: string, xml: string, urlCount: number }>,
 *   index: boolean,
 *   entries: Array<object>,
 *   rejected: Array<{ path: string, type?: string, reason: string }>,
 *   stats: { total: number, rejected: number, byType: Record<string, number>, lastmod?: string },
 * }}
 */
export function buildSitemap({
  records,
  baseUrl,
  now = Date.now(),
  stylesheet = DEFAULT_STYLESHEET,
  maxUrls = MAX_URLS_PER_SITEMAP,
}) {
  const base = normalizeBaseUrl(baseUrl)
  const { entries, rejected } = collectEntries({ records, baseUrl: base, now })

  const byType = {}
  for (const entry of entries) byType[entry.type] = (byType[entry.type] ?? 0) + 1

  const newest = entries.reduce(
    (max, entry) => (entry.lastmod && (!max || entry.lastmod > max) ? entry.lastmod : max),
    undefined,
  )

  const stats = { total: entries.length, rejected: rejected.length, byType, lastmod: newest }

  if (entries.length <= maxUrls) {
    return {
      files: [
        { name: 'sitemap.xml', xml: renderUrlset(entries, { stylesheet }), urlCount: entries.length },
      ],
      index: false,
      entries,
      rejected,
      stats,
    }
  }

  const types = Object.keys(byType).sort()
  const files = []
  const indexItems = []

  for (const type of types) {
    const ofType = entries.filter((entry) => entry.type === type)
    const shards = chunk(ofType, maxUrls)
    shards.forEach((shard, i) => {
      const name = shards.length === 1 ? `sitemap-${type}.xml` : `sitemap-${type}-${i + 1}.xml`
      const lastmod = shard.reduce(
        (max, entry) => (entry.lastmod && (!max || entry.lastmod > max) ? entry.lastmod : max),
        undefined,
      )
      files.push({ name, xml: renderUrlset(shard, { stylesheet }), urlCount: shard.length })
      indexItems.push({ loc: `${base}/${name}`, lastmod })
    })
  }

  files.unshift({
    name: 'sitemap.xml',
    xml: renderSitemapIndex(indexItems, { stylesheet }),
    urlCount: 0,
  })

  return { files, index: true, entries, rejected, stats }
}
