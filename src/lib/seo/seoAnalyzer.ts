/**
 * Reusable, framework-free SEO/content-quality analyzer shared by the Blog
 * Writer and Urgent Requirement editors. Everything here is heuristic and
 * clearly labeled as such — it never claims to predict rankings, traffic,
 * or AI-assistant recommendations, only checks structural/on-page basics.
 */

export type SeoAnalysisInput = {
  title: string
  metaTitle?: string
  metaDescription?: string
  slug: string
  focusKeyword?: string
  /** Article body — HTML or markdown/plain text both work. */
  content: string
  faqCount?: number
  imageAlt?: string
  /** Other titles/slugs already in the system, for duplicate detection. */
  existingSlugs?: string[]
  existingTitles?: string[]
  /** Slug of the item being edited, so it doesn't flag itself as a dup. */
  currentSlug?: string
  /** Title as last saved, so an unchanged title isn't reported as its own duplicate. */
  currentTitle?: string
}

export type SeoIssue = {
  id: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

export type ChecklistItem = { id: string; label: string; passed: boolean }

export type SeoAnalysisResult = {
  score: number
  readability: { score: number; label: string }
  issues: SeoIssue[]
  checklist: ChecklistItem[]
  keywordPlacement: {
    inTitle: boolean
    inMetaDescription: boolean
    inFirstParagraph: boolean
    inHeading: boolean
    densityPercent: number
  }
  headingStructure: { h2Count: number; h3Count: number }
  wordCount: number
  isThinContent: boolean
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Plain text from HTML or markdown (urgent requirements are markdown, blog posts are HTML). */
function toPlainText(content: string): string {
  return stripHtml(content)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(^|\s)#{1,6}\s+/g, ' ')
    .replace(/[*_`>~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function countSentences(text: string): number {
  const matches = text.match(/[^.!?]+[.!?]+/g)
  return matches?.length || (text.trim() ? 1 : 0)
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  const groups = w.match(/[aeiouy]+/g)
  let count = groups ? groups.length : 1
  if (w.endsWith('e') && count > 1) count -= 1
  return Math.max(1, count)
}

/** Simplified Flesch Reading Ease (0-100, higher = easier to read). */
function fleschReadingEase(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length || 1
  const sentenceCount = countSentences(text) || 1
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0)
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function readabilityLabel(score: number): string {
  if (score >= 80) return 'Very easy to read'
  if (score >= 60) return 'Easy to read'
  if (score >= 50) return 'Fairly readable'
  if (score >= 30) return 'Difficult — consider shorter sentences'
  return 'Very difficult — simplify wording'
}

export function analyzeSeoContent(input: SeoAnalysisInput): SeoAnalysisResult {
  const content = input.content || ''
  const plainText = toPlainText(content)
  const wordCount = countWords(plainText)
  const keyword = (input.focusKeyword || '').trim().toLowerCase()

  // Count both HTML (<h2>) and markdown (## ) headings.
  const h2Count = (content.match(/<h2[\s>]/gi) || []).length + (content.match(/^[ \t]{0,3}##[ \t]+\S/gm) || []).length
  const h3Count = (content.match(/<h3[\s>]/gi) || []).length + (content.match(/^[ \t]{0,3}###[ \t]+\S/gm) || []).length
  const headingTexts = [
    ...Array.from(content.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)).map((m) => stripHtml(m[1])),
    ...Array.from(content.matchAll(/^[ \t]{0,3}#{2,3}[ \t]+(.+)$/gm)).map((m) => m[1]),
  ].map((h) => h.toLowerCase())

  const firstParagraphMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const firstMarkdownParagraph = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^#{1,6}\s/.test(block))
  const firstParagraph = firstParagraphMatch
    ? stripHtml(firstParagraphMatch[1])
    : toPlainText(firstMarkdownParagraph || plainText.slice(0, 300))

  const seoTitle = (input.metaTitle || input.title || '').trim()
  const inTitle = keyword ? (input.title + ' ' + (input.metaTitle || '')).toLowerCase().includes(keyword) : false
  const inMetaDescription = keyword ? (input.metaDescription || '').toLowerCase().includes(keyword) : false
  const inFirstParagraph = keyword ? firstParagraph.toLowerCase().includes(keyword) : false
  const inHeading = keyword ? headingTexts.some((h) => h.includes(keyword)) : false
  const keywordOccurrences = keyword
    ? (plainText.toLowerCase().match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    : 0
  const densityPercent = wordCount > 0 ? Math.round((keywordOccurrences / wordCount) * 1000) / 10 : 0

  const readabilityScore = fleschReadingEase(plainText)
  const isThinContent = wordCount < 300

  const slug = (input.slug || '').trim().toLowerCase()
  const duplicateSlug = Boolean(
    slug && input.existingSlugs?.some((s) => s.toLowerCase() === slug && s.toLowerCase() !== (input.currentSlug || '').toLowerCase()),
  )
  const normalizedTitle = input.title.trim().toLowerCase()
  const titleMatches = input.existingTitles?.filter((t) => t.trim().toLowerCase() === normalizedTitle).length ?? 0
  // When editing, the saved copy of this same item is already in the list once.
  const ownTitleCount = input.currentTitle && input.currentTitle.trim().toLowerCase() === normalizedTitle ? 1 : 0
  const duplicateTitle = Boolean(normalizedTitle) && titleMatches > ownTitleCount
  const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length > 0 && slug.length <= 90

  const metaLen = (input.metaDescription || '').trim().length
  const checklist: ChecklistItem[] = [
    { id: 'title', label: 'Title is set', passed: Boolean(input.title?.trim()) },
    { id: 'title-length', label: 'SEO title 30-60 characters', passed: seoTitle.length >= 30 && seoTitle.length <= 60 },
    { id: 'meta', label: 'Meta description set (120-160 chars)', passed: metaLen >= 120 && metaLen <= 160 },
    { id: 'slug-safe', label: 'Slug is URL-safe', passed: safeSlug },
    { id: 'slug-unique', label: 'Slug is unique', passed: !duplicateSlug },
    { id: 'title-unique', label: 'Title is not a duplicate', passed: !duplicateTitle },
    { id: 'keyword', label: 'Focus keyword is set', passed: Boolean(keyword) },
    { id: 'keyword-title', label: 'Focus keyword appears in title', passed: Boolean(keyword) && inTitle },
    { id: 'keyword-meta', label: 'Focus keyword appears in meta description', passed: Boolean(keyword) && inMetaDescription },
    { id: 'keyword-intro', label: 'Focus keyword appears in the introduction', passed: Boolean(keyword) && inFirstParagraph },
    { id: 'keyword-heading', label: 'Focus keyword appears in a heading', passed: Boolean(keyword) && inHeading },
    { id: 'headings', label: 'Has at least 2 headings (H2/H3)', passed: h2Count + h3Count >= 2 },
    { id: 'length', label: 'Content is at least 300 words', passed: !isThinContent },
    { id: 'image-alt', label: 'Image alt text is set', passed: Boolean(input.imageAlt?.trim()) },
    { id: 'faq', label: 'Has at least one FAQ entry', passed: (input.faqCount || 0) > 0 },
    { id: 'density', label: 'Keyword density 0.5-3%', passed: Boolean(keyword) && densityPercent >= 0.5 && densityPercent <= 3 },
    { id: 'readability', label: 'Readable (score 40+)', passed: readabilityScore >= 40 },
  ]

  const issues: SeoIssue[] = []
  if (!input.title?.trim()) issues.push({ id: 'title', severity: 'error', message: 'Title is missing.' })
  if (metaLen === 0) issues.push({ id: 'meta', severity: 'error', message: 'Meta description is missing — search engines will auto-generate one.' })
  else if (metaLen < 120 || metaLen > 160) issues.push({ id: 'meta-length', severity: 'warning', message: `Meta description is ${metaLen} characters; aim for 120-160.` })
  if (seoTitle && (seoTitle.length < 30 || seoTitle.length > 60)) issues.push({ id: 'title-length', severity: 'warning', message: `SEO title is ${seoTitle.length} characters; aim for 30-60 so Google doesn't cut it off.` })
  if (!safeSlug) issues.push({ id: 'slug', severity: 'error', message: 'Slug should be lowercase letters, numbers, and hyphens only.' })
  if (duplicateSlug) issues.push({ id: 'slug-dup', severity: 'error', message: 'This slug is already used by another item.' })
  if (duplicateTitle) issues.push({ id: 'title-dup', severity: 'warning', message: 'Another item already has this exact title.' })
  if (!keyword) issues.push({ id: 'no-keyword', severity: 'warning', message: 'No focus keyword set — add one so placement can be checked.' })
  else {
    if (!inTitle) issues.push({ id: 'keyword-title', severity: 'warning', message: 'Focus keyword does not appear in the title.' })
    if (!inHeading) issues.push({ id: 'keyword-heading', severity: 'info', message: 'Focus keyword does not appear in any heading.' })
    if (!inMetaDescription) issues.push({ id: 'keyword-meta', severity: 'warning', message: 'Focus keyword does not appear in the meta description.' })
    if (densityPercent < 0.5) issues.push({ id: 'keyword-low', severity: 'info', message: `Focus keyword is used rarely (${densityPercent}%). Mention it naturally a few more times.` })
    if (!inFirstParagraph) issues.push({ id: 'keyword-intro', severity: 'info', message: 'Focus keyword does not appear in the introduction.' })
    if (densityPercent > 3) issues.push({ id: 'stuffing', severity: 'warning', message: `Keyword density is ${densityPercent}% — this reads as keyword stuffing. Aim under 3%.` })
  }
  if (h2Count + h3Count === 0) issues.push({ id: 'headings', severity: 'warning', message: 'No H2/H3 headings found — add structure for readers and search engines.' })
  if (isThinContent) issues.push({ id: 'thin', severity: 'warning', message: `Only ${wordCount} words — thin content is less useful to readers and search engines. Aim for 300+.` })
  if (!input.imageAlt?.trim()) issues.push({ id: 'alt', severity: 'warning', message: 'Image alt text is missing — add descriptive alt text for accessibility and image search.' })
  if ((input.faqCount || 0) === 0) issues.push({ id: 'faq', severity: 'info', message: 'No FAQ entries — an FAQ section helps both readers and FAQPage rich results.' })
  if (readabilityScore < 40) issues.push({ id: 'readability', severity: 'warning', message: 'Readability is low — use shorter sentences and simpler words.' })

  const passedCount = checklist.filter((c) => c.passed).length
  const score = Math.round((passedCount / checklist.length) * 100)

  return {
    score,
    readability: { score: readabilityScore, label: readabilityLabel(readabilityScore) },
    issues: issues.sort((a, b) => {
      const rank = { error: 0, warning: 1, info: 2 }
      return rank[a.severity] - rank[b.severity]
    }),
    checklist,
    keywordPlacement: { inTitle, inMetaDescription, inFirstParagraph, inHeading, densityPercent },
    headingStructure: { h2Count, h3Count },
    wordCount,
    isThinContent,
  }
}
