/**
 * YMYL compliance and content-quality checks for the admin editors.
 *
 * `seoAnalyzer.ts` covers on-page mechanics: title length, keyword placement,
 * density, headings, readability. All useful, none of it about whether the
 * content is safe to publish.
 *
 * This file covers the part that carries actual risk on an immigration site: a
 * promised outcome, a fee with no source, a missing disclaimer, an unreplaced
 * placeholder. A build-time auditor (`scripts/check-content-quality.mjs`) finds
 * these too, but only after the fact, and never for a blog post or urgent
 * requirement, because those live in Supabase and never pass through a build.
 * The editor is the only place a warning reaches the person writing.
 *
 * Deliberately narrow: every check below is mechanically decidable. Whether a
 * paragraph is persuasive is not in here. Whether it promises a visa is.
 *
 * Nothing here encodes a visa rule, fee or processing time. It flags a figure as
 * needing a source; it does not know the right number.
 */
import { findUnsafeClaims, ADMIN_INPUT_REQUIRED } from '@/lib/ai/guardrails'
import type { SeoIssue } from './seoAnalyzer'

export type ComplianceInput = {
  title: string
  metaDescription?: string
  content: string
  disclaimer?: string
  faq?: Array<{ question?: string; answer?: string }>
}

/** Strips tags so checks run on what a reader sees, not on markup. */
function plain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Words that turn a guarantee phrase into a warning or a denial. The site's own
 * honest copy discusses guarantees constantly and correctly ("No fake job
 * guarantees", "Can you guarantee a job? No."), and flagging that would train
 * the writer to dismiss the panel.
 */
const NEGATED =
  /\bno\b|\bnot\b|\bnever\b|\bnobody\b|\bcannot\b|can't|\bavoid\b|\bbeware\b|\bwarning\b|\bcareful\b|\bscam\b|\bfake\b|\bfraud|\bpromising\b|\bmyth\b|\bred flag\b|\bsubject to\b|\bdepends on\b|\bethical\b|\bhonest\b|does not|doesn't/i

/**
 * Figures that are claims about the world. Each needs a source, because each is
 * something an applicant may spend money or make a decision on.
 */
const FIGURES: Array<{ re: RegExp; what: string }> = [
  {
    re: /(?:₹|\bRs\.?|\bINR\b|\$|\bUSD\b|€|\bEUR\b|£|\bGBP\b|\bCAD\b|\bAUD\b|\bNZD\b|\bAED\b|\bJPY\b)\s?\d[\d,]*(?:\.\d+)?/gi,
    what: 'a fee or amount',
  },
  { re: /\b\d{1,3}(?:\.\d+)?\s?%/g, what: 'a percentage' },
  {
    re: /\b\d+\s?(?:-\s?\d+\s?)?(?:working\s+)?(?:day|days|week|weeks|month|months|year|years)\b/gi,
    what: 'a processing time',
  },
  { re: /\b(?:IELTS|PTE|TOEFL|CRS|CLB|band)\s*(?:score\s*)?(?:of\s*)?\d+(?:\.\d)?\b/gi, what: 'a score requirement' },
  { re: /\bage(?:d)?\s*(?:limit\s*)?(?:of\s*|under\s*|below\s*|up to\s*)?\d{2}\b/gi, what: 'an age limit' },
]

/** A figure is considered sourced if the text points at an official source. */
const SOURCED =
  /\[VERIFY|official (?:source|site|page|website)|gov\.uk|canada\.ca|homeaffairs|uscis|\bircc\b|immi\.|as of \d{4}|according to/i

const DISCLAIMER_SIGNALS = [
  /rules?\s+(?:can|may)\s+change/i,
  /subject to change/i,
  /(?:final )?decision (?:rests|lies) with/i,
  /decided by the (?:embassy|authority|immigration)/i,
  /we (?:do not|don'?t) guarantee/i,
  /outcomes? (?:may )?vary/i,
  /not (?:legal|immigration) advice/i,
  /confirm (?:with|on) the official/i,
]

const FALSE_URGENCY = [
  /\bhurry\b/i,
  /\blast (?:chance|few) (?:seats|slots|spots)\b/i,
  /\bonly \d+ (?:seats|slots) left\b/i,
  /\bapply (?:now )?before it'?s too late\b/i,
  /\blimited time only\b/i,
  /\bact (?:now|fast)\b/i,
]

const AI_TELLS = [
  /\bin today'?s (?:fast[- ]paced |competitive |globalized )?world\b/i,
  /\bit'?s (?:important|worth) (?:to note|noting) that\b/i,
  /\bunlock (?:your|the) (?:potential|future|opportunit)/i,
  /\bembark on (?:a|your) journey\b/i,
  /\bnavigate the (?:complex|complexities|intricacies)\b/i,
  /\bdelve into\b/i,
  /\bin conclusion,/i,
  /\bgame[- ]chang(?:er|ing)\b/i,
]

/** Acronyms a first-time applicant will not know. */
const JARGON = ['LMIA', 'PGWP', 'SDS', 'GTE', 'CoE', 'CAS', 'CRS', 'EOI', 'ANZSCO', 'NOC',
  'Chancenkarte', 'AEWV', 'SSW', 'DoFE', 'eMigrate']

const SOUTH_ASIA = ['india', 'nepal', 'bangladesh', 'pakistan', 'sri lanka']

/**
 * Returns the compliance issues for a draft, in the same shape seoAnalyzer uses
 * so the existing panel renders them with no changes.
 *
 * `error` is reserved for things that should genuinely block publishing: a
 * promised outcome, or a placeholder left in the text. Everything else warns.
 */
export function findComplianceIssues(input: ComplianceInput): SeoIssue[] {
  const issues: SeoIssue[] = []
  const body = plain(input.content || '')
  const faqText = (input.faq || [])
    .map((f) => `${f.question ?? ''} ${f.answer ?? ''}`)
    .join(' ')
  const all = [input.title, input.metaDescription ?? '', body, faqText, input.disclaimer ?? '']
    .filter(Boolean)
    .join('\n\n')

  // ── Promised outcomes. The one category that is always an error.
  for (const claim of findUnsafeClaims(all)) {
    const ctx = all.slice(Math.max(0, claim.index - 160), claim.index + claim.match.length + 160)
    if (NEGATED.test(ctx)) continue
    issues.push({
      id: `claim-${claim.index}`,
      severity: 'error',
      message:
        `"${claim.match}" promises an outcome. Visa decisions rest with the immigration authority and ` +
        `hiring with the employer. Say what you do instead: "We help eligible applicants prepare and submit their application."`,
    })
  }

  // ── Placeholders the AI generator leaves for a human to fill.
  if (all.includes(ADMIN_INPUT_REQUIRED)) {
    issues.push({
      id: 'admin-input-required',
      severity: 'error',
      message: `"${ADMIN_INPUT_REQUIRED}" is still in the text. Fill in the real value or remove the sentence before publishing.`,
    })
  }

  // ── Figures with no source.
  const found = new Set<string>()
  for (const { re, what } of FIGURES) {
    for (const m of all.matchAll(re)) found.add(`${m[0].trim()} (${what})`)
  }
  if (found.size > 0 && !SOURCED.test(all)) {
    const sample = [...found].slice(0, 4).join(', ')
    issues.push({
      id: 'unsourced-figures',
      severity: 'warning',
      message:
        `${found.size} figure(s) with no source: ${sample}. Fees, timelines and score requirements change. ` +
        `Link the official government page, or mark it [VERIFY: source] until you can.`,
    })
  }

  // ── Disclaimer.
  if (!DISCLAIMER_SIGNALS.some((re) => re.test(all))) {
    issues.push({
      id: 'no-disclaimer',
      severity: 'warning',
      message:
        'No disclaimer. Add one line: rules change, and the final decision rests with the relevant authority. ' +
        'Without it every statement here reads as a commitment.',
    })
  }

  // ── Manufactured urgency.
  for (const re of FALSE_URGENCY) {
    const m = all.match(re)
    if (m) {
      issues.push({
        id: 'false-urgency',
        severity: 'warning',
        message: `"${m[0]}" is pressure rather than information. State the real deadline, or drop it.`,
      })
      break
    }
  }

  // ── Generic phrasing.
  const tells = AI_TELLS.filter((re) => re.test(body))
  if (tells.length > 0) {
    const first = body.match(tells[0])
    issues.push({
      id: 'generic-phrasing',
      severity: 'info',
      message:
        `Generic phrasing${first ? ` ("${first[0]}")` : ''} that appears on thousands of competitor pages. ` +
        'Replace it with something only you could write, such as what you actually see in these applications.',
    })
  }

  // ── Unexplained acronyms.
  const unexplained = JARGON.filter((j) => {
    const re = new RegExp(`\\b${j}\\b`, 'i')
    if (!re.test(body)) return false
    const i = body.search(re)
    return !/\(|\bstands for\b|\bmeans\b|\bis a\b|\bis the\b/i.test(body.slice(Math.max(0, i - 100), i + 180))
  })
  if (unexplained.length > 0) {
    issues.push({
      id: 'jargon',
      severity: 'info',
      message: `Unexplained: ${unexplained.slice(0, 5).join(', ')}. Expand on first use, e.g. "LMIA (Labour Market Impact Assessment)".`,
    })
  }

  // ── Audience.
  if (!SOUTH_ASIA.some((c) => all.toLowerCase().includes(c))) {
    issues.push({
      id: 'audience',
      severity: 'info',
      message:
        'No mention of which applicants this is for. Requirements differ for Indian, Nepali, Bangladeshi, ' +
        'Pakistani and Sri Lankan applicants — say who it covers.',
    })
  }

  // ── Brand spelling.
  const misspelled = [...all.matchAll(/Sidh?d?h?i?vinayak|Siddhi\s+Vinayak|Sidhivinayak/gi)]
    .map((m) => m[0])
    .filter((v) => v !== 'Siddhivinayak')
  if (misspelled.length > 0) {
    issues.push({
      id: 'brand-spelling',
      severity: 'warning',
      message: `Brand spelled "${[...new Set(misspelled)][0]}". Use "Siddhivinayak Overseas".`,
    })
  }

  return issues
}
