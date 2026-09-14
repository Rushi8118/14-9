import { useId, useState, type FormEvent } from 'react'
import { CalendarPlus, Loader2, MessageCircle, Phone } from 'lucide-react'
import { useCountries } from '@/hooks/use-countries'
import type { ConsultationType, NewConsultation } from '@/hooks/useConsultations'
import { FlagIcon } from '@/components/flag-icon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PhoneInputField } from '@/components/ui/phone-input-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const CONSULTATION_TYPES: { value: ConsultationType; label: string }[] = [
  { value: 'work_visa', label: 'Work visa assessment' },
  { value: 'study_visa', label: 'Study visa pathway' },
  { value: 'document_review', label: 'Document review' },
  { value: 'mock_interview', label: 'Mock interview' },
]

const NOTES_LIMIT = 1000

export default function ConsultationBookingDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: NewConsultation) => Promise<void>
  isSubmitting: boolean
}) {
  const ids = useId()
  const { countries } = useCountries()
  const [type, setType] = useState<ConsultationType>('work_visa')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState<string | undefined>()
  const [whatsapp, setWhatsapp] = useState<string | undefined>()
  const [notes, setNotes] = useState('')
  const [countryError, setCountryError] = useState<string | null>(null)

  const isDirty = !!(country || phone || whatsapp || notes.trim())

  const reset = () => {
    setType('work_visa')
    setCountry('')
    setPhone(undefined)
    setWhatsapp(undefined)
    setNotes('')
    setCountryError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && isSubmitting) return
    onOpenChange(next)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!country) {
      setCountryError('Select the country you would like to discuss.')
      document.getElementById(`${ids}-country`)?.focus()
      return
    }

    try {
      await onSubmit({ consultationType: type, country, phone, whatsapp, notes: notes.trim() })
      reset()
      onOpenChange(false)
    } catch {
      // The mutation shows an error toast; keep the dialog open so nothing typed is lost.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="applicant-desk max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] p-0 text-[var(--desk-navy)] sm:max-w-xl"
        onInteractOutside={(event) => {
          if (isDirty || isSubmitting) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault()
        }}
      >
        <DialogHeader className="border-b border-[var(--desk-line)] px-5 pb-4 pt-5 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--desk-navy)] text-[var(--desk-gold-soft)]">
              <CalendarPlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <DialogTitle className="desk-display text-xl font-semibold">Book a consultation</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm text-[var(--desk-muted)]">
            Schedule a session with our counselling team to discuss your study or work pathway.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${ids}-type`}>Consultation type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ConsultationType)}>
                <SelectTrigger id={`${ids}-type`} className="h-11 w-full rounded-xl border-[var(--desk-line)] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTATION_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${ids}-country`}>
                Target country <span aria-hidden="true" className="text-[var(--desk-danger)]">*</span>
              </Label>
              <Select
                value={country}
                onValueChange={(value) => {
                  setCountry(value)
                  setCountryError(null)
                }}
              >
                <SelectTrigger
                  id={`${ids}-country`}
                  aria-required="true"
                  aria-invalid={!!countryError}
                  aria-describedby={countryError ? `${ids}-country-error` : undefined}
                  className="h-11 w-full rounded-xl border-[var(--desk-line)] bg-white aria-[invalid=true]:border-[var(--desk-danger)]"
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      <FlagIcon country={c.name} className="mr-1.5 inline-block align-[-0.1em]" /> {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other / not sure yet</SelectItem>
                </SelectContent>
              </Select>
              {countryError && (
                <p id={`${ids}-country-error`} role="alert" className="text-xs font-medium text-[var(--desk-danger)]">
                  {countryError}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${ids}-phone`}>Phone number</Label>
              <PhoneInputField
                id={`${ids}-phone`}
                defaultCountry="IN"
                value={phone}
                onChange={setPhone}
                placeholder="e.g. 98765 43210"
                icon={<Phone className="h-3.5 w-3.5 text-[var(--desk-info)]" aria-hidden="true" />}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex min-h-5 items-center justify-between gap-2">
                <Label htmlFor={`${ids}-whatsapp`}>WhatsApp number</Label>
                {phone && phone !== whatsapp && (
                  <button
                    type="button"
                    onClick={() => setWhatsapp(phone)}
                    className="rounded text-xs font-semibold text-[#8a6a1a] hover:underline"
                  >
                    Same as phone
                  </button>
                )}
              </div>
              <PhoneInputField
                id={`${ids}-whatsapp`}
                defaultCountry="IN"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="e.g. 98765 43210"
                icon={<MessageCircle className="h-3.5 w-3.5 text-[var(--desk-success)]" aria-hidden="true" />}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-notes`}>Profile brief and details</Label>
            <Textarea
              id={`${ids}-notes`}
              rows={4}
              maxLength={NOTES_LIMIT}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              aria-describedby={`${ids}-notes-hint`}
              placeholder="Work experience, IELTS scores, academic background or visa history…"
              className="rounded-xl border-[var(--desk-line)] bg-white"
            />
            <p id={`${ids}-notes-hint`} className="text-right text-xs text-[var(--desk-muted)]">
              {notes.length}/{NOTES_LIMIT}
            </p>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-[var(--desk-line)] pt-4 sm:flex-row">
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
              className="min-h-11 rounded-full bg-[var(--desk-navy)] px-6 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Booking…
                </>
              ) : (
                'Book consultation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
