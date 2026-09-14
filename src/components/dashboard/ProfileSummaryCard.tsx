import type { ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { BadgeCheck, Camera, Loader2, MailWarning, PencilLine, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/useProfile'
import { useRole } from '@/hooks/useRole'
import UserAvatar from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { StatusPill } from './StatusPill'
import { getProfileCompletion, humanize } from './dashboard-utils'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export default function ProfileSummaryCard({ onEdit }: { onEdit: () => void }) {
  const { user, profile } = useAuth()
  const role = useRole()
  const { uploadAvatar, uploadLoading } = useProfile()

  if (!user) return null

  const name = profile?.full_name || 'Applicant'
  const active = !profile || profile.status === 'active'
  const verified = !!user.email_confirmed_at
  const { percent, remaining } = getProfileCompletion(profile)
  const memberSince = new Date(profile?.created_at ?? user.created_at).getFullYear()

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Unsupported image type.', { description: 'Upload a JPG, PNG or WebP image.' })
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Image is too large.', { description: 'Choose an image under 2 MB.' })
      return
    }
    uploadAvatar(file)
  }

  return (
    <section
      aria-labelledby="profile-summary-heading"
      className="desk-card desk-card-interactive grid gap-5 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(200px,260px)_auto] lg:items-center"
    >
      <div className="relative w-fit">
        <UserAvatar
          imageUrl={profile?.profile_photo_url}
          fullName={profile?.full_name || user.email}
          size="lg"
          className="h-20 w-20 text-2xl ring-2 ring-[var(--desk-gold)]/40 ring-offset-2 ring-offset-[var(--desk-surface)]"
        />
        <label
          htmlFor="profile-avatar-input"
          className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-[var(--desk-surface)] bg-[var(--desk-navy)] text-[var(--desk-gold-soft)] transition hover:bg-[var(--desk-navy-soft)] focus-within:outline focus-within:outline-2 focus-within:outline-[#c9a227]"
        >
          {uploadLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">{uploadLoading ? 'Uploading profile photo' : 'Change profile photo'}</span>
          <input
            id="profile-avatar-input"
            type="file"
            accept={AVATAR_TYPES.join(',')}
            onChange={handleAvatarChange}
            disabled={uploadLoading}
            className="sr-only"
          />
        </label>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="profile-summary-heading" className="desk-display truncate text-2xl font-semibold text-[var(--desk-navy)]">
            {name}
          </h2>
          <StatusPill tone="gold" icon={ShieldCheck}>
            {role.name}
          </StatusPill>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate text-sm text-[var(--desk-muted)]" title={user.email}>
            {user.email}
          </span>
          {verified ? (
            <StatusPill tone="success" icon={BadgeCheck}>
              Verified
            </StatusPill>
          ) : (
            <StatusPill tone="warning" icon={MailWarning}>
              Unverified
            </StatusPill>
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--desk-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${active ? 'bg-[var(--desk-success)]' : 'bg-[var(--desk-warning)]'}`}
              aria-hidden="true"
            />
            Account {active ? 'active' : humanize(profile?.status).toLowerCase()}
          </span>
          <span aria-hidden="true">·</span>
          <span>Member since {memberSince}</span>
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span id="summary-completion-label" className="font-medium text-[var(--desk-navy)]">
            Profile {percent}% complete
          </span>
          <span className="text-xs text-[var(--desk-muted)]">{remaining === 0 ? 'Done' : `${remaining} left`}</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-labelledby="summary-completion-label"
          className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--desk-line)]/70"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--desk-gold)] to-[var(--desk-gold-soft)]"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onEdit}
        className="min-h-11 w-full rounded-full border-[var(--desk-line)] text-[var(--desk-navy)] sm:w-auto"
      >
        <PencilLine className="mr-2 h-4 w-4" aria-hidden="true" />
        Edit profile
      </Button>
    </section>
  )
}
