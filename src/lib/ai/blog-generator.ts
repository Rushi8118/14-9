import { generateAiText, type AiProviderConfig } from './providers'
import { slugify, extractJson, parseAiOutput, blogAiSchema } from './schemas'
import { collectAdminInputRequired, findUnsafeClaims, stripUnsafeClaims } from './guardrails'

export type BlogGenerateMode = 'auto' | 'keywords'

export type BlogCategory =
  | 'general'
  | 'work_visa'
  | 'study_visa'
  | 'country_guide'
  | 'immigration_news'
  | 'success_story'
  | 'tips'
  | 'document_guide'

export type BlogFaqItem = { question: string; answer: string }

export type GeneratedBlogPost = {
  title: string
  slug: string
  excerpt: string
  content: string
  category: BlogCategory
  tags: string[]
  meta_title: string
  meta_desc: string
  keywords: string[]
  canonical_path: string
  focus_keyword: string
  related_keywords: string[]
  long_tail_keywords: string[]
  search_intent: string
  faq: BlogFaqItem[]
  internal_links: string[]
  related_urgent_requirements: string[]
  image_alt: string
  image_caption: string
  reading_time_minutes: number
  disclaimer: string
  /** Field names the AI could not fill confidently — surfaced in the admin
   *  editor rather than silently left blank. */
  adminInputRequired: string[]
  /** Guaranteed-outcome phrases found and neutralized before saving. */
  flaggedClaims: string[]
  ai_generated: boolean
}

export type BlogGenerateInput = {
  mode: BlogGenerateMode
  keywords?: string
  instructions?: string
  websiteContext: string
  preferredCategory?: BlogCategory
  /** Existing published slugs/titles, used to build internal-link
   *  suggestions and steer the AI away from duplicating a topic. */
  existingPosts?: { title: string; slug: string }[]
  /** Live urgent requirement titles/slugs the article can link to when
   *  genuinely relevant, so listings and articles reinforce each other. */
  urgentRequirements?: { title: string; slug: string }[]
}

const CATEGORIES: BlogCategory[] = [
  'general', 'work_visa', 'study_visa', 'country_guide',
  'immigration_news', 'success_story', 'tips', 'document_guide',
]

function estimateReadingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function normalizeGenerated(raw: unknown, input: BlogGenerateInput): GeneratedBlogPost {
  const parsed = parseAiOutput(blogAiSchema, raw)

  const title = parsed.title
  const slug = slugify(parsed.slug || title) || `blog-${Date.now()}`
  const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'general'

  const contentClaims = findUnsafeClaims(parsed.content)
  const content = stripUnsafeClaims(parsed.content)

  const metaTitle = (parsed.meta_title || parsed.seo_title || title).slice(0, 60)
  const metaDesc = (parsed.meta_desc || parsed.meta_description || parsed.excerpt).slice(0, 160)
  const excerpt = (parsed.excerpt || metaDesc).slice(0, 280)

  const keywords = parsed.keywords.length ? parsed.keywords : parsed.related_keywords
  const tags = parsed.tags.length ? parsed.tags : keywords.slice(0, 8)

  const internalLinks = parsed.internal_links.length
    ? parsed.internal_links
    : (input.existingPosts || [])
        .filter((p) => title.toLowerCase().split(' ').some((w) => w.length > 4 && p.title.toLowerCase().includes(w)))
        .slice(0, 4)
        .map((p) => `/blog/${p.slug}`)

  const relatedUrgent = parsed.related_urgent_requirements.length
    ? parsed.related_urgent_requirements
    : (input.urgentRequirements || [])
        .filter((r) => title.toLowerCase().split(' ').some((w) => w.length > 4 && r.title.toLowerCase().includes(w)))
        .slice(0, 3)
        .map((r) => `/urgent-requirements/${r.slug}`)

  const adminInputRequired = collectAdminInputRequired({
    focus_keyword: parsed.focus_keyword,
    meta_description: metaDesc,
    image_alt: parsed.image_alt,
  })

  return {
    title,
    slug,
    excerpt,
    content,
    category,
    tags: tags.slice(0, 12),
    meta_title: metaTitle,
    meta_desc: metaDesc || excerpt.slice(0, 160),
    keywords: keywords.slice(0, 20),
    canonical_path: `/blog/${slug}`,
    focus_keyword: parsed.focus_keyword,
    related_keywords: parsed.related_keywords,
    long_tail_keywords: parsed.long_tail_keywords,
    search_intent: parsed.search_intent,
    faq: parsed.faq,
    internal_links: internalLinks,
    related_urgent_requirements: relatedUrgent,
    image_alt: parsed.image_alt,
    image_caption: parsed.image_caption,
    reading_time_minutes: estimateReadingTime(content),
    disclaimer:
      parsed.disclaimer ||
      'This article is for general information only and is not legal or immigration advice. Rules and processing times vary by case — confirm current requirements with the relevant embassy/immigration authority or a licensed consultant.',
    adminInputRequired,
    flaggedClaims: contentClaims.map((c) => c.match),
    ai_generated: true,
  }
}

function buildSystemPrompt(websiteContext: string): string {
  return `You are an expert SEO content writer for an Indian overseas education and visa consultancy.

Agency context:
${websiteContext}

Write helpful, accurate, cautious visa/study guidance. Never invent guaranteed approvals, processing times, fees, or statistics you cannot verify. Never claim a guaranteed visa, guaranteed job, or 100% approval/success rate. Prefer phrases like "as of 2026", "typically", "varies by case". If you reference search volume or trend popularity for a keyword, label it as an AI suggestion, not real search data — never invent numbers.

Return ONLY valid JSON with this shape (no markdown fences, no commentary):
{
  "title": string,
  "slug": string (kebab-case),
  "seo_title": string (<=60 chars),
  "meta_title": string (<=60 chars),
  "meta_description": string (<=155 chars),
  "excerpt": string (1-2 sentences),
  "focus_keyword": string,
  "related_keywords": string[],
  "long_tail_keywords": string[],
  "keywords": string[],
  "search_intent": one of "informational", "navigational", "transactional", "commercial",
  "content": string (HTML article body),
  "faq": [{"question": string, "answer": string}] (3-6 real reader questions),
  "internal_links": string[] (relative /blog/... or /countries/... paths, only if you are confident they exist — otherwise leave empty),
  "related_urgent_requirements": string[] (relative /urgent-requirements/... paths, only if genuinely relevant — otherwise leave empty),
  "image_alt": string (descriptive alt text for a representative cover image),
  "image_caption": string,
  "category": one of ${CATEGORIES.join(', ')},
  "tags": string[],
  "disclaimer": string (a short visa/immigration disclaimer appropriate to this article)
}

HTML content rules:
- Use semantic tags only: h2, h3, p, ul, ol, li, table, thead, tbody, tr, th, td, strong, em, blockquote
- Do NOT include <html>, <body>, <script>, <style>, <iframe>, or <h1> (the title is separate)
- Structure: introduction, 4-7 H2 sections (with H3 subsections where useful), at least one comparison/checklist TABLE, bullet lists, and end with a conclusion
- Do not repeat the FAQ inside the content body — it is rendered separately
- Add a clear CTA paragraph encouraging a free consultation with Siddhivinayak Overseas in Surat
- Keep tone professional, local to Surat/India readers, and naturally keyword-optimized (never keyword-stuff)
- Aim for 900-1400 words worth of HTML content
- Base every claim on general, well-established knowledge; do not fabricate statistics, dates, or named sources`
}

export async function generateBlogPost(
  config: AiProviderConfig,
  input: BlogGenerateInput,
): Promise<GeneratedBlogPost> {
  const system = buildSystemPrompt(input.websiteContext)
  const existingTitles = (input.existingPosts || []).slice(0, 30).map((p) => p.title).join('; ')
  const userPrompt =
    input.mode === 'auto'
      ? `Mode: FULL AUTO
Research and pick a high-intent SEO topic that fits this consultancy website and has not already been covered.
Preferred category hint: ${input.preferredCategory || 'auto-choose'}.
Extra instructions: ${input.instructions?.trim() || 'None'}
Already-published topics to avoid duplicating: ${existingTitles || 'none yet'}
Choose keywords that Indian students/workers actually search, then write the full SEO blog. Treat any keyword-popularity claim as your own estimate/suggestion, not verified search data.`
      : `Mode: KEYWORD-DRIVEN
Target keywords / topic list (use these naturally throughout — do not stuff):
${input.keywords?.trim() || '(none provided)'}

What the user wants covered:
${input.instructions?.trim() || 'Cover the keywords thoroughly with practical guidance.'}

Preferred category hint: ${input.preferredCategory || 'auto-choose'}
Already-published topics to avoid duplicating: ${existingTitles || 'none yet'}
Write one complete SEO-optimized blog post around these keywords.`

  const raw = await generateAiText(config, [
    { role: 'system', content: system },
    { role: 'user', content: userPrompt },
  ], 'blog')

  const parsed = extractJson(raw)
  return normalizeGenerated(parsed, input)
}

/** Regenerates a single section of an already-generated/edited post (e.g.
 *  just the FAQ, or just the introduction+conclusion) without discarding the
 *  rest of the admin's edits. */
export type RegenerableSection = 'content' | 'faq' | 'meta' | 'keywords'

export async function regenerateBlogSection(
  config: AiProviderConfig,
  section: RegenerableSection,
  current: GeneratedBlogPost,
  websiteContext: string,
): Promise<Partial<GeneratedBlogPost>> {
  const sectionPrompt: Record<RegenerableSection, string> = {
    content: `Rewrite ONLY the article body (HTML) for this post, keeping the same title/keywords/facts. Return JSON: {"content": string}. Follow the same HTML rules as before (semantic tags only, no h1/script/style/iframe, 900-1400 words, include a comparison table, end with a CTA).`,
    faq: `Write 3-6 new FAQ entries for this post that a real reader would ask. Return JSON: {"faq": [{"question": string, "answer": string}]}.`,
    meta: `Rewrite the SEO title, meta description, and excerpt for this post. Return JSON: {"meta_title": string, "meta_description": string, "excerpt": string}.`,
    keywords: `Suggest fresh focus/related/long-tail keywords for this post (label these as AI suggestions, not verified search volume). Return JSON: {"focus_keyword": string, "related_keywords": string[], "long_tail_keywords": string[]}.`,
  }

  const system = `You are an SEO editor for an overseas visa consultancy blog.\nAgency context: ${websiteContext}\nNever invent guaranteed outcomes or fabricated statistics. Return ONLY valid JSON, no markdown fences.`
  const userPrompt = `Current post title: ${current.title}\nCurrent category: ${current.category}\nCurrent focus keyword: ${current.focus_keyword || '(none set)'}\n\n${sectionPrompt[section]}`

  const raw = await generateAiText(config, [
    { role: 'system', content: system },
    { role: 'user', content: userPrompt },
  ], 'blog')

  const parsed = extractJson(raw) as Record<string, unknown>

  if (section === 'content' && typeof parsed.content === 'string') {
    return { content: stripUnsafeClaims(parsed.content) }
  }
  if (section === 'faq' && Array.isArray(parsed.faq)) {
    return { faq: parsed.faq as BlogFaqItem[] }
  }
  if (section === 'meta') {
    return {
      meta_title: typeof parsed.meta_title === 'string' ? parsed.meta_title.slice(0, 60) : current.meta_title,
      meta_desc: typeof parsed.meta_description === 'string' ? parsed.meta_description.slice(0, 160) : current.meta_desc,
      excerpt: typeof parsed.excerpt === 'string' ? parsed.excerpt.slice(0, 280) : current.excerpt,
    }
  }
  if (section === 'keywords') {
    return {
      focus_keyword: typeof parsed.focus_keyword === 'string' ? parsed.focus_keyword : current.focus_keyword,
      related_keywords: Array.isArray(parsed.related_keywords) ? (parsed.related_keywords as string[]) : current.related_keywords,
      long_tail_keywords: Array.isArray(parsed.long_tail_keywords) ? (parsed.long_tail_keywords as string[]) : current.long_tail_keywords,
    }
  }
  return {}
}
