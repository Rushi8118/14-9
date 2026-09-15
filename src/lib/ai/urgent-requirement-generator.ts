import { generateAiText, getActiveApiKey, type AiProviderConfig } from './providers'
import { slugify, extractJson, parseAiOutput, urgentRequirementAiSchema } from './schemas'
import { ADMIN_INPUT_REQUIRED, collectAdminInputRequired, stripUnsafeClaims, findUnsafeClaims } from './guardrails'

const LOCAL_AI_KEY = 'svo_admin_ai_settings_v1'

function getStoredAiConfig(): AiProviderConfig {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_AI_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        activeProvider: parsed.activeProvider || 'gemini',
        geminiApiKey: parsed.geminiApiKey || '',
        geminiModel: parsed.geminiModel || 'gemini-2.0-flash',
        openrouterApiKey: parsed.openrouterApiKey || '',
        openrouterModel: parsed.openrouterModel || 'google/gemini-2.0-flash-001',
      }
    }
  } catch {}
  return {
    activeProvider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',
    openrouterApiKey: '',
    openrouterModel: 'google/gemini-2.0-flash-001',
  }
}

export type FaqItem = { question: string; answer: string }

export type GeneratedUrgentRequirement = {
  title: string
  slug: string
  employer: string
  country: string
  country_code: string
  city: string
  visa_type: string
  category: string
  vacancies: number
  salary: string
  currency: string
  experience_required: string
  education: string
  skills: string[]
  benefits: string[]
  contract_type: string
  working_hours: string
  duration_days: number
  eligibility: string[]
  required_documents: string[]
  image_url: string
  summary: string
  content: string
  application_instructions: string
  seo_title: string
  meta_description: string
  focus_keyword: string
  related_keywords: string[]
  long_tail_keywords: string[]
  tags: string[]
  faq: FaqItem[]
  image_alt: string
  /** Field names the AI (or the offline template) could not determine —
   *  surfaced in the admin UI so nothing invented slips through unedited. */
  adminInputRequired: string[]
  /** Guaranteed-outcome phrases (e.g. "100% visa approval") that were found
   *  and neutralized in the generated text — shown as a warning banner. */
  flaggedClaims: string[]
}

const FALLBACK_IMAGES: Record<string, string> = {
  healthcare: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
  hospitality: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  construction: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
  it: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  agriculture: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  transport: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
  general: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
}

function getMatchingImage(category: string, title: string): string {
  const text = `${category} ${title}`.toLowerCase()
  if (/health|care|nurse|hospital/.test(text)) return FALLBACK_IMAGES.healthcare
  if (/food|cook|chef|hotel|restaurant/.test(text)) return FALLBACK_IMAGES.hospitality
  if (/construct|weld|carpenter|mason/.test(text)) return FALLBACK_IMAGES.construction
  if (/tech|software|developer|it |engineer/.test(text)) return FALLBACK_IMAGES.it
  if (/driver|truck|logistics/.test(text)) return FALLBACK_IMAGES.transport
  if (/farm|agri/.test(text)) return FALLBACK_IMAGES.agriculture
  return FALLBACK_IMAGES.general
}

function getCountryCode(country: string): string {
  const c = country.toLowerCase()
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('britain')) return 'GB'
  if (c.includes('japan')) return 'JP'
  if (c.includes('canada')) return 'CA'
  if (c.includes('australia')) return 'AU'
  if (c.includes('germany')) return 'DE'
  if (c.includes('usa') || c.includes('united states') || c.includes('america')) return 'US'
  if (c.includes('dubai') || c.includes('uae') || c.includes('emirates')) return 'AE'
  if (c.includes('singapore')) return 'SG'
  if (c.includes('new zealand')) return 'NZ'
  if (c.includes('france')) return 'FR'
  if (c.includes('ireland')) return 'IE'
  return ''
}

/**
 * Offline template used only when no AI key is configured. It deliberately
 * does NOT invent an employer, salary, deadline, or approval odds — every
 * fact-shaped field is explicitly marked so an admin fills it in, per the
 * "never invent employer/salary/deadline/legal facts" requirement.
 */
function generateOfflineTemplate(prompt: string, countryHint: string): GeneratedUrgentRequirement {
  const country = countryHint.trim() || ''
  const countryCode = getCountryCode(country)
  const topic = prompt.trim() || 'Skilled Workers'
  const title = country ? `Urgent Requirement: ${topic} (${country})` : `Urgent Requirement: ${topic}`
  const slug = slugify(title) || `urgent-requirement-${Date.now()}`

  const content = `## Urgent Opportunity Overview
${ADMIN_INPUT_REQUIRED}: describe the employer/mandate, sponsorship type, and why this is urgent.

### Key Highlights & Benefits
- ${ADMIN_INPUT_REQUIRED}: salary/package
- ${ADMIN_INPUT_REQUIRED}: contract length
- ${ADMIN_INPUT_REQUIRED}: accommodation/relocation support

### Eligibility Criteria
- ${ADMIN_INPUT_REQUIRED}: experience
- ${ADMIN_INPUT_REQUIRED}: education
- ${ADMIN_INPUT_REQUIRED}: language/certification

### Application & Visa Process
${ADMIN_INPUT_REQUIRED}: outline the real steps and processing times for this opening — do not copy timelines from other listings without verifying them.

### How to Apply
${ADMIN_INPUT_REQUIRED}: application instructions.`

  return {
    title,
    slug,
    employer: '',
    country,
    country_code: countryCode,
    city: '',
    visa_type: '',
    category: topic,
    vacancies: 1,
    salary: '',
    currency: '',
    experience_required: '',
    education: '',
    skills: [],
    benefits: [],
    contract_type: '',
    working_hours: '',
    duration_days: 14,
    eligibility: [],
    required_documents: [],
    image_url: getMatchingImage(topic, title),
    summary: `${topic}${country ? ` in ${country}` : ''} — details pending admin review before this goes live.`,
    content,
    application_instructions: '',
    seo_title: title.slice(0, 60),
    meta_description: `${topic}${country ? ` in ${country}` : ''}. Contact Siddhivinayak Overseas for eligibility and application details.`.slice(0, 155),
    focus_keyword: '',
    related_keywords: [],
    long_tail_keywords: [],
    tags: country ? [country, topic] : [topic],
    faq: [],
    image_alt: `${title} — illustrative image`,
    adminInputRequired: [
      'employer', 'salary', 'experience_required', 'education', 'eligibility',
      'required_documents', 'application_instructions', 'focus_keyword',
    ],
    flaggedClaims: [],
  }
}

const SYSTEM_PROMPT = `You are a careful, compliance-conscious overseas recruitment and visa content writer for Siddhivinayak Overseas (Surat, Gujarat, India).

Generate a complete, SEO-optimized, and FACTUAL urgent job/visa requirement listing in strict JSON. You do not have access to any real, verified employer, live vacancy, or guaranteed visa outcome — so for anything you cannot know for certain (employer name, exact salary, application deadline), leave the field as an empty string "" rather than inventing a plausible-sounding fact. Never claim a guaranteed visa, guaranteed job, or 100% approval — always describe processes as subject to standard eligibility, document, and employer review.

Return ONLY this JSON shape (all fields required, use "" / [] / 0 for anything unknown — never fabricate):
{
  "title": string,
  "slug": string (kebab-case),
  "employer": string,
  "country": string,
  "country_code": string (2-letter ISO),
  "city": string,
  "visa_type": string,
  "category": string (industry / job category),
  "vacancies": number,
  "salary": string,
  "currency": string (e.g. GBP, USD, JPY),
  "experience_required": string,
  "education": string,
  "skills": string[],
  "benefits": string[],
  "contract_type": string (e.g. Full-time, Fixed-term),
  "working_hours": string,
  "duration_days": number (how many days this listing should stay visible, default 14),
  "eligibility": string[] (bullet-point eligibility rules),
  "required_documents": string[],
  "summary": string (2-3 sentences),
  "content": string (markdown article: ## Overview, ### Key Highlights & Benefits, ### Eligibility Criteria, ### Application & Visa Process, ### How to Apply),
  "application_instructions": string,
  "seo_title": string (<=60 chars),
  "meta_description": string (<=155 chars),
  "focus_keyword": string,
  "related_keywords": string[],
  "long_tail_keywords": string[],
  "tags": string[],
  "faq": [{"question": string, "answer": string}] (3-5 realistic candidate questions),
  "image_alt": string (descriptive alt text for the listing image)
}

Respond ONLY with valid JSON, no markdown fences, no commentary.`

export async function generateUrgentRequirementWithAi(
  prompt: string,
  countryHint: string = '',
  config?: AiProviderConfig,
): Promise<GeneratedUrgentRequirement> {
  const activeConfig = config || getStoredAiConfig()

  const userPrompt = `Topic / Prompt: ${prompt}
Target Country: ${countryHint || '(not specified — infer from the prompt, or leave blank)'}
Agency: Siddhivinayak Overseas (Pragti IT Park, Surat, Gujarat, India)`

  const raw = await generateAiText(
    activeConfig,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    'urgent_requirement',
  )

  const parsedJson = extractJson(raw)
  const parsed = parseAiOutput(urgentRequirementAiSchema, parsedJson)

  const title = parsed.title
  const country = parsed.country || countryHint || ''
  const countryCode = (parsed.country_code || getCountryCode(country)).toUpperCase().slice(0, 2)
  const category = parsed.category || 'Work Visa'
  const slug = slugify(parsed.slug || title) || `urgent-requirement-${Date.now()}`

  const contentClaims = findUnsafeClaims(parsed.content)
  const summaryClaims = findUnsafeClaims(parsed.summary)
  const instructionClaims = findUnsafeClaims(parsed.application_instructions)
  const flaggedClaims = [...contentClaims, ...summaryClaims, ...instructionClaims].map((c) => c.match)

  const content = stripUnsafeClaims(parsed.content)
  const summary = stripUnsafeClaims(parsed.summary) || `${category} opportunity${country ? ` in ${country}` : ''}. Full details pending admin review.`
  const application_instructions = stripUnsafeClaims(parsed.application_instructions)

  const adminInputRequired = collectAdminInputRequired({
    employer: parsed.employer,
    salary: parsed.salary,
    experience_required: parsed.experience_required,
    eligibility: parsed.eligibility.length ? 'set' : '',
    application_instructions,
    focus_keyword: parsed.focus_keyword,
  })

  return {
    title,
    slug,
    employer: parsed.employer,
    country,
    country_code: countryCode,
    city: parsed.city,
    visa_type: parsed.visa_type,
    category,
    vacancies: parsed.vacancies,
    salary: parsed.salary,
    currency: parsed.currency,
    experience_required: parsed.experience_required,
    education: parsed.education,
    skills: parsed.skills,
    benefits: parsed.benefits,
    contract_type: parsed.contract_type,
    working_hours: parsed.working_hours,
    duration_days: parsed.duration_days,
    eligibility: parsed.eligibility,
    required_documents: parsed.required_documents,
    image_url: getMatchingImage(category, title),
    summary,
    content,
    application_instructions,
    seo_title: (parsed.seo_title || title).slice(0, 60),
    meta_description: (parsed.meta_description || summary).slice(0, 155),
    focus_keyword: parsed.focus_keyword,
    related_keywords: parsed.related_keywords,
    long_tail_keywords: parsed.long_tail_keywords,
    tags: parsed.tags.length ? parsed.tags : [category, country].filter(Boolean),
    faq: parsed.faq,
    image_alt: parsed.image_alt || `${title} — illustrative image`,
    adminInputRequired,
    flaggedClaims,
  }
}

/** Entry point used by the admin UI: tries AI when a key is configured,
 *  otherwise returns the honest offline template (never a fabricated ad). */
export async function synthesizeUrgentRequirement(
  prompt: string,
  countryHint: string = '',
  config?: AiProviderConfig,
): Promise<GeneratedUrgentRequirement> {
  const activeConfig = config || getStoredAiConfig()
  if (!getActiveApiKey(activeConfig)) {
    return generateOfflineTemplate(prompt, countryHint)
  }
  return generateUrgentRequirementWithAi(prompt, countryHint, config)
}
