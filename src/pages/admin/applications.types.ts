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
// 'consultation' and 'enquiry' exist because get_all_applications surfaces
// consultations rows as pseudo-applications: an appointment booking is a
// consultation and anything unrecognised is an enquiry. Without them in this
// list those rows render but cannot be filtered for.
export const TYPES = ['work', 'study', 'business', 'consultation', 'enquiry', 'tourist', 'investor'] as const
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

export const formatDateOnly = (value?: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatTimeOnly = (value?: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
}

export const formatFullDateTime = (value?: string | null) => {
  if (!value) return 'Not available'
  const d = new Date(value)
  if (isNaN(d.getTime())) return 'Not available'
  const dateStr = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
  return `${dateStr}, ${timeStr}`
}

export const formatRelativeTime = (value?: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

export const daysPending = (row: { created_at: string }) =>
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
