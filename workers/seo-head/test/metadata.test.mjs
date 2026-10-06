/**
 * Unit tests for the SEO Worker's metadata decisions.
 *
 * These run under plain `node --test` — no wrangler, no workerd, no network —
 * because everything they cover is pure: which field wins, when a tag is
 * omitted, when JobPosting is allowed, how text is escaped. The Miniflare suite
 * in worker.test.mjs then only has to prove the HTML plumbing.
 *
 * The cases that matter most here are the negative ones. This site writes the
 * literal string "Admin input required" into fields an author left blank, so a
 * naive read publishes that to every social card; and it is a YMYL site where a
 * fabricated salary or a JobPosting with invented facts is a regulatory problem,
 * not just a rich-result warning.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  blogMetadata,
  brandedTitle,
  clampDescription,
  escapeAttr,
  firstReal,
  isPlaceholder,
  isPubliclyVisible,
  matchRoute,
  renderHeadTags,
  renderTitleTag,
  requirementMetadata,
  SITE_NAME,
} from '../src/metadata.mjs'

const SITE = 'https://siddhivinayakoverseas.com'
const NOW = Date.parse('2026-10-06T12:00:00Z')

const blogRow = (over = {}) => ({
  slug: 'malta-welder-jobs',
  status: 'published',
  title: 'Malta Welder Jobs',
  meta_desc: 'Welding vacancies in Malta with EU work visa support.',
  featured_image: `${SITE}/img/malta.webp`,
  published_at: '2026-10-01T08:00:00Z',
  updated_at: '2026-10-02T09:00:00Z',
  created_at: '2026-09-30T08:00:00Z',
  ...over,
})

const requirementRow = (over = {}) => ({
  slug: 'malta-welder',
  status: 'active',
  title: 'Welder Required in Malta',
  country: 'Malta',
  created_at: '2026-10-01T08:00:00Z',
  ...over,
})

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

test('only the two database-driven detail routes match', () => {
  assert.deepEqual(matchRoute('/blog/malta-welder-jobs'), {
    route: { ...matchRoute('/blog/x').route },
    slug: 'malta-welder-jobs',
  })
  assert.equal(matchRoute('/urgent-requirements/malta-welder').slug, 'malta-welder')
  assert.equal(matchRoute('/urgent-requirements/malta-welder').route.table, 'urgent_requirements')
  assert.equal(matchRoute('/blog/x').route.table, 'blog_posts')
})

test('listing pages, other routes and nested paths do not match', () => {
  for (const path of [
    '/',
    '/blog',
    '/urgent-requirements',
    '/blog/category/malta',
    '/services',
    '/countries',
    '/countries/canada',
    '/work-visa/malta',
    '/admin/blog',
    '/jobs/welder',
  ]) {
    assert.equal(matchRoute(path), null, `${path} must not match`)
  }
})

test('a trailing slash resolves to the same slug, and case is normalised', () => {
  assert.equal(matchRoute('/blog/malta-welder-jobs/').slug, 'malta-welder-jobs')
  assert.equal(matchRoute('/blog/Malta-Welder-Jobs').slug, 'malta-welder-jobs')
})

test('a path that is not a clean slug is rejected before it reaches the query', () => {
  for (const path of [
    '/blog/../../etc/passwd',
    '/blog/has spaces',
    '/blog/semi;colon',
    '/blog/',
    "/blog/quote'inject",
    '/blog/under_score',
  ]) {
    assert.equal(matchRoute(path), null, `${path} must not match`)
  }
})

// ---------------------------------------------------------------------------
// Placeholder handling — the "Admin input required" sentinel
// ---------------------------------------------------------------------------

test('the admin placeholder sentinel counts as absent', () => {
  assert.equal(isPlaceholder('Admin input required'), true)
  assert.equal(isPlaceholder('  Admin input required  '), true)
  assert.equal(isPlaceholder(''), true)
  assert.equal(isPlaceholder('   '), true)
  assert.equal(isPlaceholder(null), true)
  assert.equal(isPlaceholder(undefined), true)
  assert.equal(isPlaceholder('Real content'), false)
})

test('the priority ladder skips placeholders and returns the first real value', () => {
  assert.equal(firstReal(null, 'Admin input required', 'Real', 'Later'), 'Real')
  assert.equal(firstReal(null, '', 'Admin input required'), undefined)
  assert.equal(firstReal('  padded  '), 'padded')
})

test('a placeholder seo_title never reaches og:title — the content title is used', () => {
  const meta = requirementMetadata(
    requirementRow({ seo_title: 'Admin input required' }),
    SITE,
  )
  assert.match(meta.title, /^Welder Required in Malta/)
  assert.ok(!meta.title.includes('Admin input'))
  assert.ok(!renderHeadTags(meta).includes('Admin input'))
})

test('a placeholder salary and currency cannot produce a baseSalary', () => {
  const meta = requirementMetadata(
    requirementRow({
      employer: 'Example Shipyard Ltd',
      salary: 'Admin input required',
      currency: 'EUR',
    }),
    SITE,
  )
  assert.equal(meta.jsonLd['@type'], 'JobPosting')
  assert.equal('baseSalary' in meta.jsonLd, false)
  assert.ok(!JSON.stringify(meta.jsonLd).includes('Admin input'))
})

// ---------------------------------------------------------------------------
// Blog metadata
// ---------------------------------------------------------------------------

test('blog title ladder: meta_title beats title', () => {
  assert.match(blogMetadata(blogRow({ meta_title: 'Custom SEO Title' }), SITE).title, /^Custom SEO Title/)
  assert.match(blogMetadata(blogRow({ meta_title: null }), SITE).title, /^Malta Welder Jobs/)
})

test('blog falls back to the site name when it has no usable title at all', () => {
  const meta = blogMetadata(blogRow({ title: null, meta_title: '' }), SITE)
  assert.equal(meta.title, SITE_NAME)
})

test('blog description ladder: meta_desc beats excerpt, and neither means omitted', () => {
  assert.match(blogMetadata(blogRow(), SITE).description, /^Welding vacancies/)
  assert.match(
    blogMetadata(blogRow({ meta_desc: null, excerpt: 'From the excerpt.' }), SITE).description,
    /^From the excerpt\./,
  )

  const none = blogMetadata(blogRow({ meta_desc: null, excerpt: null }), SITE)
  assert.equal(none.description, undefined)
  const tags = renderHeadTags(none)
  assert.ok(!tags.includes('name="description"'), 'no empty description meta')
  assert.ok(!tags.includes('og:description'), 'no empty og:description')
  assert.ok(!tags.includes('twitter:description'), 'no empty twitter:description')
})

test('blog canonical uses canonical_url when the row declares one', () => {
  assert.equal(blogMetadata(blogRow(), SITE).canonical, `${SITE}/blog/malta-welder-jobs`)
  assert.equal(
    blogMetadata(blogRow({ canonical_url: `${SITE}/urgent-requirements/malta-welder` }), SITE).canonical,
    `${SITE}/urgent-requirements/malta-welder`,
  )
})

test('a missing image omits every image tag rather than inventing a URL', () => {
  const meta = blogMetadata(blogRow({ featured_image: null }), SITE)
  assert.equal(meta.image, undefined)
  const tags = renderHeadTags(meta)
  assert.ok(!tags.includes('og:image'), 'no og:image')
  assert.ok(!tags.includes('twitter:image'), 'no twitter:image')
  // The card type degrades honestly when there is no image to show.
  assert.ok(tags.includes('content="summary"'))
  assert.ok(!tags.includes('summary_large_image'))
})

test('blog JSON-LD is BlogPosting and omits dates it does not have', () => {
  const full = blogMetadata(blogRow(), SITE).jsonLd
  assert.equal(full['@type'], 'BlogPosting')
  assert.equal(full.datePublished, '2026-10-01T08:00:00Z')
  assert.equal(full.dateModified, '2026-10-02T09:00:00Z')
  assert.equal(full.author['@type'], 'Organization', 'no invented byline')

  const dateless = blogMetadata(
    blogRow({ published_at: null, created_at: null, updated_at: null }),
    SITE,
  ).jsonLd
  assert.equal('datePublished' in dateless, false)
  assert.equal('dateModified' in dateless, false)
})

// ---------------------------------------------------------------------------
// Urgent-requirement metadata
// ---------------------------------------------------------------------------

test('requirement title ladder mirrors the page: short real title wins over a long seo_title', () => {
  const longSeo = 'A Very Long Search Engine Optimised Title That Comfortably Exceeds The Sixty Character Limit'
  const meta = requirementMetadata(requirementRow({ seo_title: longSeo }), SITE)
  assert.match(meta.title, /^Welder Required in Malta/)
})

test('requirement title falls back to the segment before " | " when no short title exists', () => {
  const meta = requirementMetadata(
    requirementRow({
      title: 'An Extremely Long Content Title That Is Also Far Beyond The Sixty Character Limit',
      seo_title: 'Welder Jobs in Malta 2026 | Apply Now With EU Work Visa Support Today',
    }),
    SITE,
  )
  // The " | " split picks the leading segment, then brandedTitle appends the
  // brand suffix exactly as SeoHead does for the client-rendered copy — the
  // page computes metaTitle and SeoHead owns the suffix.
  assert.equal(meta.title, `Welder Jobs in Malta 2026 | ${SITE_NAME}`)
})

test('requirement description: meta_description, then summary, then the page template', () => {
  assert.match(
    requirementMetadata(requirementRow({ meta_description: 'Custom desc.' }), SITE).description,
    /^Custom desc\./,
  )
  assert.match(
    requirementMetadata(requirementRow({ summary: 'Summary text.' }), SITE).description,
    /^Summary text\./,
  )
  // Template is built only from real stored fields.
  assert.equal(
    requirementMetadata(requirementRow(), SITE).description,
    `Welder Required in Malta — urgent visa/job opening in Malta. Apply through ${SITE_NAME}, Surat.`,
  )
})

test('with no summary and no real country the description is omitted, not templated', () => {
  const meta = requirementMetadata(
    requirementRow({ country: 'Admin input required', summary: null }),
    SITE,
  )
  assert.equal(meta.description, undefined)
  assert.ok(!renderHeadTags(meta).includes('name="description"'))
})

test('requirements always self-canonicalise', () => {
  assert.equal(
    requirementMetadata(requirementRow(), SITE).canonical,
    `${SITE}/urgent-requirements/malta-welder`,
  )
})

test('JobPosting only when employer, country and datePosted are all real', () => {
  // Missing employer -> WebPage, which claims nothing it cannot support.
  assert.equal(requirementMetadata(requirementRow(), SITE).jsonLd['@type'], 'WebPage')
  assert.equal(
    requirementMetadata(requirementRow({ employer: 'Admin input required' }), SITE).jsonLd['@type'],
    'WebPage',
  )
  assert.equal(
    requirementMetadata(requirementRow({ employer: 'Yard Ltd', created_at: null }), SITE).jsonLd['@type'],
    'WebPage',
  )

  const job = requirementMetadata(
    requirementRow({
      employer: 'Example Shipyard Ltd',
      city: 'Valletta',
      salary: '1400',
      currency: 'EUR',
      contract_type: 'FULL_TIME',
      expires_at: '2026-12-31T00:00:00Z',
    }),
    SITE,
  ).jsonLd

  assert.equal(job['@type'], 'JobPosting')
  assert.equal(job.hiringOrganization.name, 'Example Shipyard Ltd')
  assert.equal(job.jobLocation.address.addressCountry, 'Malta')
  assert.equal(job.jobLocation.address.addressLocality, 'Valletta')
  assert.equal(job.baseSalary.currency, 'EUR')
  assert.equal(job.validThrough, '2026-12-31T00:00:00Z')
})

test('a salary with no currency produces no baseSalary', () => {
  const job = requirementMetadata(
    requirementRow({ employer: 'Yard Ltd', salary: '1400', currency: null }),
    SITE,
  ).jsonLd
  assert.equal(job['@type'], 'JobPosting')
  assert.equal('baseSalary' in job, false)
})

// ---------------------------------------------------------------------------
// Visibility — what must never get public metadata
// ---------------------------------------------------------------------------

test('only a live row is publicly visible', () => {
  const blog = { publishedStatuses: ['published'], now: NOW }
  assert.equal(isPubliclyVisible({ status: 'published' }, blog), true)
  assert.equal(isPubliclyVisible({ status: 'draft' }, blog), false)
  assert.equal(isPubliclyVisible({ status: 'scheduled' }, blog), false)
  assert.equal(isPubliclyVisible({ status: 'archived' }, blog), false)
  assert.equal(isPubliclyVisible({ status: 'published', deleted_at: '2026-01-01' }, blog), false)
  assert.equal(
    isPubliclyVisible({ status: 'published', published_at: '2026-12-01T00:00:00Z' }, blog),
    false,
    'scheduled for the future',
  )
  assert.equal(
    isPubliclyVisible({ status: 'published', published_at: '2026-10-01T00:00:00Z' }, blog),
    true,
  )
  assert.equal(isPubliclyVisible(null, blog), false)
})

test('requirements use "active", and "published" is not accepted there', () => {
  const req = { publishedStatuses: ['active'], now: NOW }
  assert.equal(isPubliclyVisible({ status: 'active' }, req), true)
  assert.equal(isPubliclyVisible({ status: 'published' }, req), false)
  assert.equal(isPubliclyVisible({ status: 'expired' }, req), false)
  assert.equal(isPubliclyVisible({ status: 'filled' }, req), false)
})

// ---------------------------------------------------------------------------
// Shared formatting rules — parity with SeoHead.tsx
// ---------------------------------------------------------------------------

test('brand suffix is added, and dropped again when it overruns 60 characters', () => {
  assert.equal(brandedTitle('Short Title'), `Short Title | ${SITE_NAME}`)
  const long = 'A Title Of Precisely Fifty Characters Or Thereabouts OK'
  assert.equal(brandedTitle(long), long, 'suffix dropped rather than truncating the topic')
  assert.equal(brandedTitle(`Already ${SITE_NAME} Branded`), `Already ${SITE_NAME} Branded`)
})

test('descriptions clamp to 155 characters on a word boundary', () => {
  const long = 'word '.repeat(60).trim()
  const clamped = clampDescription(long)
  assert.ok(clamped.length <= 156, `got ${clamped.length}`)
  assert.ok(clamped.endsWith('.'))
  assert.ok(!clamped.includes('wor.'), 'must not cut mid-word')
  assert.equal(clampDescription('Short one.'), 'Short one.')
})

// ---------------------------------------------------------------------------
// Escaping and rendered output
// ---------------------------------------------------------------------------

test('attribute values are escaped so a title cannot break out of the tag', () => {
  assert.equal(escapeAttr('Fees & "costs" <b>'), 'Fees &amp; &quot;costs&quot; &lt;b&gt;')
  const meta = blogMetadata(
    blogRow({ meta_title: 'Jobs & Visas "2026"', meta_desc: '<script>alert(1)</script>' }),
    SITE,
  )
  const tags = renderHeadTags(meta)
  assert.ok(tags.includes('Jobs &amp; Visas &quot;2026&quot;'))
  assert.ok(!tags.includes('<script>alert(1)</script>'))
  assert.ok(tags.includes('&lt;script&gt;'))
})

test('JSON-LD closes an embedded script tag so the block cannot end early', () => {
  const meta = blogMetadata(blogRow({ meta_desc: 'Ends with </script> inside' }), SITE)
  const tags = renderHeadTags(meta)
  const script = tags.slice(tags.indexOf('<script type="application/ld+json"'))
  assert.ok(script.includes('\\u003c/script>'), 'the < must be escaped')
  assert.equal(script.split('</script>').length, 2, 'exactly one real closing tag')
})

test('every injected tag carries the handoff marker', () => {
  const meta = blogMetadata(blogRow(), SITE)
  const tags = `${renderTitleTag(meta)}\n${renderHeadTags(meta)}`
  const elements = tags.match(/<(meta|link|title|script)\b/g) ?? []
  const marked = tags.match(/data-seo-source="cloudflare"/g) ?? []
  assert.equal(
    elements.length,
    marked.length,
    'an unmarked tag would survive hydration and become a duplicate',
  )
})

test('the rendered tag set contains exactly one of each metadata element', () => {
  const meta = blogMetadata(blogRow(), SITE)
  const tags = `${renderTitleTag(meta)}\n${renderHeadTags(meta)}`
  const once = [
    '<title ',
    'rel="canonical"',
    'name="description"',
    'name="robots"',
    'property="og:type"',
    'property="og:url"',
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'name="twitter:card"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"',
    'application/ld+json',
  ]
  for (const needle of once) {
    assert.equal(tags.split(needle).length - 1, 1, `${needle} should appear exactly once`)
  }
})
