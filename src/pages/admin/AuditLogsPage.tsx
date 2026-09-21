import { useState } from 'react'
import { useAuditLogs, type AuditLog } from '@/hooks/useAuditLogs'
import { Shield, AlertTriangle, Info, Search, Download, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ThemeDatePicker } from '@/components/ui/theme-date-picker'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'sonner'
import { writeAuditLog } from '@/lib/audit-log'

const SEVERITY_COLORS = {
  info:     'bg-blue-50 text-blue-700 border-blue-200',
  warning:  'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

const SEVERITY_ICONS = {
  info:     <Info className="w-3.5 h-3.5" />,
  warning:  <AlertTriangle className="w-3.5 h-3.5" />,
  critical: <Shield className="w-3.5 h-3.5" />,
}

const PAGE_SIZE = 50

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(iso).toLocaleDateString()
}

function DetailRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-1.5">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`truncate text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

export default function AuditLogsPage() {
  const { can } = usePermissions()
  const canExport = can('audit.export')
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const { logs, loading, error, total, refetch } = useAuditLogs({
    search: search || undefined,
    severity: severity === 'all' ? undefined : severity,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const changeFilter = (fn: () => void) => {
    fn()
    setPage(1)
    void refetch(1, PAGE_SIZE)
  }

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages)
    setPage(clamped)
    void refetch(clamped, PAGE_SIZE)
  }

  const exportCSV = () => {
    if (!canExport) {
      toast.error('You do not have permission to export audit logs')
      return
    }
    const header = 'Time,User,Role,Action,Resource,Severity,Success,Device,Browser\n'
    const rows = logs.map((l) =>
      [l.created_at, l.user_email ?? '', l.user_role ?? '', l.action, l.resource ?? '', l.severity]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    void writeAuditLog({ action: 'export.csv', resource: 'audit_logs', newValue: { rowCount: logs.length } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} records — who changed what and when</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch(page, PAGE_SIZE)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canExport && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, action, resource…"
            value={search}
            onChange={(e) => changeFilter(() => setSearch(e.target.value))}
            className="pl-9"
          />
        </div>
        <Select value={severity} onValueChange={(v) => changeFilter(() => setSeverity(v))}>
          <SelectTrigger className="w-36">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <ThemeDatePicker
          value={from}
          onChange={(val) => changeFilter(() => setFrom(val))}
          placeholder="From date"
          variant="admin"
          showShortcuts={false}
          className="h-10 text-xs w-36"
        />
        <ThemeDatePicker
          value={to}
          onChange={(val) => changeFilter(() => setTo(val))}
          placeholder="To date"
          variant="admin"
          showShortcuts={false}
          className="h-10 text-xs w-36"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {(['info', 'warning', 'critical'] as const).map((sev) => {
          const count = logs.filter((l) => l.severity === sev).length
          return (
            <div key={sev} className={`flex items-center gap-3 p-4 rounded-xl border ${SEVERITY_COLORS[sev]}`}>
              {SEVERITY_ICONS[sev]}
              <div>
                <p className="font-semibold capitalize">{sev}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Log table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Time</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Action</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Resource</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No audit logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setSelected(log)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelected(log) }}
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{timeAgo(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{log.user_email ?? 'System'}</div>
                      {log.user_role && <div className="text-xs text-muted-foreground capitalize">{log.user_role}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.resource && <span className="font-mono text-xs">{log.resource}</span>}
                      {log.resource_id && <span className="text-xs text-muted-foreground/60 ml-1">#{log.resource_id.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`gap-1 border ${SEVERITY_COLORS[log.severity]}`} variant="outline">
                        {SEVERITY_ICONS[log.severity]}
                        <span className="capitalize">{log.severity}</span>
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages} · {total.toLocaleString()} total
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Detail drawer: before/after value comparison */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.action}</SheetTitle>
            <SheetDescription>{selected ? new Date(selected.created_at).toISOString() + ' UTC' : ''}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-3 px-4 pb-6 text-sm">
              <DetailRow label="Actor" value={selected.user_email} />
              <DetailRow label="Role" value={selected.user_role} />
              <DetailRow label="Resource" value={selected.resource} mono />
              <DetailRow label="Resource ID" value={selected.resource_id} mono />
              <DetailRow label="Severity" value={selected.severity} />
              <DetailRow label="IP address" value={selected.ip_address} mono />
              {(selected.old_value != null || selected.new_value != null) && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before / after</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">Before</p>
                      <pre className="max-h-56 overflow-auto rounded-lg bg-red-50 p-2 text-xs text-red-900 dark:bg-red-950/30 dark:text-red-200">
                        {selected.old_value != null ? JSON.stringify(selected.old_value, null, 2) : '—'}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">After</p>
                      <pre className="max-h-56 overflow-auto rounded-lg bg-emerald-50 p-2 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                        {selected.new_value != null ? JSON.stringify(selected.new_value, null, 2) : '—'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
