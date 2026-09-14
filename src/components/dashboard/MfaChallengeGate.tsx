import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, Loader2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Requires the authenticator code before rendering the dashboard when the account has
 * a verified TOTP factor but the current session has not reached AAL2 yet.
 */
export default function MfaChallengeGate({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const [state, setState] = useState<'checking' | 'required' | 'passed'>('checking')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (cancelled) return
      if (aalError || data.nextLevel !== 'aal2' || data.currentLevel === 'aal2') {
        setState('passed')
        return
      }
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verified = factors?.totp.find((factor) => factor.status === 'verified')
      if (cancelled) return
      if (!verified) {
        setState('passed')
        return
      }
      setFactorId(verified.id)
      setState('required')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault()
    if (!factorId || verifying) return
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setVerifying(true)
    setError(null)
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    setVerifying(false)
    if (verifyError) {
      setError('That code did not work. Check your app and try again.')
      setCode('')
      return
    }
    setState('passed')
  }

  if (state === 'passed') return <>{children}</>

  return (
    <div className="premium-desk applicant-desk grid min-h-dvh place-items-center px-4">
      {state === 'checking' ? (
        <div role="status" className="flex items-center gap-2 text-sm text-[var(--desk-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Securing your session…
        </div>
      ) : (
        <main className="desk-card w-full max-w-sm p-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--desk-navy)] text-[var(--desk-gold-soft)]">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="desk-display mt-4 text-2xl font-semibold text-[var(--desk-navy)]">Two-factor verification</h1>
          <p className="mt-1 text-sm text-[var(--desk-muted)]">
            Enter the 6-digit code from your authenticator app to open your applicant workspace.
          </p>
          <form onSubmit={handleVerify} noValidate className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="mfa-gate-code">Authentication code</Label>
              <Input
                id="mfa-gate-code"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                aria-invalid={!!error}
                aria-describedby={error ? 'mfa-gate-error' : undefined}
                className="h-12 rounded-xl text-center text-lg tracking-[0.4em]"
              />
              {error && (
                <p id="mfa-gate-error" role="alert" className="text-xs font-medium text-[var(--desk-danger)]">
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={verifying}
              className="min-h-11 w-full rounded-full bg-[var(--desk-navy)] text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]"
            >
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Verify and continue
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void signOut()}
              className="min-h-11 w-full rounded-full text-[var(--desk-muted)]"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </main>
      )}
    </div>
  )
}
