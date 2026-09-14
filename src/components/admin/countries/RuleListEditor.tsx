import { useId, useState, type KeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, Briefcase, ClipboardList, GraduationCap, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const TONES = {
  work: {
    icon: Briefcase,
    panel: 'border-amber-200 bg-amber-50/60',
    text: 'text-[#8a5800]',
    button: 'bg-[#a66a00] hover:bg-[#8a5800] text-white',
    badge: 'bg-amber-100 text-[#8a5800]',
  },
  study: {
    icon: GraduationCap,
    panel: 'border-sky-200 bg-sky-50/60',
    text: 'text-[#1f5f96]',
    button: 'bg-[#2876b8] hover:bg-[#1f5f96] text-white',
    badge: 'bg-sky-100 text-[#1f5f96]',
  },
} as const

export default function RuleListEditor({
  title,
  description,
  tone,
  rules,
  onChange,
  placeholder,
  onAiRefine,
  aiLoading = false,
  error,
  disabled = false,
}: {
  title: string
  description: string
  tone: keyof typeof TONES
  rules: string[]
  onChange: (rules: string[]) => void
  placeholder: string
  onAiRefine?: () => void
  aiLoading?: boolean
  error?: string
  disabled?: boolean
}) {
  const ids = useId()
  const [input, setInput] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const styles = TONES[tone]
  const Icon = styles.icon

  const append = (candidates: string[]) => {
    const existing = new Set(rules.map((rule) => rule.trim().toLowerCase()))
    const fresh = candidates.map((c) => c.trim()).filter((c) => c && !existing.has(c.toLowerCase()))
    const skipped = candidates.filter((c) => c.trim()).length - fresh.length
    if (fresh.length) onChange([...rules, ...fresh])
    setNotice(skipped > 0 ? `${skipped} duplicate rule${skipped === 1 ? '' : 's'} skipped.` : null)
  }

  const handleAdd = () => {
    if (!input.trim()) return
    append([input])
    setInput('')
  }

  const handleBulkAdd = () => {
    append(bulkText.split(/\r?\n/).map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')))
    setBulkText('')
    setBulkOpen(false)
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rules.length) return
    const next = [...rules]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAdd()
    }
  }

  const iconButton =
    'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--desk-muted)] transition hover:bg-[var(--desk-surface-soft)] hover:text-[var(--desk-navy)] disabled:pointer-events-none disabled:opacity-30'

  return (
    <section aria-labelledby={`${ids}-title`} className="space-y-4">
      <div className={cn('flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between', styles.panel)}>
        <div className="flex items-start gap-3">
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', styles.badge)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 id={`${ids}-title`} className={cn('text-sm font-semibold', styles.text)}>
              {title} <span className="font-normal text-[var(--desk-muted)]">({rules.length})</span>
            </h3>
            <p className="text-sm text-[var(--desk-muted)]">{description}</p>
          </div>
        </div>
        {onAiRefine && (
          <Button
            type="button"
            variant="outline"
            onClick={onAiRefine}
            disabled={disabled || aiLoading || rules.length === 0}
            className="min-h-11 shrink-0 rounded-full border-[var(--desk-line)] bg-white text-[var(--desk-navy)]"
          >
            {aiLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-[var(--desk-gold)]" aria-hidden="true" />
            )}
            {aiLoading ? 'Refining…' : 'Refine with AI'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={`${ids}-new`} className="text-sm font-medium text-[var(--desk-navy)]">
          Add a rule
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={`${ids}-new`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="h-11 flex-1 rounded-xl border-[var(--desk-line)] bg-white"
          />
          <Button type="button" onClick={handleAdd} disabled={disabled || !input.trim()} className={cn('min-h-11 rounded-xl px-5', styles.button)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add rule
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setBulkOpen((open) => !open)}
            aria-expanded={bulkOpen}
            aria-controls={`${ids}-bulk`}
            disabled={disabled}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-semibold text-[#8a6a1a] hover:underline disabled:opacity-50"
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            {bulkOpen ? 'Close bulk paste' : 'Paste several rules at once'}
          </button>
          {notice && (
            <p role="status" className="text-xs text-[var(--desk-muted)]">
              {notice}
            </p>
          )}
        </div>
        {bulkOpen && (
          <div id={`${ids}-bulk`} className="space-y-2 rounded-xl border border-dashed border-[var(--desk-line)] p-3">
            <label htmlFor={`${ids}-bulk-text`} className="text-xs text-[var(--desk-muted)]">
              One rule per line. Bullets and numbering are removed automatically.
            </label>
            <Textarea
              id={`${ids}-bulk-text`}
              rows={5}
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              className="rounded-xl border-[var(--desk-line)] bg-white"
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleBulkAdd} disabled={!bulkText.trim()} className={cn('min-h-10 rounded-full', styles.button)}>
                Add these rules
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--desk-danger)]">
          {error}
        </p>
      )}

      {rules.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--desk-line)] bg-[var(--desk-surface-soft)] px-4 py-8 text-center text-sm text-[var(--desk-muted)]">
          No rules yet. Add the first requirement above.
        </p>
      ) : (
        <ol className="space-y-2">
          {rules.map((rule, index) => (
            <li
              key={index}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-xl border border-[var(--desk-line)] bg-white p-2 transition focus-within:border-[var(--desk-gold)]/60 sm:p-2.5"
            >
              <span className={cn('mt-1.5 grid h-7 min-w-7 place-items-center rounded-full px-1 text-xs font-semibold tabular-nums', styles.badge)}>
                {index + 1}
              </span>
              <Textarea
                aria-label={`${title} rule ${index + 1}`}
                value={rule}
                rows={1}
                disabled={disabled}
                onChange={(event) => onChange(rules.map((r, i) => (i === index ? event.target.value : r)))}
                className="field-sizing-content min-h-10 resize-none border-transparent bg-transparent px-2 py-2 text-sm shadow-none focus-visible:border-[var(--desk-line)]"
              />
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move rule ${index + 1} up`}
                  className={cn(iconButton, 'hidden sm:grid')}
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === rules.length - 1}
                  aria-label={`Move rule ${index + 1} down`}
                  className={cn(iconButton, 'hidden sm:grid')}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(rules.filter((_, i) => i !== index))}
                  disabled={disabled}
                  aria-label={`Remove rule ${index + 1}`}
                  className={cn(iconButton, 'hover:bg-red-50 hover:text-[var(--desk-danger)]')}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
