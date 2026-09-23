import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Loader2, Plus, RefreshCw, Sparkles, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  jobTermFrom,
  suggestUrgentKeywords,
  type KeywordSuggestions,
  type UrgentKeywordInput,
} from '@/lib/seo/keyword-suggest'

const keyFor = (input: UrgentKeywordInput) =>
  [input.country.trim().toLowerCase(), jobTermFrom(input), (input.visaType || '').trim().toLowerCase()].join('|')

/**
 * Loads keyword suggestions for the job and country being edited. Reloads
 * (debounced) whenever the country, job or visa type changes, and reports
 * which input the current `data` belongs to so callers can ignore stale results.
 */
export function useKeywordSuggestions(input: UrgentKeywordInput, enabled = true) {
  const [data, setData] = useState<KeywordSuggestions | null>(null)
  const [dataKey, setDataKey] = useState('')
  const [loading, setLoading] = useState(false)
  const key = keyFor(input)
  const latest = useRef(input)
  latest.current = input
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const current = latest.current
    if (!current.country.trim()) {
      setData(null)
      setDataKey('')
      return
    }
    const id = ++requestId.current
    setLoading(true)
    try {
      const result = await suggestUrgentKeywords(current)
      if (id === requestId.current) {
        setData(result)
        setDataKey(keyFor(current))
      }
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const timer = setTimeout(() => void load(), 900)
    return () => clearTimeout(timer)
  }, [key, enabled, load])

  return { data, loading, refresh: load, isCurrent: dataKey === key && data !== null }
}

type KeywordSuggestPanelProps = {
  suggestions: ReturnType<typeof useKeywordSuggestions>
  country: string
  focusKeyword: string
  selected: string[]
  onAdd: (keywords: string[]) => void
  onSetFocus: (keyword: string) => void
}

export function KeywordSuggestPanel({
  suggestions,
  country,
  focusKeyword,
  selected,
  onAdd,
  onSetFocus,
}: KeywordSuggestPanelProps) {
  const { data, loading, refresh } = suggestions
  const chosen = new Set([...selected, focusKeyword].map((k) => k.toLowerCase()))

  if (!country.trim()) {
    return (
      <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
        Enter a country and job title to get popular keyword suggestions automatically.
      </p>
    )
  }

  const group = (label: string, icon: React.ReactNode, hint: string, list: string[]) => {
    const remaining = list.filter((k) => !chosen.has(k.toLowerCase()))
    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {icon} {label} <span className="font-normal normal-case">({list.length})</span>
          </p>
          {remaining.length > 0 && (
            <button
              type="button"
              onClick={() => onAdd(remaining)}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Add all {remaining.length}
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {list.map((k) => {
            const isChosen = chosen.has(k.toLowerCase())
            return (
              <span
                key={k}
                className={cn(
                  'inline-flex max-w-full items-center overflow-hidden rounded-full border text-[11px]',
                  isChosen ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                )}
              >
                <button
                  type="button"
                  disabled={isChosen}
                  onClick={() => onAdd([k])}
                  className="inline-flex min-w-0 items-center gap-1 py-0.5 pl-2 pr-1.5 hover:text-primary disabled:cursor-default"
                  title={isChosen ? 'Already added' : 'Add as keyword'}
                >
                  {isChosen ? <Check className="h-3 w-3 shrink-0" /> : <Plus className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{k}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetFocus(k)}
                  className={cn(
                    'border-l border-inherit px-1.5 py-0.5 hover:text-primary',
                    focusKeyword.toLowerCase() === k.toLowerCase() && 'text-primary',
                  )}
                  title="Use as focus keyword"
                  aria-label={`Use "${k}" as focus keyword`}
                >
                  <Star className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggested keywords for {country}
        </p>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void refresh()} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1">{loading ? 'Searching…' : 'Refresh'}</span>
        </Button>
      </div>

      {!data && loading && <p className="text-xs text-muted-foreground">Searching popular keywords…</p>}

      {data && (
        <>
          {data.google.length > 0
            ? group('Popular Google searches', <TrendingUp className="h-3.5 w-3.5" />, 'What people are typing now for this job and country. No search volumes available.', data.google)
            : data.googleError && <p className="text-[11px] text-muted-foreground">Google suggestions unavailable: {data.googleError}</p>}
          {data.plan.length > 0 &&
            group('From our keyword plan', <Star className="h-3.5 w-3.5" />, `${country} keywords from the site's SEO keyword plan.`, data.plan)}
          {!data.google.length && !data.plan.length && (
            <p className="text-xs text-muted-foreground">No suggestions found for this job and country yet.</p>
          )}
        </>
      )}
      <p className="text-[11px] text-muted-foreground">
        Click <Plus className="inline h-3 w-3" /> to add a keyword, <Star className="inline h-3 w-3" /> to make it the focus keyword.
        Guarantee, "free visa" and similar claims are filtered out.
      </p>
    </div>
  )
}
