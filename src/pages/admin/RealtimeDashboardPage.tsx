import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics'
import {
  Users, Activity, Briefcase, Clock, TrendingUp, Zap,
  RefreshCw, Wifi, WifiOff, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { MetricCard } from '@/components/admin/MetricCard'
import { Empty } from '@/components/ui/empty'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-gray-400', viewer: 'bg-slate-400', editor: 'bg-blue-500',
  consultant: 'bg-teal-500', manager: 'bg-violet-500', admin: 'bg-amber-500',
  super_admin: 'bg-red-500', superadmin: 'bg-red-500',
}

export default function RealtimeDashboardPage() {
  const { metrics, loading, connected, refetch } = useRealtimeMetrics()

  const maxRoleCount = Math.max(...metrics.usersByRole.map(r => r.count), 1)

  const metricCards = [
    { title: 'Active Users', value: metrics.activeUsers, subtitle: 'right now', icon: Activity, trend: 'up' as const, trendLabel: '+12%', accent: 'green' as const },
    { title: 'Active Sessions', value: metrics.activeSessions, subtitle: 'open sessions', icon: Wifi, trend: 'flat' as const, trendLabel: 'stable', accent: 'blue' as const },
    { title: 'Total Users', value: metrics.totalUsers.toLocaleString(), subtitle: `+${metrics.newUsersToday} today`, icon: Users, trend: 'up' as const, trendLabel: '+8%', accent: 'gold' as const },
    { title: 'Applications', value: metrics.totalApplications.toLocaleString(), subtitle: `${metrics.pendingApplications} pending`, icon: Briefcase, trend: 'up' as const, trendLabel: '+5%', accent: 'purple' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your platform metrics and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={connected ? 'gap-1.5' : 'bg-amber-50 text-amber-700 border-amber-200 gap-1.5'}>
            {connected
              ? <><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live</>
              : <><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Polling</>
            }
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!connected && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <div>
            <AlertTitle>Real-time connection lost</AlertTitle>
            <AlertDescription>Showing cached data. The dashboard will refresh automatically when the connection is restored.</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(card => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Applications This Week
            </CardTitle>
            <CardDescription>Daily application submissions</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="flex items-end gap-3 h-40">
              {metrics.applicationsOverTime.length > 0 ? (
                metrics.applicationsOverTime.map(point => {
                  const maxVal = Math.max(...metrics.applicationsOverTime.map(p => p.value), 1)
                  const pct = maxVal > 0 ? (point.value / maxVal) * 100 : 0
                  return (
                    <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">{point.value}</span>
                      <div className="w-full bg-muted rounded-t-lg" style={{ height: '120px' }}>
                        <div className="w-full bg-primary/70 hover:bg-primary rounded-t-lg transition-all duration-500" style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{point.label}</span>
                    </div>
                  )
                })
              ) : (
                <Empty title="No data" description="Application data will appear here once submissions come in." />
              )}
            </div>
          </CardContent>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Users by Role
          </h3>
          {metrics.usersByRole.length > 0 ? (
            <div className="space-y-3">
              {metrics.usersByRole.sort((a, b) => b.count - a.count).map(({ role, count }) => (
                <div key={role} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-foreground font-medium">{role}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${ROLE_COLORS[role] ?? 'bg-gray-400'}`} style={{ width: `${(count / maxRoleCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No roles" description="Role distribution data will appear here." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Response', value: `${metrics.avgResponseMs}ms`, icon: Zap, color: 'text-teal-500' },
          { label: 'Error Rate', value: `${metrics.errorRate}%`, icon: AlertCircle, color: metrics.errorRate > 1 ? 'text-destructive' : 'text-green-500' },
          { label: 'New Today', value: metrics.newUsersToday.toString(), icon: TrendingUp, color: 'text-pink-500' },
          { label: 'Pending Review', value: metrics.pendingApplications.toString(), icon: Clock, color: 'text-orange-500' },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
              </div>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
