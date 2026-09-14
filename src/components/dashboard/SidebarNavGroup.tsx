import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { DashboardNavItem } from './dashboard-nav'

export function navItemClass(active: boolean, collapsed: boolean) {
  return cn(
    'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150',
    active
      ? 'desk-nav-item-active text-[var(--desk-navy)]'
      : 'text-[var(--desk-muted)] hover:bg-[var(--desk-gold)]/8 hover:text-[var(--desk-navy)]',
    collapsed && 'justify-center px-0',
  )
}

export function CollapsedTooltip({ label, collapsed, children }: { label: string; collapsed: boolean; children: ReactNode }) {
  if (!collapsed) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export default function SidebarNavGroup({
  label,
  items,
  collapsed,
  isActive,
  badges,
  onNavigate,
  children,
}: {
  label: string
  items: DashboardNavItem[]
  collapsed: boolean
  isActive: (path: string) => boolean
  badges?: Partial<Record<string, number>>
  onNavigate?: () => void
  children?: ReactNode
}) {
  const headingId = useId()

  return (
    <div role="group" aria-labelledby={headingId}>
      <p
        id={headingId}
        className={cn(
          'mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--desk-muted)]/90',
          collapsed && 'sr-only',
        )}
      >
        {label}
      </p>
      {collapsed && <div className="mx-auto mb-2 h-px w-8 bg-[var(--desk-line)]" aria-hidden="true" />}
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isActive(item.path)
          const badge = badges?.[item.path] ?? 0
          const Icon = item.icon
          const tooltip = badge > 0 ? `${item.label} (${badge} unread)` : item.label

          return (
            <li key={item.path}>
              <CollapsedTooltip label={tooltip} collapsed={collapsed}>
                <Link
                  to={item.path}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={navItemClass(active, collapsed)}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      active ? 'text-[var(--desk-gold)]' : 'text-[var(--desk-muted)] group-hover:text-[var(--desk-navy)]',
                    )}
                    aria-hidden="true"
                  />
                  <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
                  {badge > 0 && (
                    <span
                      className={cn(
                        'grid min-w-5 place-items-center rounded-full bg-[var(--desk-navy)] px-1.5 text-[10px] font-semibold leading-5 text-[#fff8e7]',
                        collapsed ? 'absolute right-3 top-1.5 min-w-4 px-1 leading-4' : 'ml-auto',
                      )}
                    >
                      {badge > 99 ? '99+' : badge}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </Link>
              </CollapsedTooltip>
            </li>
          )
        })}
        {children}
      </ul>
    </div>
  )
}
