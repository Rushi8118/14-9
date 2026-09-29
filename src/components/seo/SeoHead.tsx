import { JsonLd } from './JsonLd'
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo/site'

/**
 * The single place any page declares its metadata. No page should emit <title>,
 * <meta> or <link rel="canonical"> on its own — the build-time validator
 * (scripts/validate-seo.mjs) checks the generated HTML for the tags this
 * component produces, and a page that bypasses it silently loses canonical,
 * Open Graph and robots directives.
 *
 * React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree into
 * <head>, so no portal or side-effect library is needed. This replaced
 * react-helmet-async, which is capped at React 18 and emitted nothing at all
 * here: client-side navigation left the previous page's title and canonical in
 * place, so every inner page reached by in-app navigation claimed to be the
 * homepage.
 *
 * `<html lang>` is not set here — it cannot be, since <html> is outside the
 * React root. It lives in index.html.
 */

type SeoHeadProps = {
  title: string
  description: string
  path: string
  /**
   * Overrides the canonical derived from `path`. Only for content that legitimately
   * declares a different canonical — a blog row with its own `canonical_url`. Pass an
   * absolute HTTPS URL; everything else should rely on `path`.
   */
  canonical?: string
  /** Kept so content files can carry keyword notes; deliberately not emitted. */
  keywords?: string
  image?: string
  /** Pixel size of `image`. Defaults to the 1024x1024 site image. */
  imageWidth?: number
  imageHeight?: number
  type?: 'website' | 'article'
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

const BRAND_SUFFIX = ` | ${SITE_NAME}`

/**
 * Google truncates titles past roughly 60 characters. Where the brand suffix is
 * what pushes a title over, drop it — og:site_name still carries the brand — but
 * never truncate mid-phrase, which would cut the page topic in half.
 */
function shortenTitle(fullTitle: string) {
  return fullTitle.length > 65 && fullTitle.endsWith(BRAND_SUFFIX)
    ? fullTitle.slice(0, -BRAND_SUFFIX.length)
    : fullTitle
}

export function SeoHead({
  title,
  description,
  path,
  canonical,
  image = DEFAULT_OG_IMAGE,
  imageWidth,
  imageHeight,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  const url = canonical ?? absoluteUrl(path)
  const fullTitle = title.includes(SITE_NAME) ? title : `${title}${BRAND_SUFFIX}`
  const documentTitle = shortenTitle(fullTitle)

  const isDefaultImage = image === DEFAULT_OG_IMAGE
  const width = imageWidth ?? (isDefaultImage ? 1024 : undefined)
  const height = imageHeight ?? (isDefaultImage ? 1024 : undefined)

  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <>
      <title>{documentTitle}</title>
      <meta name="description" content={description} />
      <meta name="format-detection" content="telephone=yes, date=no, email=yes, address=yes" />
      <link rel="canonical" href={url} />
      <meta
        name="robots"
        content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}
      />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {/* og:title carries the shortened form too, so a social card and a search
          result never disagree about what the page is called. */}
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {width ? <meta property="og:image:width" content={String(width)} /> : null}
      {height ? <meta property="og:image:height" content={String(height)} /> : null}
      <meta property="og:image:alt" content={documentTitle} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={documentTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={documentTitle} />

      {schemas.length ? <JsonLd data={schemas} /> : null}
    </>
  )
}
