import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  compact = false,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  actions?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[var(--desk-line)] bg-[var(--desk-surface-soft)]/70 px-4',
        compact ? 'py-6' : 'py-10 sm:py-12',
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--desk-gold)]/12 text-[var(--desk-gold)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[var(--desk-navy)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--desk-muted)]">{description}</p>}
      {actions && <div className="mt-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{actions}</div>}
    </div>
  )
}
