/**
 * Lazy access to the per-page keyword lists written by
 * scripts/build-keyword-map.mjs (src/content/keywords/*.json). Each file is
 * its own chunk, so callers only download the list they ask for.
 */
export type KeywordTopic = { topic: string; keywords: string[] }

const FILES = import.meta.glob<KeywordTopic[]>('./keywords/*.json', { import: 'default' })

/** `/work-visa/germany` → `work-visa--germany`; `/` → `home`. */
export const keywordFileId = (path: string) =>
  path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '--')

export function hasPageKeywords(path: string): boolean {
  return `./keywords/${keywordFileId(path)}.json` in FILES
}

/** Every keyword mapped to a page, grouped by topic. Empty if the page has none. */
export async function loadPageKeywords(path: string): Promise<KeywordTopic[]> {
  const load = FILES[`./keywords/${keywordFileId(path)}.json`]
  return load ? load() : []
}

/**
 * Slugs of every country that has a `/work-visa/<slug>` keyword list.
 *
 * Reads only the glob's keys, which Vite resolves at build time, so this
 * downloads nothing — the JSON chunks stay lazy. It is the authoritative
 * country set for keyword suggestion: a country absent here has no keyword
 * plan to suggest from.
 */
export function workVisaKeywordSlugs(): string[] {
  return Object.keys(FILES)
    .map((key) => /^\.\/keywords\/work-visa--([a-z0-9-]+)\.json$/.exec(key)?.[1])
    .filter((slug): slug is string => Boolean(slug))
}
