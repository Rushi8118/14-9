import DOMPurify from 'dompurify'

/**
 * Allow-listed tags for AI/admin-authored article and job-listing bodies.
 * Deliberately excludes script/style/iframe/object/embed/form and any
 * event-handler or javascript:/data: URLs — DOMPurify strips those by
 * default, but we also constrain the tag/attribute surface explicitly.
 */
const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'strong', 'em', 'b', 'i', 'u', 'blockquote', 'a', 'br', 'hr', 'span', 'div', 'sup', 'sub',
]

const ALLOWED_ATTR = ['href', 'title', 'class', 'id', 'target', 'rel']

/** Sanitizes rich-text HTML produced by an AI provider or entered by an
 *  admin before it is saved or rendered, preventing stored/reflected XSS. */
export function sanitizeRichText(html: string): string {
  if (!html) return ''
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  })
  return clean
}

/** Validates that a URL is safe to use in `href`/`src` (http/https only, or
 *  a same-site relative path) — used for admin-entered image/link URLs. */
export function isSafeUrl(url: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (trimmed.startsWith('/')) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] as const
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return 'Please select a JPG, PNG, WEBP, GIF, or AVIF image.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be smaller than 20 MB.'
  }
  return null
}
