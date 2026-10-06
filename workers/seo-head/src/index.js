/**
 * Cloudflare Worker: server-rendered SEO metadata for database-driven routes.
 *
 * THE PROBLEM IT SOLVES
 *
 * Hostinger serves this site as static files through Apache. A blog post or
 * urgent requirement published in the admin panel is reachable immediately —
 * .htaccess rule 5 hands the URL to app-shell.html and React fetches the record
 * — but app-shell.html carries no <title>, canonical, description, Open Graph or
 * JSON-LD. Googlebot renders JavaScript and eventually sees the tags SeoHead
 * sets, so the cost there is render-budget delay. Social and LLM scrapers do
 * not execute JavaScript at all, so sharing a newly published post produces a
 * card titled "Siddhivinayak Overseas" with no description and no image.
 *
 * This Worker fills that gap by injecting the real metadata into the shell
 * before it reaches the client, without a rebuild and without touching the body.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not render the page body. React still fetches and renders the content
 * client-side. This is a <head> fix, not server-side rendering, and the
 * distinction is deliberate: SSR would mean replacing the build pipeline.
 *
 * THE THREE PATHS
 *
 *   not a content route        -> fetch(request), untouched. No work at all.
 *   prerendered page           -> returned untouched, and NO database call.
 *   app shell for a live row   -> one database read, <head> rewritten.
 *
 * SAFETY RULE THAT OVERRIDES EVERYTHING ELSE
 *
 * Any failure returns the origin response unmodified. A Supabase outage, a
 * malformed row, a changed column — none of them may turn a working page into
 * an error. The worst acceptable outcome is the behaviour the site has today:
 * metadata rendered client-side.
 */
import { matchRoute, isPubliclyVisible, renderHeadTags, renderTitleTag } from './metadata.mjs'
import { fetchRow } from './content.mjs'

/**
 * How long the edge may reuse an injected page. Short, because the point of the
 * whole exercise is that publishing is visible without a deploy; a long TTL
 * would reintroduce the staleness this removes.
 */
const EDGE_TTL_SECONDS = 60
const STALE_WHILE_REVALIDATE_SECONDS = 600

/** Guards against a slow database read holding a page request open. */
const SUPABASE_TIMEOUT_MS = 1500

/** Routes that must never be touched, cached or looked up, whatever else matches. */
const PRIVATE_PREFIXES = ['/admin', '/dashboard', '/auth', '/login', '/register', '/api']

const isPrivate = (pathname) =>
  PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

const isHtml = (response) => {
  const type = response.headers.get('content-type') ?? ''
  return type.includes('text/html')
}

/**
 * Fetches the page from the origin.
 *
 * In production ORIGIN_BASE is unset and this is a plain `fetch(request)`: the
 * Worker sits on a route of the zone, so that goes to whatever the proxied DNS
 * record points at — Hostinger — with the original Host and headers intact.
 * That is the behaviour to keep, because it is the one Cloudflare optimises and
 * the one that preserves the visitor's request exactly.
 *
 * ORIGIN_BASE overrides the origin for a given deployment. It exists because
 * the alternative for testing is intercepting the runtime's outbound fetch,
 * which ties the suite to a Miniflare API that has already changed shape once;
 * pointing the Worker at a local stub origin is both simpler and closer to what
 * production does. It is also what a staging deployment would use.
 */
function fetchOrigin(request, env) {
  const base = env.ORIGIN_BASE
  if (!base) return fetch(request)

  const incoming = new URL(request.url)
  const target = new URL(base)
  target.pathname = incoming.pathname
  target.search = incoming.search
  // The original Host is forwarded so the origin can still tell which site was
  // asked for, which matters for a shared-hosting vhost.
  const headers = new Headers(request.headers)
  headers.set('X-Forwarded-Host', incoming.host)
  return fetch(target.toString(), { method: request.method, headers, redirect: 'manual' })
}

/**
 * Decides whether an origin response is the metadata-less app shell.
 *
 * The X-App-Shell header is authoritative and is what production uses: it is set
 * by public/.htaccess, it is explicit in both directions ("1" shell, "0"
 * prerendered), and reading it costs nothing because no body parsing is
 * involved. Crucially, "0" lets a prerendered page be returned without a
 * database call.
 *
 * When the header is absent — a local `vite preview` origin, or an Apache
 * without mod_headers — the body is inspected for the <meta name="x-app-shell">
 * marker that scripts/prerender.mjs writes into app-shell.html only. That path
 * buffers the response, which is why it is the fallback and not the mechanism:
 * with the header present nothing is ever buffered.
 *
 * @returns {Promise<{ isShell: boolean, response: Response }>} the response to
 *   use onward, since the fallback path consumes and rebuilds the body.
 */
async function detectShell(response) {
  const header = response.headers.get('x-app-shell')
  if (header === '1') return { isShell: true, response }
  if (header === '0') return { isShell: false, response }

  const body = await response.text()
  const isShell = body.includes('name="x-app-shell"')
  return {
    isShell,
    response: new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }),
  }
}

/**
 * Rewrites the <head> of a shell response.
 *
 * HTMLRewriter rather than string replacement: it is a real streaming HTML
 * parser, so it cannot be fooled by an angle bracket inside an inline script or
 * by attribute order, and it leaves every byte it is not asked about untouched —
 * scripts, stylesheets, the React root and the whole body pass through
 * unmodified.
 *
 * Two handlers, and the order they fire in matters:
 *
 *   title  the shell's fallback <title>Siddhivinayak Overseas</title> is
 *          REPLACED, not appended to, or the document would have two titles.
 *   head   the remaining tags are appended at the end of <head>, which is after
 *          the title has already been dealt with.
 *
 * The x-app-shell marker meta is removed on the way through: it has served its
 * purpose by this point and should not reach the client.
 */
function injectMetadata(response, meta) {
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(element) {
        element.replace(renderTitleTag(meta), { html: true })
      },
    })
    .on('meta[name="x-app-shell"]', {
      element(element) {
        element.remove()
      },
    })
    .on('head', {
      element(element) {
        element.append(`\n    ${renderHeadTags(meta)}\n  `, { html: true })
      },
    })

  return rewriter.transform(response)
}

/** Copies a response so headers can be changed (Response headers are immutable). */
function withHeaders(response, mutate) {
  const headers = new Headers(response.headers)
  mutate(headers)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function handle(request, env, ctx) {
  const url = new URL(request.url)

  // Only GET/HEAD are ever page requests; anything else goes straight through so
  // a form post or an API call is never buffered or cached here.
  if (request.method !== 'GET' && request.method !== 'HEAD') return fetchOrigin(request, env)

  // Private areas are passed through untouched and explicitly not cached.
  if (isPrivate(url.pathname)) return fetchOrigin(request, env)

  const match = matchRoute(url.pathname)
  if (!match) return fetchOrigin(request, env)

  const originResponse = await fetchOrigin(request, env)

  // Only HTML is a candidate, and only a successful one. A 301 from .htaccess or
  // a 500 from the origin must reach the client exactly as the origin sent it.
  if (!originResponse.ok || !isHtml(originResponse)) return originResponse

  let detected
  try {
    detected = await detectShell(originResponse)
  } catch {
    return originResponse
  }

  if (!detected.isShell) {
    // A prerendered page already has correct metadata. No database call, no
    // rewrite — this is the common case and it must stay free.
    return detected.response
  }

  const { route, slug } = match
  const siteUrl = env.SITE_URL
  if (!siteUrl) {
    // Without the production origin every canonical and og:url would be wrong,
    // which is worse than injecting nothing. Degrade to current behaviour.
    console.error(JSON.stringify({ event: 'seo.misconfigured', missing: 'SITE_URL' }))
    return detected.response
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS)
  let result
  try {
    result = await fetchRow({
      supabaseUrl: env.SUPABASE_URL,
      supabaseKey: env.SUPABASE_PUBLISHABLE_KEY,
      table: route.table,
      slug,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if ('error' in result) {
    // Degrade silently to client-rendered metadata, but make it visible in the
    // Worker log — a persistent error here is a real regression, just not one
    // worth breaking the page over.
    console.error(JSON.stringify({ event: 'seo.lookup_failed', path: url.pathname, error: result.error }))
    return detected.response
  }

  const row = 'row' in result ? result.row : null
  const visible = row && isPubliclyVisible(row, { publishedStatuses: route.publishedStatuses })

  if (!visible) {
    /**
     * No such slug, or a row that is draft, expired, soft-deleted or scheduled.
     *
     * The origin returns the shell with 200 for these, which is a soft 404:
     * Googlebot is told the URL exists, then React renders a not-found screen.
     * Returning 404 with noindex is the honest answer and is what stops an
     * unpublished slug being indexed. The body is passed through unchanged, so
     * the React app still renders its own not-found UI and the design does not
     * change.
     *
     * No metadata is injected, deliberately: generic metadata on a missing page
     * is exactly the misleading 200 this avoids.
     */
    return withHeaders(new Response(detected.response.body, { status: 404, headers: detected.response.headers }), (headers) => {
      headers.set('X-Robots-Tag', 'noindex')
      headers.set('Cache-Control', 'no-store')
      headers.delete('x-app-shell')
    })
  }

  let meta
  try {
    meta = route.build(row, siteUrl)
  } catch (err) {
    console.error(JSON.stringify({ event: 'seo.build_failed', path: url.pathname, message: err?.message }))
    return detected.response
  }

  const injected = injectMetadata(detected.response, meta)

  return withHeaders(injected, (headers) => {
    headers.set(
      'Cache-Control',
      `public, max-age=0, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
    )
    // Lets a response be identified as injected from curl and from the tests,
    // and makes a misrouted request obvious.
    headers.set('X-SEO-Injected', route.type)
    headers.delete('x-app-shell')
    headers.append('Vary', 'Accept-Encoding')
  })
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handle(request, env, ctx)
    } catch (err) {
      // The last line of the safety rule: an unexpected throw must still serve
      // the page. Falling back to a plain origin fetch means the visitor gets
      // exactly what they would have got with no Worker deployed.
      console.error(JSON.stringify({ event: 'seo.unhandled', message: err?.message, stack: err?.stack }))
      try {
        return await fetchOrigin(request, env)
      } catch {
        return new Response('Upstream unavailable', { status: 502 })
      }
    }
  },
}

// NOTHING ELSE IS EXPORTED, DELIBERATELY. workerd treats every named export of
// the entry module as a potential handler and refuses to start the Worker if one
// is not a function or ExportedHandler — re-exporting constants here for the
// tests' convenience took the whole Worker down with
// "Incorrect type for map entry 'EDGE_TTL_SECONDS'". Tests import those from
// ./metadata.mjs directly instead.
