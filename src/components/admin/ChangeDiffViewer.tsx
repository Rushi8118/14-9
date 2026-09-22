import { useState, useMemo } from 'react'
import { computeDetailedChanges, type ChangeItem } from '@/lib/diff-utils'
import { Button } from '@/components/ui/button'
import { Code2, Table } from 'lucide-react'

type ChangeDiffViewerProps = {
  oldValue?: unknown
  newValue?: unknown
  changes?: ChangeItem[]
  details?: Record<string, unknown>
  action?: string
  actionType?: 'Created' | 'Updated' | 'Deleted' | string
  tableName?: string
  recordId?: string
  className?: string
}

function ExpandableValue({ value, isOld }: { value: string; isOld?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isDash = value === '—' || !value
  const isLong = value.length > 75

  if (isDash) {
    return <span className="text-muted-foreground/60 font-mono">—</span>
  }

  return (
    <div className="space-y-1">
      <div className={`break-words text-xs font-mono leading-relaxed select-all ${isOld ? 'text-muted-foreground' : 'text-foreground'}`}>
        {isLong && !expanded ? `${value.slice(0, 75)}…` : value}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-medium text-primary hover:underline focus:outline-hidden"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

export function ChangeDiffViewer({
  oldValue,
  newValue,
  changes: propChanges,
  details,
  action,
  actionType: propActionType,
  tableName: propTableName,
  recordId: propRecordId,
  className = '',
}: ChangeDiffViewerProps) {
  const [showJson, setShowJson] = useState(false)

  const resolvedActionType = useMemo<'Created' | 'Updated' | 'Deleted'>(() => {
    if (propActionType === 'Created' || propActionType === 'Updated' || propActionType === 'Deleted') {
      return propActionType
    }
    const fromDetails = details?.action_type as string
    if (fromDetails === 'Created' || fromDetails === 'Updated' || fromDetails === 'Deleted') {
      return fromDetails
    }
    const act = (action || '').toLowerCase()
    if (act.includes('created') || act.includes('create')) return 'Created'
    if (act.includes('deleted') || act.includes('delete')) return 'Deleted'
    return 'Updated'
  }, [propActionType, details?.action_type, action])

  const resolvedTableName = (
    propTableName ||
    (details?.table_name as string) ||
    (details?.resource as string) ||
    'record'
  )

  const resolvedRecordId = (
    propRecordId ||
    (details?.record_id as string) ||
    (details?.resourceId as string) ||
    ''
  )

  const resolvedOldValue = oldValue ?? details?.old_value ?? details?.oldValue
  const resolvedNewValue = newValue ?? details?.new_value ?? details?.newValue

  // Extract or compute changes list
  const changes = useMemo<ChangeItem[]>(() => {
    // 1. If explicit changes passed via prop
    if (Array.isArray(propChanges)) {
      return propChanges
    }

    // 2. If explicit changes exist in details
    if (details && Array.isArray(details.changes)) {
      return details.changes.map((c: any) => ({
        field: c.field || 'field',
        field_name: c.field_name || c.label || c.field || 'Field',
        old_value: String(c.old_value ?? c.from ?? '—'),
        new_value: String(c.new_value ?? c.to ?? '—'),
        fromRaw: c.fromRaw ?? c.from,
        toRaw: c.toRaw ?? c.to,
      }))
    }

    // 3. Compute from old and new values
    if (resolvedOldValue !== undefined || resolvedNewValue !== undefined) {
      const res = computeDetailedChanges(
        resolvedOldValue,
        resolvedNewValue,
        resolvedActionType,
        { tableName: resolvedTableName, recordId: resolvedRecordId }
      )
      return res.changes
    }

    return []
  }, [propChanges, details, resolvedOldValue, resolvedNewValue, resolvedActionType, resolvedTableName, resolvedRecordId])

  const hasChanges = changes.length > 0
  const hasPayloadData = resolvedOldValue !== undefined || resolvedNewValue !== undefined || changes.length > 0 || (details && Object.keys(details).length > 0)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Changes
        </h3>
        {hasPayloadData && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowJson(!showJson)}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {showJson ? (
              <>
                <Table className="mr-1 h-3 w-3" /> Table view
              </>
            ) : (
              <>
                <Code2 className="mr-1 h-3 w-3" /> Raw JSON
              </>
            )}
          </Button>
        )}
      </div>

      {showJson ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Old Value
            </p>
            <pre className="max-h-60 overflow-auto rounded-lg border border-border/70 bg-card p-2.5 font-mono text-[11px] text-muted-foreground select-all">
              {resolvedOldValue != null ? JSON.stringify(resolvedOldValue, null, 2) : '—'}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">
              New Value
            </p>
            <pre className="max-h-60 overflow-auto rounded-lg border border-border/70 bg-card p-2.5 font-mono text-[11px] text-foreground select-all">
              {resolvedNewValue != null ? JSON.stringify(resolvedNewValue, null, 2) : '—'}
            </pre>
          </div>
        </div>
      ) : hasChanges ? (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/70 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 w-[30%]">Field</th>
                <th className="px-3 py-2 w-[35%]">Old Value</th>
                <th className="px-3 py-2 w-[35%]">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {changes.map((c, idx) => (
                <tr key={`${c.field}-${idx}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 align-top font-medium text-foreground">
                    {c.field_name}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <ExpandableValue value={c.old_value} isOld />
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <ExpandableValue value={c.new_value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">No values changed</p>
        </div>
      )}
    </div>
  )
}
