import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type AccessVisitRow = {
  id: string
  user_id: string | null
  session_id: string | null
  event_type: string
  page_path: string | null
  page_title: string | null
  referrer: string | null
  device_type: string | null
  browser: string | null
  created_at: string
  user_email?: string | null
  user_name?: string | null
}

export type ApplicationVisitRow = {
  id: string
  event_type: string
  application_id?: string
  application_type?: string
  user_email?: string | null
  user_name?: string | null
  created_at: string
}

export type AppTableRow = {
  id: string
  application_id: string | null
  application_type: string
  user_id: string
  status: string
  created_at: string
  user_profiles?: { full_name: string | null; email: string } | null
}

export type LoggedInUserRow = {
  id: string
  email: string
  full_name: string | null
  user_role: string
  last_login_at: string | null
  created_at: string
  status: string | null
}

export type AdminAccessStats = {
  visitorsToday: number
  visitors7d: number
  uniqueSessionsToday: number
  uniqueSessions7d: number
  pageViewsToday: number
  pageViews7d: number
  loginsToday: number
  totalUsers: number
  loggedInUsers7d: number
  recentVisits: AccessVisitRow[]
  recentLogins: LoggedInUserRow[]
  recentApplications: (ApplicationVisitRow | AppTableRow)[]
  topPages: { path: string; views: number }[]
}

function startOfDayIso(daysAgo = 0): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function isPublicPath(path: string | null): boolean {
  if (!path) return false
  return !path.startsWith('/admin') && !path.startsWith('/dashboard')
}

export function useAdminAccessStats() {
  return useQuery({
    queryKey: ['admin-access-stats'],
    // This query pulls up to 15,000 `interactions` rows (5,000 today + 10,000
    // for the week) and aggregates them in the browser: two filters, two Set
    // builds and a group-by, all on the main thread. At a 60s interval that ran
    // forever, including while the tab was in the background, which is the
    // stutter you feel while working in the admin panel.
    //
    // Five minutes, foreground only, with a stale window so remounting a page
    // does not re-run it. The real fix is to aggregate in Postgres -- see
    // supabase/ADMIN_DASHBOARD_PERF.sql, which needs to be run by hand.
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<AdminAccessStats> => {
      const todayIso = startOfDayIso(0)
      const weekIso = startOfDayIso(6)

      const [todayViewsRes, weekViewsRes, usersRes, recentLoginsRes, recentEventsRes, recentAppsRes, appsTableRes] =
        await Promise.all([
          supabase
            .from('interactions')
            .select('id,session_id,page_path,event_type,created_at')
            .eq('event_type', 'page_view')
            .gte('created_at', todayIso)
            .limit(5000),
          supabase
            .from('interactions')
            .select('id,session_id,page_path,event_type,created_at')
            .eq('event_type', 'page_view')
            .gte('created_at', weekIso)
            .limit(10000),
          supabase
            .from('user_profiles')
            .select('id,email,full_name,user_role,last_login_at,created_at,status', {
              count: 'exact',
            })
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('user_profiles')
            .select('id,email,full_name,user_role,last_login_at,created_at,status')
            .not('last_login_at', 'is', null)
            .gte('last_login_at', weekIso)
            .order('last_login_at', { ascending: false })
            .limit(20),
          supabase
            .from('interactions')
            .select(
              'id,user_id,session_id,event_type,page_path,page_title,referrer,device_type,browser,created_at',
            )
            .in('event_type', ['page_view', 'login', 'signup'])
            .order('created_at', { ascending: false })
            .limit(40),
          supabase
            .from('interactions')
            .select(
              'id,user_id,event_type,created_at,metadata',
            )
            .eq('event_type', 'application_submitted')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('applications')
            .select('*, user_profiles!left(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(10),
        ])

      if (todayViewsRes.error) throw todayViewsRes.error
      if (weekViewsRes.error) throw weekViewsRes.error
      if (recentEventsRes.error) throw recentEventsRes.error
      // appsTableRes may fail due to RLS; don't crash the whole query
      if (usersRes.error) throw usersRes.error
      if (recentLoginsRes.error) throw recentLoginsRes.error

      const todayPublic = (todayViewsRes.data || []).filter((r) => isPublicPath(r.page_path))
      const weekPublic = (weekViewsRes.data || []).filter((r) => isPublicPath(r.page_path))

      const uniqueSessionsToday = new Set(
        todayPublic.map((r) => r.session_id).filter(Boolean),
      ).size
      const uniqueSessions7d = new Set(weekPublic.map((r) => r.session_id).filter(Boolean)).size

      const pageCount = new Map<string, number>()
      for (const row of weekPublic) {
        const path = row.page_path || '/'
        pageCount.set(path, (pageCount.get(path) || 0) + 1)
      }
      const topPages = [...pageCount.entries()]
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8)

      const loginEventsToday = (recentEventsRes.data || []).filter(
        (r) => r.event_type === 'login' && r.created_at >= todayIso,
      ).length

      const userIds = [
        ...new Set(
          (recentEventsRes.data || [])
            .map((r) => r.user_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ]

      let profileMap = new Map<string, { email: string; full_name: string | null }>()
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id,email,full_name')
          .in('id', userIds)
        profileMap = new Map(
          (profiles || []).map((p) => [p.id, { email: p.email, full_name: p.full_name }]),
        )
      }

      const recentVisits: AccessVisitRow[] = (recentEventsRes.data || []).map((row) => {
        const profile = row.user_id ? profileMap.get(row.user_id) : undefined
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
          created_at: row.created_at,
          user_email: profile?.email ?? null,
          user_name: profile?.full_name ?? null,
        }
      })

      const recentApplications: (ApplicationVisitRow | AppTableRow)[] = (() => {
        const appIds = new Set<string>()
        const result: (ApplicationVisitRow | AppTableRow)[] = []
        for (const row of (recentAppsRes.data || []) as any[]) {
          const metadata = row.metadata || {}
          const appId = metadata?.application_id || row.id
          if (appIds.has(appId)) continue
          appIds.add(appId)
          const profile = row.user_id ? profileMap.get(row.user_id) : undefined
          result.push({
            id: row.id,
            event_type: row.event_type,
            application_id: metadata?.application_id || null,
            application_type: metadata?.application_type || null,
            user_email: profile?.email ?? null,
            user_name: profile?.full_name ?? null,
            created_at: row.created_at,
          })
        }
        for (const row of (appsTableRes.data || []) as any[]) {
          const appId = row.application_id || row.id
          if (appIds.has(appId)) continue
          appIds.add(appId)
          result.push({
            id: row.id,
            event_type: 'app_table_entry',
            application_id: row.application_id,
            application_type: row.application_type ?? 'general',
            user_email: row.user_profiles?.email ?? null,
            user_name: row.user_profiles?.full_name ?? null,
            created_at: row.created_at,
          })
        }
        return result.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      })()

      return {
        visitorsToday: uniqueSessionsToday,
        visitors7d: uniqueSessions7d,
        uniqueSessionsToday,
        uniqueSessions7d,
        pageViewsToday: todayPublic.length,
        pageViews7d: weekPublic.length,
        loginsToday: loginEventsToday,
        totalUsers: usersRes.count || 0,
        loggedInUsers7d: (recentLoginsRes.data || []).length,
        recentVisits,
        recentLogins: (recentLoginsRes.data || []) as LoggedInUserRow[],
        recentApplications,
        topPages,
      }
    },
  })
}
