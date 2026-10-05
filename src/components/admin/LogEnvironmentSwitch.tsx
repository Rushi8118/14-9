import { FlaskConical, Globe, Layers } from 'lucide-react'
import {
  LOG_ENVIRONMENT_FILTER_LABELS,
  LOG_ENVIRONMENT_LABELS,
  type LogEnvironment,
  type LogEnvironmentFilter,
} from '@/lib/runtime-env'

const OPTIONS = [
  ['production', Globe, 'Real activity on the live site'],
  ['local', FlaskConical, 'Activity recorded on localhost and during npm run build'],
  ['all', Layers, 'Live site, localhost and build activity together'],
] as const satisfies readonly (readonly [LogEnvironmentFilter, unknown, string])[]

/**
 * Chooses which environment's log records to show. Defaults to the live site so
 * development activity is never presented as real visitor activity.
 */
export function LogEnvironmentSwitch({
  value,
  onChange,
}: {
  value: LogEnvironmentFilter
  onChange: (value: LogEnvironmentFilter) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Environment"
      className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {OPTIONS.map(([option, Icon, hint]) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          title={hint}
          onClick={() => onChange(option)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
            value === option
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {LOG_ENVIRONMENT_FILTER_LABELS[option]}
        </button>
      ))}
    </div>
  )
}

/** A row written before the environment migration has no value; it is live-site activity. */
export function logEnvironmentLabel(environment: string | null | undefined): string {
  const value = (environment || 'production') as LogEnvironment
  return LOG_ENVIRONMENT_LABELS[value] ?? value
}

export function logEnvironmentBadgeClass(environment: string | null | undefined): string {
  switch (environment) {
    case 'local':
      return 'bg-purple-100 text-purple-800'
    case 'build':
      return 'bg-cyan-100 text-cyan-800'
    default:
      return 'bg-teal-100 text-teal-800'
  }
}
