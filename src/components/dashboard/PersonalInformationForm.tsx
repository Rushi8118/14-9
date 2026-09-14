import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AtSign, BadgeCheck, Loader2, MailWarning } from 'lucide-react'
import { useAuth, type UserProfile } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { SaveState } from './SaveStatus'
import { StatusPill } from './StatusPill'
import { hasPasswordLogin, humanize } from './dashboard-utils'

const FIELDS = [
  'full_name',
  'phone',
  'whatsapp',
  'nationality',
  'education_level',
  'field_of_study',
  'gender',
  'current_city',
  'current_country',
] as const

type FieldKey = (typeof FIELDS)[number]
type Values = Record<FieldKey, string>
type Errors = Partial<Record<FieldKey, string>>

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High school diploma' },
  { value: 'diploma', label: 'Associate degree / diploma' },
  { value: 'bachelors', label: "Bachelor's degree" },
  { value: 'masters', label: "Master's degree" },
  { value: 'phd', label: 'PhD / doctorate' },
]

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  'h-11 rounded-xl border-[var(--desk-line)] bg-white text-sm aria-[invalid=true]:border-[var(--desk-danger)]'

function toValues(profile: UserProfile | null): Values {
  return Object.fromEntries(FIELDS.map((key) => [key, profile?.[key] ?? ''])) as Values
}

function validate(values: Values): Errors {
  const errors: Errors = {}
  const name = values.full_name.trim()
  if (name.length < 2) errors.full_name = 'Enter your full name.'
  else if (name.length > 120) errors.full_name = 'Full name must be 120 characters or fewer.'

  for (const key of ['phone', 'whatsapp'] as const) {
    const value = values[key].trim()
    if (value && !PHONE_PATTERN.test(value)) errors[key] = 'Enter a valid number, including the country code.'
  }
  for (const key of ['nationality', 'field_of_study', 'current_city', 'current_country'] as const) {
    if (values[key].trim().length > 100) errors[key] = 'Keep this under 100 characters.'
  }
  return errors
}

function withCurrent(options: { value: string; label: string }[], current: string) {
  return current && !options.some((option) => option.value === current)
    ? [...options, { value: current, label: humanize(current) }]
    : options
}

function Field({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: (aria: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-[var(--desk-navy)]">
        {label}
        {required && (
          <span className="text-[var(--desk-danger)]" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </Label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--desk-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-[var(--desk-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

export default function PersonalInformationForm({ onStateChange }: { onStateChange: (state: SaveState) => void }) {
  const { user } = useAuth()
  const { profile, updateProfileAsync, updateLoading, changeEmailAsync, changeEmailLoading } = useProfile()
  const initial = useMemo(() => toValues(profile), [profile])
  const [values, setValues] = useState<Values>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [saveFailed, setSaveFailed] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  const dirty = FIELDS.some((key) => values[key] !== initial[key])
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  // Pick up profile changes from elsewhere (e.g. realtime refresh) unless the user is mid-edit.
  useEffect(() => {
    if (!dirtyRef.current) setValues(initial)
  }, [initial])

  useEffect(() => {
    onStateChange(updateLoading ? 'saving' : saveFailed ? 'error' : dirty ? 'unsaved' : 'saved')
  }, [updateLoading, saveFailed, dirty, onStateChange])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (!user) return null

  const set = (key: FieldKey) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setSaveFailed(false)
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleCancel = () => {
    setValues(initial)
    setErrors({})
    setSaveFailed(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (updateLoading || !dirty) return

    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstInvalid = FIELDS.find((key) => nextErrors[key])
    if (firstInvalid) {
      document.getElementById(`profile-${firstInvalid}`)?.focus()
      return
    }

    const trimmed = Object.fromEntries(FIELDS.map((key) => [key, values[key].trim()])) as Values
    const updates: Partial<UserProfile> = {}
    for (const key of FIELDS) {
      if (trimmed[key] !== initial[key]) updates[key] = trimmed[key] || null
    }

    setSaveFailed(false)
    try {
      await updateProfileAsync(updates)
      setValues(trimmed)
    } catch {
      setSaveFailed(true)
    }
  }

  const verified = !!user.email_confirmed_at

  return (
    <section aria-labelledby="personal-info-heading" className="desk-card p-5 sm:p-6">
      <div className="border-b border-[var(--desk-line)] pb-4">
        <h2 id="personal-info-heading" className="desk-display text-xl font-semibold text-[var(--desk-navy)]">
          Personal information
        </h2>
        <p className="mt-1 text-sm text-[var(--desk-muted)]">
          Keep these details current so your counsellor can assess your pathway quickly.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5">
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
          <Field id="profile-full_name" label="Full name" required error={errors.full_name}>
            {(aria) => (
              <Input
                {...aria}
                autoComplete="name"
                value={values.full_name}
                onChange={(event) => set('full_name')(event.target.value)}
                className={inputClass}
              />
            )}
          </Field>

          <div className="space-y-1.5">
            <Label htmlFor="profile-email" className="text-sm font-medium text-[var(--desk-navy)]">
              Email address
            </Label>
            <div className="flex gap-2">
              <Input
                id="profile-email"
                type="email"
                readOnly
                value={user.email ?? ''}
                aria-describedby="profile-email-status"
                className={cn(inputClass, 'bg-[var(--desk-surface-soft)] text-[var(--desk-muted)]')}
              />
              {hasPasswordLogin(user) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailDialogOpen(true)}
                  className="min-h-11 shrink-0 rounded-xl border-[var(--desk-line)] text-[var(--desk-navy)]"
                >
                  Change
                  <span className="sr-only"> email address</span>
                </Button>
              )}
            </div>
            <p id="profile-email-status">
              {verified ? (
                <StatusPill tone="success" icon={BadgeCheck}>
                  Verified email
                </StatusPill>
              ) : (
                <StatusPill tone="warning" icon={MailWarning}>
                  Email not verified
                </StatusPill>
              )}
            </p>
          </div>

          <Field id="profile-phone" label="Phone number" error={errors.phone} hint="Include your country code, e.g. +91 98765 43210.">
            {(aria) => (
              <Input
                {...aria}
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(event) => set('phone')(event.target.value)}
                className={inputClass}
              />
            )}
          </Field>

          <Field id="profile-whatsapp" label="WhatsApp number" error={errors.whatsapp}>
            {(aria) => (
              <div className="space-y-1.5">
                <Input
                  {...aria}
                  type="tel"
                  value={values.whatsapp}
                  onChange={(event) => set('whatsapp')(event.target.value)}
                  className={inputClass}
                />
                {values.phone && values.phone !== values.whatsapp && (
                  <button
                    type="button"
                    onClick={() => set('whatsapp')(values.phone)}
                    className="rounded text-xs font-semibold text-[#8a6a1a] hover:underline"
                  >
                    Same as phone
                  </button>
                )}
              </div>
            )}
          </Field>

          <Field id="profile-nationality" label="Nationality" error={errors.nationality}>
            {(aria) => (
              <Input
                {...aria}
                placeholder="e.g. Indian"
                value={values.nationality}
                onChange={(event) => set('nationality')(event.target.value)}
                className={inputClass}
              />
            )}
          </Field>

          <Field id="profile-gender" label="Gender">
            {(aria) => (
              <Select value={values.gender} onValueChange={set('gender')}>
                <SelectTrigger {...aria} className={cn(inputClass, 'w-full')}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {withCurrent(GENDER_OPTIONS, initial.gender).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field id="profile-education_level" label="Highest education level">
            {(aria) => (
              <Select value={values.education_level} onValueChange={set('education_level')}>
                <SelectTrigger {...aria} className={cn(inputClass, 'w-full')}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {withCurrent(EDUCATION_OPTIONS, initial.education_level).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field id="profile-field_of_study" label="Field of study or current profession" error={errors.field_of_study}>
            {(aria) => (
              <Input
                {...aria}
                placeholder="e.g. Nursing, Mechanical Engineering"
                value={values.field_of_study}
                onChange={(event) => set('field_of_study')(event.target.value)}
                className={inputClass}
              />
            )}
          </Field>

          <Field id="profile-current_city" label="City" error={errors.current_city}>
            {(aria) => (
              <Input
                {...aria}
                autoComplete="address-level2"
                value={values.current_city}
                onChange={(event) => set('current_city')(event.target.value)}
                className={inputClass}
              />
            )}
          </Field>

          <Field id="profile-current_country" label="Country" error={errors.current_country}>
            {(aria) => (
              <Input
                {...aria}
                autoComplete="country-name"
                value={values.current_country}
                onChange={(event) => set('current_country')(event.target.value)}
                className={inputClass}
              />
            )}
          </Field>
        </div>

        {saveFailed && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--desk-danger)]">
            We could not save your changes. Please try again.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--desk-line)] pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={!dirty || updateLoading}
            className="min-h-11 rounded-full border-[var(--desk-line)] text-[var(--desk-navy)]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!dirty || updateLoading}
            className="min-h-11 rounded-full bg-[var(--desk-navy)] px-6 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]"
          >
            {updateLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving changes...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>

      <ChangeEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        currentEmail={user.email ?? ''}
        onSubmit={changeEmailAsync}
        isSubmitting={changeEmailLoading}
      />
    </section>
  )
}

function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
  onSubmit: (email: string) => Promise<void>
  isSubmitting: boolean
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) return
    if (!next) {
      setEmail('')
      setError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(next)) return setError('Enter a valid email address.')
    if (next === currentEmail.toLowerCase()) return setError('This is already your email address.')
    try {
      await onSubmit(next)
      handleOpenChange(false)
    } catch {
      // toast shown by the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="applicant-desk rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]">
        <DialogHeader className="text-left">
          <DialogTitle className="desk-display text-xl">Change email address</DialogTitle>
          <DialogDescription className="text-[var(--desk-muted)]">
            We will send confirmation links to {currentEmail} and your new address. The change applies once confirmed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="change-email-input">New email address</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--desk-muted)]" aria-hidden="true" />
              <Input
                id="change-email-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError(null)
                }}
                aria-invalid={!!error}
                aria-describedby={error ? 'change-email-error' : undefined}
                className={cn(inputClass, 'pl-9')}
              />
            </div>
            {error && (
              <p id="change-email-error" role="alert" className="text-xs font-medium text-[var(--desk-danger)]">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="min-h-11 rounded-full border-[var(--desk-line)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 rounded-full bg-[var(--desk-navy)] text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Send confirmation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
