import { useMemo, useState } from 'react'
import { Bot, KeyRound, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminAiSettings } from '@/hooks/useAdminAiSettings'
import {
  generateBlogPost,
  type BlogCategory,
  type BlogGenerateMode,
  type GeneratedBlogPost,
} from '@/lib/ai/blog-generator'
import { getActiveApiKey, getActiveModel } from '@/lib/ai/providers'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

const CATEGORY_OPTIONS: { value: BlogCategory | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Auto-choose' },
  { value: 'study_visa', label: 'Study visa' },
  { value: 'work_visa', label: 'Work visa' },
  { value: 'country_guide', label: 'Country guide' },
  { value: 'tips', label: 'Tips' },
  { value: 'document_guide', label: 'Documents' },
  { value: 'immigration_news', label: 'Immigration news' },
  { value: 'success_story', label: 'Success story' },
  { value: 'general', label: 'General' },
]

type AiBlogWriterProps = {
  onGenerated: (draft: GeneratedBlogPost) => void
  existingPosts?: { title: string; slug: string }[]
  urgentRequirements?: { title: string; slug: string }[]
}

export function AiBlogWriter({ onGenerated, existingPosts, urgentRequirements }: AiBlogWriterProps) {
  const { settings, loading } = useAdminAiSettings()
  const [mode, setMode] = useState<BlogGenerateMode>('auto')
  const [keywords, setKeywords] = useState('')
  const [instructions, setInstructions] = useState('')
  const [category, setCategory] = useState<BlogCategory | 'auto'>('auto')
  const [generating, setGenerating] = useState(false)

  const hasKey = useMemo(() => Boolean(getActiveApiKey(settings)), [settings])
  const model = useMemo(() => getActiveModel(settings), [settings])

  const handleGenerate = async () => {
    if (!hasKey) {
      toast.error('Add an AI API key in Settings first.')
      return
    }
    if (mode === 'keywords' && !keywords.trim()) {
      toast.error('Enter at least one keyword or topic.')
      return
    }

    setGenerating(true)
    try {
      const draft = await generateBlogPost(settings, {
        mode,
        keywords,
        instructions,
        websiteContext: settings.websiteContext,
        preferredCategory: category === 'auto' ? undefined : category,
        existingPosts,
        urgentRequirements,
      })
      onGenerated(draft)
      toast.success('Draft ready — review SEO fields, then publish or save as private draft.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI generation failed')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading AI settings…
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Blog Writer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Provider: <strong>{settings.activeProvider}</strong> · Model:{' '}
            <strong>{model}</strong>
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/admin/settings">
            <KeyRound className="h-4 w-4" />
            AI Settings
          </Link>
        </Button>
      </div>

      {!hasKey && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          No API key configured for <strong>{settings.activeProvider}</strong>. Add Gemini or
          OpenRouter keys under Settings so all admins can generate posts.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode('auto')}
          className={`rounded-xl border p-4 text-left transition ${
            mode === 'auto' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Bot className="h-4 w-4" /> All Auto
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            AI picks SEO keywords and writes a full post tailored to this website.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode('keywords')}
          className={`rounded-xl border p-4 text-left transition ${
            mode === 'keywords'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Wand2 className="h-4 w-4" /> Keyword list
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            You provide keywords / topics; AI writes and SEO-optimizes the article.
          </p>
        </button>
      </div>

      {mode === 'keywords' && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Keywords / topics
          </label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            rows={3}
            placeholder="e.g. study visa Canada from Surat, IELTS requirement, SOP tips"
            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Extra instructions (optional)
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Tone, country focus, include comparison table, mention Surat office…"
          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Category hint
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as BlogCategory | 'auto')}
          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generating || !hasKey}
        className="w-full gap-2 sm:w-auto"
      >
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {generating ? 'Generating SEO article…' : 'Generate with AI'}
      </Button>
    </div>
  )
}
