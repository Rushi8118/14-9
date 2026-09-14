import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type DailyPoint = { date: string; page_views: number; visitors: number; logins: number }
export type BreakdownItem = { count: number } & Record<string, string | number>

export type DashboardAnalytics = {
  daily: DailyPoint[]
  today: { page_views_today: number; visitors_today: number; logins_today: number }
  range: {
    page_views_range: number
    visitors_range: number
    logins_range: number
    page_views_prev: number
    visitors_prev: number
    logins_prev: number
  }
  devices: { device: string; count: number }[]
  browsers: { browser: string; count: number }[]
  top_pages: { path: string; views: number }[]
  sources: { source: string; count: number }[]
  countries: { country: string; count: number }[]
  has_country_data: boolean
  range_days: number
}

/** Percentage change vs. the immediately preceding period of equal length.
 *  Returns null (not 0) when there's no prior data to compare against, so
 *  the UI can say "no baseline yet" instead of a misleading "0%". */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function useDashboardAnalytics(rangeDays: number) {
  return useQuery<DashboardAnalytics>({
    queryKey: ['admin-dashboard-analytics', rangeDays],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_analytics', { p_days: rangeDays })
      if (error) throw error
      return (typeof data === 'string' ? JSON.parse(data) : data) as DashboardAnalytics
    },
  })
}
