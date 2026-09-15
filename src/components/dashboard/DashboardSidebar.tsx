import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { skipToken, useQuery } from '@tanstack/react-query'
import { ChevronsLeft, ChevronsRight, LogOut, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import type { Notification } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import SidebarNavGroup, { CollapsedTooltip, navItemClass } from './SidebarNavGroup'
import UserIdentityCard from './UserIdentityCard'
import { getDashboardNavGroups, isNavItemActive } from './dashboard-nav'

/**
 * Reads the notifications cache kept live by NotificationBell. Calling useNotifications()
 * here would open a second realtime channel with the same name and replace the bell's.
 */
function useUnreadNotificationCount() {
  const { user } = useAuth()
  // skipToken observes the cache without fetching; a bare `enabled: false` logs "No queryFn" on invalidation.
  const { data } = useQuery<Notification[]>({ queryKey: ['notifications', user?.id], queryFn: skipToken })
  return data?.filter((notification) => !notification.is_read).length ?? 0
}

export default function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}) {
  const { signOut, canAccessAdmin } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const unread = useUnreadNotificationCount()
  const [signingOut, setSigningOut] = useState(false)
  const groups = useMemo(() => getDashboardNavGroups({ can, canAccessAdmin }), [can, canAccessAdmin])
  const isDrawer = !onToggleCollapse

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    onNavigate?.()
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'relative flex h-16 shrink-0 items-center gap-2 border-b border-[var(--desk-line)] px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--desk-gold)]/70 to-transparent"
          aria-hidden="true"
        />
        <Link
          to="/"
          onClick={onNavigate}
          aria-label="Siddhivinayak Overseas, go to home page"
          title="Go to home page"
          className="flex min-w-0 items-center gap-3 rounded-xl"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--desk-gold)]/40 shadow-[0_8px_18px_-10px_rgba(196,154,43,0.9)]">
            <img
              src="/favicon/android-chrome-192x192.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </span>
          {!collapsed && (
            <span className="min-w-0" aria-hidden="true">
              <span className="desk-display block truncate text-[15px] font-semibold leading-tight text-[var(--desk-navy)]">
                Siddhivinayak
              </span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[var(--desk-muted)]">Applicant Desk</span>
            </span>
          )}
        </Link>

        {onToggleCollapse && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            aria-expanded
            aria-controls="dashboard-sidebar"
            className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-[var(--desk-muted)] transition hover:bg-[var(--desk-gold)]/10 hover:text-[var(--desk-navy)]"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {isDrawer && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation menu"
            className="ml-auto grid h-11 w-11 place-items-center rounded-xl text-[var(--desk-muted)] transition hover:bg-[var(--desk-gold)]/10 hover:text-[var(--desk-navy)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {onToggleCollapse && collapsed && (
        <CollapsedTooltip label="Expand sidebar" collapsed>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            aria-expanded={false}
            aria-controls="dashboard-sidebar"
            className="mx-auto mt-3 grid h-9 w-9 place-items-center rounded-lg text-[var(--desk-muted)] transition hover:bg-[var(--desk-gold)]/10 hover:text-[var(--desk-navy)]"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </CollapsedTooltip>
      )}

      <UserIdentityCard collapsed={collapsed} onNavigate={onNavigate} />

      <nav aria-label="Dashboard" className={cn('min-h-0 flex-1 space-y-5 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}>
        {groups.map((group) => (
          <SidebarNavGroup
            key={group.label}
            label={group.label}
            items={group.items}
            collapsed={collapsed}
            isActive={(path) => isNavItemActive(pathname, path)}
            badges={{ '/dashboard/notifications': unread }}
            onNavigate={onNavigate}
          >
            {group.label === 'Account' && (
              <li>
                <CollapsedTooltip label="Sign Out" collapsed={collapsed}>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className={cn(
                      navItemClass(false, collapsed),
                      'w-full hover:bg-red-50 hover:text-[var(--desk-danger)] disabled:opacity-60',
                    )}
                  >
                    <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <span className={collapsed ? 'sr-only' : 'truncate'}>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
                  </button>
                </CollapsedTooltip>
              </li>
            )}
          </SidebarNavGroup>
        ))}
      </nav>
    </div>
  )
}
