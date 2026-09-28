/**
 * Near-duplicate detection shared by the similarity gate and the content
 * generation pipeline, so a page is scored the same way whether it is being
 * checked after the fact or before it is ever written.
 *
 * Similarity is measured with entity names neutralised. Two pages that differ
 * only by their country name score ~1.0 rather than looking distinct, which is
 * the failure mode that got 35 work-visa pages filtered
 * (docs/seo/ranking-diagnosis.md §3.3). AI-written pages fail the same way
 * while reading as original prose, so this check is not optional for them.
 */

/** Pairs at or above this are near-duplicates and must not be published. */
export const FAIL_AT = 0.80
/** Pairs at or above this are worth a look but do not block. */
export const WARN_AT = 0.65
/** Below this word count a page is too thin to compete, duplicate or not. */
export const MIN_WORDS = 350

export function neutralise(text, entities) {
  // Plain case-insensitive substring replacement, so entity names never have
  // to be escaped into a regex.
  let out = text
  for (const e of entities) {
    if (!e || e.length < 3) continue
    const needle = e.toLowerCase()
    let lower = out.toLowerCase()
    let at = lower.indexOf(needle)
    while (at !== -1) {
      out = out.slice(0, at) + ' _E_ ' + out.slice(at + needle.length)
      lower = out.toLowerCase()
      at = lower.indexOf(needle, at + 5)
    }
  }
  return out
}

/** Visible text of a prerendered page's <main>, markup and scripts removed. */
export function extractMainText(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i)
  if (!main) return ''
  return main[0]
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Jaccard over 5-word shingles: order-sensitive enough to catch reskins. */
export function shingles(text, n = 5) {
  const w = text.toLowerCase().replace(/[^a-z0-9\s_]/g, ' ').split(/\s+/).filter(Boolean)
  const set = new Set()
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(' '))
  return set
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const s of a) if (b.has(s)) inter++
  return inter / (a.size + b.size - inter)
}

/** Entity tokens to neutralise for a route, derived from its last segment. */
export function entitiesForRoute(route) {
  const segs = String(route).split('/').filter(Boolean)
  const last = (segs[segs.length - 1] ?? '').replace(/-/g, ' ')
  return [last, last.replace(/\s/g, '')]
}

/**
 * Every entity name on the site, so each page has all of them removed rather
 * than only its own.
 *
 * Neutralising just the page's own name is not enough: a verbatim copy of
 * /work-visa/africa placed at /work-visa/sweden would keep the word "africa",
 * and that single surviving token dropped a perfect clone to 0.794 - under
 * the 0.80 fail threshold. A duplicate must score ~1.0 regardless of which
 * route it is proposed for.
 */
export function buildEntityVocabulary(routes) {
  const vocab = new Set()
  for (const r of routes) for (const e of entitiesForRoute(r)) if (e && e.length >= 3) vocab.add(e)
  // Longest first, so "new zealand" is consumed before "zealand".
  return [...vocab].sort((a, b) => b.length - a.length)
}

/**
 * Fingerprint a page once so it can be compared many times.
 * Pass `vocab` (from buildEntityVocabulary) so all entity names are removed,
 * not just this route's own.
 */
export function fingerprint(route, rawText, vocab = null) {
  const entities = vocab ?? entitiesForRoute(route)
  return {
    route,
    words: rawText ? rawText.split(/\s+/).filter(Boolean).length : 0,
    sh: shingles(neutralise(rawText, entities)),
  }
}

/**
 * Score one candidate against a corpus.
 * @returns {{ worst: number, worstAgainst: string|null, breaches: Array<{route:string,score:number}> }}
 */
export function scoreAgainstCorpus(candidate, corpus, failAt = FAIL_AT) {
  let worst = 0
  let worstAgainst = null
  const breaches = []
  for (const other of corpus) {
    if (other.route === candidate.route) continue
    const score = jaccard(candidate.sh, other.sh)
    if (score > worst) { worst = score; worstAgainst = other.route }
    if (score >= failAt) breaches.push({ route: other.route, score })
  }
  breaches.sort((a, b) => b.score - a.score)
  return { worst, worstAgainst, breaches }
}
