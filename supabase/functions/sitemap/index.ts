/**
 * Serves sitemap.xml, its shards and robots.txt from the database, per request.
 *
 * WHY THIS EXISTS
 *
 * sitemap.xml was written at build time from dist/prerender-manifest.json, so a
 * post published in the admin panel was live for visitors immediately but absent
 * from the sitemap until someone ran `npm run build` and uploaded all of dist/
 * by hand. On a site where the urgent-requirements listings are the content most
 * worth crawling quickly, that gap is the whole problem.
 *
 * WHY AN EDGE FUNCTION AND NOT THE WEB HOST
 *
 * The site is Hostinger shared hosting serving static files through Apache. There
 * is no Node runtime there and PHP is ruled out, so the only runtime this project
 * owns that can answer a request is Supabase Edge Functions. public/.htaccess
 * points /sitemap.xml here; see docs/dynamic-sitemap.md for the routing and for
 * why a redirect rather than a proxy (mod_proxy is not available on this plan).
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not render pages. A newly published post reaches this sitemap within
 * one cache TTL with no build, but its server-rendered <title>, canonical and
 * JSON-LD still come from the prerendered HTML on Hostinger. Per-request HTML
 * needs a runtime in front of the domain; that is a separate decision and is
 * written up in docs/dynamic-sitemap.md rather than half-built here.
 */
// @ts-nocheck -- the shared core is plain ESM with JSDoc types, not TypeScript.
import { buildSitemap } from '../_shared/sitemap.mjs'
import { loadRecords } from '../_shared/sitemap-sources.mjs'

declare const Deno: {
  env: { get(key: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')

/**
 * The production domain. Required rather than defaulted: a sitemap that silently
 * emits the wrong host submits every URL on the site to the wrong place, and a
 * loud 500 on a misconfigured deploy is far cheaper to notice than that.
 */
const SITE_URL = Deno.env.get('SITE_URL')

/**
 * How long a built sitemap is reused. 60s is the publish-to-visible delay, and
 * it is the knob that matters: it bounds how stale the sitemap can be while
 * keeping a crawler burst from running five queries per request.
 */
const CACHE_TTL_MS = Number(Deno.env.get('SITEMAP_CACHE_TTL') ?? '60') * 1000

/** Lets the admin panel or a database webhook drop the cache immediately. */
const REVALIDATE_SECRET = Deno.env.get('SITEMAP_REVALIDATE_SECRET')

type CacheEntry = {
  builtAt: number
  files: Map<string, { xml: string; etag: string }>
  robots: string
  robotsEtag: string
  partial: boolean
  stats: unknown
}

/**
 * Per-isolate memo. Supabase keeps an isolate warm across requests, so this
 * absorbs a crawler fetching the index and then every shard in the same second.
 * It is not a shared cache and is not meant to be one: correctness comes from
 * the TTL and the ETag, not from cache coherence between isolates.
 */
let cache: CacheEntry | null = null

async function etagFor(body: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(body))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `"${hex.slice(0, 27)}"`
}

/**
 * robots.txt is served from here too so the Sitemap: line and the sitemap it
 * points at can never disagree — when the URL count crosses 50,000 and
 * sitemap.xml becomes an index, nothing has to be edited or re-uploaded.
 *
 * The crawler directives are copied from public/robots.txt rather than
 * generated: those Allow lines and the comments explaining why /admin is not
 * Disallowed are deliberate decisions, and regenerating them from a template
 * would quietly discard the reasoning.
 */
function renderRobots(siteUrl: string, sitemaps: string[]): string {
  return [
    '# Served from the sitemap Edge Function so the Sitemap: lines below always',
    '# match the sitemap that is actually being generated. See',
    '# supabase/functions/sitemap/index.ts.',
    '#',
    '# /admin, /dashboard and /403 are deliberately NOT disallowed: they send',
    '# X-Robots-Tag: noindex (see public/.htaccess). Blocking them here would stop',
    '# crawlers reading that header, which is what actually keeps them out of the index.',
    'User-agent: *',
    'Allow: /',
    '',
    '# Search-result and filtered URLs are an infinite crawl surface with no',
    '# indexable content behind them.',
    'Disallow: /search',
    'Disallow: /*?*',
    '',
    ...sitemaps.map((name) => `Sitemap: ${siteUrl}/${name}`),
    '',
    `# Generated ${new Date().toISOString()}`,
  ].join('\n')
}

async function rebuild(): Promise<CacheEntry> {
  const started = Date.now()
  const { records, errors, missing, counts } = await loadRecords({
    baseUrl: SUPABASE_URL,
    key: SUPABASE_KEY,
  })

  const result = buildSitemap({ records, baseUrl: SITE_URL })

  const files = new Map<string, { xml: string; etag: string }>()
  for (const file of result.files) {
    files.set(file.name, { xml: file.xml, etag: await etagFor(file.xml) })
  }

  // Always the index on the real domain, never this function's own URL: that is
  // the URL submitted to Search Console and the one a crawler should discover.
  const robots = renderRobots(SITE_URL!, ['sitemap.xml'])

  // Structured, single-line logs: these are read in the Supabase function log,
  // where a multi-line dump of every withheld URL would be unusable. The
  // per-URL reasons stay available through ?debug=1.
  console.log(
    JSON.stringify({
      event: 'sitemap.build',
      ms: Date.now() - started,
      urls: result.stats.total,
      withheld: result.stats.rejected,
      byType: result.stats.byType,
      sourceCounts: counts,
      missingTables: missing,
      errors,
      index: result.index,
    }),
  )

  // A source that errored means URLs are missing from this build. Serving it is
  // still better than a 500 — a crawler that gets an error learns nothing —
  // but it must not be cached, or a transient Supabase blip freezes a truncated
  // sitemap at the edge for a full TTL. A *missing table* is not an error here:
  // that is a migration not yet applied, which is a steady state on this project.
  const partial = errors.length > 0

  if (partial) {
    console.error(JSON.stringify({ event: 'sitemap.partial', errors }))
  }

  return {
    builtAt: Date.now(),
    files,
    robots,
    robotsEtag: await etagFor(robots),
    partial,
    stats: { ...result.stats, missing, errors, rejected: result.rejected },
  }
}

async function getCache(force: boolean): Promise<CacheEntry> {
  const fresh = cache && !cache.partial && Date.now() - cache.builtAt < CACHE_TTL_MS
  if (fresh && !force) return cache!
  const next = await rebuild()
  // Never cache a partial build; keep serving it for this request only.
  cache = next.partial ? null : next
  return next
}

function xmlResponse(xml: string, etag: string, partial: boolean, request: Request): Response {
  const headers = new Headers({
    // charset is explicit: without it a crawler may assume latin-1 and mangle a
    // non-ASCII slug or image title.
    'Content-Type': 'application/xml; charset=utf-8',
    ETag: etag,
    'X-Robots-Tag': 'noindex',
    Vary: 'Accept-Encoding',
    'Cache-Control': partial
      ? 'no-store'
      : `public, max-age=0, s-maxage=${Math.floor(CACHE_TTL_MS / 1000)}, stale-while-revalidate=600`,
  })

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers })
  }
  return new Response(xml, { status: 200, headers })
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
  }

  if (!SITE_URL) {
    console.error(JSON.stringify({ event: 'sitemap.misconfigured', missing: 'SITE_URL' }))
    return new Response('sitemap is not configured: SITE_URL is unset', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  const url = new URL(request.url)
  // Deployed at /functions/v1/sitemap, so the file being asked for is the last
  // segment — and a bare /functions/v1/sitemap means sitemap.xml.
  const segments = url.pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1] ?? ''
  // This function's urlset is reached as /sitemap-content.xml on the real domain
  // (public/.htaccess redirects it here). buildSitemap names its single file
  // sitemap.xml, so both spellings resolve to it; sitemap.xml on the domain
  // itself is the static index and is served by Hostinger, not by this function.
  const PRIMARY = new Set(['', 'sitemap', 'sitemap.xml', 'sitemap-content.xml'])
  const wanted = PRIMARY.has(last) ? 'sitemap.xml' : last

  const force =
    Boolean(REVALIDATE_SECRET) &&
    request.headers.get('x-sitemap-revalidate') === REVALIDATE_SECRET

  let entry: CacheEntry
  try {
    entry = await getCache(force)
  } catch (err) {
    // A thrown error here is a bug or a bad SITE_URL, not a missing row. Return
    // 503 rather than an empty sitemap: an empty <urlset> tells Google every URL
    // on the site is gone, which is far more damaging than a failed fetch it
    // will retry.
    console.error(
      JSON.stringify({ event: 'sitemap.error', message: err?.message, stack: err?.stack }),
    )
    return new Response('sitemap temporarily unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '300',
      },
    })
  }

  if (url.searchParams.get('debug') === '1') {
    return new Response(JSON.stringify(entry.stats, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    })
  }

  if (wanted === 'robots.txt') {
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      ETag: entry.robotsEtag,
      'Cache-Control': entry.partial ? 'no-store' : 'public, max-age=300, s-maxage=300',
    })
    if (request.headers.get('if-none-match') === entry.robotsEtag) {
      return new Response(null, { status: 304, headers })
    }
    return new Response(entry.robots, { headers })
  }

  const file = entry.files.get(wanted)
  if (!file) {
    // Named so a crawler holding a stale shard URL from a previous shape gets a
    // real 404 rather than an empty sitemap.
    return new Response(`No such sitemap: ${wanted}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  return xmlResponse(file.xml, file.etag, entry.partial, request)
})
