import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, Globe2, ShieldCheck } from 'lucide-react'
import UserAvatar from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'

export default function DashboardWelcomeCard({
  fullName,
  avatarUrl,
  accountActive,
  completion,
  onBook,
}: {
  fullName: string
  avatarUrl?: string | null
  accountActive: boolean
  completion: number
  onBook: () => void
}) {
  const today = new Date()

  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative overflow-hidden rounded-2xl bg-[var(--desk-navy)] p-5 text-[#fff8e7] shadow-[0_28px_56px_-36px_rgba(26,35,64,0.9)] sm:p-7"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 8% 110%, rgba(196,154,43,0.32), transparent 38%), linear-gradient(120deg, transparent 55%, rgba(42,53,85,0.9) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-[var(--desk-gold)]/20"
        aria-hidden="true"
      />
      <Globe2
        className="pointer-events-none absolute -bottom-10 right-4 h-48 w-48 text-[var(--desk-gold)] opacity-[0.08] sm:right-16"
        aria-hidden="true"
      />

      <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-start gap-4">
          <UserAvatar
            imageUrl={avatarUrl}
            fullName={fullName}
            size="lg"
            className="hidden ring-2 ring-[var(--desk-gold)]/50 min-[420px]:inline-flex"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--desk-gold-soft)]">
              <time dateTime={today.toISOString().slice(0, 10)}>
                {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </p>
            <h2 id="welcome-heading" className="desk-display mt-1 break-words text-2xl font-semibold leading-tight sm:text-[28px]">
              Welcome back, {fullName}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-[#fff8e7]/75">
              Manage and track your overseas visa pathways securely.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                <span
                  className={`h-2 w-2 rounded-full ${accountActive ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  aria-hidden="true"
                />
                {accountActive ? 'Account active' : 'Account restricted'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--desk-gold)]/30 bg-[var(--desk-gold)]/10 px-3 py-1 text-[var(--desk-gold-soft)]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Profile {completion}% complete
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:flex-col">
          <Button
            type="button"
            onClick={onBook}
            className="min-h-11 rounded-full bg-[var(--desk-gold)] px-6 font-semibold text-[var(--desk-navy)] hover:bg-[var(--desk-gold-soft)]"
          >
            <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Book consultation
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-11 rounded-full border-white/25 bg-white/5 px-6 text-[#fff8e7] hover:bg-white/10 hover:text-white"
          >
            <Link to="/dashboard/applications">
              View applications
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
