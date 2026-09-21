import React, { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import { warmRoutesWhenIdle } from '@/lib/route-prefetch'
import {
  Bell,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Activity,
  Shield,
  Zap,
  Mail,
  MonitorSmartphone,
  ShieldAlert, MousePointerClick,
  ChevronLeft,
  ChevronRight,
  Menu,
  FolderOpen,
  Flame,
  Globe,
  Home,
  CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminErrorBoundary } from '@/components/AdminErrorBoundary'
import NotificationBell from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/admin/ThemeToggle'
import { AdminGlobalSearch } from '@/components/admin/AdminGlobalSearch'
import UserAvatar from '@/components/UserAvatar'
import UserProfileDropdown from '@/components/UserProfileDropdown'
import type { PermissionSlug } from '@/lib/rbac'

type NavItem = {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  requiredPermission?: PermissionSlug
  requiredPermissions?: PermissionSlug[]
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Live Metrics', path: '/admin/realtime', icon: Activity, requiredPermission: 'analytics.realtime' },
      { label: 'Notifications', path: '/admin/notifications', icon: Bell, requiredPermission: 'notifications.read' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', path: '/admin/users', icon: Users, requiredPermission: 'users.read' },
      { label: 'Roles & Permissions', path: '/admin/roles', icon: Shield, requiredPermission: 'roles.read' },
      { label: 'Applications', path: '/admin/applications', icon: Briefcase, requiredPermission: 'applications.read' },
      { label: 'Appointments', path: '/admin/appointments', icon: CalendarClock },
      { label: 'Urgent Openings', path: '/admin/urgent-requirements', icon: Flame },
      { label: 'Countries & Eligibility', path: '/admin/countries', icon: Globe },
      { label: 'Blog Posts', path: '/admin/blog', icon: FileText, requiredPermission: 'blogs.read' },
    ],
  },
  {
    label: 'Security & Logs',
    items: [
      { label: 'Sessions', path: '/admin/sessions', icon: MonitorSmartphone },
      { label: 'Audit Logs', path: '/admin/audit', icon: ShieldAlert, requiredPermission: 'audit.read' },
      { label: 'Activity Logs', path: '/admin/activity-logs', icon: MousePointerClick, requiredPermission: 'audit.read' },
    ],
  },
  {
    label: 'Automation',
    items: [
      { label: 'Automations', path: '/admin/automations', icon: Zap },
      { label: 'Email Templates', path: '/admin/email-templates', icon: Mail },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'File Manager', path: '/admin/files', icon: FolderOpen },
      { label: 'Settings', path: '/admin/settings', icon: Settings, requiredPermission: 'settings.read' },
    ],
  },
]

type NavIconTheme = {
  containerInactive: string
  containerActive: string
  iconInactive: string
  iconActive: string
  hasPulse?: boolean
  hasFlameGlow?: boolean
}

const NAV_ICON_THEMES: Record<string, NavIconTheme> = {
  '/admin': {
    containerInactive: 'bg-indigo-50/90 text-indigo-600 border-indigo-200/70 group-hover:bg-indigo-100/90 group-hover:border-indigo-300 group-hover:shadow-indigo-500/10 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40 dark:group-hover:bg-indigo-900/60',
    containerActive: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-indigo-400 shadow-md shadow-indigo-500/25',
    iconInactive: 'text-indigo-600 dark:text-indigo-400',
    iconActive: 'text-white',
  },
  '/admin/realtime': {
    containerInactive: 'bg-emerald-50/90 text-emerald-600 border-emerald-200/70 group-hover:bg-emerald-100/90 group-hover:border-emerald-300 group-hover:shadow-emerald-500/10 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 dark:group-hover:bg-emerald-900/60',
    containerActive: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-500/25',
    iconInactive: 'text-emerald-600 dark:text-emerald-400',
    iconActive: 'text-white',
    hasPulse: true,
  },
  '/admin/notifications': {
    containerInactive: 'bg-amber-50/90 text-amber-600 border-amber-200/70 group-hover:bg-amber-100/90 group-hover:border-amber-300 group-hover:shadow-amber-500/10 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 dark:group-hover:bg-amber-900/60',
    containerActive: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white border-amber-400 shadow-md shadow-amber-500/30',
    iconInactive: 'text-amber-600 dark:text-amber-400',
    iconActive: 'text-white',
  },
  '/admin/users': {
    containerInactive: 'bg-sky-50/90 text-sky-600 border-sky-200/70 group-hover:bg-sky-100/90 group-hover:border-sky-300 group-hover:shadow-sky-500/10 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/40 dark:group-hover:bg-sky-900/60',
    containerActive: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-sky-400 shadow-md shadow-sky-500/25',
    iconInactive: 'text-sky-600 dark:text-sky-400',
    iconActive: 'text-white',
  },
  '/admin/roles': {
    containerInactive: 'bg-amber-50/90 text-amber-600 border-amber-200/70 group-hover:bg-amber-100/90 group-hover:border-amber-300 group-hover:shadow-amber-500/10 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 dark:group-hover:bg-amber-900/60',
    containerActive: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white border-amber-400 shadow-md shadow-amber-500/30',
    iconInactive: 'text-amber-600 dark:text-amber-400',
    iconActive: 'text-white',
  },
  '/admin/applications': {
    containerInactive: 'bg-purple-50/90 text-purple-600 border-purple-200/70 group-hover:bg-purple-100/90 group-hover:border-purple-300 group-hover:shadow-purple-500/10 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40 dark:group-hover:bg-purple-900/60',
    containerActive: 'bg-gradient-to-br from-purple-500 to-violet-600 text-white border-purple-400 shadow-md shadow-purple-500/25',
    iconInactive: 'text-purple-600 dark:text-purple-400',
    iconActive: 'text-white',
  },
  '/admin/appointments': {
    containerInactive: 'bg-rose-50/90 text-rose-600 border-rose-200/70 group-hover:bg-rose-100/90 group-hover:border-rose-300 group-hover:shadow-rose-500/10 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40 dark:group-hover:bg-rose-900/60',
    containerActive: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-rose-400 shadow-md shadow-rose-500/25',
    iconInactive: 'text-rose-600 dark:text-rose-400',
    iconActive: 'text-white',
  },
  '/admin/urgent-requirements': {
    containerInactive: 'bg-orange-50/90 text-orange-600 border-orange-200/70 group-hover:bg-orange-100/90 group-hover:border-orange-300 group-hover:shadow-orange-500/10 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40 dark:group-hover:bg-orange-900/60',
    containerActive: 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-orange-400 shadow-md shadow-orange-500/30',
    iconInactive: 'text-orange-600 dark:text-orange-400',
    iconActive: 'text-white',
    hasFlameGlow: true,
  },
  '/admin/countries': {
    containerInactive: 'bg-teal-50/90 text-teal-600 border-teal-200/70 group-hover:bg-teal-100/90 group-hover:border-teal-300 group-hover:shadow-teal-500/10 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/40 dark:group-hover:bg-teal-900/60',
    containerActive: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-teal-400 shadow-md shadow-teal-500/25',
    iconInactive: 'text-teal-600 dark:text-teal-400',
    iconActive: 'text-white',
  },
  '/admin/blog': {
    containerInactive: 'bg-fuchsia-50/90 text-fuchsia-600 border-fuchsia-200/70 group-hover:bg-fuchsia-100/90 group-hover:border-fuchsia-300 group-hover:shadow-fuchsia-500/10 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 dark:border-fuchsia-800/40 dark:group-hover:bg-fuchsia-900/60',
    containerActive: 'bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white border-fuchsia-400 shadow-md shadow-fuchsia-500/25',
    iconInactive: 'text-fuchsia-600 dark:text-fuchsia-400',
    iconActive: 'text-white',
  },
  '/admin/sessions': {
    containerInactive: 'bg-slate-100/90 text-slate-600 border-slate-200/80 group-hover:bg-slate-200/80 group-hover:border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60 dark:group-hover:bg-slate-800',
    containerActive: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-600 shadow-md shadow-slate-700/25',
    iconInactive: 'text-slate-600 dark:text-slate-300',
    iconActive: 'text-white',
  },
  '/admin/audit': {
    containerInactive: 'bg-red-50/90 text-red-600 border-red-200/70 group-hover:bg-red-100/90 group-hover:border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40 dark:group-hover:bg-red-900/60',
    containerActive: 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-400 shadow-md shadow-red-500/25',
    iconInactive: 'text-red-600 dark:text-red-400',
    iconActive: 'text-white',
  },
  '/admin/activity-logs': {
    containerInactive: 'bg-blue-50/90 text-blue-600 border-blue-200/70 group-hover:bg-blue-100/90 group-hover:border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40 dark:group-hover:bg-blue-900/60',
    containerActive: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/25',
    iconInactive: 'text-blue-600 dark:text-blue-400',
    iconActive: 'text-white',
  },
  '/admin/automations': {
    containerInactive: 'bg-amber-50/90 text-amber-600 border-amber-200/70 group-hover:bg-amber-100/90 group-hover:border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 dark:group-hover:bg-amber-900/60',
    containerActive: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white border-amber-400 shadow-md shadow-amber-500/30',
    iconInactive: 'text-amber-600 dark:text-amber-400',
    iconActive: 'text-white',
  },
  '/admin/email-templates': {
    containerInactive: 'bg-cyan-50/90 text-cyan-600 border-cyan-200/70 group-hover:bg-cyan-100/90 group-hover:border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/40 dark:group-hover:bg-cyan-900/60',
    containerActive: 'bg-gradient-to-br from-cyan-500 to-sky-600 text-white border-cyan-400 shadow-md shadow-cyan-500/25',
    iconInactive: 'text-cyan-600 dark:text-cyan-400',
    iconActive: 'text-white',
  },
  '/admin/files': {
    containerInactive: 'bg-amber-50/90 text-amber-600 border-amber-200/70 group-hover:bg-amber-100/90 group-hover:border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 dark:group-hover:bg-amber-900/60',
    containerActive: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-md shadow-amber-500/25',
    iconInactive: 'text-amber-600 dark:text-amber-400',
    iconActive: 'text-white',
  },
  '/admin/settings': {
    containerInactive: 'bg-zinc-100/90 text-zinc-600 border-zinc-200/80 group-hover:bg-zinc-200/80 group-hover:border-zinc-300 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700/60 dark:group-hover:bg-zinc-800',
    containerActive: 'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white border-zinc-600 shadow-md shadow-zinc-700/25',
    iconInactive: 'text-zinc-600 dark:text-zinc-300',
    iconActive: 'text-white',
  },
}

const DEFAULT_NAV_THEME: NavIconTheme = {
  containerInactive: 'bg-slate-100/90 text-slate-600 border-slate-200/80 group-hover:bg-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60 dark:group-hover:bg-slate-800',
  containerActive: 'bg-gradient-to-br from-[var(--desk-gold)] to-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/25',
  iconInactive: 'text-slate-600 dark:text-slate-300',
  iconActive: 'text-white',
}

function useFilteredNavGroups(): NavGroup[] {
  const { can } = usePermissions()
  return useMemo(() => {
    return ALL_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.requiredPermission) return can(item.requiredPermission)
        if (item.requiredPermissions) return item.requiredPermissions.some((p) => can(p))
        return true
      }),
    })).filter((group) => group.items.length > 0)
  }, [can])
}

function Breadcrumbs() {
  const location = useLocation()
  const path = location.pathname.replace('/admin', '').split('/').filter(Boolean)
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[var(--desk-muted)]" aria-label="Breadcrumb">
      <Link to="/admin" className="hover:text-[var(--desk-navy)] transition-colors font-medium">
        Admin
      </Link>
      {path.map((seg, i) => (
        <span key={`${seg}-${i}`} className="flex items-center gap-1.5">
          <span aria-hidden="true">/</span>
          <span className="text-[var(--desk-navy)] font-medium capitalize">{seg.replace(/-/g, ' ')}</span>
        </span>
      ))}
    </nav>
  )
}

const AdminLayout: React.FC = () => {
  const { isAdmin, canAccessAdmin, isLoading, signOut, profile, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileWaitExpired, setProfileWaitExpired] = useState(false)
  const navGroups = useFilteredNavGroups()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    if (!user || profile) {
      setProfileWaitExpired(false)
      return
    }
    const timer = window.setTimeout(() => setProfileWaitExpired(true), 2500)
    return () => window.clearTimeout(timer)
  }, [user, profile])

  const waitingForProfile = Boolean(user) && !profile && !profileWaitExpired
  if (isLoading || waitingForProfile) {
    return (
      <div className="premium-desk min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--desk-gold)]/30 border-t-[var(--desk-gold)]" />
          <p className="text-sm text-[var(--desk-muted)]">Loading admin panel…</p>
        </div>
      </div>
    )
  }

  if (!isAdmin && !canAccessAdmin) {
    return (
      <div className="premium-desk min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center desk-panel border-[var(--desk-line)]">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="desk-display text-2xl font-semibold mb-2 text-[var(--desk-navy)]">Access Denied</h2>
          <p className="text-sm text-[var(--desk-muted)] mb-6">You don't have permission to access this area.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link to="/">Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)

  const activeLabel =
    navGroups.flatMap((g) => g.items).find((item) => isActive(item.path))?.label || 'Dashboard'

  const sidebarWidth = collapsed ? 'w-[64px]' : 'w-64'

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="h-full flex flex-col min-h-0">
      <div className={`shrink-0 flex items-center gap-3 p-4 border-b border-[var(--desk-line)] ${collapsed ? 'justify-center' : ''}`}>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center justify-center w-9 h-9 overflow-hidden rounded-xl bg-white ring-1 ring-[var(--desk-gold)]/40 shrink-0"
          aria-label="Siddhivinayak Overseas, go to home page"
          title="Go to home page"
        >
          <img
            src="/favicon/android-chrome-192x192.png"
            alt=""
            width={26}
            height={26}
            className="h-[26px] w-[26px] object-contain"
          />
        </Link>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="desk-display text-sm font-semibold text-[var(--desk-navy)] truncate">Siddhivinayak</h1>
            <p className="text-[10px] text-[var(--desk-muted)] uppercase tracking-[0.14em]">Admin Panel</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-[var(--desk-gold)]/10 text-[var(--desk-muted)] ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && profile && (
        <div className="shrink-0 mx-3 mt-3 p-3 rounded-xl bg-[var(--desk-ivory)]/80 border border-[var(--desk-line)]">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              imageUrl={profile.profile_photo_url}
              fullName={profile.full_name || profile.email}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--desk-navy)] truncate">
                {profile.full_name || profile.email}
              </p>
              <Badge className="mt-1 text-[10px] capitalize bg-[var(--desk-gold)]/15 text-[#8a6a1a] dark:text-[#f3cf7a] border border-[var(--desk-gold)]/25 hover:bg-[var(--desk-gold)]/15">
                {profile.user_role.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-2 space-y-4" aria-label="Admin">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-[var(--desk-muted)] uppercase tracking-[0.14em] px-3 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                const theme = NAV_ICON_THEMES[item.path] || DEFAULT_NAV_THEME
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex items-center gap-3 px-2.5 py-2 min-h-11 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-[var(--desk-gold)]/15 text-[var(--desk-navy)] font-semibold border border-[var(--desk-gold)]/35 shadow-xs'
                        : 'text-[var(--desk-navy)]/80 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] hover:text-[var(--desk-navy)]'
                    } ${collapsed ? 'justify-center px-1' : ''}`}
                  >
                    {active && !collapsed && (
                      <span
                        className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[var(--desk-gold)] shadow-xs"
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className={`relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl border transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs ${
                        active ? theme.containerActive : theme.containerInactive
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                          active ? theme.iconActive : theme.iconInactive
                        }`}
                        aria-hidden="true"
                      />

                      {theme.hasPulse && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2" aria-hidden="true">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-1.5 ring-white" />
                        </span>
                      )}

                      {theme.hasFlameGlow && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2" aria-hidden="true">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 ring-1.5 ring-white" />
                        </span>
                      )}
                    </div>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {collapsed && <span className="sr-only">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 p-2 border-t border-[var(--desk-line)] space-y-1">
        <Link
          to="/"
          onClick={onNavigate}
          title={collapsed ? 'Home Page' : undefined}
          className={`group flex items-center gap-3 w-full px-2.5 py-2 min-h-11 rounded-xl text-sm font-medium text-[var(--desk-navy)]/80 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] hover:text-[var(--desk-navy)] transition-all duration-200 ${
            collapsed ? 'justify-center px-1' : ''
          }`}
        >
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl border border-blue-200/70 bg-blue-50/90 text-blue-600 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-400 shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-100 group-hover:shadow-xs">
            <Home className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
          </div>
          {!collapsed && <span className="truncate">Home Page</span>}
          {collapsed && <span className="sr-only">Home Page</span>}
        </Link>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          title={collapsed ? 'Applicant Desk' : undefined}
          className={`group flex items-center gap-3 w-full px-2.5 py-2 min-h-11 rounded-xl text-sm font-medium text-[var(--desk-navy)]/80 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] hover:text-[var(--desk-navy)] transition-all duration-200 ${
            collapsed ? 'justify-center px-1' : ''
          }`}
        >
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl border border-amber-200/70 bg-amber-50/90 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-400 shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:bg-amber-100 group-hover:shadow-xs">
            <LayoutDashboard className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
          </div>
          {!collapsed && <span className="truncate">Applicant Desk</span>}
          {collapsed && <span className="sr-only">Applicant Desk</span>}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`group flex items-center gap-3 w-full px-2.5 py-2 min-h-11 rounded-xl text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-950/40 transition-all duration-200 ${
            collapsed ? 'justify-center px-1' : ''
          }`}
        >
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl border border-red-200/70 bg-red-50/90 text-red-600 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400 shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:bg-red-100 group-hover:shadow-xs">
            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
          </div>
          {!collapsed && <span className="truncate">Sign Out</span>}
          {collapsed && <span className="sr-only">Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="premium-desk h-dvh w-full flex overflow-hidden">
      <a href="#admin-main" className="skip-to-content">
        Skip to main content
      </a>

      <aside
        className={`desk-sidebar hidden lg:flex flex-col h-dvh border-r transition-all duration-200 shrink-0 overflow-hidden ${sidebarWidth}`}
        aria-label="Admin sidebar"
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--desk-navy)]/40 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`desk-sidebar fixed inset-y-0 left-0 z-50 h-dvh w-64 border-r flex flex-col overflow-hidden transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col h-dvh min-w-0 overflow-hidden">
        <header className="desk-topbar shrink-0 h-14 border-b flex items-center gap-3 px-3 sm:px-4 lg:px-6 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-[var(--desk-gold)]/10 text-[var(--desk-muted)]"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="hidden md:block">
              <Breadcrumbs />
            </div>
            <h1 className="md:hidden desk-display text-sm font-semibold text-[var(--desk-navy)] truncate">
              {activeLabel}
            </h1>
          </div>

          <div className="w-full max-w-xs hidden sm:block">
            <AdminGlobalSearch />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden sm:block">
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 min-h-0 p-4 lg:p-8 overflow-y-auto outline-none"
        >
          <div className="mx-auto w-full max-w-7xl">
            <AdminErrorBoundary key={location.pathname}>
              <SuspendedOutlet />
            </AdminErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Suspends only the content area while a page chunk loads, so the sidebar and header
 * stay mounted instead of the whole layout being torn down on every navigation.
 */
function SuspendedOutlet() {
  useEffect(() => warmRoutesWhenIdle('/admin'), [])
  return (
    <React.Suspense fallback={<ContentSkeleton />}>
      <Outlet />
    </React.Suspense>
  )
}

function ContentSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-4 animate-pulse">
      <div className="h-8 w-64 max-w-full rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-muted" />
    </div>
  )
}

export default AdminLayout
