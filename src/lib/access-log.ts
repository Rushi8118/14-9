/**
 * Access-log shared types, URL/filter helpers, and PostgREST query builder.
 * Filtering is done server-side via Supabase/PostgREST (parameterized), matching audit logs.
 */

import { supabase } from '@/lib/supabase/client'
import {
  getAdministratorRoleSlugs,
  getEndUserRoleSlugs,
  getStaffRoleSlugs,
  getSuperAdminRoleSlugs,
} from '@/lib/rbac'
import { writeAuditLog } from '@/lib/audit-log'

// ---------------------------------------------------------------------------
// Event types (must stay in sync with interactions_event_type_check)
// ---------------------------------------------------------------------------

export const ACCESS_EVENT_TYPES = [
  'page_view',
  'login',
  'logout',
  'failed_login',
  'application_submitted',
  'application_status_change',
  'password_change',
  'signup',
] as const

export type AccessEventType = (typeof ACCESS_EVENT_TYPES)[number]

export const ACCESS_EVENT_LABELS: Record<AccessEventType, string> = {
  page_view: 'Page view',
  login: 'Login',
  logout: 'Logout',
  failed_login: 'Failed login',
  application_submitted: 'Application created',
  application_status_change: 'Application updated',
  password_change: 'Password change',
  signup: 'Signup',
}

export type AccessLogTab = 'all' | 'visits' | 'applications' | 'logins' | 'admin' | 'security'

/** Tab presets seed (and stay in sync with) the event-type filter.
 *  `admin` has no interactions-table preset — the panel switches its data
 *  source to the audit_logs table entirely for that tab (see
 *  AccessLogPanel's AdminActionsTab), since that's where admin CRUD
 *  actions with before/after values actually live. */
export const TAB_EVENT_PRESETS: Record<AccessLogTab, AccessEventType[] | null> = {
  all: null,
  visits: ['page_view'],
  applications: ['application_submitted', 'application_status_change'],
  logins: ['login', 'logout', 'failed_login'],
  admin: null,
  security: ['failed_login', 'password_change'],
}

export type AccessRoleFilter = 'super_admin' | 'admin' | 'staff' | 'user' | 'guest'

export const ACCESS_ROLE_LABELS: Record<AccessRoleFilter, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  staff: 'Staff',
  user: 'Logged-in user',
  guest: 'Guest visitor',
}

export type AccessDevice = 'desktop' | 'mobile' | 'tablet'
export type AccessBrowser = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other'
export type AccessReferrer = 'direct' | 'google.com' | 'facebook.com' | 'other'
export type AccessTimeRange = '15m' | '1h' | '24h' | '7d' | '30d' | 'custom'

export const PAGE_SIZE = 25
export const CSV_EXPORT_CAP = 5000

export type AccessLogFilters = {
  tab: AccessLogTab
  /** Empty / omitted = all types (subject to tab preset). */
  eventTypes: AccessEventType[]
  role?: AccessRoleFilter
  userId?: string
  userLabel?: string
  device?: AccessDevice
  browser?: AccessBrowser
  path?: string
  referrer?: AccessReferrer
  timeRange: AccessTimeRange
  from?: string
  to?: string
  /** Hide administrator and super-administrator activity from the list. */
  hideAdmin: boolean
  /** When false, pause 60s polling. Default true. */
  live: boolean
}

export type AccessLogRow = {
  id: string
  user_id: string | null
  session_id: string | null
  event_type: string
  page_path: string | null
  page_title: string | null
  referrer: string | null
  device_type: string | null
  browser: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user_email: string | null
  user_name: string | null
  user_role: string | null
}

export const DEFAULT_ACCESS_LOG_FILTERS: AccessLogFilters = {
  tab: 'all',
  eventTypes: [],
  timeRange: '7d',
  // Default to hiding admin/super-admin activity (mostly the viewing admin's
  // own routine page-view logging) so the log opens on the real audit
  // signal instead of internal noise. Admins can still opt back in via the
  // "Hide admin logs" toggle, which un-hides them.
  hideAdmin: true,
  live: true,
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

export function timeRangeToFromIso(range: AccessTimeRange, customFrom?: string): string | undefined {
  if (range === 'custom') return customFrom || undefined
  const ms: Record<Exclude<AccessTimeRange, 'custom'>, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }
  return new Date(Date.now() - ms[range]).toISOString()
}

/** Resolve effective event types from tab + explicit types. */
export function resolveEventTypes(filters: AccessLogFilters): AccessEventType[] | null {
  if (filters.eventTypes.length > 0) return filters.eventTypes
  return TAB_EVENT_PRESETS[filters.tab]
}

/** Infer which tab matches the current event-type selection. */
export function tabForEventTypes(types: AccessEventType[]): AccessLogTab {
  if (types.length === 0) return 'all'
  const sorted = [...types].sort().join(',')
  for (const tab of ['visits', 'applications', 'logins', 'security'] as AccessLogTab[]) {
    const preset = TAB_EVENT_PRESETS[tab]
    if (preset && [...preset].sort().join(',') === sorted) return tab
  }
  return 'all'
}

// ---------------------------------------------------------------------------
// URL <-> filters
// ---------------------------------------------------------------------------

export function parseAccessLogSearchParams(params: URLSearchParams): AccessLogFilters {
  const tabRaw = params.get('tab')
  const tab: AccessLogTab =
    tabRaw === 'visits' || tabRaw === 'applications' || tabRaw === 'logins' ||
    tabRaw === 'admin' || tabRaw === 'security' || tabRaw === 'all'
      ? tabRaw
      : 'all'

  const typeParam = params.get('type')
  const eventTypes = (typeParam ? typeParam.split(',') : [])
    .map((t) => t.trim())
    .filter((t): t is AccessEventType =>
      (ACCESS_EVENT_TYPES as readonly string[]).includes(t),
    )

  const roleRaw = params.get('role')
  const role =
    roleRaw === 'super_admin' ||
    roleRaw === 'admin' ||
    roleRaw === 'staff' ||
    roleRaw === 'user' ||
    roleRaw === 'guest'
      ? roleRaw
      : undefined

  const deviceRaw = params.get('device')
  const device =
    deviceRaw === 'desktop' || deviceRaw === 'mobile' || deviceRaw === 'tablet'
      ? deviceRaw
      : undefined

  const browserRaw = params.get('browser')
  const browser =
    browserRaw === 'Chrome' ||
    browserRaw === 'Safari' ||
    browserRaw === 'Firefox' ||
    browserRaw === 'Edge' ||
    browserRaw === 'Other'
      ? browserRaw
      : undefined

  const refRaw = params.get('ref')
  const referrer =
    refRaw === 'direct' ||
    refRaw === 'google.com' ||
    refRaw === 'facebook.com' ||
    refRaw === 'other'
      ? refRaw
      : undefined

  const rangeRaw = params.get('range')
  const timeRange: AccessTimeRange =
    rangeRaw === '15m' ||
    rangeRaw === '1h' ||
    rangeRaw === '24h' ||
    rangeRaw === '7d' ||
    rangeRaw === '30d' ||
    rangeRaw === 'custom'
      ? rangeRaw
      : '7d'

  const live = params.get('live') !== '0'
  // Default to hiding admin/system noise unless the URL explicitly turns it off.
  const hideAdmin = params.get('hideAdmin') !== '0'

  // Hydrate event types from tab preset when only ?tab= is present.
  let resolvedTypes = eventTypes
  if (resolvedTypes.length === 0 && tab !== 'all') {
    const preset = TAB_EVENT_PRESETS[tab]
    if (preset) resolvedTypes = [...preset]
  }

  const resolvedTab =
    resolvedTypes.length > 0 ? tabForEventTypes(resolvedTypes) : tab

  return {
    tab: resolvedTab,
    eventTypes: resolvedTypes,
    role,
    userId: params.get('user') || undefined,
    userLabel: params.get('userLabel') || undefined,
    device,
    browser,
    path: params.get('path') || undefined,
    referrer,
    timeRange,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    hideAdmin,
    live,
  }
}

export function accessLogFiltersToSearchParams(filters: AccessLogFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.tab !== 'all') p.set('tab', filters.tab)
  if (filters.eventTypes.length > 0) p.set('type', filters.eventTypes.join(','))
  if (filters.role) p.set('role', filters.role)
  if (filters.userId) p.set('user', filters.userId)
  if (filters.userLabel) p.set('userLabel', filters.userLabel)
  if (filters.device) p.set('device', filters.device)
  if (filters.browser) p.set('browser', filters.browser)
  if (filters.path) p.set('path', filters.path)
  if (filters.referrer) p.set('ref', filters.referrer)
  if (filters.timeRange !== '7d') p.set('range', filters.timeRange)
  if (filters.timeRange === 'custom' && filters.from) p.set('from', filters.from)
  if (filters.timeRange === 'custom' && filters.to) p.set('to', filters.to)
  // Persist explicit "show admin logs" choice; hideAdmin=true is the
  // implicit default so it does not need to be written to the URL.
  if (!filters.hideAdmin) p.set('hideAdmin', '0')
  if (!filters.live) p.set('live', '0')
  return p
}

// ---------------------------------------------------------------------------
// Query builder (PostgREST / supabase-js)
// ---------------------------------------------------------------------------

type ProfileEmbed = {
  id: string
  email: string
  full_name: string | null
  user_role: string
} | null

type RawInteractionRow = {
  id: string
  user_id: string | null
  session_id: string | null
  event_type: string
  page_path: string | null
  page_title: string | null
  referrer: string | null
  device_type: string | null
  browser: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user_profiles?: ProfileEmbed | ProfileEmbed[]
}

function mapRow(row: RawInteractionRow): AccessLogRow {
  const profile = Array.isArray(row.user_profiles)
    ? row.user_profiles[0] ?? null
    : row.user_profiles ?? null
  return {
    id: row.id,
    user_id: row.user_id,
    session_id: row.session_id,
    event_type: row.event_type,
    page_path: row.page_path,
    page_title: row.page_title,
    referrer: row.referrer,
    device_type: row.device_type,
    browser: row.browser,
    metadata: row.metadata,
    created_at: row.created_at,
    user_email: profile?.email ?? null,
    user_name: profile?.full_name ?? null,
    user_role: profile?.user_role ?? null,
  }
}

function roleSlugsForFilter(role: AccessRoleFilter): string[] | null {
  switch (role) {
    case 'super_admin':
      return getSuperAdminRoleSlugs()
    case 'admin':
      return getAdministratorRoleSlugs()
    case 'staff':
      return getStaffRoleSlugs()
    case 'user':
      return getEndUserRoleSlugs()
    case 'guest':
      return null
  }
}

/**
 * Build a filtered interactions query.
 * Uses !inner join when filtering by role so PostgREST can apply `user_profiles.user_role`.
 * Pass `{ head: true }` for count-only requests (event-type availability).
 */
export function buildAccessLogQuery(
  filters: AccessLogFilters,
  options: { head?: boolean } = {},
) {
  const needsRoleJoin = Boolean(
    (filters.role && filters.role !== 'guest') || filters.hideAdmin,
  )

  let select: string
  if (options.head) {
    select = needsRoleJoin ? 'id, user_profiles!inner(user_role)' : 'id'
  } else if (needsRoleJoin) {
    select = `id, user_id, session_id, event_type, page_path, page_title, referrer, device_type, browser, metadata, created_at,
       user_profiles!inner ( id, email, full_name, user_role )`
  } else {
    select = `id, user_id, session_id, event_type, page_path, page_title, referrer, device_type, browser, metadata, created_at,
       user_profiles ( id, email, full_name, user_role )`
  }

  let query = supabase
    .from('interactions')
    .select(select, { count: 'exact', head: options.head === true })

  if (!options.head) {
    query = query.order('created_at', { ascending: false })
  }

  const eventTypes = resolveEventTypes(filters)
  if (eventTypes && eventTypes.length > 0) {
    query = query.in('event_type', eventTypes)
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  } else if (filters.role === 'guest') {
    query = query.is('user_id', null)
  } else if (filters.role) {
    const slugs = roleSlugsForFilter(filters.role)
    if (slugs && slugs.length > 0) {
      query = query.in('user_profiles.user_role', slugs)
    }
  }

  if (filters.hideAdmin) {
    query = query.not(
      'user_profiles.user_role',
      'in',
      '(admin,super_admin,superadmin)',
    )
  }

  if (filters.device) query = query.eq('device_type', filters.device)
  if (filters.browser) query = query.eq('browser', filters.browser)
  if (filters.path) query = query.ilike('page_path', `%${filters.path}%`)

  if (filters.referrer === 'direct') {
    query = query.or('referrer.is.null,referrer.eq.')
  } else if (filters.referrer === 'google.com') {
    query = query.ilike('referrer', '%google.%')
  } else if (filters.referrer === 'facebook.com') {
    query = query.ilike('referrer', '%facebook.%')
  } else if (filters.referrer === 'other') {
    query = query
      .not('referrer', 'is', null)
      .neq('referrer', '')
      .not('referrer', 'ilike', '%google.%')
      .not('referrer', 'ilike', '%facebook.%')
  }

  const fromIso = timeRangeToFromIso(filters.timeRange, filters.from)
  if (fromIso) query = query.gte('created_at', fromIso)
  if (filters.timeRange === 'custom' && filters.to) {
    query = query.lte('created_at', filters.to)
  }

  return query
}

export async function fetchAccessLogPage(
  filters: AccessLogFilters,
  offset: number,
  limit: number,
): Promise<{ rows: AccessLogRow[]; total: number }> {
  const { data, error, count } = await buildAccessLogQuery(filters).range(
    offset,
    offset + limit - 1,
  )
  if (error) throw error
  return {
    rows: ((data || []) as unknown as RawInteractionRow[]).map(mapRow),
    total: count ?? 0,
  }
}

/** Head-count each filterable event type (for hiding/disabling empty options). */
export async function fetchEventTypeCounts(
  baseFilters: AccessLogFilters,
): Promise<Partial<Record<AccessEventType, number>>> {
  const results = await Promise.all(
    ACCESS_EVENT_TYPES.map(async (type) => {
      const filters: AccessLogFilters = {
        ...baseFilters,
        tab: 'all',
        eventTypes: [type],
      }
      const { count, error } = await buildAccessLogQuery(filters, { head: true })
      if (error) return [type, 0] as const
      return [type, count ?? 0] as const
    }),
  )
  return Object.fromEntries(results)
}

export async function searchAccessLogUsers(q: string, limit = 20) {
  const term = q.trim()
  if (!term) return []
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, user_role')
    .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
    .order('full_name', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function searchAccessLogPaths(q: string, limit = 20) {
  const term = q.trim()
  let query = supabase
    .from('interactions')
    .select('page_path')
    .not('page_path', 'is', null)
    .order('created_at', { ascending: false })
    .limit(80)

  if (term) query = query.ilike('page_path', `%${term}%`)

  const { data, error } = await query
  if (error) throw error
  const seen = new Set<string>()
  const paths: string[] = []
  for (const row of data || []) {
    const p = row.page_path
    if (!p || seen.has(p)) continue
    seen.add(p)
    paths.push(p)
    if (paths.length >= limit) break
  }
  return paths
}

export async function exportAccessLogsCsv(filters: AccessLogFilters): Promise<Blob> {
  const { rows } = await fetchAccessLogPage(filters, 0, CSV_EXPORT_CAP)
  void writeAuditLog({
    action: 'export.csv',
    resource: 'interactions',
    newValue: { tab: filters.tab, rowCount: rows.length, timeRange: filters.timeRange },
  })
  const header = [
    'Time',
    'Event',
    'Path',
    'User',
    'Email',
    'Role',
    'Device',
    'Browser',
    'Referrer',
  ].join(',')
  const escape = (v: string | null | undefined) =>
    `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [
      escape(r.created_at),
      escape(r.event_type),
      escape(r.page_path),
      escape(r.user_name || (r.user_id ? 'User' : 'Guest visitor')),
      escape(r.user_email),
      escape(r.user_role || (r.user_id ? '' : 'guest')),
      escape(r.device_type),
      escape(r.browser),
      escape(r.referrer),
    ].join(','),
  )
  return new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
}

export function formatAccessEventLabel(eventType: string): string {
  if ((ACCESS_EVENT_TYPES as readonly string[]).includes(eventType)) {
    return ACCESS_EVENT_LABELS[eventType as AccessEventType]
  }
  return eventType.replace(/_/g, ' ')
}
