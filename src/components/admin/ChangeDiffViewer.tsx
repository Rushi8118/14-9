import React, { useState } from 'react'
import { ArrowRight, CheckCircle2, Code2, Columns2, FileEdit, Plus, Trash2 } from 'lucide-react'
import { computeFieldDiffs, type FieldDiff } from '@/lib/diff-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ChangeDiffViewerProps = {
  oldValue?: unknown
  newValue?: unknown
  details?: Record<string, unknown>
  action?: string
  className?: string
}

export function ChangeDiffViewer({
  oldValue,
  newValue,
  details,
  action,
  className = '',
}: ChangeDiffViewerProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual')

  // Extract diffs
  const diffs = React.useMemo(() => {
    // If explicit changes array exists in details
    if (details && Array.isArray(details.changes) && details.changes.length > 0) {
      return details.changes.map((c: any) => ({
        field: c.field || 'field',
        label: c.label || c.field,
        from: c.from,
        to: c.to,
        fromFormatted: String(c.from ?? '—'),
        toFormatted: String(c.to ?? '—'),
        type: (c.from === undefined ? 'added' : c.to === undefined ? 'removed' : 'changed') as 'added' | 'removed' | 'changed',
      })) as FieldDiff[]
    }

    return computeFieldDiffs(oldValue, newValue)
  }, [oldValue, newValue, details])

  const hasDiffs = diffs.length > 0
  const isCreate = action?.includes('create') || (!oldValue && !!newValue)
  const isDelete = action?.includes('delete') || (!!oldValue && !newValue)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with count & toggle buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Changes Recorded
          </span>
          <Badge
            variant="outline"
            className={`text-[11px] font-bold ${
              isDelete
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : isCreate
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-primary/30 bg-primary/10 text-primary'
            }`}
          >
            {isDelete
              ? 'Deleted'
              : isCreate
              ? 'Created'
              : hasDiffs
              ? `${diffs.length} ${diffs.length === 1 ? 'field' : 'fields'} changed`
              : 'Detailed Payload'}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={viewMode === 'visual' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('visual')}
            className="h-7 px-2 text-xs font-medium"
          >
            <Columns2 className="mr-1 h-3 w-3" /> Visual Diffs
          </Button>
          <Button
            type="button"
            variant={viewMode === 'json' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('json')}
            className="h-7 px-2 text-xs font-medium"
          >
            <Code2 className="mr-1 h-3 w-3" /> Raw JSON
          </Button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        hasDiffs ? (
          <div className="space-y-2.5">
            {diffs.map((d) => (
              <div
                key={d.field}
                className="overflow-hidden rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-all hover:border-border"
              >
                {/* Field Label Header */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                    {d.type === 'added' ? (
                      <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    ) : d.type === 'removed' ? (
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span className="font-semibold text-foreground">{d.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">({d.field})</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${
                      d.type === 'added'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : d.type === 'removed'
                        ? 'border-red-500/20 bg-red-500/10 text-red-400'
                        : 'border-border/60 bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {d.type}
                  </Badge>
                </div>

                {/* Diff Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                  {/* Before */}
                  <div className="rounded-lg border border-red-500/25 bg-red-950/25 dark:bg-red-950/30 p-2.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-red-400/90 mb-1">
                      Previous Value
                    </span>
                    <div className="break-words font-mono text-xs text-red-200 line-through decoration-red-400/60 select-all">
                      {d.fromFormatted}
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="hidden sm:flex items-center justify-center text-muted-foreground px-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>

                  {/* After */}
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/25 dark:bg-emerald-950/30 p-2.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mb-1">
                      New Value
                    </span>
                    <div className="break-words font-mono text-xs font-semibold text-emerald-200 select-all">
                      {d.toFormatted}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            {isCreate ? (
              <div className="space-y-1">
                <p className="font-semibold text-foreground">New Record Created</p>
                <pre className="mt-2 max-h-56 overflow-auto text-left rounded-lg bg-card p-3 font-mono text-xs text-emerald-300">
                  {JSON.stringify(newValue || details, null, 2)}
                </pre>
              </div>
            ) : isDelete ? (
              <div className="space-y-1">
                <p className="font-semibold text-red-400">Record Deleted</p>
                <pre className="mt-2 max-h-56 overflow-auto text-left rounded-lg bg-card p-3 font-mono text-xs text-red-300">
                  {JSON.stringify(oldValue || details, null, 2)}
                </pre>
              </div>
            ) : (
              <p>No specific field differences detected between values.</p>
            )}
          </div>
        )
      ) : (
        /* Raw JSON Side-by-Side */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-red-400">
              Before (Old Value)
            </p>
            <pre className="max-h-64 overflow-auto rounded-xl border border-red-500/20 bg-black/60 p-3 font-mono text-xs text-red-200">
              {oldValue != null ? JSON.stringify(oldValue, null, 2) : '— (null)'}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              After (New Value)
            </p>
            <pre className="max-h-64 overflow-auto rounded-xl border border-emerald-500/20 bg-black/60 p-3 font-mono text-xs text-emerald-200">
              {newValue != null ? JSON.stringify(newValue, null, 2) : '— (null)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
