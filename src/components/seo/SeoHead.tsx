import { Helmet } from 'react-helmet-async'
import { JsonLd } from './JsonLd'
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo/site'

type SeoHeadProps = {
  title: string
  description: string
  path: string
  keywords?: string
  image?: string
  type?: 'website' | 'article'
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

export function SeoHead({
  title,
  description,
  path,
  keywords,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  const url = absoluteUrl(path)
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  // Google truncates titles past ~60 characters; drop the brand suffix from the
  // <title> tag when it would push the page topic out of view (og:site_name keeps it).
  const brandSuffix = ` | ${SITE_NAME}`
  const documentTitle = fullTitle.length > 65 && fullTitle.endsWith(brandSuffix) ? fullTitle.slice(0, -brandSuffix.length) : fullTitle
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <>
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <Helmet>
      <html lang="en-IN" />
      <title>{documentTitle}</title>
      <meta name="description" content={description} />
      {/* meta keywords is ignored by every search engine and only advertises targets to
          competitors. The prop stays so content files keep their internal keyword notes. */}
      <link rel="canonical" href={url} />
      <meta
        name="robots"
        content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}
      />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {image === DEFAULT_OG_IMAGE ? <meta property="og:image:width" content="1024" /> : null}
      {image === DEFAULT_OG_IMAGE ? <meta property="og:image:height" content="1024" /> : null}
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      </Helmet>
    </>
  )
}
