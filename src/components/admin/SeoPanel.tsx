import { useMemo } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyzeSeoContent, type SeoAnalysisInput } from '@/lib/seo/seoAnalyzer'
import { SITE_URL } from '@/lib/seo/site'

type SeoPanelProps = SeoAnalysisInput & {
  pathPrefix: string // e.g. '/blog' or '/urgent-requirements'
  socialImage?: string
  className?: string
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 55 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className={cn('relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4', color, 'border-current/25')}>
        <span className={cn('text-lg font-bold', color)}>{score}</span>
      </div>
      <div>
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
    props.content, props.faqCount, props.imageAlt, props.existingSlugs, props.existingTitles, props.currentSlug,
  ])

  const url = `${SITE_URL}${props.pathPrefix}/${props.slug || '(slug)'}`
  const displayTitle = (props.metaTitle || props.title || 'Untitled').slice(0, 70)
  const displayDesc = (props.metaDescription || '').slice(0, 160) || 'No meta description set yet.'

  return (
    <div className={cn('space-y-5 rounded-2xl border border-border bg-card p-5', props.className)}>
      <ScoreRing score={analysis.score} />

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

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
        <ul className="space-y-1.5">
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

      {analysis.issues.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Findings</p>
          <ul className="space-y-2">
            {analysis.issues.map((issue) => {
              const Icon = SEVERITY_ICON[issue.severity]
              return (
                <li key={issue.id} className="flex items-start gap-2 text-xs">
                  <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', SEVERITY_CLASS[issue.severity])} />
                  <span className="text-muted-foreground">{issue.message}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

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
            <img src={props.socialImage} alt="" className="h-32 w-full object-cover" />
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
}
