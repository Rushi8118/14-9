import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const metricCardVariants = cva(
  'bg-card border border-border rounded-xl p-5 transition-all hover:shadow-md',
  {
    variants: {
      accent: {
        gold: 'border-l-4 border-l-amber-500',
        blue: 'border-l-4 border-l-blue-500',
        green: 'border-l-4 border-l-green-500',
        red: 'border-l-4 border-l-red-500',
        purple: 'border-l-4 border-l-purple-500',
      },
    },
    defaultVariants: { accent: 'gold' },
  },
)

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  accent = 'gold',
  className,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'flat'
  trendLabel?: string
  accent?: 'gold' | 'blue' | 'green' | 'red' | 'purple'
  className?: string
}) {
  return (
    <div className={cn(metricCardVariants({ accent }), className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
          {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
          {trend === 'flat' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className={cn(
            'text-xs font-medium',
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'flat' && 'text-muted-foreground',
          )}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  )
}
