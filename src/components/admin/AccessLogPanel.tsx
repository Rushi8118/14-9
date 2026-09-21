/**
 * Live access log panel: tabs (presets) + advanced filters synced to URL query params.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  Download,
  Eye,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ChangeDiffViewer } from '@/components/admin/ChangeDiffViewer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAccessLogs } from '@/hooks/useAccessLogs'
import {
  ACCESS_EVENT_LABELS,
  ACCESS_EVENT_TYPES,
  ACCESS_ROLE_LABELS,
  AccessBrowser,
  AccessDevice,
  AccessEventType,
  AccessLogFilters,
  AccessLogRow,
  AccessLogTab,
  AccessReferrer,
  AccessRoleFilter,
  AccessTimeRange,
  DEFAULT_ACCESS_LOG_FILTERS,
  TAB_EVENT_PRESETS,
  accessLogFiltersToSearchParams,
  formatAccessEventLabel,
  parseAccessLogSearchParams,
  searchAccessLogPaths,
  searchAccessLogUsers,
  tabForEventTypes,
} from '@/lib/access-log'
import { getAccessLogRoleGroup } from '@/lib/rbac'

const TABS: AccessLogTab[] = ['all', 'visits', 'logins', 'applications', 'admin', 'security']

const TIME_RANGE_LABELS: Record<AccessTimeRange, string> = {
  '15m': 'Last 15 min',
  '1h': 'Last 1 hour',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  custom: 'Custom range',
}

function eventBadgeClass(eventType: string): string {
  switch (eventType) {
    case 'login':
      return 'bg-emerald-100 text-emerald-800'
    case 'logout':
      return 'bg-slate-100 text-slate-800'
    case 'failed_login':
      return 'bg-red-100 text-red-800'
    case 'signup':
      return 'bg-violet-100 text-violet-800'
    case 'application_submitted':
    case 'application_status_change':
      return 'bg-amber-100 text-amber-800'
    case 'password_change':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-sky-100 text-sky-800'
  }
}

function roleDisplayLabel(row: {
  user_id: string | null
  user_role: string | null
  user_name: string | null
  user_email: string | null
}): string {
  if (!row.user_id) return 'Guest visitor'
  const group = getAccessLogRoleGroup(row.user_role, row.user_id)
  return ACCESS_ROLE_LABELS[group]
}

type Chip = { key: string; label: string; clear: () => void }

export function AccessLogPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => parseAccessLogSearchParams(searchParams),
    [searchParams],
  )

  const patchFilters = useCallback(
    (patch: Partial<AccessLogFilters>) => {
      const next: AccessLogFilters = { ...filters, ...patch }

      // Keep tab ↔ eventTypes in sync (single source of truth in URL).
      if (patch.tab !== undefined && patch.eventTypes === undefined) {
        const preset = TAB_EVENT_PRESETS[patch.tab]
        next.eventTypes = preset ? [...preset] : []
      }
      if (patch.eventTypes !== undefined && patch.tab === undefined) {
        next.tab = tabForEventTypes(patch.eventTypes)
      }

      const params = accessLogFiltersToSearchParams(next)
      setSearchParams(params, { replace: true })
    },
    [filters, setSearchParams],
  )

  const clearAll = useCallback(() => {
    setSearchParams(accessLogFiltersToSearchParams(DEFAULT_ACCESS_LOG_FILTERS), {
      replace: true,
    })
  }, [setSearchParams])

  const {
    rows,
    total,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    eventTypeCounts,
    loadMore,
    refresh,
    exportCsv,
    exporting,
  } = useAccessLogs(filters)

  const listRef = useRef<HTMLDivElement>(null)
  const [selectedRow, setSelectedRow] = useState<AccessLogRow | null>(null)

  // ---- User search combobox ----
  const [userQuery, setUserQuery] = useState('')
  const [userOpen, setUserOpen] = useState(false)
  const [userOptions, setUserOptions] = useState<
    { id: string; email: string; full_name: string | null }[]
  >([])

  useEffect(() => {
    if (!userOpen) return
    const t = window.setTimeout(() => {
      void searchAccessLogUsers(userQuery || 'a')
        .then(setUserOptions)
        .catch(() => setUserOptions([]))
    }, 250)
    return () => window.clearTimeout(t)
  }, [userQuery, userOpen])

  // ---- Path autocomplete ----
  const [pathQuery, setPathQuery] = useState(filters.path || '')
  const [pathOpen, setPathOpen] = useState(false)
  const [pathOptions, setPathOptions] = useState<string[]>([])

  useEffect(() => {
    setPathQuery(filters.path || '')
  }, [filters.path])

  useEffect(() => {
    if (!pathOpen) return
    const t = window.setTimeout(() => {
      void searchAccessLogPaths(pathQuery, filters.source)
        .then(setPathOptions)
        .catch(() => setPathOptions([]))
    }, 250)
    return () => window.clearTimeout(t)
  }, [pathQuery, pathOpen, filters.source])

  const chips: Chip[] = useMemo(() => {
    const list: Chip[] = []
    if (filters.eventTypes.length > 0) {
      for (const t of filters.eventTypes) {
        list.push({
          key: `type-${t}`,
          label: ACCESS_EVENT_LABELS[t],
          clear: () =>
            patchFilters({
              eventTypes: filters.eventTypes.filter((x) => x !== t),
            }),
        })
      }
    }
    if (filters.role) {
      list.push({
        key: 'role',
        label: ACCESS_ROLE_LABELS[filters.role],
        clear: () => patchFilters({ role: undefined }),
      })
    }
    if (filters.userId) {
      list.push({
        key: 'user',
        label: filters.userLabel || filters.userId.slice(0, 8),
        clear: () => patchFilters({ userId: undefined, userLabel: undefined }),
      })
    }
    if (filters.device) {
      list.push({
        key: 'device',
        label: filters.device,
        clear: () => patchFilters({ device: undefined }),
      })
    }
    if (filters.browser) {
      list.push({
        key: 'browser',
        label: filters.browser,
        clear: () => patchFilters({ browser: undefined }),
      })
    }
    if (filters.path) {
      list.push({
        key: 'path',
        label: filters.path,
        clear: () => patchFilters({ path: undefined }),
      })
    }
    if (filters.referrer) {
      list.push({
        key: 'ref',
        label: `from ${filters.referrer}`,
        clear: () => patchFilters({ referrer: undefined }),
      })
    }
    if (filters.timeRange !== '7d') {
      list.push({
        key: 'range',
        label:
          filters.timeRange === 'custom'
            ? `Custom ${filters.from || '…'} → ${filters.to || '…'}`
            : TIME_RANGE_LABELS[filters.timeRange],
        clear: () =>
          patchFilters({ timeRange: '7d', from: undefined, to: undefined }),
      })
    }
    return list
  }, [filters, patchFilters])

  const availableEventTypes = ACCESS_EVENT_TYPES.filter(
    (t) => (eventTypeCounts[t] ?? 0) > 0 || filters.eventTypes.includes(t),
  )
  // Prefer hide empty types; if everything is empty (fresh DB), show all grayed options.
  const eventTypesForSelect =
    availableEventTypes.length > 0 ? availableEventTypes : [...ACCESS_EVENT_TYPES]

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Live access log</h2>
          <p className="text-xs text-muted-foreground">
            Showing {rows.length.toLocaleString()} of {total.toLocaleString()} activities
            {refreshing ? ' · refreshing…' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
            <Switch
              id="access-log-live"
              checked={filters.live}
              onCheckedChange={(checked) => patchFilters({ live: checked })}
            />
            <Label htmlFor="access-log-live" className="text-xs font-medium cursor-pointer">
              {filters.live ? (
                <span className="inline-flex items-center gap-1">
                  <Play className="h-3 w-3" /> Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Pause className="h-3 w-3" /> Paused
                </span>
              )}
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void exportCsv()}
            disabled={exporting || total === 0}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export CSV
          </Button>
          <div
            role="radiogroup"
            aria-label="Log store"
            className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
          >
            {([
              ['visitors', 'Visitor logs', Eye],
              ['admins', 'Admin logs', ShieldAlert],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={filters.source === value}
                onClick={() => patchFilters({ source: value, role: undefined, userId: undefined, userLabel: undefined, path: undefined })}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
                  filters.source === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs = filter presets */}
      <div className="mb-3 flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => patchFilters({ tab })}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              filters.tab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab === 'admin' ? 'Admin Actions' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {filters.tab === 'admin' ? (
        <AdminActionsPreview />
      ) : (
      <>
      {/* Filter bar */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Select
          value={
            filters.eventTypes.length === 0
              ? 'all'
              : filters.eventTypes.length === 1
                ? filters.eventTypes[0]
                : '__multi__'
          }
          onValueChange={(v) => {
            if (v === 'all' || v === '__multi__') {
              patchFilters({ eventTypes: [], tab: 'all' })
            } else {
              patchFilters({ eventTypes: [v as AccessEventType] })
            }
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity types</SelectItem>
            {filters.eventTypes.length > 1 && (
              <SelectItem value="__multi__">
                {filters.eventTypes.map((t) => ACCESS_EVENT_LABELS[t]).join(', ')}
              </SelectItem>
            )}
            {eventTypesForSelect.map((t) => {
              const count = eventTypeCounts[t] ?? 0
              const disabled = count === 0 && !filters.eventTypes.includes(t)
              return (
                <SelectItem key={t} value={t} disabled={disabled}>
                  {ACCESS_EVENT_LABELS[t]}
                  {count > 0 ? ` (${count})` : ' (none)'}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Select
          value={filters.role || 'all'}
          onValueChange={(v) =>
            patchFilters({
              role: v === 'all' ? undefined : (v as AccessRoleFilter),
            })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="User role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {(Object.keys(ACCESS_ROLE_LABELS) as AccessRoleFilter[]).map((r) => (
              <SelectItem key={r} value={r}>
                {ACCESS_ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={userOpen} onOpenChange={setUserOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 justify-start truncate text-xs font-normal"
            >
              <Search className="mr-2 h-3.5 w-3.5 shrink-0" />
              {filters.userLabel || 'Specific user…'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <Input
              placeholder="Search name or email"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="mb-2 h-8 text-xs"
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {userOptions.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">No users found</p>
              ) : (
                userOptions.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      patchFilters({
                        userId: u.id,
                        userLabel: u.full_name || u.email,
                      })
                      setUserOpen(false)
                    }}
                  >
                    <span className="font-medium">{u.full_name || 'Unnamed'}</span>
                    <span className="block truncate text-muted-foreground">{u.email}</span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={filters.device || 'all'}
          onValueChange={(v) =>
            patchFilters({
              device: v === 'all' ? undefined : (v as AccessDevice),
            })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.browser || 'all'}
          onValueChange={(v) =>
            patchFilters({
              browser: v === 'all' ? undefined : (v as AccessBrowser),
            })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Browser" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All browsers</SelectItem>
            <SelectItem value="Chrome">Chrome</SelectItem>
            <SelectItem value="Safari">Safari</SelectItem>
            <SelectItem value="Firefox">Firefox</SelectItem>
            <SelectItem value="Edge">Edge</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={pathOpen} onOpenChange={setPathOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 justify-start truncate text-xs font-normal"
            >
              <Search className="mr-2 h-3.5 w-3.5 shrink-0" />
              {filters.path || 'Page / URL…'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <Input
              placeholder="Filter by path"
              value={pathQuery}
              onChange={(e) => setPathQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  patchFilters({ path: pathQuery.trim() || undefined })
                  setPathOpen(false)
                }
              }}
              className="mb-2 h-8 text-xs"
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {pathOptions.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    patchFilters({ path: p })
                    setPathOpen(false)
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="mt-1 w-full rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary"
                onClick={() => {
                  patchFilters({ path: pathQuery.trim() || undefined })
                  setPathOpen(false)
                }}
              >
                Apply “{pathQuery || '…'}”
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={filters.referrer || 'all'}
          onValueChange={(v) =>
            patchFilters({
              referrer: v === 'all' ? undefined : (v as AccessReferrer),
            })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Referrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="google.com">google.com</SelectItem>
            <SelectItem value="facebook.com">facebook.com</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.timeRange}
          onValueChange={(v) =>
            patchFilters({
              timeRange: v as AccessTimeRange,
              ...(v !== 'custom' ? { from: undefined, to: undefined } : {}),
            })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TIME_RANGE_LABELS) as AccessTimeRange[]).map((r) => (
              <SelectItem key={r} value={r}>
                {TIME_RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.timeRange === 'custom' && (
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">From</Label>
            <Input
              type="datetime-local"
              className="h-9 text-xs"
              value={filters.from ? filters.from.slice(0, 16) : ''}
              onChange={(e) =>
                patchFilters({
                  from: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">To</Label>
            <Input
              type="datetime-local"
              className="h-9 text-xs"
              value={filters.to ? filters.to.slice(0, 16) : ''}
              onChange={(e) =>
                patchFilters({
                  to: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1 pr-1 font-normal"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.label}`}
                className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={chip.clear}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error}
          {/permission|policy|RLS/i.test(error)
            ? ' — Access log reads require Super Administrator or Administrator. Apply the interactions access-log migration if needed.'
            : null}
        </div>
      )}

      {/* Scrollable list — ref kept so polls do not reset scroll */}
      <div
        ref={listRef}
        className="max-h-[520px] space-y-2 overflow-y-auto scroll-smooth scrollbar-thin"
      >
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity matches these filters.
          </p>
        ) : (
          rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedRow(row)}
              className={`block w-full rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                row.event_type.startsWith('application_')
                  ? 'border-amber-200/70 bg-amber-50/20'
                  : 'border-border/70 bg-muted/20'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold uppercase ${eventBadgeClass(row.event_type)}`}
                >
                  {formatAccessEventLabel(row.event_type)}
                </span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                </span>
                {row.device_type && (
                  <span className="text-muted-foreground">· {row.device_type}</span>
                )}
                {row.browser && (
                  <span className="text-muted-foreground">· {row.browser}</span>
                )}
                {row.page_path && (
                  <span className="truncate text-muted-foreground">· {row.page_path}</span>
                )}
                <span className="text-muted-foreground">· {roleDisplayLabel(row)}</span>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {row.user_name || row.user_email || (row.user_id ? 'User' : 'Guest visitor')}
                {row.user_email && row.user_name ? ` · ${row.user_email}` : ''}
              </p>
              {row.referrer ? (
                <p className="truncate text-xs text-muted-foreground">from {row.referrer}</p>
              ) : null}
            </button>
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
      </>
      )}

      <Sheet open={!!selectedRow} onOpenChange={(open) => { if (!open) setSelectedRow(null) }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedRow ? formatAccessEventLabel(selectedRow.event_type) : 'Event details'}</SheetTitle>
            <SheetDescription>{selectedRow ? new Date(selectedRow.created_at).toISOString() + ' UTC' : ''}</SheetDescription>
          </SheetHeader>
          {selectedRow && (
            <div className="space-y-3 px-4 pb-6 text-sm">
              <DetailRow label="User" value={selectedRow.user_name || selectedRow.user_email || (selectedRow.user_id ? 'User' : 'Guest visitor')} />
              <DetailRow label="Email" value={selectedRow.user_email} />
              <DetailRow label="Role" value={roleDisplayLabel(selectedRow)} />
              <DetailRow label="Session" value={selectedRow.session_id} mono />
              <DetailRow label="Page path" value={selectedRow.page_path} />
              <DetailRow label="Page title" value={selectedRow.page_title} />
              <DetailRow label="Referrer" value={selectedRow.referrer} />
              <DetailRow label="Device" value={selectedRow.device_type} />
              <DetailRow label="Browser" value={selectedRow.browser} />
              {selectedRow.metadata && Object.keys(selectedRow.metadata).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metadata</p>
                  <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-muted/40 p-3 text-xs">{JSON.stringify(selectedRow.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
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

const SEVERITY_BADGE: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}

/** "Admin Actions" tab: a compact, live view of the most recent audit_logs
 *  entries (admin CRUD, publishing, deletes, exports, AI generations, …)
 *  with a before/after value comparison drawer. The full searchable/paginated
 *  audit log lives at /admin/audit — this is a fast-glance preview embedded
 *  next to the visitor/login activity feed. */
function AdminActionsPreview() {
  const { logs, loading, error, total } = useAuditLogs({})
  const [selected, setSelected] = useState<(typeof logs)[number] | null>(null)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" /> {total.toLocaleString()} recorded admin actions
        </span>
        <Link to="/admin/audit" className="flex items-center gap-1 font-medium text-primary hover:underline">
          Full audit log <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">{error}</div>
      )}

      <div className="max-h-[520px] space-y-2 overflow-y-auto scroll-smooth scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No admin actions recorded yet.</p>
        ) : (
          logs.slice(0, 25).map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => setSelected(log)}
              className="block w-full rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-semibold uppercase ${SEVERITY_BADGE[log.severity] || SEVERITY_BADGE.info}`}>
                  {log.severity}
                </span>
                <span className="font-mono text-foreground">{log.action}</span>
                <span className="text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {log.user_email || 'System'}
                {log.resource ? ` · ${log.resource}${log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}` : ''}
              </p>
            </button>
          ))
        )}
      </div>

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
              {(selected.old_value != null || selected.new_value != null) && (
                <div className="pt-2">
                  <ChangeDiffViewer
                    oldValue={selected.old_value}
                    newValue={selected.new_value}
                    action={selected.action}
                  />
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
