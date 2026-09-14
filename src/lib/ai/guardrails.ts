/**
 * Shared factual/legal guardrails applied to AI-generated blog posts and
 * urgent-requirement listings. Keeps content honest: no invented facts, no
 * guaranteed-outcome claims, and a clear marker for anything the AI could
 * not determine so an admin has to fill it in before publishing.
 */

export const ADMIN_INPUT_REQUIRED = 'Admin input required'

/** Phrases that promise an outcome nobody can actually guarantee. Matched
 *  case-insensitively against generated text before it reaches the admin. */
const UNSAFE_CLAIM_PATTERNS: RegExp[] = [
  /guaranteed?\s+(visa|job|employment|placement|approval|acceptance)/i,
  /100%\s*(visa\s*)?(approval|guarantee|success|placement)/i,
  /(visa|job)\s+guarantee/i,
  /guarantee(d)?\s+to\s+(get|obtain|secure)\s+(a\s+)?(visa|job)/i,
  /no\s+visa\s+rejection/i,
  /assured\s+(visa|job|approval|placement)/i,
  /risk[- ]free\s+(visa|immigration|application)/i,
  /promise[sd]?\s+(a\s+)?(visa|job|approval)/i,
]

export type ClaimIssue = { match: string; index: number }

/** Scans free text for unsupported guaranteed-outcome claims. */
export function findUnsafeClaims(text: string): ClaimIssue[] {
  if (!text) return []
  const issues: ClaimIssue[] = []
  for (const pattern of UNSAFE_CLAIM_PATTERNS) {
    const match = text.match(pattern)
    if (match && typeof match.index === 'number') {
      issues.push({ match: match[0], index: match.index })
    }
  }
  return issues
}

export function containsUnsafeClaims(text: string): boolean {
  return findUnsafeClaims(text).length > 0
}

/** Neutralizes guaranteed-outcome language in place, for defense in depth
 *  even if an admin skips the warning. Never removes factual statements —
 *  only the absolute/guarantee wording. */
export function stripUnsafeClaims(text: string): string {
  if (!text) return text
  let out = text
  for (const pattern of UNSAFE_CLAIM_PATTERNS) {
    out = out.replace(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'), 'subject to standard visa/employment approval')
  }
  return out
}

/** Returns `ADMIN_INPUT_REQUIRED` when a generated value is missing/empty,
 *  otherwise the trimmed value — used so every optional-but-important field
 *  is visibly flagged instead of silently blank. */
export function withAdminFallback(value: unknown): string {
  const str = typeof value === 'string' ? value.trim() : ''
  return str || ADMIN_INPUT_REQUIRED
}

export function isAdminInputRequired(value: string | null | undefined): boolean {
  return !value || value.trim() === '' || value.trim() === ADMIN_INPUT_REQUIRED
}

/** Given a record of field name -> value, returns the names of fields that
 *  are still `ADMIN_INPUT_REQUIRED` (or empty) so the UI/backend can flag
 *  them explicitly rather than silently saving incomplete facts as final. */
export function collectAdminInputRequired(fields: Record<string, string | null | undefined>): string[] {
  return Object.entries(fields)
    .filter(([, value]) => isAdminInputRequired(value))
    .map(([key]) => key)
}
