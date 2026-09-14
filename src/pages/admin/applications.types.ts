export type AppRow = {
  id: string
  application_id: string | null
  user_id?: string
  user_profile_full_name: string | null
  user_profile_email: string | null
  application_type: string
  status: string
  priority: string
  case_status?: string
  created_at: string
  updated_at?: string
  submitted_at?: string | null
  country_id: string | null
  country_name?: string | null
  country_flag_emoji?: string | null
  assigned_consultant?: string | null
  assigned_officer_name?: string | null
  assigned_officer_email?: string | null
  meta?: Record<string, any> | null
}

export type ApplicationActivity = {
  id: string
  application_id: string
  actor_id: string | null
  actor_name?: string | null
  actor_email?: string | null
  action: string
  reason: string | null
  metadata?: Record<string, any> | null
  created_at: string
}

export type MessageVisibility = 'public' | 'internal'

export type ApplicationMessage = {
  id: string
  application_id: string
  author_id: string | null
  author_name?: string | null
  author_email?: string | null
  visibility: MessageVisibility
  body: string
  created_at: string
}

export type DetailData = {
  application: AppRow & Record<string, any>
  documents: Array<Record<string, any>>
  activity: ApplicationActivity[]
  messages?: ApplicationMessage[]
}

export type Officer = { id: string; full_name: string | null; email: string }

export const STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'] as const
export const TYPES = ['work', 'study', 'business', 'tourist', 'investor'] as const
export const PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const
export const CASE_STATUSES = ['open', 'in_progress', 'waiting_for_applicant', 'resolved', 'closed'] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]

export const PAGE_SIZES = [15, 30, 50] as const

export const statusVariant = (status: string) =>
  status === 'approved' ? 'success'
  : status === 'rejected' ? 'destructive'
  : status === 'under_review' ? 'warning'
  : status === 'draft' ? 'default'
  : status === 'withdrawn' ? 'purple'
  : 'info'

export const caseStatusVariant = (status: string) =>
  status === 'resolved' ? 'success'
  : status === 'closed' ? 'default'
  : status === 'in_progress' ? 'warning'
  : status === 'waiting_for_applicant' ? 'purple'
  : 'info'

export const pretty = (value: unknown) =>
  String(value ?? '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())

export const dateText = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : 'Not available'

export const daysPending = (row: AppRow) =>
  Math.max(0, Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000))

const MESSAGE_KEYS = [
  'message', 'applicant_message', 'enquiry_message', 'cover_letter',
  'additional_notes', 'notes', 'details', 'description', 'comments', 'query',
]

/** Best-effort extraction of the applicant's free-text message from the loosely
 *  typed JSONB `personal_info` blob (applications) or `user_notes` (enquiries). */
export function extractApplicantMessage(info: unknown): string | null {
  if (!info) return null
  if (typeof info === 'string') return info.trim() || null
  if (typeof info !== 'object') return null
  const record = info as Record<string, unknown>
  for (const key of MESSAGE_KEYS) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}
