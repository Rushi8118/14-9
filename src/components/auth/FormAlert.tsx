import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type FormAlertProps = {
  tone: 'error' | 'success'
  title?: string
  children: ReactNode
  className?: string
}

/** Form-level message. Errors interrupt screen readers (role=alert); successes are announced politely. */
export function FormAlert({ tone, title, children, className }: FormAlertProps) {
  const Icon = tone === 'error' ? AlertTriangle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xl border p-3.5 text-sm',
        tone === 'error'
          ? 'border-destructive/30 bg-destructive/5 text-foreground'
          : 'border-emerald-600/30 bg-emerald-600/5 text-foreground',
        className,
      )}
    >
      <Icon
        className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'error' ? 'text-destructive' : 'text-emerald-600')}
        aria-hidden="true"
      />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-muted-foreground [&_a]:font-semibold [&_a]:text-foreground [&_a]:underline [&_a]:decoration-primary [&_a]:underline-offset-4">
          {children}
        </div>
      </div>
    </div>
  )
}
