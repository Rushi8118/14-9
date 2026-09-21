/**
 * Advanced SEO utilities for Country profiles.
 * Provides real-time SEO scoring, smart title/description generator, keyword suggestions,
 * and Schema.org JSON-LD generation.
 */

export type SeoAuditItem = {
  label: string
  status: 'good' | 'warning' | 'poor'
  detail: string
}

export type SeoAnalysis = {
  score: number // 0 to 100
  grade: 'A' | 'B' | 'C' | 'D'
  titleLength: number
  descLength: number
  items: SeoAuditItem[]
  missingItems: string[]
}

export function analyzeCountrySeo(country: {
  name?: string | null
  slug?: string | null
  meta_title?: string | null
  meta_desc?: string | null
  images?: string[] | string | null
  description?: string | null
  has_work_visa?: boolean
  has_study_visa?: boolean
}): SeoAnalysis {
  const title = (country.meta_title || '').trim()
  const desc = (country.meta_desc || '').trim()
  const images = Array.isArray(country.images)
    ? country.images.filter(Boolean)
    : typeof country.images === 'string'
      ? country.images.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      : []
  const overview = (country.description || '').trim()
  const items: SeoAuditItem[] = []
  const missingItems: string[] = []

  let score = 0

  // 1. Meta Title Analysis (35 pts)
  if (title.length >= 40 && title.length <= 65) {
    score += 35
    items.push({ label: 'Meta title length', status: 'good', detail: `${title.length}/60 chars (Optimal length)` })
  } else if (title.length > 0 && title.length < 40) {
    score += 20
    items.push({ label: 'Meta title too short', status: 'warning', detail: `${title.length} chars (Recommend 40–60 chars)` })
  } else if (title.length > 65) {
    score += 20
    items.push({ label: 'Meta title too long', status: 'warning', detail: `${title.length} chars (May get truncated on Google)` })
  } else {
    missingItems.push('Meta title')
    items.push({ label: 'Meta title missing', status: 'poor', detail: 'Google will generate an arbitrary snippet' })
  }

  // 2. Meta Description Analysis (35 pts)
  if (desc.length >= 120 && desc.length <= 165) {
    score += 35
    items.push({ label: 'Meta description length', status: 'good', detail: `${desc.length}/160 chars (Optimal snippet length)` })
  } else if (desc.length > 0 && desc.length < 120) {
    score += 20
    items.push({ label: 'Meta description short', status: 'warning', detail: `${desc.length} chars (Aim for 120–160 chars)` })
  } else if (desc.length > 165) {
    score += 20
    items.push({ label: 'Meta description long', status: 'warning', detail: `${desc.length} chars (May truncate on mobile SERP)` })
  } else {
    missingItems.push('Meta description')
    items.push({ label: 'Meta description missing', status: 'poor', detail: 'Add a compelling description to boost click-through rate' })
  }

  // 3. Social / OpenGraph Media (15 pts)
  if (images.length >= 2) {
    score += 15
    items.push({ label: 'Social & OG Media', status: 'good', detail: `${images.length} high-res images configured` })
  } else if (images.length === 1) {
    score += 10
    items.push({ label: 'Social & OG Media', status: 'warning', detail: '1 image configured (2+ recommended for gallery)' })
  } else {
    missingItems.push('Preview images')
    items.push({ label: 'No preview images', status: 'poor', detail: 'Links shared on WhatsApp/social media will lack a rich card' })
  }

  // 4. Content Richness & Slug (15 pts)
  if (overview.length >= 80) {
    score += 15
    items.push({ label: 'Search landing copy', status: 'good', detail: `${overview.length} chars overview text for indexing` })
  } else if (overview.length > 0) {
    score += 8
    items.push({ label: 'Thin landing copy', status: 'warning', detail: 'Brief overview text (recommend 100+ words)' })
  } else {
    missingItems.push('Country overview')
    items.push({ label: 'Missing overview copy', status: 'poor', detail: 'Search bots rank comprehensive destination pages higher' })
  }

  const grade: SeoAnalysis['grade'] =
    score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D'

  return {
    score,
    grade,
    titleLength: title.length,
    descLength: desc.length,
    items,
    missingItems,
  }
}

export function generateCountrySmartSeo(country: {
  name: string
  slug?: string
  capital?: string
  region?: string
  has_work_visa?: boolean
  has_study_visa?: boolean
  monthly_living_cost?: number | string | null
  success_rate?: number | string | null
}) {
  const name = country.name.trim() || 'Country'
  const capitalPart = country.capital ? ` (${country.capital})` : ''

  // 1. Meta Title (aiming for 50-58 chars)
  let meta_title = ''
  if (country.has_work_visa && country.has_study_visa) {
    meta_title = `${name} Visa Consultants in Surat | Work & Study Permits`
  } else if (country.has_work_visa) {
    meta_title = `${name} Work Visa Consultants in Surat | PR & Permits`
  } else if (country.has_study_visa) {
    meta_title = `Study in ${name} Consultants in Surat | Student Visas`
  } else {
    meta_title = `${name} Visa & Immigration Guide | Siddhivinayak Overseas`
  }

  // Ensure title has brand suffix if length permits
  if (meta_title.length <= 48) {
    meta_title = `${meta_title} - Siddhivinayak`
  }

  // 2. Meta Description (aiming for 135-155 chars)
  const numCost =
    country.monthly_living_cost !== undefined &&
    country.monthly_living_cost !== null &&
    String(country.monthly_living_cost).trim() !== ''
      ? Number(country.monthly_living_cost)
      : NaN
  const livingCost =
    !isNaN(numCost) && numCost > 0
      ? `~₹${numCost.toLocaleString('en-IN')}/mo`
      : 'affordable'

  const numSuccess =
    country.success_rate !== undefined &&
    country.success_rate !== null &&
    String(country.success_rate).trim() !== ''
      ? Number(country.success_rate)
      : NaN
  const success =
    !isNaN(numSuccess) && numSuccess > 0
      ? `${numSuccess}% success rate`
      : 'high visa success'

  let meta_desc = ''
  if (country.has_work_visa && country.has_study_visa) {
    meta_desc = `Apply for ${name}${capitalPart} work & study visas with Siddhivinayak Overseas. Complete guidance on eligibility, living costs (${livingCost}), permits & ${success}.`
  } else if (country.has_work_visa) {
    meta_desc = `Explore ${name} work permit & PR pathways with Siddhivinayak Overseas in Surat. Expert job eligibility assessments, documentation, and ${success}.`
  } else {
    meta_desc = `Plan your higher education in ${name} with Siddhivinayak Overseas. Guidance on university admission, student visas, scholarships, and living costs (${livingCost}).`
  }

  // Trim to 160 chars maximum
  if (meta_desc.length > 160) {
    meta_desc = meta_desc.slice(0, 157) + '...'
  }

  // 3. Target keywords
  const keywords = [
    `${name} visa consultants in surat`,
    `${name} immigration consultants`,
    country.has_work_visa ? `${name} work visa eligibility` : null,
    country.has_study_visa ? `study in ${name} requirements` : null,
    `${name} visa processing time`,
    'siddhivinayak overseas surat',
  ].filter(Boolean) as string[]

  // 4. Schema JSON-LD
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: `${name} Visa & Immigration Guidance`,
    serviceType: 'Immigration & Study Visa Consultancy',
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Siddhivinayak Overseas',
      url: 'https://siddhivinayakoverseas.com',
      telephone: '+91-98795-55555',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Surat',
        addressRegion: 'Gujarat',
        addressCountry: 'IN',
      },
    },
    areaServed: {
      '@type': 'Country',
      name: name,
    },
    url: `https://siddhivinayakoverseas.com/countries/${country.slug || name.toLowerCase().replaceAll(' ', '-')}`,
  }

  return {
    meta_title,
    meta_desc,
    keywords,
    schemaJson: JSON.stringify(schema, null, 2),
  }
}
