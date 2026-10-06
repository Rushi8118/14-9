/**
 * Integration tests for the SEO Worker, run in the real workerd runtime.
 *
 * WHY THE REAL RUNTIME AND NOT A MOCK
 *
 * The thing most worth proving here is the HTML transformation, and HTMLRewriter
 * is a native streaming parser that exists only in workerd. A hand-rolled stand-in
 * would test the stand-in. `wrangler unstable_dev` runs the actual Worker in the
 * actual runtime, so these assertions are made against the same bytes Cloudflare
 * would return.
 *
 * Two local HTTP stubs stand in for the halves of the real request path:
 * Hostinger (returning either the app shell or a prerendered page, with the
 * X-App-Shell header .htaccess sets) and Supabase PostgREST. The Worker is
 * pointed at them with ORIGIN_BASE and SUPABASE_URL, so nothing here touches the
 * network, the live site or the real database.
 *
 * These are the raw-HTTP checks the acceptance criteria call for — the assertions
 * read the response body as text, before any JavaScript has run, which is exactly
 * what `curl` would show and what a social or LLM crawler receives.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unstable_dev } from 'wrangler'

const here = path.dirname(fileURLToPath(import.meta.url))
const workerRoot = path.resolve(here, '..')
const repoRoot = path.resolve(workerRoot, '..', '..')

const SITE_URL = 'https://siddhivinayakoverseas.com'
const SUPABASE_URL = 'https://testref.supabase.co'
const SUPABASE_KEY = 'sb_publishable_test_key'

/**
 * A realistic app shell: the marker meta immediately after charset, the fallback
 * <title>, no canonical / description / og / JSON-LD, plus a script, a
 * stylesheet and the React root — so the tests can prove those survive.
 *
 * Mirrors what scripts/prerender.mjs writes to dist/app-shell.html. The
 * structural assumptions are checked against the real file by the last test in
 * this file, so a change to the shell cannot quietly invalidate these fixtures.
 */
const APP_SHELL = `<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8" />
    <meta name="x-app-shell" content="1" />
    <script>/* anti-flash theme guard; must survive */ window.__theme = 'light'</script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/assets/index-abc123.css" />
    <title>Siddhivinayak Overseas</title>
  </head>
  <body>
    <div id="root"><p>loading</p></div>
    <script type="module" src="/assets/index-def456.js"></script>
  </body>
</html>
`

/** A prerendered page: real metadata already present, X-App-Shell: 0. */
const PRERENDERED = `<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8" />
    <title>Malta Welder Jobs | Siddhivinayak Overseas</title>
    <meta name="description" content="Already prerendered description." />
    <link rel="canonical" href="${SITE_URL}/blog/prerendered-post" />
    <meta property="og:title" content="Malta Welder Jobs | Siddhivinayak Overseas" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
  </head>
  <body><div id="root"><h1>Malta Welder Jobs</h1></div></body>
</html>
`

/** Rows the stubbed PostgREST returns, keyed by table and slug. */
const ROWS = {
  blog_posts: {
    'published-post': {
      slug: 'published-post',
      status: 'published',
      title: 'Malta Welder Jobs',
      meta_title: null,
      meta_desc: 'Welding vacancies in Malta with EU work visa support.',
      excerpt: null,
      canonical_url: null,
      featured_image: `${SITE_URL}/img/malta.webp`,
      image_alt: 'Welders at work',
      published_at: '2026-10-01T08:00:00Z',
      created_at: '2026-09-30T08:00:00Z',
      updated_at: '2026-10-02T09:00:00Z',
    },
    'draft-post': {
      slug: 'draft-post',
      status: 'draft',
      title: 'Unpublished Draft About Visas',
      meta_desc: 'This must never be served publicly.',
      published_at: null,
      created_at: '2026-10-01T08:00:00Z',
      updated_at: '2026-10-01T08:00:00Z',
    },
    'prerendered-post': {
      slug: 'prerendered-post',
      status: 'published',
      title: 'Malta Welder Jobs',
      meta_desc: 'Already prerendered description.',
      published_at: '2026-09-01T08:00:00Z',
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-09-01T08:00:00Z',
    },
    'tricky-title-post': {
      slug: 'tricky-title-post',
      status: 'published',
      title: 'Fees & "Costs" <2026>',
      meta_desc: 'Includes an </script> sequence and an & ampersand.',
      published_at: '2026-10-01T08:00:00Z',
      created_at: '2026-10-01T08:00:00Z',
      updated_at: '2026-10-01T08:00:00Z',
    },
  },
  urgent_requirements: {
    'malta-welder': {
      slug: 'malta-welder',
      status: 'active',
      title: 'Welder Required in Malta',
      seo_title: null,
      meta_description: null,
      summary: 'Shipyard welders needed in Malta. EU work visa route.',
      country: 'Malta',
      city: 'Valletta',
      employer: 'Example Shipyard Ltd',
      salary: '1400',
      currency: 'EUR',
      contract_type: 'FULL_TIME',
      expires_at: '2026-12-31T00:00:00Z',
      detail_image_url: `${SITE_URL}/img/welder.webp`,
      image_url: null,
      created_at: '2026-10-01T08:00:00Z',
      updated_at: '2026-10-02T08:00:00Z',
    },
    'expired-requirement': {
      slug: 'expired-requirement',
      status: 'expired',
      title: 'Closed Vacancy',
      summary: 'Should not be served.',
      country: 'Malta',
      created_at: '2026-01-01T08:00:00Z',
      updated_at: '2026-01-01T08:00:00Z',
    },
  },
}

/** Paths the stub origin serves as a prerendered page rather than the shell. */
const PRERENDERED_PATHS = new Set(['/blog/prerendered-post', '/urgent-requirements/prerendered-req'])

/**
 * Mutable stub state. Tests flip these instead of restarting the Worker, which
 * keeps the suite fast enough to run on every change.
 */
const stub = { origin: { status: 200 }, supabase: { status: 200 } }

/** Lets each test see exactly what the Worker requested. */
let calls = []

/**
 * Stub Hostinger origin. Serves the shell or a prerendered page and sets the
 * X-App-Shell header exactly as public/.htaccess does.
 */
function startOrigin() {
  const server = createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname
    calls.push(`origin${pathname}`)

    if (stub.origin.status !== 200) {
      res.writeHead(stub.origin.status, { 'Content-Type': 'text/html' })
      res.end('origin error')
      return
    }

    const isPrerendered = PRERENDERED_PATHS.has(pathname)
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=UTF-8',
      'X-App-Shell': isPrerendered ? '0' : '1',
    })
    res.end(isPrerendered ? PRERENDERED : APP_SHELL)
  })
  return listen(server)
}

/** Stub PostgREST. Answers ?slug=eq.<slug> from the ROWS fixture. */
function startSupabase() {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    calls.push(`supabase${url.pathname}`)

    if (stub.supabase.status !== 200) {
      res.writeHead(stub.supabase.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'database unavailable' }))
      return
    }

    const table = url.pathname.split('/rest/v1/')[1]
    const slug = (url.searchParams.get('slug') ?? '').replace(/^eq\./, '')
    const row = ROWS[table]?.[slug]
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(row ? [row] : []))
  })
  return listen(server)
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, url: `http://127.0.0.1:${port}` })
    })
  })
}

let worker
let origin
let supabase

const get = (pathname, init) => worker.fetch(pathname, { redirect: 'manual', ...init })

/** Counts non-overlapping occurrences — the duplication assertions rely on this. */
const count = (haystack, needle) => haystack.split(needle).length - 1

before(async () => {
  origin = await startOrigin()
  supabase = await startSupabase()

  worker = await unstable_dev(path.join(workerRoot, 'src', 'index.js'), {
    config: path.join(workerRoot, 'wrangler.toml'),
    local: true,
    // The stub servers stand in for Hostinger and Supabase. ORIGIN_BASE is the
    // seam that makes this possible without intercepting the runtime's outbound
    // fetch; in production it is unset. See fetchOrigin() in src/index.js.
    vars: {
      SITE_URL,
      ORIGIN_BASE: origin.url,
      SUPABASE_URL: supabase.url,
      SUPABASE_PUBLISHABLE_KEY: SUPABASE_KEY,
    },
    ip: '127.0.0.1',
    experimental: { disableExperimentalWarning: true, disableDevRegistry: true },
  })
})

after(async () => {
  if (worker) await worker.stop()
  for (const target of [origin, supabase]) {
    if (target) await new Promise((resolve) => target.server.close(resolve))
  }
})

// ---------------------------------------------------------------------------
// TEST 1 — shell + published blog -> server-rendered metadata
// ---------------------------------------------------------------------------

test('TEST 1: a published blog on the app shell gets full server-rendered metadata', async () => {
  calls = []
  const response = await get('/blog/published-post')
  const html = await response.text()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type')?.includes('text/html'), true)
  assert.equal(response.headers.get('x-seo-injected'), 'blog')

  // The critical acceptance criterion: correct metadata in the RAW HTML.
  assert.match(html, /<title data-seo-source="cloudflare">Malta Welder Jobs \| Siddhivinayak Overseas<\/title>/)
  assert.match(html, /<meta name="description" content="Welding vacancies in Malta with EU work visa support\."/)
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL}/blog/published-post"`))
  assert.match(html, /property="og:title" content="Malta Welder Jobs \| Siddhivinayak Overseas"/)
  assert.match(html, /property="og:description" content="Welding vacancies/)
  assert.match(html, new RegExp(`property="og:url" content="${SITE_URL}/blog/published-post"`))
  assert.match(html, new RegExp(`property="og:image" content="${SITE_URL}/img/malta.webp"`))
  assert.match(html, /property="og:type" content="article"/)
  assert.match(html, /name="twitter:card" content="summary_large_image"/)
  assert.match(html, /name="twitter:title" content="Malta Welder Jobs/)
  assert.match(html, /name="twitter:image" content=/)
  assert.match(html, /name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"/)

  // JSON-LD, with the real dates and no invented byline.
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1])
  assert.equal(ld['@type'], 'BlogPosting')
  assert.equal(ld.headline, 'Malta Welder Jobs')
  assert.equal(ld.url, `${SITE_URL}/blog/published-post`)
  assert.equal(ld.datePublished, '2026-10-01T08:00:00Z')
  assert.equal(ld.dateModified, '2026-10-02T09:00:00Z')
  assert.equal(ld.author['@type'], 'Organization')

  // Exactly one Supabase read, and nothing else.
  const supabaseCalls = calls.filter((c) => c.startsWith('supabase'))
  assert.equal(supabaseCalls.length, 1, `expected 1 lookup, got ${supabaseCalls.length}`)
  assert.match(supabaseCalls[0], /\/rest\/v1\/blog_posts$/)
})

test('TEST 1b: the shell document survives intact — scripts, styles, root, body', async () => {
  const html = await (await get('/blog/published-post')).text()

  assert.match(html, /window\.__theme = 'light'/, 'inline theme guard preserved')
  assert.match(html, /<link rel="stylesheet" href="\/assets\/index-abc123\.css" \/>/)
  assert.match(html, /<script type="module" src="\/assets\/index-def456\.js"><\/script>/)
  assert.match(html, /<div id="root"><p>loading<\/p><\/div>/, 'React root untouched')
  assert.match(html, /<html lang="en-IN">/)
  assert.match(html, /<meta name="viewport"/)

  // The shell marker has served its purpose and must not reach the client.
  assert.equal(count(html, 'name="x-app-shell"'), 0)
  assert.equal(response_headerless(html), true)
})

/** The shell's fallback title must be gone, replaced rather than appended to. */
function response_headerless(html) {
  return count(html, '<title') === 1 && !html.includes('<title>Siddhivinayak Overseas</title>')
}

// ---------------------------------------------------------------------------
// TEST 2 — shell + published urgent requirement
// ---------------------------------------------------------------------------

test('TEST 2: a live urgent requirement gets metadata and a real JobPosting', async () => {
  const response = await get('/urgent-requirements/malta-welder')
  const html = await response.text()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-seo-injected'), 'requirements')

  assert.match(html, /<title data-seo-source="cloudflare">Welder Required in Malta \| Siddhivinayak Overseas<\/title>/)
  assert.match(html, /content="Shipyard welders needed in Malta\. EU work visa route\."/)
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL}/urgent-requirements/malta-welder"`))
  assert.match(html, /property="og:type" content="website"/)
  assert.match(html, new RegExp(`property="og:image" content="${SITE_URL}/img/welder.webp"`))

  const ld = JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1])
  assert.equal(ld['@type'], 'JobPosting')
  assert.equal(ld.hiringOrganization.name, 'Example Shipyard Ltd')
  assert.equal(ld.jobLocation.address.addressCountry, 'Malta')
  assert.equal(ld.jobLocation.address.addressLocality, 'Valletta')
  assert.equal(ld.baseSalary.currency, 'EUR')
  assert.equal(ld.validThrough, '2026-12-31T00:00:00Z')
})

// ---------------------------------------------------------------------------
// TESTS 3 and 4 — prerendered pages are returned untouched
// ---------------------------------------------------------------------------

test('TEST 3: an already-prerendered blog page is returned byte-identical', async () => {
  calls = []
  const response = await get('/blog/prerendered-post')
  const html = await response.text()

  assert.equal(response.status, 200)
  assert.equal(html, PRERENDERED, 'body must be unchanged')
  assert.equal(response.headers.get('x-seo-injected'), null, 'must not be marked as injected')
  assert.equal(count(html, 'data-seo-source'), 0, 'no injected tags')
  assert.equal(count(html, '<title'), 1)
  assert.equal(count(html, 'rel="canonical"'), 1)

  // And crucially, no database call at all for a prerendered page.
  //
  // The origin assertion is not redundant: without it this would pass just as
  // happily if the recorder had stopped recording, which is exactly how a
  // "0 lookups" assertion goes quietly vacuous.
  assert.deepEqual(calls, ['origin/blog/prerendered-post'], 'origin hit once, database not at all')
})

test('TEST 4: an already-prerendered requirement page is returned byte-identical', async () => {
  calls = []
  const response = await get('/urgent-requirements/prerendered-req')
  const html = await response.text()

  assert.equal(html, PRERENDERED)
  assert.equal(response.headers.get('x-seo-injected'), null)
  assert.equal(calls.filter((c) => c.startsWith('supabase')).length, 0)
})

// ---------------------------------------------------------------------------
// TEST 5 — a slug that does not exist
// ---------------------------------------------------------------------------

test('TEST 5: a nonexistent slug returns 404 with noindex and no invented metadata', async () => {
  const response = await get('/blog/no-such-post-anywhere')
  const html = await response.text()

  assert.equal(response.status, 404, 'must not be a soft 404')
  assert.equal(response.headers.get('x-robots-tag'), 'noindex')
  assert.equal(response.headers.get('cache-control'), 'no-store')

  // No metadata is fabricated for a page that does not exist.
  assert.equal(count(html, 'data-seo-source'), 0)
  assert.equal(count(html, 'rel="canonical"'), 0)
  assert.equal(count(html, 'application/ld+json'), 0)

  // The React app still boots and renders its own not-found screen.
  assert.match(html, /<div id="root">/)
  assert.match(html, /<script type="module" src="\/assets\/index-def456\.js"><\/script>/)
})

test('TEST 5b: a nonexistent requirement slug behaves the same way', async () => {
  const response = await get('/urgent-requirements/no-such-vacancy')
  assert.equal(response.status, 404)
  assert.equal(response.headers.get('x-robots-tag'), 'noindex')
})

// ---------------------------------------------------------------------------
// TEST 6 — unpublished content must not be exposed
// ---------------------------------------------------------------------------

test('TEST 6: a draft blog post is not publicly indexed and leaks no content', async () => {
  const response = await get('/blog/draft-post')
  const html = await response.text()

  assert.equal(response.status, 404)
  assert.equal(response.headers.get('x-robots-tag'), 'noindex')

  // The draft's own words must not appear anywhere in the response.
  assert.equal(html.includes('Unpublished Draft About Visas'), false)
  assert.equal(html.includes('This must never be served publicly.'), false)
  assert.equal(count(html, 'data-seo-source'), 0)
})

test('TEST 6b: an expired requirement is treated the same as unpublished', async () => {
  const response = await get('/urgent-requirements/expired-requirement')
  const html = await response.text()

  assert.equal(response.status, 404)
  assert.equal(response.headers.get('x-robots-tag'), 'noindex')
  assert.equal(html.includes('Closed Vacancy'), false)
})

// ---------------------------------------------------------------------------
// TEST 7 — no duplicate metadata in the served HTML
// ---------------------------------------------------------------------------

test('TEST 7: the injected document contains exactly one of every metadata element', async () => {
  const html = await (await get('/blog/published-post')).text()

  const exactlyOnce = {
    '<title': 1,
    'rel="canonical"': 1,
    'name="description"': 1,
    'name="robots"': 1,
    'property="og:type"': 1,
    'property="og:url"': 1,
    'property="og:title"': 1,
    'property="og:description"': 1,
    'property="og:image"': 1,
    'property="og:site_name"': 1,
    'name="twitter:card"': 1,
    'name="twitter:title"': 1,
    'name="twitter:description"': 1,
    'name="twitter:image"': 1,
    'application/ld+json': 1,
  }

  for (const [needle, expected] of Object.entries(exactlyOnce)) {
    assert.equal(count(html, needle), expected, `${needle} appeared ${count(html, needle)} times`)
  }

  // The shell's fallback title is replaced, not left behind alongside the new one.
  assert.equal(html.includes('<title>Siddhivinayak Overseas</title>'), false)
})

test('TEST 7b: every injected element is marked, so hydration can remove exactly its own', async () => {
  const html = await (await get('/blog/published-post')).text()
  const headStart = html.indexOf('<head>')
  const headEnd = html.indexOf('</head>')
  const head = html.slice(headStart, headEnd)

  // Count the elements the Worker is responsible for, not the shell's own.
  const marked = count(head, 'data-seo-source="cloudflare"')
  assert.ok(marked >= 15, `expected the full tag set to be marked, got ${marked}`)

  for (const needle of ['rel="canonical"', 'property="og:title"', 'application/ld+json', '<title']) {
    const index = head.indexOf(needle)
    const element = head.slice(head.lastIndexOf('<', index), head.indexOf('>', index) + 1)
    assert.match(element, /data-seo-source="cloudflare"/, `${needle} is not marked`)
  }
})

// ---------------------------------------------------------------------------
// Escaping in the real pipeline
// ---------------------------------------------------------------------------

test('special characters survive HTMLRewriter as valid escaped HTML', async () => {
  const html = await (await get('/blog/tricky-title-post')).text()

  assert.match(html, /Fees &amp; &quot;Costs&quot; &lt;2026&gt;/)
  // The JSON-LD block must still parse, and must not have been ended early by
  // the </script> sequence inside the description.
  const block = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]
  const ld = JSON.parse(block)
  assert.equal(ld.headline, 'Fees & "Costs" <2026>')
  assert.match(ld.description, /<\/script>/)
  assert.equal(count(html, 'application/ld+json'), 1)
})

// ---------------------------------------------------------------------------
// Pass-through and failure behaviour
// ---------------------------------------------------------------------------

test('routes the Worker does not own are passed through without a lookup', async () => {
  for (const pathname of ['/', '/blog', '/urgent-requirements', '/services', '/countries', '/admin/blog']) {
    calls = []
    const response = await get(pathname)
    assert.equal(response.headers.get('x-seo-injected'), null, `${pathname} must not be injected`)
    assert.equal(
      calls.filter((c) => c.startsWith('supabase')).length,
      0,
      `${pathname} must not hit Supabase`,
    )
  }
})

test('caching is short, revalidating, and never applied to a 404', async () => {
  const ok = await get('/blog/published-post')
  assert.match(ok.headers.get('cache-control'), /s-maxage=60/)
  assert.match(ok.headers.get('cache-control'), /stale-while-revalidate=600/)

  const missing = await get('/blog/no-such-post-anywhere')
  assert.equal(missing.headers.get('cache-control'), 'no-store')
})

test('a Supabase failure degrades to the unmodified shell, never an error page', async () => {
  stub.supabase.status = 500
  calls = []
  const response = await get('/blog/published-post')
  const html = await response.text()

  assert.equal(response.status, 200, 'the page must still work')
  assert.equal(response.headers.get('x-seo-injected'), null)
  assert.equal(count(html, 'data-seo-source'), 0)
  // Exactly the behaviour the site has today: client-rendered metadata.
  assert.match(html, /<title>Siddhivinayak Overseas<\/title>/)
  assert.match(html, /<div id="root">/)

  stub.supabase.status = 200
})

test('an origin error is relayed unchanged rather than masked', async () => {
  stub.origin.status = 503
  const response = await get('/blog/published-post')
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('x-seo-injected'), null)
  stub.origin.status = 200
})

test('a POST is never intercepted', async () => {
  const response = await get('/blog/published-post', { method: 'POST' })
  assert.equal(response.headers.get('x-seo-injected'), null)
})

// ---------------------------------------------------------------------------
// Fixture fidelity — the shell these tests assume must match the real one
// ---------------------------------------------------------------------------

test('the real dist/app-shell.html matches the assumptions in these fixtures', async (t) => {
  let real
  try {
    real = await readFile(path.join(repoRoot, 'dist', 'app-shell.html'), 'utf8')
  } catch {
    t.skip('dist/app-shell.html not built — run `npm run build` to include this check')
    return
  }

  assert.match(real, /name="x-app-shell"/, 'the Worker fallback marker is missing from the shell')
  assert.equal(count(real, '<title'), 1, 'the shell should carry exactly one fallback title')
  assert.match(real, /<title>Siddhivinayak Overseas<\/title>/)
  assert.equal(count(real, 'rel="canonical"'), 0, 'the shell must declare no canonical')
  assert.equal(count(real, 'og:url'), 0)
  assert.equal(count(real, 'application/ld+json'), 0)

  // The marker must be parsed before the title, since HTMLRewriter streams and
  // cannot look ahead.
  assert.ok(
    real.indexOf('name="x-app-shell"') < real.indexOf('<title'),
    'the marker must appear before <title> in the document',
  )
})
