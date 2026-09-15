import type { ComponentProps, ReactNode } from 'react'
import { AlertCircle, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type AuthFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  id: string
  label: string
  icon: LucideIcon
  error?: string
  /** Helper content rendered below the input and linked with aria-describedby. */
  hint?: ReactNode
  /** Small action shown on the label row, e.g. "Forgot password?". */
  labelAction?: ReactNode
  /** Element positioned inside the input on the right, e.g. a visibility toggle. */
  trailing?: ReactNode
}

export function AuthField({ id, label, icon: Icon, error, hint, labelAction, trailing, className, ...inputProps }: AuthFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        />
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 scroll-mt-32 rounded-xl border-border/70 bg-background/60 pl-10 text-base sm:text-sm',
            'hover:border-foreground/25 focus-visible:border-primary',
            trailing && 'pr-12',
            className,
          )}
          {...inputProps}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {hint ? (
        <div id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  )
}
