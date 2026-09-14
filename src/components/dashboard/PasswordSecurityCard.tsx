import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { InvalidCurrentPasswordError, useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordStrengthMeter, { meetsPasswordRequirements } from './PasswordStrengthMeter'
import { formatDateTime, hasPasswordLogin } from './dashboard-utils'

type FieldName = 'current' | 'next' | 'confirm'

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  describedBy,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete: string
  describedBy?: string
  disabled?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const ariaDescribedBy = [error && `${id}-error`, describedBy].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[var(--desk-navy)]">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          className="h-11 rounded-xl border-[var(--desk-line)] bg-white pr-12 aria-[invalid=true]:border-[var(--desk-danger)]"
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-r-xl text-[var(--desk-muted)] hover:text-[var(--desk-navy)]"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-[var(--desk-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

export default function PasswordSecurityCard() {
  const { user } = useAuth()
  const { updatePasswordAsync, passwordLoading } = useProfile()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})

  if (!user) return null

  const header = (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--desk-gold)]/12 text-[#8a6a1a]">
        <KeyRound className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 id="password-security-heading" className="desk-display text-xl font-semibold text-[var(--desk-navy)]">
          Password security
        </h2>
        <p className="mt-0.5 text-sm text-[var(--desk-muted)]">Update your password regularly to protect your account.</p>
      </div>
    </div>
  )

  if (!hasPasswordLogin(user)) {
    return (
      <section aria-labelledby="password-security-heading" className="desk-card p-5 sm:p-6">
        {header}
        <p className="mt-4 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-4 text-sm text-[var(--desk-muted)]">
          You sign in with Google, so there is no separate password for this account. Manage your password and security
          from your Google account.
        </p>
      </section>
    )
  }

  const dirty = !!(current || next || confirm)

  const reset = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setErrors({})
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (passwordLoading) return

    const nextErrors: Partial<Record<FieldName, string>> = {}
    if (!current) nextErrors.current = 'Enter your current password.'
    if (!meetsPasswordRequirements(next)) nextErrors.next = 'Choose a password that meets every requirement.'
    else if (next === current) nextErrors.next = 'Your new password must be different from your current one.'
    if (confirm !== next) nextErrors.confirm = 'Passwords do not match.'
    setErrors(nextErrors)

    const firstInvalid = (['current', 'next', 'confirm'] as const).find((name) => nextErrors[name])
    if (firstInvalid) {
      document.getElementById(`password-${firstInvalid}`)?.focus()
      return
    }

    try {
      await updatePasswordAsync({ currentPassword: current, newPassword: next })
      reset()
    } catch (err) {
      if (err instanceof InvalidCurrentPasswordError) {
        setErrors({ current: err.message })
        document.getElementById('password-current')?.focus()
      }
    }
  }

  return (
    <section aria-labelledby="password-security-heading" className="desk-card p-5 sm:p-6">
      {header}

      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <PasswordField
            id="password-current"
            label="Current password"
            value={current}
            onChange={setCurrent}
            error={errors.current}
            autoComplete="current-password"
            disabled={passwordLoading}
          />
          <PasswordField
            id="password-next"
            label="New password"
            value={next}
            onChange={setNext}
            error={errors.next}
            autoComplete="new-password"
            describedBy="password-strength"
            disabled={passwordLoading}
          />
          <PasswordField
            id="password-confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            autoComplete="new-password"
            disabled={passwordLoading}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-4">
            <PasswordStrengthMeter id="password-strength" password={next} />
          </div>
          {user.last_sign_in_at && (
            <p className="text-xs text-[var(--desk-muted)]">Last sign-in: {formatDateTime(user.last_sign_in_at)}</p>
          )}
          <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={!dirty || passwordLoading}
              className="min-h-11 rounded-full border-[var(--desk-line)] text-[var(--desk-navy)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={passwordLoading}
              className="min-h-11 rounded-full bg-[var(--desk-navy)] px-6 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Updating…
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}
