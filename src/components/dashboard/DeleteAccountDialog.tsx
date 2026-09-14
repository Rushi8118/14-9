import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { InvalidCurrentPasswordError, useProfile } from '@/hooks/useProfile'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hasPasswordLogin } from './dashboard-utils'

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT'

export default function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth()
  const { deleteAccountAsync, deleteLoading } = useProfile()
  const [phrase, setPhrase] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const needsPassword = !!user && hasPasswordLogin(user)
  const phraseMatches = phrase === CONFIRM_PHRASE
  const ready = phraseMatches && (!needsPassword || password.length > 0)

  const handleOpenChange = (next: boolean) => {
    if (deleteLoading) return
    if (!next) {
      setPhrase('')
      setPassword('')
      setPasswordError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!ready || deleteLoading) return
    setPasswordError(null)
    try {
      await deleteAccountAsync({ currentPassword: needsPassword ? password : undefined })
    } catch (err) {
      if (err instanceof InvalidCurrentPasswordError) {
        setPasswordError(err.message)
        document.getElementById('delete-account-password')?.focus()
      }
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="applicant-desk max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border-red-200 bg-[var(--desk-surface)] text-[var(--desk-navy)]">
        <AlertDialogHeader>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-red-100 text-[var(--desk-danger)]">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <AlertDialogTitle className="desk-display text-xl">Delete your account permanently?</AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--desk-muted)]">
            This action cannot be undone. Your access is revoked immediately on every device, and your account, application
            records and uploaded documents are marked for permanent removal.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {needsPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="delete-account-password">Current password</Label>
              <Input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setPasswordError(null)
                }}
                disabled={deleteLoading}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'delete-account-password-error' : 'delete-account-password-hint'}
                className="h-11 rounded-xl border-[var(--desk-line)] bg-white aria-[invalid=true]:border-[var(--desk-danger)]"
              />
              {passwordError ? (
                <p id="delete-account-password-error" role="alert" className="text-xs font-medium text-[var(--desk-danger)]">
                  {passwordError}
                </p>
              ) : (
                <p id="delete-account-password-hint" className="text-xs text-[var(--desk-muted)]">
                  We ask for your password to confirm it’s really you.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="delete-account-phrase">
              Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> to confirm
            </Label>
            <Input
              id="delete-account-phrase"
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              disabled={deleteLoading}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="delete-account-phrase-status"
              className="h-11 rounded-xl border-[var(--desk-line)] bg-white font-mono"
            />
            <p id="delete-account-phrase-status" aria-live="polite" className="text-xs text-[var(--desk-muted)]">
              {phraseMatches ? (
                <span className="inline-flex items-center gap-1 text-[var(--desk-danger)]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Phrase confirmed
                </span>
              ) : (
                'The phrase must match exactly, including capital letters.'
              )}
            </p>
          </div>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel type="button" disabled={deleteLoading} className="min-h-11 rounded-full">
              Cancel
            </AlertDialogCancel>
            <Button
              type="submit"
              disabled={!ready || deleteLoading}
              className="min-h-11 rounded-full bg-[var(--desk-danger)] text-white hover:bg-[#912018]"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {deleteLoading ? 'Deleting account…' : 'Yes, delete my account'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
