import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/hooks/use-auth'

/** True when the account can sign in with an email + password (not OAuth-only). */
export function hasPasswordLogin(user: User) {
  return user.app_metadata?.provider === 'email' || !!user.identities?.some((identity) => identity.provider === 'email')
}
import type { Application } from '@/hooks/useApplications'

/** Profile columns that exist in `user_profiles` and count towards completion. */
export const PROFILE_COMPLETION_FIELDS: { key: keyof UserProfile; label: string }[] = [
  { key: 'full_name', label: 'Full name' },
  { key: 'phone', label: 'Phone number' },
  { key: 'whatsapp', label: 'WhatsApp number' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'education_level', label: 'Education level' },
  { key: 'field_of_study', label: 'Field of study or profession' },
  { key: 'gender', label: 'Gender' },
  { key: 'current_city', label: 'City' },
  { key: 'current_country', label: 'Country' },
]

export function getProfileCompletion(profile: UserProfile | null) {
  const missing = PROFILE_COMPLETION_FIELDS.filter(({ key }) => {
    const value = profile?.[key]
    return typeof value === 'string' ? value.trim() === '' : !value
  })
  const total = PROFILE_COMPLETION_FIELDS.length
  return {
    percent: Math.round(((total - missing.length) / total) * 100),
    missing,
    remaining: missing.length,
  }
}

export type ApplicationStatus = Application['status']

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export const APPLICATION_STATUS_FILTERS: ApplicationStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
]

export const APPLICATION_STEPS = ['Draft created', 'File submitted', 'Under review', 'Outcome decided'] as const

export function getApplicationStep(app: Pick<Application, 'status' | 'submitted_at' | 'review_started_at'>) {
  switch (app.status) {
    case 'draft':
      return 0
    case 'submitted':
      return 1
    case 'under_review':
      return 2
    case 'approved':
    case 'rejected':
      return 3
    default:
      return app.review_started_at ? 2 : app.submitted_at ? 1 : 0
  }
}

export function humanize(value: string | null | undefined) {
  if (!value) return ''
  const text = value.replace(/_/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function getFirstName(profile: UserProfile | null, fallback = 'Applicant') {
  return profile?.first_name || profile?.full_name?.split(' ')[0] || fallback
}

export function formatDate(value: string | Date | null | undefined, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(value: string | Date) {
  return `${formatDate(value)}, ${formatTime(value)}`
}
