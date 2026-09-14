import type { ReactNode } from 'react'
import { CircleCheck, CircleX, FilePen, Hourglass, Send, Undo2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from './dashboard-utils'

export type PillTone = 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'navy'

const TONES: Record<PillTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  gold: 'bg-[#c49a2b]/12 text-[#7a5c12] border-[#c49a2b]/35',
  success: 'bg-emerald-50 text-[#1a6f4a] border-emerald-200',
  warning: 'bg-amber-50 text-[#8a5800] border-amber-200',
  danger: 'bg-red-50 text-[#b42318] border-red-200',
  info: 'bg-sky-50 text-[#1f5f96] border-sky-200',
  navy: 'bg-[#1a2340]/6 text-[#1a2340] border-[#1a2340]/15',
}

export function StatusPill({
  tone = 'neutral',
  icon: Icon,
  children,
  className,
}: {
  tone?: PillTone
  icon?: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}

const STATUS_VISUALS: Record<ApplicationStatus, { tone: PillTone; icon: LucideIcon }> = {
  draft: { tone: 'warning', icon: FilePen },
  submitted: { tone: 'info', icon: Send },
  under_review: { tone: 'gold', icon: Hourglass },
  approved: { tone: 'success', icon: CircleCheck },
  rejected: { tone: 'danger', icon: CircleX },
  withdrawn: { tone: 'neutral', icon: Undo2 },
}

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const visual = STATUS_VISUALS[status] ?? STATUS_VISUALS.draft
  return (
    <StatusPill tone={visual.tone} icon={visual.icon} className={className}>
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </StatusPill>
  )
}
