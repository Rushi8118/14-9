import { z } from 'zod'

/** Shared, safe slugify used everywhere a slug is derived from a title. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-+|-+$/g, '')
}

const TITLE_MISSING = 'AI response missing a usable title. Try a more specific prompt.'
const CONTENT_TOO_SHORT = 'AI content is too short. Try again.'
const FRIENDLY_MESSAGES = new Set([TITLE_MISSING, CONTENT_TOO_SHORT])

/** Models often send null, numbers or omit fields; treat all of those as empty text. */
const text = () =>
  z.preprocess((value) => (value == null ? '' : typeof value === 'number' ? String(value) : value), z.string().trim())

/** Unknown counts arrive as 0, null, "" or "25 workers"; keep a real positive number or use the fallback. */
const positiveIntOr = (fallback: number) =>
  z.preprocess((value) => {
    const n = typeof value === 'string' ? Number(value.replace(/[^\d.]/g, '')) : Number(value)
    return Number.isFinite(n) && n >= 1 ? Math.round(n) : fallback
  }, z.number().int().positive())

const stringArray = z.preprocess(
  (value) => (value == null ? [] : Array.isArray(value) ? value : [value]),
  z
    .array(z.unknown())
    .transform((arr) => arr.filter((v) => typeof v === 'string' || typeof v === 'number').map((v) => String(v).trim()).filter(Boolean)),
)

/** Keeps only complete question/answer pairs instead of rejecting the whole response for one bad item. */
const faqList = z.preprocess(
  (value) => (Array.isArray(value) ? value : []),
  z.array(z.unknown()).transform((items) =>
    items.flatMap((item) => {
      const entry = item as { question?: unknown; answer?: unknown } | null
      const question = typeof entry?.question === 'string' ? entry.question.trim() : ''
      const answer = typeof entry?.answer === 'string' ? entry.answer.trim() : ''
      return question && answer ? [{ question, answer }] : []
    }),
  ),
)

/** Loosely-typed schema: AI JSON is coerced/defaulted field-by-field rather
 *  than rejected outright on a single bad field, since a wholesale reject
 *  would throw away an otherwise-usable generation. Required identity
 *  fields (title) still fail hard. */
export const urgentRequirementAiSchema = z.object({
  title: text().pipe(z.string().min(3, TITLE_MISSING)),
  slug: text(),
  employer: text(),
  country: text(),
  country_code: text(),
  city: text(),
  visa_type: text(),
  category: text(),
  vacancies: positiveIntOr(1),
  salary: text(),
  currency: text(),
  experience_required: text(),
  education: text(),
  skills: stringArray,
  benefits: stringArray,
  contract_type: text(),
  working_hours: text(),
  duration_days: positiveIntOr(14),
  eligibility: stringArray,
  required_documents: stringArray,
  summary: text(),
  content: text(),
  application_instructions: text(),
  seo_title: text(),
  meta_description: text(),
  focus_keyword: text(),
  related_keywords: stringArray,
  long_tail_keywords: stringArray,
  tags: stringArray,
  faq: faqList,
  image_alt: text(),
})

export type UrgentRequirementAiOutput = z.infer<typeof urgentRequirementAiSchema>

const CATEGORIES = [
  'general', 'work_visa', 'study_visa', 'country_guide',
  'immigration_news', 'success_story', 'tips', 'document_guide',
] as const

/** "Work Visa" / "work-visa" -> "work_visa"; anything unrecognised becomes "general". */
const blogCategory = z.preprocess((value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s-]+/g, '_') : ''
  return (CATEGORIES as readonly string[]).includes(normalized) ? normalized : 'general'
}, z.enum(CATEGORIES))

export const blogAiSchema = z.object({
  title: text().pipe(z.string().min(3, TITLE_MISSING)),
  slug: text(),
  seo_title: text(),
  meta_title: text(),
  meta_description: text(),
  meta_desc: text(),
  excerpt: text(),
  focus_keyword: text(),
  related_keywords: stringArray,
  long_tail_keywords: stringArray,
  keywords: stringArray,
  search_intent: text(),
  content: text().pipe(z.string().min(150, CONTENT_TOO_SHORT)),
  faq: faqList,
  internal_links: stringArray,
  related_urgent_requirements: stringArray,
  image_alt: text(),
  image_caption: text(),
  category: blogCategory,
  tags: stringArray,
  disclaimer: text(),
})

export type BlogAiOutput = z.infer<typeof blogAiSchema>

/**
 * Validates AI JSON and turns validation failures into a plain message.
 * Raw Zod issue JSON must never reach the admin's screen.
 */
export function parseAiOutput<S extends z.ZodTypeAny>(schema: S, json: unknown): z.infer<S> {
  const result = schema.safeParse(json)
  if (result.success) return result.data
  const friendly = result.error.issues.find((issue) => FRIENDLY_MESSAGES.has(issue.message))
  throw new Error(friendly?.message ?? 'The AI response was incomplete. Please try generating again.')
}

/** Extracts the first JSON object/array from a raw LLM response, tolerating
 *  markdown code fences and leading/trailing prose. */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() || raw.trim()
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1))
      } catch {
        // fall through to the friendly error below
      }
    }
    throw new Error('The AI did not return valid JSON. Try regenerating.')
  }
}
