import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function InlineError({
  title = 'We could not load your dashboard.',
  description = 'Please refresh and try again.',
  onRetry,
  isRetrying = false,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--desk-danger)]" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-[var(--desk-navy)]">{title}</p>
          <p className="text-sm text-[var(--desk-muted)]">{description}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
          className="min-h-11 rounded-full border-red-200 bg-white text-[var(--desk-danger)] hover:bg-red-50"
        >
          <RotateCw className={cn('mr-1.5 h-4 w-4', isRetrying && 'animate-spin')} aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  )
}
