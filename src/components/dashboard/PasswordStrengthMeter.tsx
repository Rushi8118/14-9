import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { id: 'number', label: 'One number', test: (value: string) => /\d/.test(value) },
  { id: 'special', label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

export function meetsPasswordRequirements(value: string) {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(value))
}

const LEVELS = [
  { label: 'Weak', bar: 'bg-[var(--desk-danger)]', text: 'text-[var(--desk-danger)]' },
  { label: 'Fair', bar: 'bg-[var(--desk-warning)]', text: 'text-[var(--desk-warning)]' },
  { label: 'Good', bar: 'bg-[var(--desk-info)]', text: 'text-[var(--desk-info)]' },
  { label: 'Strong', bar: 'bg-[var(--desk-success)]', text: 'text-[var(--desk-success)]' },
]

export default function PasswordStrengthMeter({ password, id }: { password: string; id?: string }) {
  const met = PASSWORD_REQUIREMENTS.filter((requirement) => requirement.test(password)).length
  const level = met <= 2 ? 0 : met - 2
  const current = LEVELS[level]

  return (
    <div id={id}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--desk-muted)]">Password strength</span>
        <span aria-live="polite" className={cn('font-semibold', password ? current.text : 'text-[var(--desk-muted)]')}>
          {password ? current.label : 'Not entered'}
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-4 gap-1" aria-hidden="true">
        {LEVELS.map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 rounded-full transition-colors',
              password && index <= level ? current.bar : 'bg-[var(--desk-line)]',
            )}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const ok = requirement.test(password)
          const Icon = ok ? CheckCircle2 : Circle
          return (
            <li
              key={requirement.id}
              className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-[var(--desk-success)]' : 'text-[var(--desk-muted)]')}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {requirement.label}
              <span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
