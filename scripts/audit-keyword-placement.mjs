#!/usr/bin/env node
/**
 * Reports where each page's target keywords actually appear, and flags
 * over-use.
 *
 *   npm run keywords:audit                 whole site summary
 *   npm run keywords:audit -- --route=/work-visa/germany   one page, in detail
 *   npm run keywords:audit -- --stuffing   only the over-use warnings
 *
 * Why this is a report and not a writer
 * -------------------------------------
 * src/content/keywords/*.json holds 7,839 researched phrases. They are
 * RESEARCH INPUT, not page content: an earlier version of this site printed
 * them across 56 pages and that is keyword stuffing under Google's spam
 * policies (see scripts/build-keyword-map.mjs and commit 225c8b1, which
 * removed it). Nothing in this script writes a keyword onto a page.
 *
 * What it does instead is tell you which terms a page genuinely earns today
 * (title, H1, H2, opening text, FAQ, image alt, link text) and which it does
 * not, so an editor can rewrite the few that matter into real sentences.
 * Coverage is meant to stay well below 100%: a page that matched every phrase
 * assigned to it would be stuffed by definition.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const KW = path.join(ROOT, 'src', 'content', 'keywords')

const arg = (n) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : null
}
const rawRoute = arg('route')
const only = rawRoute
  ? '/' + rawRoute.replace(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/]/, '').replace(/^\/+/, '')
  : null
const stuffingOnly = process.argv.includes('--stuffing')

/** A keyword appears this many times or more in body text -> likely stuffed. */
const STUFF_AT = 6

const fileIdToRoute = (id) => (id === 'home' ? '/' : '/' + id.replace(/--/g, '/'))
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

function slice(html, re) {
  const out = []
  let m
  while ((m = re.exec(html)) !== null) out.push(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
  return out.filter(Boolean)
}

function parse(html) {
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i)
  const main = mainMatch ? mainMatch[0] : html
  const text = main
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return {
    title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim(),
    description: html.match(/<meta\s+name="description"[^>]*content="([^"]*)"/i)?.[1] ?? '',
    h1: slice(main, /<h1[^>]*>([\s\S]*?)<\/h1>/gi),
    h2: slice(main, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi),
    alts: [...html.matchAll(/<img[^>]*\salt="([^"]*)"/gi)].map((m) => m[1]),
    anchors: slice(main, /<a[^>]*>([\s\S]*?)<\/a>/gi),
    opening: text.split(' ').slice(0, 100).join(' '),
    text,
  }
}

/** Which slots a keyword shows up in. */
function placement(kw, p) {
  const k = norm(kw)
  if (!k || k.length < 4) return null
  const inAny = (arr) => arr.some((v) => norm(v).includes(k))
  const slots = []
  if (norm(p.title).includes(k)) slots.push('title')
  if (norm(p.description).includes(k)) slots.push('meta')
  if (inAny(p.h1)) slots.push('h1')
  if (inAny(p.h2)) slots.push('h2')
  if (norm(p.opening).includes(k)) slots.push('intro')
  if (inAny(p.alts)) slots.push('alt')
  if (inAny(p.anchors)) slots.push('link')
  const body = norm(p.text)
  let count = 0
  let at = body.indexOf(k)
  while (at !== -1) { count++; at = body.indexOf(k, at + k.length) }
  if (count && !slots.length) slots.push('body')
  return { kw, slots, count }
}

if (!existsSync(DIST)) {
  console.error('dist/ not found - run `npm run build` first.')
  process.exit(1)
}

const files = readdirSync(KW).filter((f) => f.endsWith('.json'))
const rows = []
const stuffed = []

for (const file of files) {
  const route = fileIdToRoute(file.replace(/\.json$/, ''))
  if (only && route !== only) continue
  const htmlPath = path.join(DIST, ...route.split('/').filter(Boolean), 'index.html')
  if (!existsSync(htmlPath)) continue

  const p = parse(readFileSync(htmlPath, 'utf8'))
  const topics = JSON.parse(readFileSync(path.join(KW, file), 'utf8'))
  const all = [...new Set(topics.flatMap((t) => t.keywords))]

  const results = all.map((k) => placement(k, p)).filter(Boolean)
  const placed = results.filter((r) => r.slots.length)
  const prominent = results.filter((r) => r.slots.some((s) => s !== 'body'))

  for (const r of results) if (r.count >= STUFF_AT) stuffed.push({ route, ...r })

  rows.push({
    route,
    total: results.length,
    placed: placed.length,
    prominent: prominent.length,
    results,
  })

  if (only) {
    console.log(`\n${route}`)
    console.log(`  ${results.length} assigned keywords, ${prominent.length} in a prominent slot.\n`)
    console.log('  Covered prominently:')
    for (const r of prominent.slice(0, 25)) {
      console.log(`    [${r.slots.join(',')}]`.padEnd(30) + r.kw)
    }
    const missing = results.filter((r) => !r.slots.length)
    console.log(`\n  Not present at all (${missing.length}) - pick only the few worth a real sentence:`)
    for (const r of missing.slice(0, 30)) console.log(`    ${r.kw}`)
    if (missing.length > 30) console.log(`    ... and ${missing.length - 30} more`)
    console.log('\n  Do not try to cover these all. Choose the ones a reader would actually search,')
    console.log('  and work them into a heading, an FAQ answer or the opening paragraph as prose.')
  }
}

if (stuffingOnly || !only) {
  if (!only) {
    console.log('Keyword placement by page (prominent = title/meta/h1/h2/intro/alt/link):\n')
    rows.sort((a, b) => a.prominent / a.total - b.prominent / b.total)
    for (const r of rows) {
      const pct = ((r.prominent / r.total) * 100).toFixed(1)
      console.log(`  ${String(r.prominent).padStart(4)}/${String(r.total).padEnd(5)} ${pct.padStart(5)}%  ${r.route}`)
    }
  }
  console.log(`\nOver-use check (a term appearing ${STUFF_AT}+ times in body text):`)
  if (!stuffed.length) {
    console.log('  None. No page is repeating a target phrase unnaturally.')
  } else {
    stuffed.sort((a, b) => b.count - a.count)
    for (const s of stuffed.slice(0, 25)) {
      console.log(`  ${String(s.count).padStart(3)}x  ${s.route}  "${s.kw}"`)
    }
    if (stuffed.length > 25) console.log(`  ... and ${stuffed.length - 25} more`)
    console.log('\n  High counts are usually a common word inside longer phrases - check before editing.')
  }
}
