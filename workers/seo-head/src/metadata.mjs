/**
 * Builds the <head> metadata the SEO Worker injects into an app-shell response.
 *
 * WHY THIS IS A SEPARATE, PURE MODULE
 *
 * Nothing here touches HTMLRewriter, fetch or any Cloudflare global, so the
 * whole of the metadata decision-making is testable under `node --test` with no
 * wrangler, no network and no database. The Worker entry (src/index.js) is then
 * thin enough to verify with a handful of integration requests.
 *
 * WHY IT DUPLICATES LOGIC FROM THE REACT PAGES
 *
 * This is deliberate, and the duplication is the point: the Worker runs in
 * workerd and cannot import TypeScript from src/. What it *must* do is produce
 * the same strings the React page would, because both can be in the DOM at once
 * for a moment during hydration and because a crawler that does not execute JS
 * sees only this version. Every rule below is mirrored from a specific line of
 * the page that owns it:
 *
 *   src/components/seo/SeoHead.tsx                 brand suffix, 60-char rule, tag set
 *   src/pages/BlogPostPage.tsx                     meta_title -> title, meta_desc -> excerpt
 *   src/pages/UrgentRequirementDetailPage.tsx      seo_title ladder, 155-char description
 *   src/lib/ai/guardrails.ts                       the "Admin input required" sentinel
 *   src/lib/seo/schema.ts                          publisher/author shape
 *
 * If one of those changes, this must change with it. The parity tests in
 * workers/seo-head/test/metadata.test.mjs assert the shared rules so the drift
 * is caught rather than discovered in a search result.
 *
 * WHY PLACEHOLDERS ARE FILTERED
 *
 * The admin tooling writes the literal string "Admin input required" into any
 * important field an author left empty, so that it is visibly flagged instead of
 * silently blank. Those values reach the database. Injecting one into og:title
 * would publish "Admin input required" to every social card, so every read goes
 * through isPlaceholder() — the Worker's copy of isAdminInputRequired().
 */

export const SITE_NAME = 'Siddhivinayak Overseas'
export const BRAND_SUFFIX = ` | ${SITE_NAME}`

/** src/components/seo/SeoHead.tsx — Google truncates past roughly 60 chars. */
const TITLE_LIMIT = 60
/** src/pages/UrgentRequirementDetailPage.tsx */
const DESCRIPTION_LIMIT = 155

/** src/lib/ai/guardrails.ts — ADMIN_INPUT_REQUIRED. */
const ADMIN_INPUT_REQUIRED = 'Admin input required'

/** The Worker marks every tag it injects so hydration can remove exactly its own. */
export const SEO_SOURCE_ATTR = 'data-seo-source'
export const SEO_SOURCE_VALUE = 'cloudflare'

/** Mirrors isAdminInputRequired(): empty, whitespace or the sentinel. */
export function isPlaceholder(value) {
  return !value || typeof value !== 'string' || value.trim() === '' || value.trim() === ADMIN_INPUT_REQUIRED
}

/**
 * First value that is real content. This is the priority ladder — custom SEO
 * field, then the content field, then a safe site-wide fallback — expressed
 * once. Returns undefined when nothing qualifies, which is how a tag comes to
 * be omitted rather than emitted empty.
 */
export function firstReal(...values) {
  for (const value of values) {
    if (!isPlaceholder(value)) return value.trim()
  }
  return undefined
}

/**
 * Escapes text for an HTML attribute value.
 *
 * `&` first, or it would double-escape the entities the later replacements
 * introduce. Both quote styles are escaped so the output is safe regardless of
 * which the attribute uses, and `<`/`>` are escaped so a stray angle bracket in
 * a title cannot close the tag early.
 */
export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escapes text content for an element body (no quote handling needed). */
export function escapeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * SeoHead.tsx: append the brand suffix unless the title already names the
 * brand, then drop the suffix again if it is what pushed the title past 60.
 * Never truncates mid-phrase — that would cut the page topic in half.
 */
export function brandedTitle(title) {
  const full = title.includes(SITE_NAME) ? title : `${title}${BRAND_SUFFIX}`
  return full.length > TITLE_LIMIT && full.endsWith(BRAND_SUFFIX)
    ? full.slice(0, -BRAND_SUFFIX.length)
    : full
}

/** UrgentRequirementDetailPage.tsx — trim to 155 chars on a word boundary. */
export function clampDescription(text) {
  if (text.length <= DESCRIPTION_LIMIT) return text
  return (
    text
      .slice(0, DESCRIPTION_LIMIT)
      .replace(/\s+\S*$/, '')
      .trim()
      .replace(/[,;:\s]+$/, '') + '.'
  )
}

const trimSlash = (url) => (url.endsWith('/') ? url.slice(0, -1) : url)

/**
 * True when the row is a public, published, indexable page.
 *
 * The Worker re-checks this even though the query already filtered on status:
 * the filter is an optimisation, this is the guarantee. A row that is soft
 * deleted, scheduled for the future, or explicitly noindex must not get public
 * metadata injected for it.
 */
export function isPubliclyVisible(row, { publishedStatuses, now = Date.now() }) {
  if (!row) return false
  if (row.deleted_at) return false
  if (row.status != null && !publishedStatuses.includes(String(row.status).toLowerCase())) return false
  if (row.published_at) {
    const at = Date.parse(String(row.published_at))
    if (!Number.isNaN(at) && at > now) return false
  }
  return true
}

/**
 * Blog metadata. Mirrors BlogPostPage.tsx lines 53-90.
 *
 * The two slug-specific title rewrites in that file are NOT reproduced here:
 * they exist to shorten two specific posts whose titles overran, they are
 * already applied client-side, and hardcoding two slugs into edge
 * infrastructure would be a maintenance trap. The consequence is bounded — for
 * those two posts the raw HTML title is the longer form and React replaces it
 * on hydration, which is cosmetic and affects no other field.
 */
export function blogMetadata(row, siteUrl) {
  const base = trimSlash(siteUrl)
  const path = `/blog/${row.slug}`

  // meta_title -> title -> site name. BlogPostPage: `post.meta_title || post.title`.
  const rawTitle = firstReal(row.meta_title, row.title) ?? SITE_NAME
  // meta_desc -> excerpt -> omitted. BlogPostPage uses '' here; an empty
  // description meta is worse than none, so it is dropped instead.
  const description = firstReal(row.meta_desc, row.excerpt)
  const canonical = firstReal(row.canonical_url) ?? `${base}${path}`
  const image = firstReal(row.featured_image)

  const title = brandedTitle(rawTitle)
  const published = firstReal(row.published_at, row.created_at)
  const modified = firstReal(row.updated_at, row.published_at, row.created_at)

  return {
    title,
    description,
    canonical,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    ogType: 'article',
    image,
    imageAlt: firstReal(row.image_alt, rawTitle),
    jsonLd: blogJsonLd({ title: rawTitle, description, canonical, image, published, modified }),
  }
}

/**
 * BlogPosting rather than the Article that src/lib/seo/schema.ts emits.
 * BlogPosting is a subtype of Article and is the more specific correct type for
 * a blog post. The two differ only in @type, and the mismatch is documented in
 * workers/seo-head/README.md.
 *
 * `author` is the organisation, not a Person: no byline is displayed on these
 * posts and inventing one would be a fabricated fact. Properties with no real
 * value are omitted rather than defaulted — a wrong datePublished is an error
 * Google checks, and a hardcoded one has already been removed from this codebase.
 */
function blogJsonLd({ title, description, canonical, image, published, modified }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    ...(description ? { description } : {}),
    url: canonical,
    mainEntityOfPage: canonical,
    ...(image ? { image } : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified || published ? { dateModified: modified ?? published } : {}),
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  }
}

/**
 * Urgent-requirement metadata. Mirrors UrgentRequirementDetailPage.tsx 154-176.
 *
 * The title ladder is that file's, exactly: seo_title, falling back to title;
 * then if the result overruns 60 characters, prefer a short real title, else the
 * segment before the first " | " when that alone reads as a title.
 */
export function requirementMetadata(row, siteUrl) {
  const base = trimSlash(siteUrl)
  const path = `/urgent-requirements/${row.slug}`

  let metaTitle = firstReal(row.seo_title, row.title) ?? SITE_NAME
  if (metaTitle.length > TITLE_LIMIT) {
    const plainTitle = firstReal(row.title)
    if (plainTitle && plainTitle.length <= TITLE_LIMIT) {
      metaTitle = plainTitle
    } else if (metaTitle.includes(' | ')) {
      const firstPart = metaTitle.split(' | ')[0].trim()
      if (firstPart.length >= 20 && firstPart.length <= TITLE_LIMIT) metaTitle = firstPart
    }
  }

  // meta_description -> summary -> the page's own template. The template is
  // built only from fields that hold real values; it is a deterministic
  // rendering of stored facts, not a generated claim. With no summary and no
  // real country there is nothing honest to say, so the description is omitted.
  const country = firstReal(row.country)
  const plainTitle = firstReal(row.title)
  const templated =
    country && plainTitle
      ? `${plainTitle} — urgent visa/job opening in ${country}. Apply through ${SITE_NAME}, Surat.`
      : undefined
  const rawDesc = firstReal(row.meta_description, row.summary, templated)
  const description = rawDesc ? clampDescription(rawDesc) : undefined

  const image = firstReal(row.detail_image_url, row.image_url)

  return {
    title: brandedTitle(metaTitle),
    description,
    // UrgentRequirementDetailPage always self-canonicalises; there is no
    // canonical_url column on this table.
    canonical: `${base}${path}`,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    ogType: 'website',
    image,
    imageAlt: firstReal(row.title, metaTitle),
    jsonLd: requirementJsonLd(row, { title: metaTitle, description, canonical: `${base}${path}`, image }),
  }
}

/**
 * JobPosting only when the row genuinely carries job-posting facts.
 *
 * UrgentRequirementDetailPage gates JobPosting on real salary and currency for
 * the same reason: Google validates JobPosting, and emitting one with
 * "Admin input required" where the salary should be, or with no hiring
 * organisation, is both a rich-result error and a false statement about a real
 * vacancy. Where the facts are not there this falls back to a WebPage, which
 * claims nothing it cannot support.
 */
function requirementJsonLd(row, { title, description, canonical, image }) {
  const employer = firstReal(row.employer)
  const country = firstReal(row.country)
  const salary = firstReal(row.salary)
  const currency = firstReal(row.currency)
  const datePosted = firstReal(row.created_at)

  const qualifiesAsJobPosting = Boolean(employer && country && datePosted)

  if (!qualifiesAsJobPosting) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      ...(description ? { description } : {}),
      url: canonical,
      ...(image ? { primaryImageOfPage: image } : {}),
      isPartOf: { '@type': 'WebSite', name: SITE_NAME },
    }
  }

  const validThrough = firstReal(row.expires_at)
  const city = firstReal(row.city)
  const employmentType = firstReal(row.contract_type)

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    ...(description ? { description } : {}),
    url: canonical,
    datePosted,
    ...(validThrough ? { validThrough } : {}),
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: { '@type': 'Organization', name: employer },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(city ? { addressLocality: city } : {}),
        addressCountry: country,
      },
    },
    // Only when both the amount and its currency are real. A salary without a
    // currency is meaningless and a currency without an amount is noise.
    ...(salary && currency
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency,
            value: { '@type': 'QuantitativeValue', value: salary },
          },
        }
      : {}),
    ...(image ? { image } : {}),
  }
}

/** The content types this Worker serves, and how each one is read and rendered. */
export const ROUTES = Object.freeze([
  {
    type: 'blog',
    prefix: '/blog/',
    table: 'blog_posts',
    publishedStatuses: ['published'],
    build: blogMetadata,
  },
  {
    type: 'requirements',
    prefix: '/urgent-requirements/',
    table: 'urgent_requirements',
    publishedStatuses: ['active'],
    build: requirementMetadata,
  },
])

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Matches a pathname to a content route and extracts its slug.
 *
 * Returns null for the listing pages themselves (/blog, /urgent-requirements),
 * for nested paths, and for anything that is not a clean slug — all of which
 * must be passed straight through to the origin rather than guessed at. The slug
 * check also keeps a path-traversal attempt out of the PostgREST query.
 */
export function matchRoute(pathname) {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  for (const route of ROUTES) {
    if (!path.startsWith(route.prefix)) continue
    const slug = path.slice(route.prefix.length).toLowerCase()
    if (!slug || slug.includes('/') || !SLUG.test(slug)) return null
    return { route, slug }
  }
  return null
}

/**
 * Renders the metadata as HTML ready for injection.
 *
 * Every element carries data-seo-source="cloudflare" so the client can remove
 * precisely the Worker's tags after React has hoisted its own, leaving exactly
 * one of each. Tags whose value is unknown are not emitted at all — an empty
 * og:description is a worse signal than a missing one.
 *
 * The JSON-LD escapes `<` the same way src/components/seo/JsonLd.tsx does:
 * JSON.stringify does not HTML-escape, so a `</script>` inside a string value
 * would otherwise end the block early.
 */
export function renderHeadTags(meta) {
  const mark = `${SEO_SOURCE_ATTR}="${SEO_SOURCE_VALUE}"`
  const tags = []

  const metaTag = (kind, name, content) =>
    `<meta ${kind}="${name}" content="${escapeAttr(content)}" ${mark}>`

  tags.push(`<link rel="canonical" href="${escapeAttr(meta.canonical)}" ${mark}>`)
  if (meta.description) tags.push(metaTag('name', 'description', meta.description))
  tags.push(metaTag('name', 'robots', meta.robots))

  tags.push(metaTag('property', 'og:type', meta.ogType))
  tags.push(metaTag('property', 'og:url', meta.canonical))
  tags.push(metaTag('property', 'og:title', meta.title))
  if (meta.description) tags.push(metaTag('property', 'og:description', meta.description))
  if (meta.image) {
    tags.push(metaTag('property', 'og:image', meta.image))
    if (meta.imageAlt) tags.push(metaTag('property', 'og:image:alt', meta.imageAlt))
  }
  tags.push(metaTag('property', 'og:locale', 'en_IN'))
  tags.push(metaTag('property', 'og:site_name', SITE_NAME))

  // summary_large_image only describes a card that has an image.
  tags.push(metaTag('name', 'twitter:card', meta.image ? 'summary_large_image' : 'summary'))
  tags.push(metaTag('name', 'twitter:title', meta.title))
  if (meta.description) tags.push(metaTag('name', 'twitter:description', meta.description))
  if (meta.image) {
    tags.push(metaTag('name', 'twitter:image', meta.image))
    if (meta.imageAlt) tags.push(metaTag('name', 'twitter:image:alt', meta.imageAlt))
  }

  if (meta.jsonLd) {
    const json = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')
    tags.push(`<script type="application/ld+json" ${mark}>${json}</script>`)
  }

  return tags.join('\n    ')
}

/** The replacement <title>, marked the same way. */
export function renderTitleTag(meta) {
  return `<title ${SEO_SOURCE_ATTR}="${SEO_SOURCE_VALUE}">${escapeText(meta.title)}</title>`
}
