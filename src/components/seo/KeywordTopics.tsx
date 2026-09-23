import { useEffect, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { KEYWORD_MAP } from '@/content/keyword-map.generated'

type KeywordTopic = { topic: string; keywords: string[] }

// One chunk per page, so a page only downloads its own keywords.
const ALL_KEYWORDS = import.meta.glob<KeywordTopic[]>('../../content/keywords/*.json', {
  import: 'default',
})

const fileFor = (path: string) =>
  `../../content/keywords/${path === '/' ? 'home' : path.slice(1).replace(/\//g, '--')}.json`

type KeywordTopicsProps = {
  /** Route path the keywords were mapped to, e.g. `/work-visa/germany`. */
  path: string
}

/**
 * The searches from docs/seo/keyword-strategy.csv that this page is the answer
 * for, rendered as visible copy (hidden or meta keywords are ignored by search
 * engines). The strongest 12 show first; the rest sit in an expander, grouped
 * by topic. Both lists come from scripts/build-keyword-map.mjs.
 */
export function KeywordTopics({ path }: KeywordTopicsProps) {
  const featured = KEYWORD_MAP[path] ?? []
  const [topics, setTopics] = useState<KeywordTopic[]>([])

  useEffect(() => {
    const load = ALL_KEYWORDS[fileFor(path)]
    if (!load) return
    let active = true
    load()
      .then((data) => {
        if (active) setTopics(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [path])

  const total = topics.reduce((n, t) => n + t.keywords.length, 0)
  if (!featured.length && !total) return null

  return (
    <section aria-labelledby="popular-searches" className="border-t border-border/40 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2
          id="popular-searches"
          className="font-serif text-xl font-semibold text-foreground md:text-2xl"
        >
          Popular searches this page answers
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          People reach us with questions like these. If yours is one of them, book a free
          eligibility consultation and we will answer it for your profile.
        </p>

        {featured.length ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {featured.map((keyword) => (
              <li
                key={keyword}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-sm text-foreground/90"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>{keyword}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {total > featured.length ? (
          <details className="group mt-6 rounded-2xl border border-border/60 bg-card/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
              <span>See all {total.toLocaleString('en-IN')} searches</span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-6 border-t border-border/40 px-5 py-5">
              {topics.map(({ topic, keywords }) => (
                <div key={topic}>
                  <h3 className="text-sm font-semibold text-foreground">
                    {topic}{' '}
                    <span className="font-normal text-muted-foreground">({keywords.length})</span>
                  </h3>
                  <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    {keywords.map((keyword) => (
                      <li key={keyword}>{keyword}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  )
}
