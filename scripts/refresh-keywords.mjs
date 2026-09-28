#!/usr/bin/env node
/**
 * Refreshes the trending-keyword snapshot used by the admin suggestion panel.
 *
 *   npm run keywords:refresh
 *   npm run keywords:refresh -- --dry-run
 *
 * What this does and does not do
 * ------------------------------
 * The suggestion panel already calls Google autocomplete live every time an
 * editor types, so "what people are searching now" is never stale. What IS
 * static is docs/seo/keyword-strategy.csv, which is dated desk research.
 *
 * So this script does not re-derive the CSV. It records what Google is
 * actually autocompleting today, per destination, and diffs it against the
 * previous snapshot. The useful output is the DELTA: terms that have appeared
 * since the last run are the ones worth writing a post or an urgent
 * requirement about, because they are demand the site has no page for yet.
 *
 * Auth: keyword_trends requires a signed-in user with blog permissions, so
 * this signs in as CONTENT_PIPELINE_EMAIL and goes through the same RBAC
 * check as the admin UI rather than bypassing it with a service key.
 *
 * Run it on a schedule (weekly is plenty — autocomplete does not move daily).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src', 'content', 'keywords', 'trending.json')
const dryRun = process.argv.includes('--dry-run')

const env = loadEnv('production', ROOT, '')
const SUPABASE_URL = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
const EMAIL = env.CONTENT_PIPELINE_EMAIL
const PASSWORD = env.CONTENT_PIPELINE_PASSWORD

/** Destinations worth polling: the ones with real pages behind them. */
function seedCountries() {
  const src = readFileSync(path.join(ROOT, 'src/content/work-countries.ts'), 'utf8')
  return [...src.matchAll(/\{ slug: "([a-z-]+)", name: "([^"]+)"/g)].map((m) => ({
    slug: m[1],
    name: m[2],
  }))
}

/** Service angles, so we see intent variety rather than just the country name. */
const ANGLES = ['work visa', 'study visa', 'work permit', 'jobs for indians']

let token = null
async function signIn() {
  if (token) return token
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'CONTENT_PIPELINE_EMAIL / CONTENT_PIPELINE_PASSWORD are not set. ' +
      'Add an admin account to .env.local, or run with --dry-run.',
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

async function trendsFor(seed) {
  const jwt = await signIn()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate`, {
    method: 'POST',
    headers: { apikey: ANON, authorization: `Bearer ${jwt}`, 'content-type': 'application/json' },
    body: JSON.stringify({ feature: 'keyword_trends', seed, country: 'in' }),
  })
  const body = await res.json()
  if (!res.ok || body?.error) throw new Error(body?.error || `keyword_trends failed (${res.status})`)
  return Array.isArray(body.keywords) ? body.keywords : []
}

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { byCountry: {} }
const countries = seedCountries()
console.log(`Polling ${countries.length} destinations x ${ANGLES.length} angles.`)

if (dryRun) {
  console.log('Dry run - no network calls. Seeds that would be polled:')
  for (const c of countries.slice(0, 5)) {
    for (const a of ANGLES) console.log(`  "${c.name} ${a}"`)
  }
  console.log(`  ... and ${(countries.length - 5) * ANGLES.length} more`)
  process.exit(0)
}

const byCountry = {}
const newTerms = []

for (const c of countries) {
  const found = new Set()
  for (const angle of ANGLES) {
    try {
      for (const k of await trendsFor(`${c.name} ${angle}`)) found.add(k.toLowerCase().trim())
    } catch (err) {
      console.warn(`  ! ${c.name} / ${angle}: ${err.message}`)
    }
  }
  const list = [...found].sort()
  byCountry[c.slug] = list

  const before = new Set(previous.byCountry?.[c.slug] ?? [])
  const fresh = list.filter((k) => !before.has(k))
  if (fresh.length && Object.keys(previous.byCountry ?? {}).length) {
    newTerms.push({ slug: c.slug, name: c.name, terms: fresh })
  }
  console.log(`  ${c.slug}: ${list.length} terms${fresh.length ? ` (+${fresh.length} new)` : ''}`)
}

const snapshot = {
  refreshedAt: new Date().toISOString(),
  note: 'Google autocomplete snapshot. No search volumes - these are demand signals, not a ranking plan.',
  byCountry,
}

mkdirSync(path.dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
console.log(`\nWritten ${path.relative(ROOT, OUT)}.`)

if (newTerms.length) {
  console.log('\nNew since last refresh - these are topics with demand and no page yet:')
  for (const n of newTerms.slice(0, 20)) {
    console.log(`  ${n.name}: ${n.terms.slice(0, 6).join(', ')}${n.terms.length > 6 ? ', ...' : ''}`)
  }
  console.log('\nTurn the strongest of these into a blog post or an urgent requirement.')
  console.log('Do NOT create a page per phrase - see docs/seo/ranking-diagnosis.md.')
} else {
  console.log('\nNo new terms since the last snapshot.')
}
