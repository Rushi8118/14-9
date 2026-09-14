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

const faqItemSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
})

const stringArray = z
  .array(z.union([z.string(), z.number()]))
  .default([])
  .transform((arr) => arr.map((v) => String(v).trim()).filter(Boolean))

/** Loosely-typed schema: AI JSON is coerced/defaulted field-by-field rather
 *  than rejected outright on a single bad field, since a wholesale reject
 *  would throw away an otherwise-usable generation. Required identity
 *  fields (title) still fail hard. */
export const urgentRequirementAiSchema = z.object({
  title: z.string().trim().min(3, 'AI response missing a usable title.'),
  slug: z.string().trim().optional().default(''),
  employer: z.string().trim().optional().default(''),
  country: z.string().trim().optional().default(''),
  country_code: z.string().trim().optional().default(''),
  city: z.string().trim().optional().default(''),
  visa_type: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  vacancies: z.coerce.number().int().positive().optional().default(1),
  salary: z.string().trim().optional().default(''),
  currency: z.string().trim().optional().default(''),
  experience_required: z.string().trim().optional().default(''),
  education: z.string().trim().optional().default(''),
  skills: stringArray,
  benefits: stringArray,
  contract_type: z.string().trim().optional().default(''),
  working_hours: z.string().trim().optional().default(''),
  duration_days: z.coerce.number().int().positive().optional().default(14),
  eligibility: stringArray,
  required_documents: stringArray,
  summary: z.string().trim().optional().default(''),
  content: z.string().trim().optional().default(''),
  application_instructions: z.string().trim().optional().default(''),
  seo_title: z.string().trim().optional().default(''),
  meta_description: z.string().trim().optional().default(''),
  focus_keyword: z.string().trim().optional().default(''),
  related_keywords: stringArray,
  long_tail_keywords: stringArray,
  tags: stringArray,
  faq: z.array(faqItemSchema).optional().default([]),
  image_alt: z.string().trim().optional().default(''),
})

export type UrgentRequirementAiOutput = z.infer<typeof urgentRequirementAiSchema>

const CATEGORIES = [
  'general', 'work_visa', 'study_visa', 'country_guide',
  'immigration_news', 'success_story', 'tips', 'document_guide',
] as const

export const blogAiSchema = z.object({
  title: z.string().trim().min(3, 'AI response missing a usable title.'),
  slug: z.string().trim().optional().default(''),
  seo_title: z.string().trim().optional().default(''),
  meta_title: z.string().trim().optional().default(''),
  meta_description: z.string().trim().optional().default(''),
  meta_desc: z.string().trim().optional().default(''),
  excerpt: z.string().trim().optional().default(''),
  focus_keyword: z.string().trim().optional().default(''),
  related_keywords: stringArray,
  long_tail_keywords: stringArray,
  keywords: stringArray,
  search_intent: z.string().trim().optional().default(''),
  content: z.string().trim().min(150, 'AI content is too short. Try again.'),
  faq: z.array(faqItemSchema).optional().default([]),
  internal_links: stringArray,
  related_urgent_requirements: stringArray,
  image_alt: z.string().trim().optional().default(''),
  image_caption: z.string().trim().optional().default(''),
  category: z.enum(CATEGORIES).optional().default('general'),
  tags: stringArray,
  disclaimer: z.string().trim().optional().default(''),
})

export type BlogAiOutput = z.infer<typeof blogAiSchema>

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
      return JSON.parse(candidate.slice(start, end + 1))
    }
    throw new Error('The AI did not return valid JSON. Try regenerating.')
  }
}
