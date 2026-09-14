import React, { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import {
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
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Menu,
  FolderOpen,
  Flame,
  Globe,
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
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', path: '/admin/users', icon: Users, requiredPermission: 'users.read' },
      { label: 'Roles & Permissions', path: '/admin/roles', icon: Shield, requiredPermission: 'roles.read' },
      { label: 'Applications', path: '/admin/applications', icon: Briefcase, requiredPermission: 'applications.read' },
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
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--desk-gold)]/15 text-[var(--desk-gold)] ring-1 ring-[var(--desk-gold)]/30 shrink-0"
          aria-label="Siddhivinayak home"
        >
          <Shield className="w-4.5 h-4.5" aria-hidden="true" />
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
              <Badge className="mt-1 text-[10px] capitalize bg-[var(--desk-gold)]/15 text-[#8a6a1a] border border-[var(--desk-gold)]/25 hover:bg-[var(--desk-gold)]/15">
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
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2.5 min-h-10 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'desk-nav-active'
                        : 'text-[var(--desk-muted)] hover:bg-[var(--desk-gold)]/10 hover:text-[var(--desk-navy)]'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
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
          to="/dashboard"
          onClick={onNavigate}
          className={`flex items-center gap-2 w-full px-3 py-2.5 min-h-10 rounded-xl text-sm font-medium text-[var(--desk-muted)] hover:bg-[var(--desk-gold)]/10 hover:text-[var(--desk-navy)] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />
          {!collapsed && 'Applicant Desk'}
          {collapsed && <span className="sr-only">Applicant Desk</span>}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-2 w-full px-3 py-2.5 min-h-10 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          {!collapsed && 'Sign Out'}
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
              <Outlet />
            </AdminErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
