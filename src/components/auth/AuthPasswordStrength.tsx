import { PasswordRequirements } from '@/components/password-requirements'
import { getPasswordStrength, type PasswordStrengthLevel } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

const LEVEL_BAR: Record<PasswordStrengthLevel, string> = {
  Weak: 'bg-destructive',
  Fair: 'bg-amber-500',
  Good: 'bg-sky-500',
  Strong: 'bg-emerald-500',
}

/** Strength meter that reports level in text and as an ARIA meter, never by colour alone. */
export function AuthPasswordStrength({ password }: { password: string }) {
  if (!password) {
    return <p>Use at least 8 characters with upper and lowercase letters, a number and a symbol.</p>
  }

  const strength = getPasswordStrength(password)

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <span>Password strength</span>
        <span className="font-semibold text-foreground">
          {strength.level} · {strength.score}/{strength.maxScore}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={strength.maxScore}
        aria-valuenow={strength.score}
        aria-valuetext={`${strength.level}: ${strength.score} of ${strength.maxScore} requirements met`}
        className="grid h-1.5 grid-cols-5 gap-1"
      >
        {Array.from({ length: strength.maxScore }, (_, index) => (
          <span
            key={index}
            className={cn(
              'rounded-full transition-colors duration-300',
              index < strength.score ? LEVEL_BAR[strength.level] : 'bg-border',
            )}
          />
        ))}
      </div>
      <PasswordRequirements strength={strength} />
    </div>
  )
}
