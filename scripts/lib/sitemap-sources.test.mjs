/**
 * Tests for the database adapters behind the dynamic sitemap.
 *
 * `fetch` is injected rather than mocked globally, so these run with no network,
 * no database and no Deno. What they actually pin down is the degradation
 * behaviour: which failures are allowed to cost one content type, which must
 * make the whole response uncacheable, and which must never silently empty the
 * sitemap. That distinction is the difference between "the services page is
 * missing for an hour" and "Google is told the entire site is gone".
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CONTENT_SOURCES, loadRecords } from '../../supabase/functions/_shared/sitemap-sources.mjs'

const BASE = 'https://project.supabase.co'
const KEY = 'publishable-key'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Builds a fetch stub that answers per table name, recording what was asked. */
function stubFetch(handlers) {
  const calls = []
  const impl = async (url) => {
    const { pathname, searchParams } = new URL(url)
    const table = pathname.split('/rest/v1/')[1]
    calls.push({ table, select: searchParams.get('select'), url })
    const handler = handlers[table]
    if (!handler) return json({ code: '42P01', message: `relation "${table}" does not exist` }, 404)
    return typeof handler === 'function' ? handler(searchParams, calls) : json(handler)
  }
  impl.calls = calls
  return impl
}

const load = (fetchImpl, sources = CONTENT_SOURCES) =>
  loadRecords({ baseUrl: BASE, key: KEY, fetchImpl, sources })

test('published rows from each table become records at the right path', async () => {
  const fetchImpl = stubFetch({
    blog_posts: [{ slug: 'malta-work-visa', status: 'published', updated_at: '2026-10-01T00:00:00Z' }],
    urgent_requirements: [{ slug: 'malta-welder', status: 'active', updated_at: '2026-10-02T00:00:00Z' }],
    services: [{ slug: 'study-visa', status: 'published' }],
    job_listings: [{ slug: 'welder-malta', status: 'published' }],
  })

  const { records, errors, missing, counts } = await load(fetchImpl)

  assert.deepEqual(errors, [])
  assert.deepEqual(missing, [])
  assert.deepEqual(records.map((r) => r.path).sort(), [
    '/blog/malta-work-visa',
    '/jobs/welder-malta',
    '/services/study-visa',
    '/urgent-requirements/malta-welder',
  ])
  assert.deepEqual(counts, { blog: 1, requirements: 1, services: 1, jobs: 1 })
})

test('the query filters on status so a draft never crosses the network', async () => {
  const fetchImpl = stubFetch({
    blog_posts: [],
    urgent_requirements: [],
    services: [],
    job_listings: [],
  })
  await load(fetchImpl)

  const urls = fetchImpl.calls.map((c) => c.url)
  assert.ok(urls.some((u) => u.includes('blog_posts') && u.includes('status=eq.published')))
  assert.ok(urls.some((u) => u.includes('urgent_requirements') && u.includes('status=eq.active')))
})

test('a table that does not exist costs that one type and is reported, not thrown', async () => {
  const fetchImpl = stubFetch({
    blog_posts: [{ slug: 'a', status: 'published' }],
    urgent_requirements: [{ slug: 'b', status: 'active' }],
    // services and job_listings deliberately absent: their migration is not applied
  })

  const { records, errors, missing } = await load(fetchImpl)

  assert.deepEqual(missing.sort(), ['job_listings', 'services'])
  assert.deepEqual(errors, [], 'an unapplied migration is a steady state, not an error')
  assert.deepEqual(records.map((r) => r.path).sort(), ['/blog/a', '/urgent-requirements/b'])
})

test('a missing SEO column degrades the select instead of losing the table', async () => {
  let attempts = 0
  const fetchImpl = stubFetch({
    blog_posts: (searchParams) => {
      attempts += 1
      const select = searchParams.get('select')
      // Reject any select asking for columns this older table has not got.
      if (select.includes('robots') || select.includes('is_indexable') || select.includes('deleted_at')) {
        return json({ code: '42703', message: 'column blog_posts.robots does not exist' }, 400)
      }
      if (select.includes('canonical_url')) {
        return json([{ slug: 'a', status: 'published', canonical_url: null, updated_at: '2026-10-01T00:00:00Z' }])
      }
      return json([{ slug: 'a', status: 'published' }])
    },
    urgent_requirements: [],
    services: [],
    job_listings: [],
  })

  const { records, errors } = await load(fetchImpl)

  assert.ok(attempts > 1, 'should have retried with a narrower column list')
  assert.deepEqual(errors, [])
  assert.deepEqual(records.map((r) => r.path), ['/blog/a'])
  assert.equal(records[0].updated_at, '2026-10-01T00:00:00Z')
})

test('a network failure is an error, so the response will not be cached', async () => {
  const fetchImpl = stubFetch({
    blog_posts: () => {
      throw new Error('connection reset')
    },
    urgent_requirements: [{ slug: 'b', status: 'active' }],
    services: [],
    job_listings: [],
  })

  const { records, errors } = await load(fetchImpl)

  assert.equal(errors.length, 1)
  assert.match(errors[0], /blog_posts: connection reset/)
  // The URLs that could be read are still returned — a partial sitemap beats none.
  assert.deepEqual(records.map((r) => r.path), ['/urgent-requirements/b'])
})

test('a 500 from PostgREST is an error, not a missing table', async () => {
  const fetchImpl = stubFetch({
    blog_posts: () => json({ message: 'internal server error' }, 500),
    urgent_requirements: [],
    services: [],
    job_listings: [],
  })

  const { errors, missing } = await load(fetchImpl)
  assert.equal(missing.includes('blog_posts'), false)
  assert.equal(errors.length, 1)
  assert.match(errors[0], /blog_posts: 500/)
})

test('a row with an unusable slug is dropped without affecting its siblings', async () => {
  const fetchImpl = stubFetch({
    blog_posts: [
      { slug: 'good-post', status: 'published' },
      { slug: 'Bad Slug With Spaces', status: 'published' },
      { slug: '../../etc/passwd', status: 'published' },
      { slug: null, status: 'published' },
      { status: 'published' },
    ],
    urgent_requirements: [],
    services: [],
    job_listings: [],
  })

  const { records, counts } = await load(fetchImpl)
  assert.deepEqual(records.map((r) => r.path), ['/blog/good-post'])
  assert.equal(counts.blog, 1)
})

test('missing configuration is reported rather than producing an empty sitemap quietly', async () => {
  const noUrl = await loadRecords({ baseUrl: '', key: KEY, fetchImpl: stubFetch({}) })
  assert.equal(noUrl.records.length, 0)
  assert.match(noUrl.errors[0], /SUPABASE_URL or SUPABASE_ANON_KEY/)

  const noKey = await loadRecords({ baseUrl: BASE, key: '', fetchImpl: stubFetch({}) })
  assert.match(noKey.errors[0], /SUPABASE_URL or SUPABASE_ANON_KEY/)
})
