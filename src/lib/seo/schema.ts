import { absoluteUrl, DEFAULT_OG_IMAGE, NAP, SITE_NAME, SITE_URL, SOCIAL_SAME_AS } from './site'

export type FaqItem = { question: string; answer: string }
export type BreadcrumbItem = { name: string; path: string }

function organizationId() {
  return `${SITE_URL}/#organization`
}

function localBusinessId() {
  return `${SITE_URL}/#localbusiness`
}

function educationalOrganizationId() {
  return `${SITE_URL}/#educationalorganization`
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(),
    name: SITE_NAME,
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

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const

export const INDIAN_UNION_TERRITORIES = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const

export const SOUTH_ASIAN_COUNTRIES = [
  'India', 'Bangladesh', 'Pakistan', 'Nepal', 'Sri Lanka',
] as const

export const TARGET_DESTINATION_COUNTRIES = [
  'United Kingdom', 'Canada', 'Australia', 'Germany', 'United States',
  'New Zealand', 'Ireland', 'Japan', 'France', 'Poland', 'Portugal',
  'Singapore', 'Italy', 'Spain', 'Austria', 'Switzerland', 'Netherlands',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar',
] as const

export const COMPREHENSIVE_AREA_SERVED = [
  { '@type': 'City', name: 'Surat' },
  { '@type': 'AdministrativeArea', name: 'Gujarat' },
  ...INDIAN_STATES.map((state) => ({ '@type': 'AdministrativeArea', name: state })),
  ...INDIAN_UNION_TERRITORIES.map((ut) => ({ '@type': 'AdministrativeArea', name: ut })),
  ...SOUTH_ASIAN_COUNTRIES.map((country) => ({ '@type': 'Country', name: country })),
]

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['ProfessionalService', 'LocalBusiness'],
    '@id': localBusinessId(),
    name: `${SITE_NAME} — Visa Consultants in Surat & Pan-India`,
    description:
      'Study visa, work visa & post-study transition consultants serving all 28 states & 8 UTs in India, Bangladesh, Pakistan, Nepal & Sri Lanka for UK, Canada, Australia, USA, Germany, Japan & Europe.',
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
    areaServed: COMPREHENSIVE_AREA_SERVED,
    parentOrganization: { '@id': organizationId() },
    sameAs: SOCIAL_SAME_AS,
  }
}

/**
 * The study-visa side of the business. Kept separate from organizationSchema()
 * because a single node cannot honestly be both a generic Organization and an
 * EducationalOrganization; `parentOrganization` ties them together instead.
 */
export function educationalOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': educationalOrganizationId(),
    name: `${SITE_NAME} — Overseas Education Consultants`,
    description:
      'Overseas education consultancy in Surat supporting students across India and South Asia with university admissions, student visa applications and post-study work visa routes. Visa decisions are made by the relevant immigration authority.',
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
    areaServed: COMPREHENSIVE_AREA_SERVED,
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
    url: SITE_URL,
    publisher: { '@id': organizationId() },
    inLanguage: ['en-IN', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/regional-coverage?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
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
  /**
   * A named person who reviewed the page, when one is displayed on the page.
   * Omitted otherwise, in which case the organisation is the author — which is
   * accurate, unlike the alternative of inventing a byline.
   */
  author?: string
}) {
  // No invented publication date. This previously fell back to a hardcoded
  // '2026-08-25' for any page without one, which asserted a specific publication
  // date for content that had none. Omitting the property is honest; a wrong
  // date is a factual error Google can and does check against.
  const published = input.datePublished
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.image || DEFAULT_OG_IMAGE,
    ...(published ? { datePublished: published } : {}),
    ...(input.dateModified || published
      ? { dateModified: input.dateModified ?? published }
      : {}),
    author: input.author
      ? { '@type': 'Person', name: input.author }
      : { '@id': organizationId() },
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
