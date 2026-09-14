import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Copy, Loader2, ShieldCheck, Smartphone, Trash2 } from 'lucide-react'
import { useMfa, type TotpEnrollment } from '@/hooks/useMfa'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from './StatusPill'
import { formatDate } from './dashboard-utils'

const dialogClass = 'applicant-desk rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]'
const primaryButton = 'min-h-11 rounded-full bg-[var(--desk-navy)] px-6 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]'

export default function TwoFactorCard() {
  const mfa = useMfa()
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null)
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const openEnrollment = async () => {
    setEnrollOpen(true)
    setEnrollError(null)
    setCode('')
    setCodeError(null)
    setEnrollLoading(true)
    try {
      setEnrollment(await mfa.startEnrollment())
    } catch {
      setEnrollError('We could not start two-factor setup. Please try again later.')
    } finally {
      setEnrollLoading(false)
    }
  }

  const handleEnrollOpenChange = (open: boolean) => {
    if (open || verifying) return
    if (enrollment) void mfa.cancelEnrollment(enrollment.factorId)
    setEnrollment(null)
    setEnrollOpen(false)
  }

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault()
    if (!enrollment || verifying) return
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setVerifying(true)
    try {
      await mfa.verifyEnrollment(enrollment.factorId, code)
      toast.success('Two-factor authentication enabled.')
      setEnrollment(null)
      setEnrollOpen(false)
    } catch {
      setCodeError('That code did not work. Check your app and try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleRemove = async (factorId: string) => {
    if (removing) return
    setRemoving(true)
    try {
      await mfa.disable(factorId)
      toast.success('Two-factor authentication disabled.')
      setConfirmRemoveId(null)
      setManageOpen(false)
    } catch {
      toast.error('Unable to remove this authenticator.', { description: 'Sign out, sign in again and retry.' })
    } finally {
      setRemoving(false)
    }
  }

  const copySecret = async () => {
    if (!enrollment) return
    try {
      await navigator.clipboard.writeText(enrollment.secret)
      toast.success('Setup key copied.')
    } catch {
      toast.error('Unable to copy the setup key.')
    }
  }

  return (
    <section aria-labelledby="two-factor-heading" className="desk-card flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--desk-navy)] text-[var(--desk-gold-soft)]">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="two-factor-heading" className="desk-display text-xl font-semibold text-[var(--desk-navy)]">
            Two-factor authentication
          </h2>
          <p className="mt-0.5 text-sm text-[var(--desk-muted)]">Add another layer of security to your account.</p>
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        {mfa.isLoading ? (
          <Skeleton className="h-6 w-40 rounded-full bg-[var(--desk-line)]/60" />
        ) : !mfa.isAvailable ? (
          <StatusPill tone="neutral">Status: Unavailable</StatusPill>
        ) : mfa.isEnabled ? (
          <StatusPill tone="success" icon={ShieldCheck}>
            Status: Enabled
          </StatusPill>
        ) : (
          <StatusPill tone="warning">Status: Not enabled</StatusPill>
        )}
        <p className="text-sm text-[var(--desk-muted)]">
          {mfa.isAvailable
            ? 'When enabled, you enter a 6-digit code from an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password each time you open your workspace on a new session.'
            : 'Two-factor authentication is not available for this account right now. Contact our team if you need it enabled.'}
        </p>
      </div>

      <div className="mt-5">
        {mfa.isEnabled ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setManageOpen(true)}
            className="min-h-11 w-full rounded-full border-[var(--desk-line)] text-[var(--desk-navy)] sm:w-auto"
          >
            Manage authentication
          </Button>
        ) : (
          <Button
            type="button"
            onClick={openEnrollment}
            disabled={mfa.isLoading || !mfa.isAvailable}
            className={`${primaryButton} w-full sm:w-auto`}
          >
            Enable 2FA
          </Button>
        )}
      </div>

      <Dialog open={enrollOpen} onOpenChange={handleEnrollOpenChange}>
        <DialogContent
          className={`${dialogClass} max-h-[calc(100dvh-2rem)] overflow-y-auto`}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="desk-display text-xl">Set up two-factor authentication</DialogTitle>
            <DialogDescription className="text-[var(--desk-muted)]">
              Scan the QR code with your authenticator app, then enter the 6-digit code it shows.
            </DialogDescription>
          </DialogHeader>

          {enrollLoading ? (
            <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--desk-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Preparing your setup code…
            </div>
          ) : enrollError ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[var(--desk-danger)]">
              {enrollError}
            </p>
          ) : (
            enrollment && (
              <form onSubmit={handleVerify} noValidate className="space-y-4">
                <div className="grid place-items-center rounded-xl border border-[var(--desk-line)] bg-white p-4">
                  <img src={enrollment.qrCode} alt="QR code to add Siddhivinayak to your authenticator app" className="h-44 w-44" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--desk-muted)]">Can’t scan? Enter this setup key manually:</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded-lg bg-[var(--desk-surface-soft)] px-3 py-2 text-xs">
                      {enrollment.secret}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copySecret}
                      aria-label="Copy setup key"
                      className="h-11 w-11 shrink-0 rounded-xl border-[var(--desk-line)]"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mfa-enroll-code">Authentication code</Label>
                  <Input
                    id="mfa-enroll-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, ''))
                      setCodeError(null)
                    }}
                    aria-invalid={!!codeError}
                    aria-describedby={codeError ? 'mfa-enroll-error' : undefined}
                    className="h-12 rounded-xl text-center text-lg tracking-[0.4em]"
                  />
                  {codeError && (
                    <p id="mfa-enroll-error" role="alert" className="text-xs font-medium text-[var(--desk-danger)]">
                      {codeError}
                    </p>
                  )}
                </div>
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEnrollOpenChange(false)}
                    disabled={verifying}
                    className="min-h-11 rounded-full border-[var(--desk-line)]"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={verifying} className={primaryButton}>
                    {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    Verify and enable
                  </Button>
                </DialogFooter>
              </form>
            )
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={manageOpen}
        onOpenChange={(open) => {
          if (removing) return
          setManageOpen(open)
          if (!open) setConfirmRemoveId(null)
        }}
      >
        <DialogContent className={dialogClass}>
          <DialogHeader className="text-left">
            <DialogTitle className="desk-display text-xl">Manage authentication</DialogTitle>
            <DialogDescription className="text-[var(--desk-muted)]">
              Authenticator apps currently protecting your account.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {mfa.verifiedFactors.map((factor) => (
              <li key={factor.id} className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 shrink-0 text-[var(--desk-gold)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Authenticator app</p>
                    <p className="text-xs text-[var(--desk-muted)]">Added {formatDate(factor.created_at)}</p>
                  </div>
                  {confirmRemoveId !== factor.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmRemoveId(factor.id)}
                      className="min-h-11 rounded-full text-[var(--desk-danger)] hover:bg-red-50 hover:text-[var(--desk-danger)]"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Remove
                    </Button>
                  )}
                </div>
                {confirmRemoveId === factor.id && (
                  <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-[var(--desk-navy)]">
                      Removing this authenticator turns off two-factor authentication for your account.
                    </p>
                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfirmRemoveId(null)}
                        disabled={removing}
                        className="min-h-11 rounded-full border-[var(--desk-line)] bg-white"
                      >
                        Keep it
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleRemove(factor.id)}
                        disabled={removing}
                        className="min-h-11 rounded-full bg-[var(--desk-danger)] text-white hover:bg-[#912018]"
                      >
                        {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                        Turn off 2FA
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  )
}
