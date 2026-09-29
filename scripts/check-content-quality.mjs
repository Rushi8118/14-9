/**
 * Content quality auditor.
 *
 * Scores a page against the ten categories that matter for this site and prints
 * every issue with its severity and a specific fix. Runs on the built HTML in
 * dist/, so it audits what a reader actually gets rather than what the source
 * intends.
 *
 * It deliberately checks only what a machine can check *correctly*. Whether a
 * paragraph is persuasive is not in here; whether it promises a visa outcome,
 * states an unsourced fee, or omits the disclaimer is. Everything it reports is
 * mechanically verifiable, so a finding is never a matter of taste — which is
 * what makes it safe to fail a build on.
 *
 * The judgement layer (rewriting, tone, whether a claim is actually true) is the
 * `/content-audit` command, which uses this script's output as its starting
 * point instead of re-deriving it.
 *
 * Usage:
 *   npm run check:content                      # every indexable page
 *   npm run check:content -- /blog/my-post     # one route
 *   npm run check:content -- --type=blog       # only that content type
 *   npm run check:content -- --json            # machine-readable
 *   npm run check:content -- --fail-on=critical   # exit 1 (default: never)
 *
 * NEVER encodes a visa rule, fee, salary or processing time. It flags figures
 * that need checking; it does not know what the right number is, and it must not
 * pretend to.
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')

const args = process.argv.slice(2)
const AS_JSON = args.includes('--json')
const ROUTES = args.filter((a) => a.startsWith('/'))
const TYPE_FILTER = (args.find((a) => a.startsWith('--type=')) || '').split('=')[1]
const FAIL_ON = (args.find((a) => a.startsWith('--fail-on=')) || '').split('=')[1] || 'never'

// ────────────────────────────────────────────────────────── helpers

const decode = (s) =>
  s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))

const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '')

function mainHtml(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  return m ? m[1] : html
}

/** Visible text, with nav/header/footer removed so boilerplate never inflates a score. */
function visibleText(html) {
  return decode(
    mainHtml(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim()
}

function headings(html) {
  const out = []
  for (const m of mainHtml(html).matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    out.push({ level: Number(m[1]), text: decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() })
  }
  return out
}

function attr(html, tag, sel, want) {
  const m = html.match(new RegExp(`<${tag}\\b[^>]*\\b${sel}[^>]*>`, 'i'))
  if (!m) return null
  const g = m[0].match(new RegExp(`\\b${want}\\s*=\\s*"([^"]*)"`, 'i'))
  return g ? g[1] : null
}

const words = (t) => t.split(/\s+/).filter(Boolean)
const sentences = (t) => t.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 1)

// ────────────────────────────────────────────────── detection rules

/**
 * Loaded from src/lib/ai/guardrails.ts so hand-written content is screened by
 * exactly the same patterns as AI-generated content, and the two cannot drift.
 */
async function guaranteePatterns() {
  const src = await readFile(path.join(root, 'src/lib/ai/guardrails.ts'), 'utf8')
  const block = src.match(/UNSAFE_CLAIM_PATTERNS:\s*RegExp\[\]\s*=\s*\[([\s\S]*?)\n\]/)?.[1]
  if (!block) throw new Error('[check:content] UNSAFE_CLAIM_PATTERNS not found in guardrails.ts')
  const pats = [...block.matchAll(/^\s*\/(.+)\/([a-z]*),\s*$/gm)]
    .map(([, body, flags]) => new RegExp(body, flags.includes('i') ? flags : `${flags}i`))
  if (pats.length < 5) throw new Error(`[check:content] parsed only ${pats.length} guarantee patterns`)
  return pats
}

/** Words that turn a guarantee phrase into a warning or a denial. */
const NEGATED = new RegExp([
  '\\bno\\b', '\\bnot\\b', '\\bnever\\b', '\\bnobody\\b', '\\bcannot\\b', "\\bcan't\\b",
  '\\bavoid\\b', '\\bbeware\\b', '\\bwarning\\b', '\\bcareful\\b', '\\bscam\\b', '\\bfake\\b',
  '\\bfraud', '\\bpromising\\b', '\\bmyth\\b', '\\bred flag\\b', '\\bsubject to\\b',
  '\\bdepends on\\b', '\\bethical\\b', '\\bhonest\\b', '\\bdoes not\\b', "\\bdoesn't\\b",
].join('|'), 'i')

/**
 * Figures that are claims about the world and must trace to an official source:
 * money, percentages, processing times, score thresholds, age limits.
 * The script cannot know whether the number is right, only that it is asserted.
 */
const FIGURE_PATTERNS = [
  // Currency codes need a word boundary and the amount needs at least one digit.
  // Without both, `[\d,]+` matched a bare comma and `Rs` matched the tail of
  // "consultants,", so every page reported phantom monetary figures.
  { id: 'money', re: /(?:₹|\bRs\.?|\bINR\b|\$|\bUSD\b|€|\bEUR\b|£|\bGBP\b|\bCAD\b|\bAUD\b|\bNZD\b|\bNPR\b|\bBDT\b|\bPKR\b|\bLKR\b|\bAED\b|\bQAR\b|\bSAR\b|¥|\bJPY\b)\s?\d[\d,]*(?:\.\d+)?|\b\d[\d,]{2,}\s?(?:INR|USD|EUR|GBP|CAD|AUD|NZD|AED|JPY)\b/gi, what: 'a monetary figure' },
  { id: 'percent', re: /\b\d{1,3}(?:\.\d+)?\s?%/g, what: 'a percentage' },
  { id: 'duration', re: /\b\d+\s?(?:-\s?\d+\s?)?(?:working\s+)?(?:day|days|week|weeks|month|months|year|years)\b/gi, what: 'a processing time or duration' },
  { id: 'score', re: /\b(?:IELTS|PTE|TOEFL|CRS|CLB|band)\s*(?:score\s*)?(?:of\s*)?\d+(?:\.\d)?\b/gi, what: 'a test score threshold' },
  { id: 'age', re: /\bage(?:d)?\s*(?:limit\s*)?(?:of\s*|under\s*|below\s*|up to\s*)?\d{2}\b|\bunder\s+\d{2}\s+years?\b/gi, what: 'an age limit' },
]

/** Terms a first-time applicant will not know. Flagged when used without a gloss. */
const JARGON = ['LMIA', 'PGWP', 'SDS', 'GTE', 'CoE', 'CAS', 'CRS', 'EOI', 'ANZSCO', 'NOC',
  'Chancenkarte', 'Blue Card', 'AEWV', 'SSW', 'Subclass 485', 'Subclass 500', 'DoFE',
  'Protector of Emigrants', 'eMigrate', 'biometrics', 'apostille', 'attestation']

/** Phrasing that reads as machine-written. Not proof, but worth a human look. */
const AI_TELLS = [
  /\bin today'?s (?:fast[- ]paced |competitive |globalized )?world\b/i,
  /\bit'?s (?:important|worth) (?:to note|noting) that\b/i,
  /\bunlock (?:your|the) (?:potential|future|opportunit)/i,
  /\bembark on (?:a|your) journey\b/i,
  /\bnavigate the (?:complex|complexities|intricacies)\b/i,
  /\bdelve into\b/i, /\bin conclusion,/i, /\bthe realm of\b/i,
  /\bgame[- ]chang(?:er|ing)\b/i, /\bseamless(?:ly)? (?:experience|process|transition)\b/i,
]

/** False-urgency phrasing. Honest deadlines are fine; manufactured ones are not. */
const FALSE_URGENCY = [
  /\bhurry\b/i, /\blast (?:chance|few) (?:seats|slots|spots)\b/i, /\bonly \d+ (?:seats|slots) left\b/i,
  /\bapply (?:now )?before it'?s too late\b/i, /\blimited time only\b/i, /\bact (?:now|fast)\b/i,
]

const DISCLAIMER_SIGNALS = [
  /rules?\s+(?:can|may)\s+change/i, /subject to change/i,
  /(?:final )?decision (?:rests|lies) with/i, /decided by the (?:embassy|authority|immigration)/i,
  /we (?:do not|don'?t) guarantee/i, /outcomes? (?:may )?vary/i,
  /not (?:legal|immigration) advice/i, /confirm (?:with|on) the official/i,
]

const CTA_SIGNALS = [/whatsapp/i, /book a (?:free )?consultation/i, /contact (?:us|our)/i,
  /call\s*(?:us|\+?\d)/i, /get in touch/i, /speak to (?:a|our)/i, /free assessment/i]

const SOUTH_ASIA = ['india', 'nepal', 'bangladesh', 'pakistan', 'sri lanka']

/** Required sections per content type, as heading keywords. */
const REQUIRED_SECTIONS = {
  country: [
    ['overview', 'about', 'introduction', 'why'],
    ['visa type', 'visa option', 'routes', 'permit type', 'streams'],
    ['eligibility', 'who can apply', 'requirements', 'criteria'],
    ['document', 'checklist', 'paperwork'],
    ['process', 'steps', 'how it works', 'how to apply'],
    ['timeline', 'processing time', 'how long'],
    ['cost', 'fee', 'price', 'budget'],
    ['job', 'work', 'employment', 'opportunit', 'salary'],
    ['faq', 'frequently asked', 'common question'],
  ],
  blog: [
    ['intro', 'overview', 'what', 'why', 'how'],
    ['takeaway', 'summary', 'checklist', 'what to do', 'next step', 'key point'],
  ],
  urgent: [
    ['role', 'job', 'position', 'vacanc', 'opening'],
    ['salary', 'pay', 'wage', 'package'],
    ['eligibility', 'requirement', 'who can apply', 'criteria'],
    ['document', 'checklist'],
    ['apply', 'how to', 'next step', 'process'],
  ],
  service: [
    ['what we do', 'service', 'overview', 'how we help'],
    ['process', 'steps', 'how it works'],
    ['faq', 'frequently asked', 'common question'],
  ],
  other: [],
}

function contentType(route) {
  if (/^\/blog\//.test(route)) return 'blog'
  if (/^\/urgent-requirements\//.test(route)) return 'urgent'
  if (/^\/(study-in-|work-visa\/|countries\/)/.test(route)) return 'country'
  if (/^\/(services|study-visa|work-visa)$/.test(route)) return 'service'
  if (/^\/(guides|pathways)\//.test(route)) return 'blog'
  return 'other'
}

const MIN_WORDS = { country: 600, blog: 600, urgent: 300, service: 400, other: 250 }

// ─────────────────────────────────────────────────────── the audit

function auditPage({ route, html, type, keyword, patterns, corpus }) {
  const issues = []
  const add = (severity, category, issue, why, fix) =>
    issues.push({ severity, category, issue, why, fix })

  const text = visibleText(html)
  const ws = words(text)
  const lower = text.toLowerCase()
  const hs = headings(html)
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim()
  const desc = decode(attr(html, 'meta', 'name="description"', 'content') ?? '')

  // ── 1. Accuracy & compliance
  let accuracy = 10
  for (const re of patterns) {
    for (const m of text.matchAll(new RegExp(re.source, `${re.flags.replace('g', '')}g`))) {
      const ctx = text.slice(Math.max(0, m.index - 160), m.index + m[0].length + 160)
      if (NEGATED.test(ctx)) continue
      accuracy -= 6
      add('Critical', 'Accuracy & compliance', `Outcome promise: "${m[0]}"`,
        'A guaranteed visa or job is a promise nobody can keep. On a YMYL page in a sector regulated under the Emigration Act it is a trust and a legal exposure.',
        'Replace with what you actually do, e.g. "We help eligible applicants prepare and submit their application. The decision rests with the immigration authority."')
    }
  }
  const figures = []
  for (const { id, re, what } of FIGURE_PATTERNS) {
    for (const m of text.matchAll(re)) figures.push({ id, what, value: m[0].trim() })
  }
  const hasSource = /\[VERIFY:|official (?:source|site|page)|gov\.uk|canada\.ca|homeaffairs|uscis|\bircc\b/i.test(text) ||
    /<a[^>]+href="https?:\/\/[^"]*\.(?:gov|gov\.uk|canada\.ca|gov\.au)[^"]*"/i.test(html)
  if (figures.length && !hasSource) {
    accuracy -= 3
    const sample = [...new Set(figures.map((f) => f.value))].slice(0, 6)
    add('High', 'Accuracy & compliance',
      `${figures.length} unsourced figure(s): ${sample.join(', ')}`,
      'Fees, processing times, score thresholds and age limits change. An unsourced figure on an immigration page is read as authoritative and is the kind of error that costs an applicant money.',
      'Link each figure to the official government page that states it, and add a "last checked" date. If you cannot source it, mark it [VERIFY: source] or remove it.')
  }
  if (!DISCLAIMER_SIGNALS.some((re) => re.test(text))) {
    accuracy -= 3
    add('High', 'Accuracy & compliance', 'No disclaimer that rules change and the authority decides',
      'Without it, every statement on the page reads as a commitment.',
      'Add near the end: "Immigration rules change and the final decision rests with the relevant authority. Confirm current requirements on the official government site before you apply."')
  }

  // ── 2. Clarity & readability
  let clarity = 10
  const ss = sentences(text)
  const avgLen = ss.length ? ws.length / ss.length : 0
  const longSentences = ss.filter((s) => words(s).length > 34).length
  if (avgLen > 26) {
    clarity -= 3
    add('Medium', 'Clarity & readability', `Average sentence is ${Math.round(avgLen)} words`,
      'Readers are applicants reading in a second language. Long sentences are where misunderstandings about eligibility start.',
      'Aim for 15-20 words on average. Split any sentence carrying two conditions into two.')
  }
  if (longSentences > 3) {
    clarity -= 2
    add('Low', 'Clarity & readability', `${longSentences} sentences over 34 words`,
      'Long sentences hide the condition that actually applies to the reader.', 'Split them.')
  }
  const unexplained = JARGON.filter((j) => {
    const re = new RegExp(`\\b${j.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (!re.test(text)) return false
    const i = text.search(re)
    const around = text.slice(Math.max(0, i - 120), i + 200)
    return !/\(|\bstands for\b|\bmeans\b|\bis a\b|\bis the\b|,\s*(?:the|a|an)\s/i.test(around)
  })
  if (unexplained.length) {
    clarity -= 2
    add('Medium', 'Clarity & readability', `Unexplained jargon: ${unexplained.slice(0, 6).join(', ')}`,
      'A first-time applicant does not know these. Unexplained acronyms make a page feel written for insiders.',
      'Expand on first use, e.g. "LMIA (Labour Market Impact Assessment, an approval a Canadian employer may need)".')
  }

  // ── 3. Structure
  let structure = 10
  const h1s = hs.filter((h) => h.level === 1)
  if (h1s.length !== 1) {
    structure -= 3
    add('High', 'Structure', `${h1s.length} H1 headings`, 'Search engines and screen readers use the H1 as the page topic.', 'Use exactly one H1.')
  }
  let skipped = 0
  for (let i = 1; i < hs.length; i += 1) if (hs[i].level - hs[i - 1].level > 1) skipped += 1
  if (skipped) {
    structure -= 2
    add('Low', 'Structure', `${skipped} skipped heading level(s)`, 'Breaks the document outline for assistive technology.', 'Do not jump from H2 to H4.')
  }
  const headingBlob = hs.map((h) => h.text.toLowerCase()).join(' | ')
  const missing = (REQUIRED_SECTIONS[type] || []).filter((alts) => !alts.some((a) => headingBlob.includes(a)))
  if (missing.length) {
    structure -= Math.min(6, missing.length * 1.5)
    add(missing.length > 3 ? 'High' : 'Medium', 'Structure',
      `Missing section(s) for a ${type} page: ${missing.map((a) => a[0]).join(', ')}`,
      'These are the questions this page type exists to answer. A reader who cannot find them leaves for a competitor.',
      `Add an H2 for each: ${missing.map((a) => a[0]).join(', ')}.`)
  }

  // ── 4. SEO
  let seo = 10
  if (!title) { seo -= 4; add('Critical', 'SEO', 'No <title>', 'Google has nothing to show.', 'Add a title under 60 characters.') }
  else if (title.length > 60) {
    seo -= 1
    add('Low', 'SEO', `Title is ${title.length} characters`, 'Google truncates past roughly 60.', 'Shorten it, dropping the brand suffix first.')
  }
  if (!desc) { seo -= 3; add('High', 'SEO', 'No meta description', 'Google writes its own snippet, usually worse.', 'Add one of 120-155 characters.') }
  else if (desc.length > 155) {
    seo -= 1
    add('Low', 'SEO', `Meta description is ${desc.length} characters`, 'It will be cut off.', 'Trim to 155.')
  }
  const floor = MIN_WORDS[type] ?? 250
  if (ws.length < floor) {
    seo -= 3
    add(ws.length < floor * 0.5 ? 'High' : 'Medium', 'SEO',
      `Thin: ${ws.length} words (expected ${floor}+ for a ${type} page)`,
      'Thin pages rarely rank and rarely convert. On this site the thin pages are the ones targeting the highest-intent queries.',
      'Add the missing sections above with real, sourced detail. Do not pad with generic filler, which is worse than being short.')
  }
  if (keyword) {
    const k = keyword.toLowerCase()
    const first100 = words(text).slice(0, 100).join(' ').toLowerCase()
    if (!title.toLowerCase().includes(k)) { seo -= 2; add('Medium', 'SEO', `Keyword "${keyword}" not in the title`, 'The title is the strongest on-page relevance signal.', `Work "${keyword}" into the title naturally.`) }
    if (!first100.includes(k)) { seo -= 1; add('Low', 'SEO', `Keyword not in the first 100 words`, 'Confirms the topic early for readers and crawlers.', 'Mention it in the opening paragraph.') }
    if (!hs.some((h) => h.level === 2 && h.text.toLowerCase().includes(k))) { seo -= 1; add('Low', 'SEO', 'Keyword not in any H2', 'Subheadings reinforce topic coverage.', 'Use it in one H2 where it reads naturally.') }
    if (desc && !desc.toLowerCase().includes(k)) { seo -= 1; add('Low', 'SEO', 'Keyword not in the meta description', 'Google bolds matched terms in the snippet.', 'Include it once.') }
    const hits = (lower.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    const density = ws.length ? (hits * words(keyword).length) / ws.length : 0
    if (density > 0.03) {
      seo -= 3
      add('High', 'SEO', `Keyword stuffing: "${keyword}" is ${(density * 100).toFixed(1)}% of the text`,
        'Repetition above about 3% reads as manipulation and can suppress the page.',
        'Cut repetitions; use natural variations and pronouns instead.')
    }
  }

  // ── 5. Trust & credibility (E-E-A-T)
  let trust = 10
  const hasAuthor = /reviewed by|written by|author|our team|editorial/i.test(html)
  const hasReviewDate = /last (?:reviewed|updated)|<time[^>]*datetime=/i.test(html)
  const hasContact = /\+91|whatsapp|@siddhivinayakoverseas|contact/i.test(html)
  if (!hasAuthor) {
    trust -= 4
    add('High', 'Trust & credibility', 'No named author or reviewer',
      'This is YMYL content. Google weights who wrote and checked it heavily, and a reader deciding where to spend lakhs wants to know who is advising them.',
      'Add a real named reviewer with their role, or an accurate team label if that is genuinely who reviews it. Never invent a person.')
  }
  if (!hasReviewDate) {
    trust -= 3
    add('Medium', 'Trust & credibility', 'No last-reviewed date',
      'Immigration content decays. An undated page cannot be trusted by a reader or by an AI assistant deciding whether to cite it.',
      'Add a visible "Last reviewed: <date>" and keep it honest.')
  }
  if (!hasContact) {
    trust -= 2
    add('Medium', 'Trust & credibility', 'No contact detail on the page', 'A consultancy page with no way to reach the consultancy reads as a scrape.', 'Add the phone number or WhatsApp link.')
  }

  // ── 6. Conversion
  let conversion = 10
  const ctaCount = CTA_SIGNALS.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0)
  if (!ctaCount) {
    conversion -= 5
    add('High', 'Conversion', 'No call to action', 'The page informs and then stops.', 'Add a CTA early and again at the end: WhatsApp, call, or book a free consultation.')
  } else {
    const half = Math.floor(ws.length / 2)
    const firstHalf = ws.slice(0, half).join(' ')
    const secondHalf = ws.slice(half).join(' ')
    if (!CTA_SIGNALS.some((re) => re.test(firstHalf))) {
      conversion -= 2
      add('Low', 'Conversion', 'No CTA in the first half of the page', 'Most readers never reach the end.', 'Add one after the opening section.')
    }
    if (!CTA_SIGNALS.some((re) => re.test(secondHalf))) {
      conversion -= 1
      add('Low', 'Conversion', 'No CTA at the end', 'The end is where a convinced reader looks for the next step.', 'Close with a CTA.')
    }
  }
  for (const re of FALSE_URGENCY) {
    const m = text.match(re)
    if (m) {
      conversion -= 3
      add('High', 'Conversion', `Manufactured urgency: "${m[0]}"`,
        'Pressure tactics on immigration decisions damage trust and attract complaints. Real deadlines are fine; invented ones are not.',
        'State the real deadline and its source, or remove the urgency.')
      break
    }
  }

  // ── 7. Grammar & consistency
  let consistency = 10
  const brandWrong = [...text.matchAll(/Sidh?d?h?i?vinayak|Siddhi\s+Vinayak|Sidhivinayak/gi)]
    .map((m) => m[0]).filter((v) => v !== 'Siddhivinayak')
  if (brandWrong.length) {
    consistency -= 3
    add('Medium', 'Grammar & consistency', `Brand name spelled ${[...new Set(brandWrong)].join(', ')}`,
      'Inconsistent brand spelling weakens entity recognition and looks careless.', 'Use "Siddhivinayak Overseas" everywhere.')
  }
  const dateFormats = new Set()
  if (/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(text)) dateFormats.add('DD/MM/YYYY')
  if (/\b\d{4}-\d{2}-\d{2}\b/.test(text)) dateFormats.add('YYYY-MM-DD')
  if (/\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text)) dateFormats.add('D Mon YYYY')
  if (dateFormats.size > 1) {
    consistency -= 2
    add('Low', 'Grammar & consistency', `Mixed date formats: ${[...dateFormats].join(', ')}`,
      'Ambiguous dates are a real problem for deadlines: 05/10 means different days in different countries.',
      'Use one unambiguous format everywhere, e.g. 15 Oct 2026.')
  }
  const ukUs = /\b(?:programme|organise|centre)\b/i.test(text) && /\b(?:program|organize|center)\b/i.test(text)
  if (ukUs) { consistency -= 1; add('Low', 'Grammar & consistency', 'Mixed UK and US spelling', 'Looks unedited.', 'Pick one and apply it throughout.') }

  // ── 8. Duplication & originality
  let originality = 10
  const tells = AI_TELLS.filter((re) => re.test(text))
  if (tells.length) {
    originality -= tells.length * 2
    add('Medium', 'Duplication & originality', `${tells.length} generic AI-sounding phrase(s)`,
      'This phrasing appears on thousands of competitor pages. It signals the page adds nothing.',
      'Replace with something only this business could write: what you actually see in these applications.')
  }
  if (corpus) {
    const mine = new Set(ws.map((w) => w.toLowerCase()).filter((w) => w.length > 3))
    let worst = null
    for (const [other, set] of corpus) {
      if (other === route) continue
      const inter = [...mine].filter((w) => set.has(w)).length
      const union = new Set([...mine, ...set]).size
      const j = union ? inter / union : 0
      if (!worst || j > worst.j) worst = { other, j }
    }
    if (worst && worst.j >= 0.8) {
      originality -= 6
      add('High', 'Duplication & originality', `${(worst.j * 100).toFixed(0)}% word overlap with ${worst.other}`,
        'Near-duplicate pages compete with each other. Google picks one and may pick the wrong one.',
        `Give each page country-specific facts, or consolidate and redirect one to the other.`)
    } else if (worst && worst.j >= 0.7) {
      originality -= 3
      add('Medium', 'Duplication & originality', `${(worst.j * 100).toFixed(0)}% word overlap with ${worst.other}`,
        'Heavily templated pages struggle to rank individually.', 'Add detail unique to this country or role.')
    }
  }

  // ── 9. Audience fit
  let audience = 10
  const mentioned = SOUTH_ASIA.filter((c) => lower.includes(c))
  if (!mentioned.length) {
    audience -= 4
    add('Medium', 'Audience fit', 'No mention of the applicant countries served',
      'The audience is applicants from India, Nepal, Bangladesh, Pakistan and Sri Lanka, whose requirements differ from each other.',
      'State who the page is for, and note where requirements differ by nationality.')
  } else if (mentioned.length === 1) {
    audience -= 1
    add('Low', 'Audience fit', `Only mentions ${mentioned[0]}`,
      'Requirements often differ for Nepali, Bangladeshi, Pakistani and Sri Lankan applicants.',
      'Add a line on the differences, or say explicitly that the page covers Indian applicants only.')
  }

  // ── 10. Freshness
  let freshness = 10
  if (!hasReviewDate) {
    freshness -= 5
    add('Medium', 'Freshness', 'No review date', 'Nothing tells a reader or a crawler how current this is.', 'Add a visible last-reviewed date and a review cadence.')
  }
  const yearMentions = [...text.matchAll(/\b20(2[0-9])\b/g)].map((m) => Number(`20${m[1]}`))
  const nowYear = new Date().getFullYear()
  const stale = yearMentions.filter((y) => y < nowYear)
  if (stale.length && !yearMentions.some((y) => y >= nowYear)) {
    freshness -= 3
    add('Medium', 'Freshness', `Only references past years (${[...new Set(stale)].join(', ')})`,
      'A page citing only older years reads as abandoned, whatever its content.',
      'Re-check the facts and update the year references, or remove them.')
  }

  const scores = {
    'Accuracy & compliance': Math.max(0, accuracy),
    'Clarity & readability': Math.max(0, clarity),
    Structure: Math.max(0, structure),
    SEO: Math.max(0, seo),
    'Trust & credibility': Math.max(0, trust),
    Conversion: Math.max(0, conversion),
    'Grammar & consistency': Math.max(0, consistency),
    'Duplication & originality': Math.max(0, originality),
    'Audience fit': Math.max(0, audience),
    Freshness: Math.max(0, freshness),
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  return { route, type, words: ws.length, title, scores, total, issues }
}

// ────────────────────────────────────────────────────────── run

async function findPages(dir, acc = []) {
  for (const e of await readdir(dir)) {
    const full = path.join(dir, e)
    if ((await stat(full)).isDirectory()) await findPages(full, acc)
    else if (e === 'index.html') acc.push(full)
  }
  return acc
}

const routeOf = (f) => {
  const rel = path.relative(distDir, f).replace(/\\/g, '/').replace(/\/?index\.html$/, '')
  return rel === '' ? '/' : `/${rel}`
}

let files
try {
  files = await findPages(distDir)
} catch {
  console.error('dist/ not found. Run `npm run build` first.')
  process.exit(1)
}

const patterns = await guaranteePatterns()

// Corpus for the duplication check, built once.
const corpus = new Map()
const loaded = []
for (const f of files) {
  const route = routeOf(f)
  const html = stripComments(await readFile(f, 'utf8'))
  const noindex = /\bnoindex\b/i.test(attr(html, 'meta', 'name="robots"', 'content') ?? '')
  loaded.push({ route, html, noindex })
  corpus.set(route, new Set(words(visibleText(html)).map((w) => w.toLowerCase()).filter((w) => w.length > 3)))
}

const keyword = (args.find((a) => a.startsWith('--keyword=')) || '').split('=')[1]
const results = []
for (const { route, html, noindex } of loaded) {
  if (route === '/404') continue
  if (ROUTES.length && !ROUTES.includes(route)) continue
  const type = contentType(route)
  if (TYPE_FILTER && type !== TYPE_FILTER) continue
  if (!ROUTES.length && noindex) continue
  results.push(auditPage({ route, html, type, keyword, patterns, corpus }))
}

results.sort((a, b) => a.total - b.total)

if (AS_JSON) {
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2))
} else {
  const RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const r of results) for (const i of r.issues) counts[i.severity] += 1

  console.log(`\nContent quality: ${results.length} pages audited\n`)
  console.log(`${'SCORE'.padEnd(7)}${'TYPE'.padEnd(9)}${'WORDS'.padEnd(7)}ROUTE`)
  console.log('-'.repeat(72))
  for (const r of results.slice(0, 25)) {
    console.log(`${String(r.total).padStart(3)}/100${' '.repeat(2)}${r.type.padEnd(9)}${String(r.words).padEnd(7)}${r.route}`)
  }
  if (results.length > 25) console.log(`  ... and ${results.length - 25} more (use --json for all)`)

  console.log(`\nIssues: ${counts.Critical} Critical, ${counts.High} High, ${counts.Medium} Medium, ${counts.Low} Low\n`)

  const worst = results.filter((r) => r.issues.some((i) => i.severity === 'Critical' || i.severity === 'High')).slice(0, 8)
  for (const r of worst) {
    console.log(`\n${r.route}  (${r.total}/100, ${r.type}, ${r.words} words)`)
    for (const i of r.issues.sort((a, b) => RANK[a.severity] - RANK[b.severity])) {
      if (i.severity === 'Medium' || i.severity === 'Low') continue
      console.log(`  [${i.severity}] ${i.category}: ${i.issue}`)
      console.log(`      why: ${i.why}`)
      console.log(`      fix: ${i.fix}`)
    }
  }
  console.log('\nFor a full rewrite of any page, run the /content-audit command with its route.')
}

const shouldFail =
  (FAIL_ON === 'critical' && results.some((r) => r.issues.some((i) => i.severity === 'Critical'))) ||
  (FAIL_ON === 'high' && results.some((r) => r.issues.some((i) => i.severity === 'Critical' || i.severity === 'High')))
if (shouldFail) process.exit(1)
