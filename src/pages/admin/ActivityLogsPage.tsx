import { useDeferredValue, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AlertTriangle, ChevronLeft, ChevronRight, Download, FileInput, Info, MousePointerClick, Navigation, RefreshCw, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ChangeDiffViewer } from '@/components/admin/ChangeDiffViewer'

type ActivityLog = {
  id: number
  created_at: string
  occurred_at: string | null
  user_id: string | null
  session_id: string | null
  category: string
  action: string
  page_path: string | null
  target: string | null
  details: Record<string, unknown>
  device_type: string | null
  browser: string | null
}

type Person = { id: string; full_name: string | null; email: string | null }

const PAGE_SIZE = 50

const CATEGORIES = [
  { value: 'all', label: 'All events' },
  { value: 'click', label: 'Clicks' },
  { value: 'navigation', label: 'Page views' },
  { value: 'form_submit', label: 'Form submits' },
  { value: 'error', label: 'Errors' },
  { value: 'api_error', label: 'App errors' },
  { value: 'app', label: 'App warnings' },
]

const CATEGORY_STYLE: Record<string, { icon: typeof Info; className: string }> = {
  click: { icon: MousePointerClick, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  navigation: { icon: Navigation, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  form_submit: { icon: FileInput, className: 'bg-violet-50 text-violet-700 border-violet-200' },
  error: { icon: AlertTriangle, className: 'bg-red-50 text-red-700 border-red-200' },
  api_error: { icon: AlertTriangle, className: 'bg-red-50 text-red-700 border-red-200' },
  app: { icon: Info, className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const RANGES = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '180', label: 'Last 180 days' },
]

export default function ActivityLogsPage() {
  const [category, setCategory] = useState('all')
  const [range, setRange] = useState('7')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<ActivityLog | null>(null)
  const deferredSearch = useDeferredValue(search.trim())

  const logs = useQuery({
    queryKey: ['activity-logs', category, range, deferredSearch, page],
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - Number(range) * 86_400_000).toISOString())
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      if (category !== 'all') query = query.eq('category', category)
      if (deferredSearch) {
        const term = deferredSearch.replace(/[,()%]/g, ' ')
        // Match an email/name too: resolve it to user ids first.
        const { data: people } = await supabase
          .from('user_profiles')
          .select('id')
          .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
          .limit(50)
        const ids = (people ?? []).map((p) => p.id)
        query = query.or([
          `action.ilike.%${term}%`,
          `page_path.ilike.%${term}%`,
          `target.ilike.%${term}%`,
          ...(ids.length ? [`user_id.in.(${ids.join(',')})`] : []),
        ].join(','))
      }
      const { data, error, count } = await query
      if (error) throw new Error('Could not load activity logs.')
      const rows = (data ?? []) as ActivityLog[]

      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))))
      const people = new Map<string, Person>()
      if (userIds.length) {
        const { data: profiles } = await supabase.from('user_profiles').select('id, full_name, email').in('id', userIds)
        for (const p of (profiles ?? []) as Person[]) people.set(p.id, p)
      }
      return { rows, count: count ?? 0, people }
    },
  })

  const rows = logs.data?.rows ?? []
  const total = logs.data?.count ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const personLabel = (id: string | null) => {
    if (!id) return 'Visitor'
    const p = logs.data?.people.get(id)
    return p?.full_name || p?.email || id.slice(0, 8)
  }

  const exportCsv = () => {
    if (!rows.length) { toast.info('Nothing to export on this page.'); return }
    const csv = [
      ['Time', 'User', 'Category', 'Action', 'Page', 'Target', 'Device', 'Browser', 'Session'],
      ...rows.map((r) => [r.created_at, personLabel(r.user_id), r.category, r.action, r.page_path ?? '', r.target ?? '', r.device_type ?? '', r.browser ?? '', r.session_id ?? '']),
    ].map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-page-${page + 1}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0) }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">Every click, page view, form submit and error across the website. Typed values are never stored.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void logs.refetch()} disabled={logs.isFetching}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', logs.isFetching && 'animate-spin')} />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />Export</Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Search action, page, button, user name or email" className="pl-9" />
        </div>
        <Select value={category} onValueChange={reset(setCategory)}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={range} onValueChange={reset(setRange)}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {logs.isError ? (
        <p className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
          Could not load activity logs. Make sure the activity logs migration has been run.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-2"><Skeleton className="h-6 w-full" /></td></tr>
              )) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No activity found for these filters.</td></tr>
              ) : rows.map((r) => {
                const style = CATEGORY_STYLE[r.category] ?? CATEGORY_STYLE.app
                const Icon = style.icon
                return (
                  <tr key={r.id} tabIndex={0} className="cursor-pointer hover:bg-muted/20" onClick={() => setSelected(r)} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(r) }}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{format(new Date(r.created_at), 'dd MMM, HH:mm:ss')}</td>
                    <td className="max-w-[160px] truncate px-4 py-2.5">{personLabel(r.user_id)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={cn('gap-1 font-normal', style.className)}><Icon className="h-3 w-3" />{CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category}</Badge>
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2.5">{r.action}</td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.page_path}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs capitalize text-muted-foreground">{[r.device_type, r.browser].filter(Boolean).join(' · ')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString()} events</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Page {page + 1} of {pages}</span>
          <Button variant="outline" size="icon" aria-label="Next page" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="break-words">{selected.action}</SheetTitle>
                <SheetDescription>{format(new Date(selected.created_at), 'dd MMM yyyy, HH:mm:ss')}</SheetDescription>
              </SheetHeader>
              <dl className="mt-4 space-y-2 px-4 text-sm">
                {([
                  ['User', personLabel(selected.user_id)],
                  ['User ID', selected.user_id],
                  ['Type', selected.category],
                  ['Page', selected.page_path],
                  ['Element', selected.target],
                  ['Device', selected.device_type],
                  ['Browser', selected.browser],
                  ['Session', selected.session_id],
                ] as const).map(([label, value]) => value ? (
                  <div key={label} className="flex justify-between gap-3 border-b border-border/50 pb-1.5">
                    <dt className="shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd className="break-all text-right font-mono text-xs">{value}</dd>
                  </div>
                ) : null)}
                {Object.keys(selected.details ?? {}).length > 0 && (
                  <div className="pt-2">
                    <ChangeDiffViewer
                      oldValue={selected.details?.oldValue}
                      newValue={selected.details?.newValue}
                      details={selected.details}
                      action={selected.action}
                    />
                  </div>
                )}
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
