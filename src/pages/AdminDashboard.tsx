import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertCircle, Briefcase, Calendar, Clock, Eye, Flame, Globe,
  Laptop, LogIn, MessageSquare, Monitor, RefreshCw, Smartphone, Tablet,
  TrendingDown, TrendingUp, Users, Wifi, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useAdminAccessStats } from '@/hooks/useAdminAccessStats'
import { useDashboardAnalytics, percentChange } from '@/hooks/useDashboardAnalytics'
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics'
import { useActiveSessions } from '@/hooks/useActiveSessions'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import { AccessLogPanel } from '@/components/admin/AccessLogPanel'
import { AdminAmbientScene } from '@/components/admin/AdminAmbientScene'
import { cn } from '@/lib/utils'

type RangeDays = 7 | 14 | 30

const RANGE_LABELS: Record<RangeDays, string> = { 7: 'Last 7 days', 14: 'Last 14 days', 30: 'Last 30 days' }

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">no baseline yet</span>
  }
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', up ? 'text-emerald-600' : 'text-red-600')}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  )
}

function KpiCard({
  title, value, hint, icon: Icon, accent, delta, loading,
}: {
  title: string
  value: string | number
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  delta?: number | null
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
          )}
          <div className="mt-1 flex items-center gap-2">
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {delta !== undefined && <Delta value={delta} />}
          </div>
        </div>
        <div className={cn('shrink-0 rounded-xl p-2.5', accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title, icon: Icon, children, className, action,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border py-8 text-center">
      <AdminAmbientScene variant="empty" />
      <p className="relative z-10 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const DEVICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor, mobile: Smartphone, tablet: Tablet, unknown: Laptop,
}

const CHART_CONFIG: ChartConfig = {
  page_views: { label: 'Page views', color: 'var(--chart-1, #6366f1)' },
  visitors: { label: 'Visitors', color: 'var(--chart-2, #22c55e)' },
  logins: { label: 'Logins', color: 'var(--chart-3, #f59e0b)' },
}


const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null
function countryDisplayName(code: string): string {
  try { return regionNames?.of(code.toUpperCase()) || code } catch { return code }
}

export default function AdminDashboard() {
  const [rangeDays, setRangeDays] = useState<RangeDays>(7)
  const access = useAdminAccessStats()
  const analytics = useDashboardAnalytics(rangeDays)
  const realtime = useRealtimeMetrics()
  const sessions = useActiveSessions()
  const stats = access.data
  const a = analytics.data

  const core = useQuery({
    queryKey: ['admin-core-stats'],
    queryFn: async () => {
      const [apps, countries, consults] = await Promise.all([
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('countries').select('*', { count: 'exact', head: true }),
        supabase.from('consultations').select('*', { count: 'exact', head: true }),
      ])
      return {
        applications: apps.count || 0,
        countries: countries.count || 0,
        consultations: consults.count || 0,
      }
    },
  })

  const chartData = useMemo(
    () => (a?.daily || []).map((d) => ({ ...d, label: format(new Date(d.date), 'MMM d') })),
    [a?.daily],
  )
  const chartSummary = useMemo(() => {
    if (!chartData.length) return ''
    const totalViews = chartData.reduce((sum, d) => sum + d.page_views, 0)
    const totalVisitors = chartData.reduce((sum, d) => sum + d.visitors, 0)
    const totalLogins = chartData.reduce((sum, d) => sum + d.logins, 0)
    return `Over ${chartData.length} days: ${totalViews} page views, ${totalVisitors} unique visitors, ${totalLogins} logins.`
  }, [chartData])

  const activeNow = useMemo(() => {
    const cutoff = Date.now() - 5 * 60 * 1000
    return sessions.activeSessions.filter((s) => new Date(s.last_seen).getTime() >= cutoff).length
  }, [sessions.activeSessions])

  const hasAnyAnalytics = Boolean(a && (a.range.page_views_range > 0 || a.range.visitors_range > 0 || a.range.logins_range > 0))

  const refreshAll = () => {
    void access.refetch()
    void core.refetch()
    void analytics.refetch()
    void realtime.refetch()
    void sessions.refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <AdminAmbientScene variant="header" />
        <div className="relative z-10 flex flex-col gap-3 p-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Website visitors, logins, applications, and live activity in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(rangeDays)} onValueChange={(v) => setRangeDays(Number(v) as RangeDays)}>
              <SelectTrigger className="h-9 w-40 gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([7, 14, 30] as RangeDays[]).map((d) => (
                  <SelectItem key={d} value={String(d)}>{RANGE_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={refreshAll}
              disabled={access.isFetching || analytics.isFetching}
            >
              <RefreshCw className={cn('h-4 w-4', (access.isFetching || analytics.isFetching) && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {(access.isError || analytics.isError) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>Could not load some dashboard data. Open the public website once to start collecting visits, then retry.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={refreshAll}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
            </Button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          title="Visitors" icon={Eye} accent="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
          value={a?.range.visitors_range ?? stats?.visitors7d ?? 0}
          hint={`${a?.today.visitors_today ?? stats?.visitorsToday ?? 0} today`}
          delta={a ? percentChange(a.range.visitors_range, a.range.visitors_prev) : undefined}
          loading={analytics.isLoading}
        />
        <KpiCard
          title="Page views" icon={Globe} accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          value={a?.range.page_views_range ?? stats?.pageViews7d ?? 0}
          hint={`${a?.today.page_views_today ?? stats?.pageViewsToday ?? 0} today`}
          delta={a ? percentChange(a.range.page_views_range, a.range.page_views_prev) : undefined}
          loading={analytics.isLoading}
        />
        <KpiCard
          title="Logins" icon={LogIn} accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          value={a?.range.logins_range ?? 0}
          hint={`${a?.today.logins_today ?? stats?.loginsToday ?? 0} today`}
          delta={a ? percentChange(a.range.logins_range, a.range.logins_prev) : undefined}
          loading={analytics.isLoading}
        />
        <KpiCard
          title="Users" icon={Users} accent="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          value={stats?.totalUsers ?? 0}
          hint="All accounts"
          loading={access.isLoading}
        />
        <KpiCard
          title="Applications" icon={Briefcase} accent="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          value={core.data?.applications ?? 0}
          hint="All statuses"
          loading={core.isLoading}
        />
        <KpiCard
          title="Countries" icon={Globe} accent="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          value={core.data?.countries ?? 0}
          loading={core.isLoading}
        />
        <KpiCard
          title="Consultations" icon={MessageSquare} accent="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          value={core.data?.consultations ?? 0}
          loading={core.isLoading}
        />
      </div>

      {/* Trend chart + Live activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard title={`Traffic trend — ${RANGE_LABELS[rangeDays]}`} icon={Activity} className="xl:col-span-2">
          {analytics.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !hasAnyAnalytics ? (
            <EmptyPanel label="No public-site activity recorded yet for this range." />
          ) : (
            <>
              <span className="sr-only">{chartSummary}</span>
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-64 w-full">
                <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-page_views)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-page_views)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area dataKey="page_views" type="monotone" stroke="var(--color-page_views)" fill="url(#fillViews)" strokeWidth={2} />
                  <Area dataKey="visitors" type="monotone" stroke="var(--color-visitors)" fill="url(#fillVisitors)" strokeWidth={2} />
                  <Area dataKey="logins" type="monotone" stroke="var(--color-logins)" fill="none" strokeWidth={2} strokeDasharray="4 3" />
                </AreaChart>
              </ChartContainer>
            </>
          )}
        </SectionCard>

        <SectionCard title="Live activity" icon={Wifi}>
          <div className="flex items-center gap-4">
            <AdminAmbientScene variant="pulse" className="shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', realtime.connected ? 'bg-emerald-500' : 'bg-amber-500')} />
                <p className="text-xs font-medium text-muted-foreground">
                  {realtime.connected ? 'Live' : 'Polling'}
                </p>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{realtime.metrics.activeUsers}</p>
              <p className="text-xs text-muted-foreground">active users right now</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Active sessions</p>
              <p className="font-semibold text-foreground">{realtime.metrics.activeSessions}</p>
            </div>
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="cursor-help text-xs text-muted-foreground underline decoration-dotted">Devices online (5 min)</p>
                </TooltipTrigger>
                <TooltipContent>Admin device sessions seen in the last 5 minutes</TooltipContent>
              </Tooltip>
              <p className="font-semibold text-foreground">{sessions.loading ? '—' : activeNow}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full gap-1.5">
            <Link to="/admin/realtime"><Zap className="h-3.5 w-3.5" /> Open live metrics</Link>
          </Button>
        </SectionCard>
      </div>

      {/* Recent logins + Top pages */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent login users" icon={LogIn}
          action={<Button asChild variant="outline" size="sm"><Link to="/admin/users">All users</Link></Button>}
        >
          <div className="max-h-[420px] space-y-2 overflow-y-auto scroll-smooth scrollbar-thin">
            {access.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            ) : (stats?.recentLogins || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No logins recorded in the last 7 days yet.</p>
            ) : (
              stats?.recentLogins.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.full_name || 'Unnamed user'}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Role: {user.user_role}
                      {user.last_login_at ? ` · ${formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    logged in
                  </span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top public pages" icon={Globe} action={<span className="text-xs text-muted-foreground">{RANGE_LABELS[rangeDays]}</span>}>
          {analytics.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-xl" />)}</div>
          ) : (a?.top_pages || []).length === 0 ? (
            <EmptyPanel label="No page data yet." />
          ) : (
            <div className="grid gap-2">
              {a?.top_pages.map((page) => {
                const max = Math.max(...(a.top_pages.map((p) => p.views)), 1)
                return (
                  <div key={page.path} className="relative overflow-hidden rounded-xl border border-border/60 px-3 py-2">
                    <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${(page.views / max) * 100}%` }} aria-hidden="true" />
                    <div className="relative flex items-center justify-between">
                      <span className="truncate text-sm text-foreground">{page.path}</span>
                      <span className="ml-3 shrink-0 text-sm font-semibold text-muted-foreground">{page.views}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Traffic sources, devices, browsers, countries */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Traffic sources" icon={Activity}>
          {analytics.isLoading ? <Skeleton className="h-32 w-full" /> : !(a?.sources.length) ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {a.sources.map((s) => (
                <li key={s.source} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{s.source}</span>
                  <span className="font-semibold text-muted-foreground">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Devices" icon={Smartphone}>
          {analytics.isLoading ? <Skeleton className="h-32 w-full" /> : !(a?.devices.length) ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {a.devices.map((d) => {
                const Icon = DEVICE_ICON[d.device] || Laptop
                return (
                  <li key={d.device} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 capitalize text-foreground"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{d.device}</span>
                    <span className="font-semibold text-muted-foreground">{d.count}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Browsers" icon={Globe}>
          {analytics.isLoading ? <Skeleton className="h-32 w-full" /> : !(a?.browsers.length) ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {a.browsers.map((b) => (
                <li key={b.browser} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{b.browser}</span>
                  <span className="font-semibold text-muted-foreground">{b.count}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Countries" icon={Globe}>
          {analytics.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !a?.has_country_data ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No country data yet — countries are recorded for new visits from now on.
            </p>
          ) : a.countries.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {a.countries.map((c) => (
                <li key={c.country} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{countryDisplayName(c.country)}</span>
                  <span className="font-semibold text-muted-foreground">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Live access log (tabs, filters, pagination, export) */}
      <AccessLogPanel />

      {/* Quick actions */}
      <SectionCard title="Quick actions" icon={Flame}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Button asChild variant="outline"><Link to="/admin/users"><Users className="mr-1.5 h-4 w-4" />Users</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/blog">Blog AI</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/realtime"><Zap className="mr-1.5 h-4 w-4" />Live Metrics</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/sessions"><Clock className="mr-1.5 h-4 w-4" />Sessions</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/applications"><Briefcase className="mr-1.5 h-4 w-4" />Applications</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/urgent-requirements"><Flame className="mr-1.5 h-4 w-4" />Urgent Requirements</Link></Button>
        </div>
      </SectionCard>
    </div>
  )
}
