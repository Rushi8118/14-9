/**
 * Tests for the sitemap core. Run with `npm run test:sitemap`.
 *
 * `node:test` is used rather than a test framework because the project had no
 * test runner and no runner dependency: Node ships one, it needs no config and
 * no transpile step, and the module under test is plain ESM.
 *
 * Each test below corresponds to a failure that either has happened on this
 * site or is the specific guarantee a dynamic sitemap has to make — that
 * publishing adds a URL and unpublishing removes it, without a build.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSitemap,
  collectEntries,
  escapeXml,
  formatLastmod,
  normalizeBaseUrl,
  normalizePath,
  renderUrlset,
  stripInvalidXmlChars,
} from '../../supabase/functions/_shared/sitemap.mjs'

const BASE = 'https://siddhivinayakoverseas.com'
const NOW = Date.parse('2026-10-06T12:00:00Z')

const build = (records) => buildSitemap({ records, baseUrl: BASE, now: NOW })
const locsOf = (records) =>
  collectEntries({ records, baseUrl: BASE, now: NOW }).entries.map((e) => e.loc)
const reasonFor = (record) => {
  const { rejected } = collectEntries({ records: [record], baseUrl: BASE, now: NOW })
  return rejected[0]?.reason
}

/**
 * Dependency-free well-formedness check: walks the tag stack and asserts every
 * open tag closes in order, and that no raw `&` or `<` survived outside a tag.
 * Enough to catch the real failure modes — an unescaped ampersand in a title,
 * an unbalanced element from a template edit — without adding an XML parser.
 */
function assertWellFormedXml(xml) {
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/, 'missing XML declaration')

  const stack = []
  const tagPattern = /<(\/?)([A-Za-z_?][\w:.?-]*)([^>]*?)(\/?)>/g
  let match
  let cursor = 0
  while ((match = tagPattern.exec(xml)) !== null) {
    const text = xml.slice(cursor, match.index)
    assert.ok(
      !text.includes('&') || /&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/.test(text),
      `unescaped & in text: ${JSON.stringify(text.slice(0, 60))}`,
    )
    assert.ok(!text.includes('<'), 'unescaped < in text')
    cursor = match.index + match[0].length

    const [, closing, name, , selfClosing] = match
    if (name.startsWith('?') || selfClosing) continue
    if (closing) {
      assert.equal(stack.pop(), name, `tag closed out of order: </${name}>`)
    } else {
      stack.push(name)
    }
  }
  assert.deepEqual(stack, [], `unclosed tags: ${stack.join(', ')}`)
}

// ---------------------------------------------------------------------------
// New content appears
// ---------------------------------------------------------------------------

test('a newly published post appears in the sitemap', () => {
  const before = build([{ type: 'pages', path: '/' }])
  assert.deepEqual(
    before.entries.map((e) => e.path),
    ['/'],
  )

  const after = build([
    { type: 'pages', path: '/' },
    {
      type: 'blog',
      path: '/blog/work-visa-for-malta',
      status: 'published',
      updated_at: '2026-10-05T09:30:00Z',
    },
  ])
  assert.deepEqual(
    after.entries.map((e) => e.path),
    ['/', '/blog/work-visa-for-malta'],
  )
  assert.match(
    after.files[0].xml,
    /<loc>https:\/\/siddhivinayakoverseas\.com\/blog\/work-visa-for-malta<\/loc>/,
  )
})

test('an active urgent requirement appears; "active" counts as published', () => {
  const locs = locsOf([
    { type: 'requirements', path: '/urgent-requirements/malta-welder', status: 'active' },
  ])
  assert.deepEqual(locs, [`${BASE}/urgent-requirements/malta-welder`])
})

// ---------------------------------------------------------------------------
// Unpublished, deleted and noindex content is removed
// ---------------------------------------------------------------------------

test('draft, scheduled and archived content is excluded', () => {
  for (const status of ['draft', 'scheduled', 'archived', 'expired', 'filled', 'pending_review']) {
    assert.deepEqual(locsOf([{ type: 'blog', path: '/blog/x', status }]), [], status)
    assert.equal(reasonFor({ type: 'blog', path: '/blog/x', status }), `status is "${status}"`)
  }
})

test('an unknown status is excluded rather than assumed safe', () => {
  assert.deepEqual(locsOf([{ path: '/blog/x', status: 'in_review_by_legal' }]), [])
})

test('soft-deleted content is excluded even when its status still says published', () => {
  const record = { path: '/blog/removed', status: 'published', deleted_at: '2026-09-01T00:00:00Z' }
  assert.deepEqual(locsOf([record]), [])
  assert.equal(reasonFor(record), 'soft-deleted')
})

test('scheduled publishing: a future published_at is excluded until it arrives', () => {
  const record = { path: '/blog/future', status: 'published', published_at: '2026-12-01T00:00:00Z' }
  assert.deepEqual(locsOf([record]), [])
  assert.equal(reasonFor(record), 'publish date is in the future')

  const arrived = { ...record, published_at: '2026-10-01T00:00:00Z' }
  assert.deepEqual(locsOf([arrived]), [`${BASE}/blog/future`])
})

test('an expired urgent requirement is excluded once its expires_at passes', () => {
  // The other end of the scheduled-publishing window. urgent_requirements keeps
  // status = 'active' until someone closes it by hand, so expiry is what ends
  // the listing; the detail page goes noindex at the same moment
  // (UrgentRequirementDetailPage, noindex={isClosed}). Without this rule the
  // sitemap submits a URL whose own page says not to index it.
  const expired = {
    type: 'requirements',
    path: '/urgent-requirements/closed-opening',
    status: 'active',
    expires_at: '2026-10-01T00:00:00Z',
  }
  assert.deepEqual(locsOf([expired]), [])
  assert.equal(reasonFor(expired), 'expired')

  const live = { ...expired, expires_at: '2026-12-01T00:00:00Z' }
  assert.deepEqual(locsOf([live]), [`${BASE}/urgent-requirements/closed-opening`])

  // camelCase spelling, as a record built in JS rather than read from PostgREST.
  assert.equal(reasonFor({ ...expired, expires_at: undefined, expiresAt: '2026-10-01T00:00:00Z' }), 'expired')
})

test('an unparseable or absent expires_at never drops a live URL', () => {
  // Losing a real URL to a malformed timestamp is worse than keeping one a
  // little too long, so an undecidable date is ignored rather than fatal.
  for (const expires_at of [undefined, null, '', 'not a date', 'tomorrow']) {
    assert.deepEqual(
      locsOf([{ path: '/urgent-requirements/live', status: 'active', expires_at }]),
      [`${BASE}/urgent-requirements/live`],
      String(expires_at),
    )
  }
})

test('noindex content is excluded, however the directive is spelled', () => {
  for (const robots of ['noindex', 'noindex, follow', 'NOINDEX,NOFOLLOW', 'none']) {
    assert.deepEqual(locsOf([{ path: '/thin-page', status: 'published', robots }]), [], robots)
  }
  // index,follow must still be allowed through.
  assert.deepEqual(locsOf([{ path: '/good-page', status: 'published', robots: 'index, follow' }]), [
    `${BASE}/good-page`,
  ])
})

test('isIndexable: false is excluded', () => {
  assert.deepEqual(locsOf([{ path: '/x', status: 'published', isIndexable: false }]), [])
})

test('a page whose canonical points elsewhere is excluded', () => {
  const record = {
    path: '/blog/duplicate-malta-post',
    status: 'published',
    canonical_url: `${BASE}/urgent-requirements/malta-welder`,
  }
  assert.deepEqual(locsOf([record]), [])
  assert.match(reasonFor(record), /^canonical points elsewhere/)

  // A self-canonical page is kept, and a trailing slash on the stored canonical
  // must not be read as "points elsewhere".
  assert.deepEqual(
    locsOf([{ path: '/blog/ok', status: 'published', canonical_url: `${BASE}/blog/ok/` }]),
    [`${BASE}/blog/ok`],
  )
})

test('admin, auth and search routes are never emitted', () => {
  const records = [
    '/admin',
    '/admin/blog',
    '/dashboard',
    '/dashboard/applications',
    '/auth/callback',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/403',
    '/404',
    '/search',
    '/search?q=visa',
    '/api/health',
    '/app-shell.html',
  ].map((path) => ({ path, status: 'published' }))
  assert.deepEqual(locsOf(records), [])
})

test('a public path that merely starts with a private word is kept', () => {
  assert.deepEqual(locsOf([{ path: '/administrative-support', status: 'published' }]), [
    `${BASE}/administrative-support`,
  ])
})

// ---------------------------------------------------------------------------
// lastmod
// ---------------------------------------------------------------------------

test('lastmod comes from updated_at and keeps the precision the source has', () => {
  const { entries } = collectEntries({
    records: [
      { path: '/a', updated_at: '2026-10-05T09:30:00.123Z' },
      { path: '/b', lastmod: '2026-09-14' },
    ],
    baseUrl: BASE,
    now: NOW,
  })
  assert.equal(entries.find((e) => e.path === '/a').lastmod, '2026-10-05T09:30:00Z')
  assert.equal(entries.find((e) => e.path === '/b').lastmod, '2026-09-14')
})

test('a missing, unparseable or future lastmod is omitted rather than invented', () => {
  assert.equal(formatLastmod(undefined), undefined)
  assert.equal(formatLastmod(''), undefined)
  assert.equal(formatLastmod('not a date'), undefined)
  assert.equal(formatLastmod('2027-01-01T00:00:00Z', NOW), undefined)

  const xml = renderUrlset(
    collectEntries({ records: [{ path: '/a' }], baseUrl: BASE, now: NOW }).entries,
  )
  assert.ok(!xml.includes('<lastmod>'), 'no lastmod element should be emitted')
})

test('updated_at wins over published_at', () => {
  const { entries } = collectEntries({
    records: [
      { path: '/a', published_at: '2026-01-01T00:00:00Z', updated_at: '2026-09-09T00:00:00Z' },
    ],
    baseUrl: BASE,
    now: NOW,
  })
  assert.equal(entries[0].lastmod, '2026-09-09T00:00:00Z')
})

// ---------------------------------------------------------------------------
// Duplicate prevention and normalization
// ---------------------------------------------------------------------------

test('the same path from two content types is emitted once, with the newer lastmod', () => {
  const { entries, rejected } = collectEntries({
    records: [
      { type: 'blog', path: '/vacancy/malta', updated_at: '2026-08-01T00:00:00Z' },
      { type: 'requirements', path: '/vacancy/malta', updated_at: '2026-10-01T00:00:00Z' },
    ],
    baseUrl: BASE,
    now: NOW,
  })
  assert.equal(entries.length, 1)
  assert.equal(entries[0].lastmod, '2026-10-01T00:00:00Z')
  assert.equal(rejected.filter((r) => r.reason === 'duplicate URL').length, 1)
})

test('trailing slash, uppercase and doubled slashes collapse to one URL', () => {
  const { entries } = collectEntries({
    records: [
      { path: '/study-in-canada' },
      { path: '/study-in-canada/' },
      { path: '/Study-In-Canada' },
      { path: '//study-in-canada' },
      { path: 'study-in-canada' },
      { path: `${BASE}/study-in-canada` },
    ],
    baseUrl: BASE,
    now: NOW,
  })
  assert.deepEqual(
    entries.map((e) => e.loc),
    [`${BASE}/study-in-canada`],
  )
})

test('the root path keeps its single slash', () => {
  assert.deepEqual(locsOf([{ path: '/' }]), [`${BASE}/`])
})

test('query strings and fragments are rejected, not silently stripped', () => {
  assert.equal(normalizePath('/blog?page=2'), null)
  assert.equal(normalizePath('/blog#top'), null)
  assert.deepEqual(locsOf([{ path: '/blog?page=2' }, { path: '/blog#top' }]), [])
})

test('path traversal and unusable paths are rejected', () => {
  for (const path of ['/a/../b', '/a/./b', '/a b', '/a<script>', '', null, 42, {}]) {
    assert.deepEqual(locsOf([{ path }]), [], `${JSON.stringify(path)} should be rejected`)
  }
})

test('output order is stable so unchanged content produces identical XML', () => {
  const records = [{ path: '/zebra' }, { path: '/' }, { path: '/apple' }, { path: '/mango' }]
  const first = build(records).files[0].xml
  const second = build([...records].reverse()).files[0].xml
  assert.equal(first, second)
  assert.deepEqual(
    build(records).entries.map((e) => e.path),
    ['/', '/apple', '/mango', '/zebra'],
  )
})

// ---------------------------------------------------------------------------
// XML validity and escaping
// ---------------------------------------------------------------------------

test('XML special characters in image metadata are escaped', () => {
  const { files } = build([
    {
      path: '/blog/fees-and-costs',
      updated_at: '2026-10-01T00:00:00Z',
      images: [
        {
          loc: `${BASE}/img/a.webp?w=800&h=600`,
          title: 'Fees & "costs" <2026>',
          caption: 'The Surat office’s front desk',
        },
      ],
    },
  ])
  const xml = files[0].xml
  assert.match(xml, /w=800&amp;h=600/)
  assert.match(xml, /Fees &amp; &quot;costs&quot; &lt;2026&gt;/)
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml), 'no bare ampersands')
  assertWellFormedXml(xml)
})

test('a straight apostrophe is escaped so the helper is attribute-safe', () => {
  assert.equal(escapeXml("Surat's office"), 'Surat&apos;s office')
})

test('control characters XML forbids are stripped, not escaped', () => {
  assert.equal(stripInvalidXmlChars('a\u0000b\u000Bc'), 'abc')
  assert.equal(stripInvalidXmlChars('keep\tthis\nand\rthis'), 'keep\tthis\nand\rthis')
  assert.equal(escapeXml('a & b'), 'a &amp; b')
})

test('the image namespace is declared only when an image is present', () => {
  const withImage = build([{ path: '/a', images: [{ loc: `${BASE}/i.webp` }] }]).files[0].xml
  const withoutImage = build([{ path: '/a' }]).files[0].xml
  assert.match(withImage, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/)
  assert.ok(!withoutImage.includes('xmlns:image'))
  assertWellFormedXml(withImage)
  assertWellFormedXml(withoutImage)
})

test('an invalid image URL is dropped without dropping the page', () => {
  const { entries } = collectEntries({
    records: [{ path: '/a', images: [{ loc: '/relative.webp' }, { loc: `${BASE}/ok.webp` }] }],
    baseUrl: BASE,
    now: NOW,
  })
  assert.deepEqual(
    entries[0].images.map((i) => i.loc),
    [`${BASE}/ok.webp`],
  )
})

test('changefreq and priority are emitted only when a record supplies a valid one', () => {
  const xml = build([
    { path: '/a' },
    { path: '/b', changefreq: 'daily', priority: 0.8 },
    { path: '/c', changefreq: 'occasionally', priority: 7 },
  ]).files[0].xml
  assert.equal((xml.match(/<changefreq>/g) ?? []).length, 1)
  assert.equal((xml.match(/<priority>/g) ?? []).length, 1)
  assert.match(xml, /<changefreq>daily<\/changefreq>/)
  assert.match(xml, /<priority>0\.8<\/priority>/)
})

test('an empty sitemap is still well-formed XML', () => {
  const { files } = build([])
  assert.equal(files[0].urlCount, 0)
  assertWellFormedXml(files[0].xml)
  assert.match(files[0].xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
})

// ---------------------------------------------------------------------------
// Splitting
// ---------------------------------------------------------------------------

test('under the cap there is exactly one file, still at sitemap.xml', () => {
  const result = buildSitemap({
    records: Array.from({ length: 5 }, (_, i) => ({ type: 'blog', path: `/blog/p-${i}` })),
    baseUrl: BASE,
    now: NOW,
    maxUrls: 5,
  })
  assert.equal(result.index, false)
  assert.deepEqual(
    result.files.map((f) => f.name),
    ['sitemap.xml'],
  )
})

test('over the cap, sitemap.xml becomes an index and URLs split by content type', () => {
  const records = [
    ...Array.from({ length: 4 }, (_, i) => ({ type: 'blog', path: `/blog/p-${i}` })),
    ...Array.from({ length: 3 }, (_, i) => ({
      type: 'requirements',
      path: `/urgent-requirements/r-${i}`,
    })),
    { type: 'pages', path: '/', updated_at: '2026-10-02T00:00:00Z' },
  ]
  const result = buildSitemap({ records, baseUrl: BASE, now: NOW, maxUrls: 3 })

  assert.equal(result.index, true)
  assert.deepEqual(
    result.files.map((f) => f.name),
    [
      'sitemap.xml',
      'sitemap-blog-1.xml',
      'sitemap-blog-2.xml',
      'sitemap-pages.xml',
      'sitemap-requirements.xml',
    ],
  )

  const index = result.files[0].xml
  assert.match(index, /<sitemapindex/)
  assert.match(index, new RegExp(`<loc>${BASE}/sitemap-blog-1\\.xml</loc>`))

  // Every URL survives the split exactly once.
  const emitted = result.files
    .slice(1)
    .flatMap((f) => [...f.xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
  assert.equal(emitted.length, 8)
  assert.equal(new Set(emitted).size, 8)
  for (const file of result.files) assertWellFormedXml(file.xml)
})

test('the index carries each shard newest lastmod', () => {
  const result = buildSitemap({
    records: [
      { type: 'blog', path: '/blog/a', updated_at: '2026-01-01T00:00:00Z' },
      { type: 'blog', path: '/blog/b', updated_at: '2026-09-09T00:00:00Z' },
      { type: 'pages', path: '/' },
    ],
    baseUrl: BASE,
    now: NOW,
    maxUrls: 2,
  })
  assert.match(
    result.files[0].xml,
    /sitemap-blog\.xml<\/loc>\n\s*<lastmod>2026-09-09T00:00:00Z<\/lastmod>/,
  )
})

// ---------------------------------------------------------------------------
// Base URL handling
// ---------------------------------------------------------------------------

test('the production domain comes from configuration, never a hardcoded host', () => {
  const { entries } = collectEntries({
    records: [{ path: '/contact' }],
    baseUrl: 'https://staging.example.com/',
    now: NOW,
  })
  assert.equal(entries[0].loc, 'https://staging.example.com/contact')
  assert.equal(normalizeBaseUrl('https://example.com/'), 'https://example.com')
})

test('a missing or malformed base URL fails loudly', () => {
  for (const bad of [undefined, '', '   ', 'example.com', 'ftp://example.com', 'https://a.com/?x=1']) {
    assert.throws(() => normalizeBaseUrl(bad), /\[sitemap\]/, `${JSON.stringify(bad)} should throw`)
  }
})

// ---------------------------------------------------------------------------
// Resilience
// ---------------------------------------------------------------------------

test('one malformed record does not empty the sitemap', () => {
  const { entries, rejected } = collectEntries({
    records: [null, { path: '/good' }, undefined, { nothing: true }, { path: '/also-good' }],
    baseUrl: BASE,
    now: NOW,
  })
  assert.deepEqual(
    entries.map((e) => e.path),
    ['/also-good', '/good'],
  )
  assert.equal(rejected.length, 3)
})

test('every rejection is reported with a reason', () => {
  const { rejected } = collectEntries({
    records: [
      { path: '/a', status: 'draft' },
      { path: '/b', deleted_at: '2026-01-01' },
      { path: '/c', robots: 'noindex' },
      { path: '/admin/x' },
    ],
    baseUrl: BASE,
    now: NOW,
  })
  assert.equal(rejected.length, 4)
  for (const row of rejected) assert.ok(row.reason && row.reason.length > 0, 'reason must be present')
})

test('stats summarise what was emitted and what was withheld', () => {
  const { stats } = build([
    { type: 'blog', path: '/blog/a', updated_at: '2026-10-01T00:00:00Z' },
    { type: 'blog', path: '/blog/b' },
    { type: 'pages', path: '/' },
    { type: 'blog', path: '/blog/c', status: 'draft' },
  ])
  assert.deepEqual(stats.byType, { blog: 2, pages: 1 })
  assert.equal(stats.total, 3)
  assert.equal(stats.rejected, 1)
  assert.equal(stats.lastmod, '2026-10-01T00:00:00Z')
})

test('every rendered file ends with exactly one newline', () => {
  const single = build([{ path: '/a' }]).files[0].xml
  assert.ok(single.endsWith('</urlset>\n'), 'urlset must end with a newline')

  const split = buildSitemap({
    records: [
      { type: 'blog', path: '/blog/a' },
      { type: 'pages', path: '/' },
    ],
    baseUrl: BASE,
    now: NOW,
    maxUrls: 1,
  })
  assert.ok(split.files[0].xml.endsWith('</sitemapindex>\n'), 'index must end with a newline')
  for (const file of split.files) assert.ok(!file.xml.endsWith('\n\n'), 'no double trailing newline')
})
