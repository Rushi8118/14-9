import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarPlus, LifeBuoy, Menu, Search, UserRoundPen } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import NotificationBell from '@/components/NotificationBell'
import UserProfileDropdown from '@/components/UserProfileDropdown'
import UserAvatar from '@/components/UserAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { PAGE_LABELS, getDashboardNavGroups } from './dashboard-nav'
import { humanize } from './dashboard-utils'

const iconButton =
  'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--desk-muted)] transition hover:bg-[var(--desk-gold)]/10 hover:text-[var(--desk-navy)]'

export default function DashboardTopbar({
  scrolled,
  mobileOpen,
  onOpenMenu,
}: {
  scrolled: boolean
  mobileOpen: boolean
  onOpenMenu: () => void
}) {
  const { user, profile, canAccessAdmin } = useAuth()
  const { can } = usePermissions()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const navItems = useMemo(
    () => getDashboardNavGroups({ can, canAccessAdmin }).flatMap((group) => group.items),
    [can, canAccessAdmin],
  )

  const path = pathname.replace(/\/+$/, '')
  const pageLabel = PAGE_LABELS[path] ?? humanize(path.split('/').pop())

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const go = (to: string) => {
    setSearchOpen(false)
    navigate(to)
  }

  return (
    <header
      data-scrolled={scrolled}
      className="desk-topbar z-30 flex h-16 shrink-0 items-center gap-1.5 border-b px-3 transition-shadow duration-200 sm:gap-2 sm:px-5 lg:px-8"
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="dashboard-mobile-nav"
        className={`${iconButton} lg:hidden`}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center gap-1.5 text-xs text-[var(--desk-muted)]">
            <li>
              <Link to="/dashboard" className="rounded hover:text-[var(--desk-navy)]">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate font-medium text-[var(--desk-navy)]">
              {pageLabel}
            </li>
          </ol>
        </nav>
        <p className="desk-display truncate text-base font-semibold leading-tight text-[var(--desk-navy)]">{pageLabel}</p>
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-haspopup="dialog"
        aria-label="Search pages and actions"
        className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface)] px-3 text-sm text-[var(--desk-muted)] transition hover:border-[var(--desk-gold)]/45 md:flex"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="rounded border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] px-1.5 text-[10px] font-medium">
          Ctrl K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-haspopup="dialog"
        aria-label="Search pages and actions"
        className={`${iconButton} md:hidden`}
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => navigate('/dashboard/chat')}
            aria-label="Get help from your case officer"
            className={`${iconButton} hidden sm:grid`}
          >
            <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Get help from your case officer</TooltipContent>
      </Tooltip>

      <NotificationBell />

      <div className="hidden sm:block">
        <UserProfileDropdown />
      </div>
      <Link
        to="/dashboard/profile"
        aria-label="Open profile settings"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full sm:hidden"
      >
        <UserAvatar imageUrl={profile?.profile_photo_url} fullName={profile?.full_name || user?.email} size="sm" />
      </Link>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No matching pages.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => go('/dashboard?book=1')}>
              <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Book consultation
            </CommandItem>
            <CommandItem onSelect={() => go('/dashboard/profile?tab=personal')}>
              <UserRoundPen className="mr-2 h-4 w-4" aria-hidden="true" />
              Complete profile
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Go to">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem key={item.path} value={`${item.label} ${item.description}`} onSelect={() => go(item.path)}>
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{item.description}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}
