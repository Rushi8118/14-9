import { Loader2 } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
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

export default function DeactivateAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { deactivateAccountAsync, deactivateLoading } = useProfile()

  const handleConfirm = async () => {
    if (deactivateLoading) return
    try {
      await deactivateAccountAsync()
    } catch {
      // toast shown by the mutation
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !deactivateLoading && onOpenChange(next)}>
      <AlertDialogContent className="applicant-desk rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="desk-display text-xl">Deactivate your account?</AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--desk-muted)]">
            Your access is paused, but nothing is deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-[var(--desk-navy)]">
          <li>You will be signed out on every device.</li>
          <li>You won’t be able to sign in until our team reactivates your account.</li>
          <li>Your applications, documents and messages stay securely stored.</li>
        </ul>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <AlertDialogCancel disabled={deactivateLoading} className="min-h-11 rounded-full">
            Keep my account active
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={deactivateLoading}
            className="min-h-11 rounded-full bg-[var(--desk-danger)] text-white hover:bg-[#912018]"
          >
            {deactivateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {deactivateLoading ? 'Deactivating…' : 'Deactivate account'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
