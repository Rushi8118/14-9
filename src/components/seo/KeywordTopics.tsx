import { Search } from 'lucide-react'
import { KEYWORD_MAP } from '@/content/keyword-map.generated'

type KeywordTopicsProps = {
  /** Route path the keywords were mapped to, e.g. `/work-visa/germany`. */
  path: string
}

/**
 * The searches from docs/seo/keyword-strategy.csv that this page is the answer
 * for. Rendered as visible copy, since hidden or meta keywords are ignored by
 * search engines. The list is capped and filtered by scripts/build-keyword-map.mjs.
 */
export function KeywordTopics({ path }: KeywordTopicsProps) {
  const keywords = KEYWORD_MAP[path]
  if (!keywords?.length) return null

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
        <ul className="mt-6 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <li
              key={keyword}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-sm text-foreground/90"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>{keyword}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
