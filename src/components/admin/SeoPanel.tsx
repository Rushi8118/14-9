import { useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, Search, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { analyzeSeoContent, type SeoAnalysisInput } from '@/lib/seo/seoAnalyzer'
import { SITE_URL } from '@/lib/seo/site'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminAiSettings } from '@/hooks/useAdminAiSettings'
import { fetchTrendingKeywords, generateAiText, type AiFeature } from '@/lib/ai/providers'
import { extractJson } from '@/lib/ai/schemas'

/** Fields the optimizer may propose; editors map them onto their own form. */
export type SeoImprovement = {
  title?: string
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  content?: string
  imageAlt?: string
}

type SeoPanelProps = SeoAnalysisInput & {
  className?: string
  pathPrefix: string
  contentFormat?: 'html' | 'markdown'
  aiFeature?: AiFeature | 'urgent_requirement'
  socialImage?: string
  layout?: 'sidebar' | 'full'
  /** Enables "Improve with AI" + trending keyword import when provided. */
  onApply?: (patch: SeoImprovement) => void
  /** Adds imported keywords as secondary/related keywords. */
  onAddKeywords?: (keywords: string[]) => void
}

const FIELD_LABELS: Record<keyof SeoImprovement, string> = {
  title: 'Title',
  metaTitle: 'SEO title',
  metaDescription: 'Meta description',
  focusKeyword: 'Focus keyword',
  content: 'Content',
  imageAlt: 'Image alt text',
}

function SeoOptimizer(props: SeoPanelProps & { failing: string[] }) {
  const { settings } = useAdminAiSettings()
  const [improving, setImproving] = useState(false)
  const [proposal, setProposal] = useState<SeoImprovement | null>(null)
  const [selected, setSelected] = useState<Set<keyof SeoImprovement>>(new Set())
  const [seed, setSeed] = useState('')
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [trends, setTrends] = useState<string[]>([])
  const format = props.contentFormat ?? 'html'

  const improve = async () => {
    if (improving) return
    setImproving(true)
    setProposal(null)
    try {
      const prompt = [
        'You are an SEO editor for an immigration & visa consultancy website. Improve the page below for Google search while keeping every fact accurate.',
        'Rules: do not invent prices, dates, laws, success rates or guarantees; keep the same meaning and language; write naturally for humans (no keyword stuffing).',
        'Targets: SEO title 30-60 chars containing the focus keyword; meta description 120-160 chars containing the focus keyword with a clear call to action; focus keyword in the first paragraph and in at least one H2; 2+ H2 sections; keyword density 0.5-3%; short sentences; descriptive image alt text.',
        `Content format: ${format === 'html' ? 'HTML (use <h2>, <h3>, <p>, <ul>)' : 'Markdown (use ## and ### headings)'}. Return the FULL improved content, not a summary.`,
        props.failing.length ? `Currently failing checks: ${props.failing.join('; ')}.` : '',
        'Reply with ONLY a JSON object with these optional string keys: title, metaTitle, metaDescription, focusKeyword, content, imageAlt. Omit any key you would not change.',
        '',
        `Title: ${props.title}`,
        `SEO title: ${props.metaTitle || ''}`,
        `Meta description: ${props.metaDescription || ''}`,
        `Focus keyword: ${props.focusKeyword || '(none — choose the best one)'}`,
        `Image alt: ${props.imageAlt || ''}`,
        'Content:',
        props.content,
      ].join('\n')
      const raw = await generateAiText(settings, [{ role: 'user', content: prompt }], props.aiFeature ?? 'blog')
      const json = extractJson(raw)
      if (!json || typeof json !== 'object') throw new Error('The AI response could not be read. Please try again.')
      const current: Record<keyof SeoImprovement, string> = {
        title: props.title || '', metaTitle: props.metaTitle || '', metaDescription: props.metaDescription || '',
        focusKeyword: props.focusKeyword || '', content: props.content || '', imageAlt: props.imageAlt || '',
      }
      const next: SeoImprovement = {}
      for (const key of Object.keys(FIELD_LABELS) as (keyof SeoImprovement)[]) {
        const value = (json as Record<string, unknown>)[key]
        if (typeof value !== 'string' || !value.trim() || value.trim() === current[key].trim()) continue
        // Guard against the model returning a truncated article.
        if (key === 'content' && value.trim().length < current.content.trim().length * 0.6) continue
        next[key] = value.trim()
      }
      if (Object.keys(next).length === 0) {
        toast.info('No improvements suggested — this content already looks good.')
        return
      }
      setProposal(next)
      setSelected(new Set(Object.keys(next) as (keyof SeoImprovement)[]))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not improve SEO. Please try again.')
    } finally {
      setImproving(false)
    }
  }

  const applySelected = () => {
    if (!proposal) return
    const patch: SeoImprovement = {}
    for (const key of selected) patch[key] = proposal[key]
    props.onApply?.(patch)
    setProposal(null)
    toast.success('SEO improvements applied. Review and save your changes.')
  }

  const loadTrends = async () => {
    const query = (seed || props.focusKeyword || props.title || '').trim()
    if (!query) { toast.error('Enter a keyword to search trends for.'); return }
    setLoadingTrends(true)
    try {
      const list = await fetchTrendingKeywords(query)
      setTrends(list)
      if (list.length === 0) toast.info('No popular searches found for that keyword.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load trending keywords.')
    } finally {
      setLoadingTrends(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <p className="mb-2 text-xs text-muted-foreground">
          {props.failing.length > 0
            ? `${props.failing.length} check${props.failing.length === 1 ? '' : 's'} failing. Let AI rewrite the SEO fields for you — you choose what to apply.`
            : 'All checks pass. You can still ask AI for a polish.'}
        </p>
        <Button type="button" size="sm" className="w-full" onClick={improve} disabled={improving || !props.content?.trim()}>
          {improving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {improving ? 'Improving…' : 'Improve SEO with AI'}
        </Button>

        {proposal && (
          <div className="mt-3 space-y-2">
            {(Object.keys(proposal) as (keyof SeoImprovement)[]).map((key) => (
              <label key={key} className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background p-2 text-xs">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={selected.has(key)}
                  onChange={(e) => setSelected((prev) => {
                    const copy = new Set(prev)
                    if (e.target.checked) copy.add(key); else copy.delete(key)
                    return copy
                  })}
                />
                <span className="min-w-0">
                  <span className="font-semibold text-foreground">{FIELD_LABELS[key]}</span>
                  <span className="mt-0.5 block line-clamp-3 break-words text-muted-foreground">
                    {key === 'content' ? `Rewritten article (${proposal.content?.length ?? 0} characters)` : proposal[key]}
                  </span>
                </span>
              </label>
            ))}
            <div className="flex gap-2">
              <Button type="button" size="sm" className="flex-1" onClick={applySelected} disabled={selected.size === 0}>Apply selected</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setProposal(null)}>Discard</Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" /> Trending keywords
        </p>
        <div className="flex gap-2">
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void loadTrends() } }}
            placeholder={props.focusKeyword || 'e.g. canada work visa'}
            className="h-8 text-xs min-w-0 flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={loadTrends} disabled={loadingTrends} className="shrink-0">
            {loadingTrends ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
          </Button>
        </div>
        {trends.length > 0 && (
          <>
            <p className="mt-2 text-[11px] text-muted-foreground">Popular Google searches (no volume data). Click to use as focus keyword.</p>
            <div className="mt-2 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
              {trends.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => { props.onApply?.({ focusKeyword: k }); toast.success(`Focus keyword set to "${k}"`) }}
                  className={cn('rounded-full border px-2 py-0.5 text-[11px] transition-colors hover:border-primary hover:text-primary max-w-full truncate',
                    k === props.focusKeyword?.toLowerCase() ? 'border-primary text-primary' : 'border-border text-muted-foreground')}
                >
                  {k}
                </button>
              ))}
            </div>
            {props.onAddKeywords && (
              <Button type="button" size="sm" variant="ghost" className="mt-2 h-7 w-full text-xs"
                onClick={() => { props.onAddKeywords?.(trends.slice(0, 10)); toast.success('Top 10 added as related keywords') }}>
                Add top 10 as related keywords
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 55 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className={cn('relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4', color, 'border-current/25')}>
        <span className={cn('text-lg font-bold', color)}>{score}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">SEO score</p>
        <p className="text-xs text-muted-foreground">Heuristic checklist — not a ranking guarantee.</p>
      </div>
    </div>
  )
}

const SEVERITY_ICON = { error: AlertCircle, warning: AlertTriangle, info: Info } as const
const SEVERITY_CLASS = {
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
} as const

/**
 * Reusable SEO/AI-visibility analyzer sidebar for the Blog and Urgent
 * Requirement editors. Purely client-side heuristics — never claims to
 * predict rankings, traffic, or AI-assistant recommendations.
 */
export function SeoPanel(props: SeoPanelProps) {
  const analysis = useMemo(() => analyzeSeoContent(props), [
    props.title, props.metaTitle, props.metaDescription, props.slug, props.focusKeyword,
    props.content, props.faqCount, props.imageAlt, props.existingSlugs, props.existingTitles, props.currentSlug, props.currentTitle,
  ])

  const url = `${SITE_URL}${props.pathPrefix}/${props.slug || '(slug)'}`
  const displayTitle = (props.metaTitle || props.title || 'Untitled').slice(0, 70)
  const displayDesc = (props.metaDescription || '').slice(0, 160) || 'No meta description set yet.'

  const metricsSection = (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="rounded-lg border border-border p-2.5">
        <p className="font-semibold text-foreground">Readability</p>
        <p className="text-muted-foreground">{analysis.readability.label} ({analysis.readability.score}/100)</p>
      </div>
      <div className="rounded-lg border border-border p-2.5">
        <p className="font-semibold text-foreground">Word count</p>
        <p className={cn('text-muted-foreground', analysis.isThinContent && 'text-amber-600 font-medium')}>
          {analysis.wordCount} words{analysis.isThinContent && ' — thin'}
        </p>
      </div>
      <div className="rounded-lg border border-border p-2.5">
        <p className="font-semibold text-foreground">Headings</p>
        <p className="text-muted-foreground">{analysis.headingStructure.h2Count} H2 · {analysis.headingStructure.h3Count} H3</p>
      </div>
      <div className="rounded-lg border border-border p-2.5">
        <p className="font-semibold text-foreground">Keyword density</p>
        <p className={cn('text-muted-foreground', analysis.keywordPlacement.densityPercent > 3 && 'text-amber-600 font-medium')}>
          {analysis.keywordPlacement.densityPercent}%
        </p>
      </div>
    </div>
  )

  const checklistSection = (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
      <ul className="space-y-1.5 rounded-xl border border-border/60 bg-muted/10 p-3">
        {analysis.checklist.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-xs">
            {item.passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className={item.passed ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  const findingsSection = analysis.issues.length > 0 && (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Findings</p>
      <ul className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
        {analysis.issues.map((issue) => {
          const Icon = SEVERITY_ICON[issue.severity]
          return (
            <li key={issue.id} className="flex items-start gap-2 text-xs">
              <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', SEVERITY_CLASS[issue.severity])} />
              <span className="text-muted-foreground break-words min-w-0">{issue.message}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )

  const previewsSection = (
    <div className="space-y-4">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> Google-style preview
        </p>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="truncate text-xs text-muted-foreground">{url}</p>
          <p className="mt-0.5 truncate text-base text-[#1a0dab] dark:text-[#8ab4f8]">{displayTitle}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{displayDesc}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social preview</p>
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          {props.socialImage && (
            <img src={props.socialImage} alt="" className="h-36 w-full object-cover" />
          )}
          <div className="p-3">
            <p className="truncate text-[11px] uppercase text-muted-foreground">{new URL(SITE_URL).host}</p>
            <p className="truncate text-sm font-semibold text-foreground">{displayTitle}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{displayDesc}</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (props.layout === 'full') {
    return (
      <div className={cn('rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm', props.className)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Column 1: Core Optimization */}
          <div className="space-y-5 min-w-0">
            <ScoreRing score={analysis.score} />
            {props.onApply && (
              <SeoOptimizer {...props} failing={analysis.checklist.filter((c) => !c.passed).map((c) => c.label)} />
            )}
            {previewsSection}
          </div>

          {/* Column 2: Audit & Diagnostics */}
          <div className="space-y-5 min-w-0">
            {metricsSection}
            {checklistSection}
            {findingsSection}
          </div>
        </div>
      </div>
    )
  }

  // Default: sidebar layout
  return (
    <div className={cn('space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5', props.className)}>
      <ScoreRing score={analysis.score} />

      {props.onApply && (
        <SeoOptimizer {...props} failing={analysis.checklist.filter((c) => !c.passed).map((c) => c.label)} />
      )}

      {metricsSection}
      {checklistSection}
      {findingsSection}
      {previewsSection}
    </div>
  )
}
