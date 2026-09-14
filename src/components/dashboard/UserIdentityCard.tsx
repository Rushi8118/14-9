import { Link } from 'react-router-dom'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRole } from '@/hooks/useRole'
import UserAvatar from '@/components/UserAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CollapsedTooltip } from './SidebarNavGroup'
import { humanize } from './dashboard-utils'

export default function UserIdentityCard({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { user, profile } = useAuth()
  const role = useRole()
  const name = profile?.full_name || 'Applicant'
  const email = user?.email ?? ''
  const isActive = !profile || profile.status === 'active'
  const label = `${name}, ${role.name}, account ${isActive ? 'active' : humanize(profile?.status)}. Open profile settings`

  const avatar = (
    <span className="relative shrink-0">
      <UserAvatar imageUrl={profile?.profile_photo_url} fullName={profile?.full_name || email} size="sm" />
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--desk-surface)]',
          isActive ? 'bg-[var(--desk-success)]' : 'bg-[var(--desk-warning)]',
        )}
        aria-hidden="true"
      />
    </span>
  )

  if (collapsed) {
    return (
      <div className="mt-4 flex justify-center">
        <CollapsedTooltip label={`${name} · ${email}`} collapsed>
          <Link
            to="/dashboard/profile"
            onClick={onNavigate}
            aria-label={label}
            className="grid h-11 w-11 place-items-center rounded-full transition hover:ring-2 hover:ring-[var(--desk-gold)]/40"
          >
            {avatar}
          </Link>
        </CollapsedTooltip>
      </div>
    )
  }

  return (
    <div className="mx-3 mt-4">
      <Link
        to="/dashboard/profile"
        onClick={onNavigate}
        aria-label={label}
        className="group flex items-center gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--desk-gold)]/45 hover:shadow-[0_12px_24px_-18px_rgba(26,35,64,0.45)]"
      >
        {avatar}
        <span className="min-w-0 flex-1" aria-hidden="true">
          <span className="block truncate text-sm font-semibold text-[var(--desk-navy)]">{name}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block truncate text-xs text-[var(--desk-muted)]">{email}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom">{email}</TooltipContent>
          </Tooltip>
          <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--desk-gold)]/30 bg-[var(--desk-gold)]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7a5c12]">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            <span className="truncate">{role.name}</span>
          </span>
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-[var(--desk-muted)] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </Link>
    </div>
  )
}
