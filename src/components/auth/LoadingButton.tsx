import type { ComponentProps } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LoadingButtonProps = Omit<ComponentProps<typeof Button>, 'loading'> & {
  loading: boolean
  loadingText: string
  icon?: LucideIcon
}

export function LoadingButton({ loading, loadingText, icon: Icon, children, disabled, className, ...props }: LoadingButtonProps) {
  return (
    <Button
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn('h-11 w-full rounded-full btn-glow', className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
          {children}
        </>
      )}
    </Button>
  )
}
