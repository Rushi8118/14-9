import { absoluteUrl, DEFAULT_OG_IMAGE, NAP, SITE_NAME, SITE_URL, SOCIAL_SAME_AS } from './site'

export type FaqItem = { question: string; answer: string }
export type BreadcrumbItem = { name: string; path: string }

function organizationId() {
  return `${SITE_URL}/#organization`
}

function localBusinessId() {
  return `${SITE_URL}/#localbusiness`
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(),
    name: SITE_NAME,
    // Spacing and spelling variants people actually type. These belong here, not in
    // visible copy, which is where putting them would read as keyword stuffing.
    alternateName: [
      'Siddhi Vinayak Overseas',
      'Shree Siddhivinayak Overseas',
      'Sidhivinayak Overseas',
      'Siddhivinayak Overseas Surat',
    ],
    url: SITE_URL,
    logo: `${SITE_URL}/favicon/android-chrome-512x512.png`,
    image: DEFAULT_OG_IMAGE,
    email: NAP.email,
    telephone: NAP.phoneINDisplay,
    address: {
      '@type': 'PostalAddress',
      streetAddress: NAP.streetAddress,
      addressLocality: NAP.addressLocality,
      addressRegion: NAP.addressRegion,
      postalCode: NAP.postalCode,
      addressCountry: NAP.addressCountry,
    },
    sameAs: SOCIAL_SAME_AS,
  }
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['ProfessionalService', 'LocalBusiness'],
    '@id': localBusinessId(),
    name: `${SITE_NAME} — Visa Consultants in Surat`,
    description:
      'Study visa and work visa consultants in Surat, Gujarat for Canada, UK, Australia, USA, Germany, Japan and more.',
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    telephone: NAP.phoneIN,
    email: NAP.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: NAP.streetAddress,
      addressLocality: NAP.addressLocality,
      addressRegion: NAP.addressRegion,
      postalCode: NAP.postalCode,
      addressCountry: NAP.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: NAP.geo.latitude,
      longitude: NAP.geo.longitude,
    },
    areaServed: [
      { '@type': 'City', name: 'Surat' },
      { '@type': 'AdministrativeArea', name: 'Gujarat' },
      { '@type': 'Country', name: 'India' },
    ],
    parentOrganization: { '@id': organizationId() },
    sameAs: SOCIAL_SAME_AS,
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: 'Siddhi Vinayak Overseas',
    url: SITE_URL,
    publisher: { '@id': organizationId() },
    inLanguage: 'en-IN',
  }
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function serviceSchema(input: {
  name: string
  description: string
  path: string
  serviceType: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    serviceType: input.serviceType,
    provider: { '@id': localBusinessId() },
    areaServed: {
      '@type': 'City',
      name: 'Surat',
    },
  }
}

export function articleSchema(input: {
  title: string
  description: string
  path: string
  datePublished?: string
  dateModified?: string
  image?: string
}) {
  const published = input.datePublished ?? '2026-08-25'
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.image || DEFAULT_OG_IMAGE,
    datePublished: published,
    dateModified: input.dateModified ?? published,
    author: { '@id': organizationId() },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon/android-chrome-512x512.png`,
      },
    },
    mainEntityOfPage: absoluteUrl(input.path),
  }
}

/**
 * JobPosting structured data — the caller is responsible for only invoking
 * this when the underlying fields are real (not "Admin input required"
 * placeholders), since JobPosting rich results are validated against the
 * live page content by search engines.
 */
export function jobPostingSchema(input: {
  title: string
  description: string
  path: string
  datePosted: string
  validThrough?: string | null
  employmentType?: string
  hiringOrganizationName?: string
  countryName: string
  city?: string
  salary?: { currency: string; value: string }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: input.title,
    description: input.description,
    identifier: {
      '@type': 'PropertyValue',
      name: input.hiringOrganizationName || SITE_NAME,
      value: absoluteUrl(input.path),
    },
    datePosted: input.datePosted,
    ...(input.validThrough ? { validThrough: input.validThrough } : {}),
    employmentType: input.employmentType || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: input.hiringOrganizationName || SITE_NAME,
      sameAs: SITE_URL,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: input.city || input.countryName,
        addressCountry: input.countryName,
      },
    },
    ...(input.salary
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: input.salary.currency,
            value: { '@type': 'QuantitativeValue', value: input.salary.value, unitText: 'YEAR' },
          },
        }
      : {}),
    directApply: false,
  }
}

export function webpageSchema(input: {
  title: string
  description: string
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': localBusinessId() },
  }
}
