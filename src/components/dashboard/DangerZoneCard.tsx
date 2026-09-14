import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DeactivateAccountDialog from './DeactivateAccountDialog'
import DeleteAccountDialog from './DeleteAccountDialog'

export default function DangerZoneCard() {
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <section aria-labelledby="danger-zone-heading" className="rounded-2xl border-2 border-red-200 bg-[var(--desk-surface)] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-[var(--desk-danger)]">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="danger-zone-heading" className="desk-display text-xl font-semibold text-[var(--desk-danger)]">
            Danger zone
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-[var(--desk-muted)]">
            These actions affect your account and may not be reversible. Review the details carefully before continuing.
          </p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-red-100 rounded-xl border border-red-100">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--desk-navy)]">Deactivate account</h3>
            <p className="text-sm text-[var(--desk-muted)]">
              Temporarily disable access while keeping your records securely stored.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeactivateOpen(true)}
            className="min-h-11 w-full shrink-0 rounded-full border-red-200 text-[var(--desk-danger)] hover:bg-red-50 hover:text-[var(--desk-danger)] sm:w-auto"
          >
            Deactivate account
          </Button>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--desk-navy)]">Delete account permanently</h3>
            <p className="text-sm text-[var(--desk-muted)]">
              Permanently close your account and revoke access to your application records and uploaded documents.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="min-h-11 w-full shrink-0 rounded-full bg-[var(--desk-danger)] text-white hover:bg-[#912018] sm:w-auto"
          >
            Delete account permanently
          </Button>
        </div>
      </div>

      <DeactivateAccountDialog open={deactivateOpen} onOpenChange={setDeactivateOpen} />
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </section>
  )
}
