import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const bar = 'bg-[var(--desk-line)]/60'

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('desk-card p-5', className)} role="status">
      <span className="sr-only">Loading…</span>
      <Skeleton className={cn('h-4 w-1/3', bar)} />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn('h-3', bar, i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--desk-line)] p-4">
          <Skeleton className={cn('h-10 w-10 rounded-lg', bar)} />
          <div className="flex-1 space-y-2">
            <Skeleton className={cn('h-3.5 w-1/2', bar)} />
            <Skeleton className={cn('h-3 w-1/3', bar)} />
          </div>
          <Skeleton className={cn('h-6 w-20 rounded-full', bar)} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonSidebar() {
  return (
    <div className="space-y-3 p-4" role="status">
      <span className="sr-only">Loading navigation…</span>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className={cn('h-10 w-full rounded-xl', bar)} />
      ))}
    </div>
  )
}
