#!/usr/bin/env node
/**
 * Drives the AI content pipeline for a route, refusing to emit anything that
 * is a near-duplicate of a page the site already has.
 *
 *   npm run content:gen -- --route=/work-visa/sweden
 *   npm run content:gen -- --route=/work-visa/sweden --dry-run
 *
 * Auth: the ai-generate edge function requires a signed-in admin. This script
 * signs in with CONTENT_PIPELINE_EMAIL / CONTENT_PIPELINE_PASSWORD and uses
 * that JWT, so it goes through exactly the same RBAC check as the admin UI.
 * It does NOT use the service-role key to bypass that boundary.
 *
 * Output is written to src/content/generated/<slug>.json for review. Nothing
 * is published automatically: a human still approves before it reaches a page.
 */
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { buildEntityVocabulary, extractMainText, fingerprint } from './lib/similarity.mjs'
import { generateUntilDistinct } from './lib/content-pipeline.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const OUT_DIR = path.join(ROOT, 'src', 'content', 'generated')

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}
const rawRoute = arg('route')
// Git Bash rewrites a leading-slash argument into a Windows path
// (/work-visa/x -> C:/Program Files/Git/work-visa/x). Recover the real route.
const route = rawRoute
  ? '/' + rawRoute.replace(/^[A-Za-z]:[\/].*?[\/]Git[\/]/, '').replace(/^\/+/, '')
  : null
const dryRun = process.argv.includes('--dry-run')
const maxAttempts = Number(arg('attempts') ?? 3)

if (!route) {
  console.error('Usage: npm run content:gen -- --route=/work-visa/sweden [--dry-run] [--attempts=3]')
  process.exit(1)
}

// -- Corpus: every page already on the site ------------------------------
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (name === 'index.html') acc.push(p)
  }
  return acc
}

if (!existsSync(DIST)) {
  console.error('dist/ not found - run `npm run build` first so there is a corpus to compare against.')
  process.exit(1)
}

const docs = []
for (const file of walk(DIST)) {
  const rel = path.relative(DIST, path.dirname(file)).split(path.sep).join('/')
  const url = rel === '' || rel === '.' ? '/' : '/' + rel
  const raw = extractMainText(readFileSync(file, 'utf8'))
  if (raw) docs.push({ url, raw })
}
const vocab = buildEntityVocabulary([...docs.map((d) => d.url), route])
const corpus = docs.map((d) => fingerprint(d.url, d.raw, vocab))
console.log(`Corpus: ${corpus.length} existing pages.`)
console.log(`Target: ${route}`)

// -- Generator -----------------------------------------------------------
const env = loadEnv('production', ROOT, '')
const SUPABASE_URL = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
const EMAIL = env.CONTENT_PIPELINE_EMAIL
const PASSWORD = env.CONTENT_PIPELINE_PASSWORD

const entity = route.split('/').filter(Boolean).pop().replace(/-/g, ' ')

function buildPrompt(attempt, feedback) {
  const base = [
    `Write the main body content for the page at ${route} on a visa consultancy website.`,
    `The subject is: ${entity}.`,
    '',
    'Requirements:',
    '- Write only about what is specifically true of this route. Name the official visa,',
    '  the responsible authority, real salary or funds thresholds, and realistic processing times.',
    '- Do not write filler that would be equally true of any other country.',
    '- Never promise or guarantee a visa, a job, or an outcome. State that the government decides.',
    '- State that rules change and that official sources should be checked.',
    '- Plain factual prose. No marketing superlatives.',
    '- At least 450 words of substance.',
  ]
  if (feedback) {
    base.push('', 'The previous attempt was REJECTED. ' + feedback)
  }
  return base.join(String.fromCharCode(10))
}

let token = null
async function signIn() {
  if (token) return token
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'CONTENT_PIPELINE_EMAIL / CONTENT_PIPELINE_PASSWORD are not set. ' +
      'Add them to .env.local (an admin account), or run with --dry-run.',
    )
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const body = await res.json()
  if (!res.ok || !body?.access_token) {
    throw new Error(`Sign-in failed: ${body?.error_description || body?.msg || res.status}`)
  }
  token = body.access_token
  return token
}

async function generateViaEdge(attempt, feedback) {
  const jwt = await signIn()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate`, {
    method: 'POST',
    headers: { apikey: ANON, authorization: `Bearer ${jwt}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      feature: 'blog',
      messages: [{ role: 'user', content: buildPrompt(attempt, feedback) }],
    }),
  })
  const body = await res.json()
  if (!res.ok || body?.error) throw new Error(body?.error || `AI request failed (${res.status})`)
  return typeof body.text === 'string' ? body.text : ''
}

/**
 * Stand-in used by --dry-run to prove the gate actually bites: attempt 1
 * returns an existing page verbatim (must be rejected as a duplicate),
 * attempt 2 returns something too short (must be rejected as thin), and
 * attempt 3 returns genuinely distinct text (must be accepted). If a run
 * ever accepts attempt 1, the gate is broken.
 */
function generateStub(attempt) {
  const donor = corpus.find((c) => c.route.startsWith('/work-visa/')) || corpus[0]
  const donorFile = donorTextFor(donor.route)
  if (attempt === 1) return donorFile
  if (attempt === 2) return 'Too short to be a real page.'
  const words = []
  for (let i = 0; i < 520; i++) words.push('distinct' + (i % 137))
  return words.join(' ')
}

function donorTextFor(r) {
  const file = path.join(DIST, ...r.split('/').filter(Boolean), 'index.html')
  return existsSync(file) ? extractMainText(readFileSync(file, 'utf8')) : ''
}

const generate = dryRun ? async (a, f) => generateStub(a, f) : generateViaEdge

// -- Run -----------------------------------------------------------------
const result = await generateUntilDistinct({
  route, generate, corpus, vocab, maxAttempts, log: (m) => console.log(m),
})

if (!result.ok) {
  console.error('')
  console.error(`REJECTED ${route}: ${result.reason}.`)
  console.error(`Best attempt still scored ${result.best.worst.toFixed(3)} vs ${result.best.worstAgainst}.`)
  console.error('Leave this page noindexed rather than publishing a near-duplicate.')
  process.exit(1)
}

console.log('')
console.log(`ACCEPTED ${route}: ${result.words} words, worst similarity ${result.worst.toFixed(3)}.`)

if (dryRun) {
  console.log('Dry run - nothing written.')
} else {
  mkdirSync(OUT_DIR, { recursive: true })
  const slug = route.split('/').filter(Boolean).join('--')
  const out = path.join(OUT_DIR, `${slug}.json`)
  writeFileSync(out, JSON.stringify({
    route, generatedAt: new Date().toISOString(),
    words: result.words, worstSimilarity: result.worst, worstAgainst: result.worstAgainst,
    attempts: result.attempts, status: 'pending-review', text: result.text,
  }, null, 2) + String.fromCharCode(10), 'utf8')
  console.log(`Written to ${path.relative(ROOT, out)} (status: pending-review).`)
}
