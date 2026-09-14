import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, UserRoundCheck } from 'lucide-react'
import type { UserProfile } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { getProfileCompletion } from './dashboard-utils'

export default function ProfileCompletionCard({ profile }: { profile: UserProfile | null }) {
  const { percent, missing, remaining } = getProfileCompletion(profile)
  const complete = remaining === 0

  return (
    <section aria-labelledby="profile-completion-heading" className="desk-card flex h-full flex-col p-5">
      <div className="flex items-center gap-2">
        <UserRoundCheck className="h-[18px] w-[18px] text-[var(--desk-gold)]" aria-hidden="true" />
        <h2 id="profile-completion-heading" className="text-sm font-semibold text-[var(--desk-navy)]">
          Profile completion
        </h2>
      </div>

      <p className="desk-display mt-4 text-3xl font-semibold tabular-nums text-[var(--desk-navy)]">{percent}%</p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-labelledby="profile-completion-heading"
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--desk-line)]/70"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--desk-gold)] to-[var(--desk-gold-soft)]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-2 text-sm text-[var(--desk-muted)]">
        {complete ? 'Your profile is complete.' : `${remaining} field${remaining === 1 ? '' : 's'} remaining`}
      </p>

      {!complete && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Missing profile fields">
          {missing.slice(0, 3).map((field) => (
            <li
              key={field.key}
              className="rounded-full border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] px-2.5 py-0.5 text-xs text-[var(--desk-muted)]"
            >
              {field.label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-5">
        <Button
          asChild
          variant={complete ? 'outline' : 'default'}
          className={
            complete
              ? 'min-h-11 w-full rounded-full border-[var(--desk-line)] text-[var(--desk-navy)]'
              : 'min-h-11 w-full rounded-full bg-[var(--desk-navy)] text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]'
          }
        >
          <Link to="/dashboard/profile?tab=personal">
            {complete ? 'Review profile' : 'Complete profile'}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
