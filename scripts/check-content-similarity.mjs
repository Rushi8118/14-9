#!/usr/bin/env node
/**
 * Fails the build when prerendered pages are near-duplicates of each other.
 *
 * Why this exists: an earlier version of this site shipped 35 work-visa
 * country pages that were one template with the country name swapped
 * (measured 0.94-0.97 similarity, see docs/seo/ranking-diagnosis.md §3.3).
 * Google treats that as scaled content abuse, and it suppressed the whole
 * domain rather than just those pages.
 *
 *   npm run check:similarity            report only
 *   npm run check:similarity -- --fail  exit 1 when any pair breaches
 *
 * Thresholds live in scripts/lib/similarity.mjs and are deliberately strict.
 * Raising them to make a build pass is not a fix; it reinstates the problem
 * the gate exists to catch.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FAIL_AT, WARN_AT, MIN_WORDS, buildEntityVocabulary, extractMainText, fingerprint, jaccard,
} from './lib/similarity.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const shouldFail = process.argv.includes('--fail')

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (name === 'index.html') acc.push(p)
  }
  return acc
}

if (!existsSync(DIST)) {
  console.error('dist/ not found - run `npm run build` first.')
  process.exit(shouldFail ? 1 : 0)
}

const docs = []
for (const file of walk(DIST)) {
  const rel = path.relative(DIST, path.dirname(file)).split(path.sep).join('/')
  const url = rel === '' || rel === '.' ? '/' : '/' + rel
  const raw = extractMainText(readFileSync(file, 'utf8'))
  if (raw) docs.push({ url, raw })
}
// One vocabulary for the whole corpus, so a page copied from another route
// cannot hide behind the donor's country name still being present.
const vocab = buildEntityVocabulary(docs.map((d) => d.url))
const pages = docs.map((d) => fingerprint(d.url, d.raw, vocab))

const thin = pages.filter((p) => p.words < MIN_WORDS).sort((a, b) => a.words - b.words)

const pairs = []
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const score = jaccard(pages[i].sh, pages[j].sh)
    if (score >= WARN_AT) pairs.push({ a: pages[i].route, b: pages[j].route, score })
  }
}
pairs.sort((x, y) => y.score - x.score)
const breaches = pairs.filter((p) => p.score >= FAIL_AT)

console.log(`Scanned ${pages.length} prerendered pages.`)
console.log('')

if (thin.length) {
  console.log(`Thin pages (<${MIN_WORDS} words): ${thin.length}`)
  for (const p of thin.slice(0, 15)) console.log(`  ${String(p.words).padStart(5)}  ${p.route}`)
  if (thin.length > 15) console.log(`  ... and ${thin.length - 15} more`)
  console.log('')
}

if (!pairs.length) {
  console.log(`No page pair scored above ${WARN_AT}. Nothing to review.`)
} else {
  console.log(`Near-duplicate pairs (>=${WARN_AT}), entity names neutralised:`)
  for (const p of pairs.slice(0, 40)) {
    console.log(`  ${p.score.toFixed(3)} ${p.score >= FAIL_AT ? 'FAIL' : 'warn'}  ${p.a}  vs  ${p.b}`)
  }
  if (pairs.length > 40) console.log(`  ... and ${pairs.length - 40} more`)
}

console.log(
  `${breaches.length} pair(s) at or above the ${FAIL_AT} fail threshold, ` +
  `${pairs.length - breaches.length} warning(s), ${thin.length} thin page(s).`,
)

if (shouldFail && (breaches.length || thin.length)) {
  console.error('')
  console.error('Blocked: rewrite the flagged pages so each carries substance the others do not.')
  process.exit(1)
}
