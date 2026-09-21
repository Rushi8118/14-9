/**
 * Diffing and change-tracking utility for audit and activity logs.
 * Computes deep or shallow field-level differences between before/after states
 * and produces human-readable labels, values, and summaries.
 */

export type FieldDiff = {
  field: string
  label: string
  from: unknown
  to: unknown
  fromFormatted: string
  toFormatted: string
  type: 'changed' | 'added' | 'removed'
}

const IGNORED_DIFF_KEYS = new Set([
  'id',
  'created_at',
  'updated_at',
  'source',
  'raw',
  'password',
  'token',
  'secret',
])

const FRIENDLY_FIELD_NAMES: Record<string, string> = {
  name: 'Country / Item Name',
  title: 'Title',
  slug: 'URL Slug',
  code: 'Country ISO Code',
  flag_emoji: 'Flag Emoji',
  capital: 'Capital City',
  region: 'Region',
  subregion: 'Subregion',
  language: 'Official Language',
  currency: 'Currency Name',
  currency_code: 'Currency Code',
  description: 'Description',
  why_work: 'Why Work Benefits',
  why_study: 'Why Study Benefits',
  lifestyle: 'Lifestyle & Living',
  climate_summary: 'Climate Summary',
  has_work_visa: 'Work Visa Available',
  has_study_visa: 'Study Visa Available',
  is_active: 'Active Status (Website Visibility)',
  sort_order: 'Sort Order',
  meta_title: 'SEO Meta Title',
  meta_desc: 'SEO Meta Description',
  eligibility_criteria: 'General Eligibility Requirements',
  work_eligibility_criteria: 'Work Visa Eligibility',
  study_eligibility_criteria: 'Study Visa Eligibility',
  images: 'Gallery Images',
  success_rate: 'Visa Success Rate (%)',
  avg_processing_days: 'Avg Processing Time (Days)',
  monthly_living_cost: 'Monthly Living Cost',
  monthly_family_cost: 'Monthly Family Cost',
  vacancies: 'Open Vacancies',
  salary: 'Salary / Compensation',
  category: 'Category / Visa Type',
  employer: 'Employer Name',
  status: 'Publish Status',
  summary: 'Summary Overview',
  content: 'Body Content',
  deadline_at: 'Application Deadline',
  expires_at: 'Expiration Date',
  user_role: 'User Role',
  full_name: 'Full Name',
  phone: 'Phone Number',
  is_suspended: 'Account Suspended',
}

export function getFieldLabel(key: string): string {
  if (FRIENDLY_FIELD_NAMES[key]) return FRIENDLY_FIELD_NAMES[key]
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatDiffValue(val: unknown): string {
  if (val === null || val === undefined) return '— (empty)'
  if (typeof val === 'boolean') return val ? 'Active / Yes (true)' : 'Hidden / No (false)'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return '— (empty string)'
    if (trimmed.length > 250) return `${trimmed.slice(0, 247)}...`
    return trimmed
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[] (empty list)'
    if (val.every((item) => typeof item === 'string')) {
      if (val.length <= 3) return val.join(', ')
      return `${val.slice(0, 3).join(', ')} (+${val.length - 3} more)`
    }
    return `[${val.length} items]`
  }
  if (typeof val === 'object') {
    try {
      const str = JSON.stringify(val)
      return str.length > 100 ? `${str.slice(0, 97)}...` : str
    } catch {
      return '[Object]'
    }
  }
  return String(val)
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || a === undefined) return b === null || b === undefined
  if (b === null || b === undefined) return false
  if (typeof a === 'object' || typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }
  return false
}

/**
 * Compute differences between two states.
 */
export function computeFieldDiffs(
  oldObj: unknown,
  newObj: unknown,
  ignoredKeys: string[] = []
): FieldDiff[] {
  const ignore = new Set([...IGNORED_DIFF_KEYS, ...ignoredKeys])
  const diffs: FieldDiff[] = []

  const isOldObject = typeof oldObj === 'object' && oldObj !== null
  const isNewObject = typeof newObj === 'object' && newObj !== null

  if (!isOldObject && !isNewObject) return []

  const oldRec = (isOldObject ? oldObj : {}) as Record<string, unknown>
  const newRec = (isNewObject ? newObj : {}) as Record<string, unknown>

  // Collect all unique keys
  const allKeys = new Set([...Object.keys(oldRec), ...Object.keys(newRec)])

  for (const key of allKeys) {
    if (ignore.has(key)) continue

    const hasOld = key in oldRec
    const hasNew = key in newRec

    const oldVal = oldRec[key]
    const newVal = newRec[key]

    if (!hasOld && hasNew) {
      if (newVal === null || newVal === undefined || newVal === '') continue
      diffs.push({
        field: key,
        label: getFieldLabel(key),
        from: undefined,
        to: newVal,
        fromFormatted: '— (none)',
        toFormatted: formatDiffValue(newVal),
        type: 'added',
      })
    } else if (hasOld && !hasNew) {
      diffs.push({
        field: key,
        label: getFieldLabel(key),
        from: oldVal,
        to: undefined,
        fromFormatted: formatDiffValue(oldVal),
        toFormatted: '— (removed)',
        type: 'removed',
      })
    } else if (!areValuesEqual(oldVal, newVal)) {
      diffs.push({
        field: key,
        label: getFieldLabel(key),
        from: oldVal,
        to: newVal,
        fromFormatted: formatDiffValue(oldVal),
        toFormatted: formatDiffValue(newVal),
        type: 'changed',
      })
    }
  }

  return diffs
}

/**
 * Creates an object containing only the fields that actually changed,
 * returning { oldValue: { ... }, newValue: { ... }, changes: [...] }
 */
export function createDiffPayload(
  oldObj: unknown,
  newObj: unknown,
  ignoredKeys: string[] = []
): {
  oldValue: Record<string, unknown>
  newValue: Record<string, unknown>
  changes: Array<{ field: string; label: string; from: unknown; to: unknown }>
  summary: string
} {
  const diffs = computeFieldDiffs(oldObj, newObj, ignoredKeys)

  const oldValue: Record<string, unknown> = {}
  const newValue: Record<string, unknown> = {}
  const changes = diffs.map((d) => {
    oldValue[d.field] = d.from
    newValue[d.field] = d.to
    return {
      field: d.field,
      label: d.label,
      from: d.from,
      to: d.to,
    }
  })

  let summary = ''
  if (diffs.length === 0) {
    summary = 'No field changes'
  } else if (diffs.length <= 3) {
    summary = diffs
      .map((d) => `${d.label}: "${d.fromFormatted}" ➔ "${d.toFormatted}"`)
      .join('; ')
  } else {
    const first3 = diffs.slice(0, 3).map((d) => d.label).join(', ')
    summary = `${diffs.length} fields modified: ${first3} (+${diffs.length - 3} more)`
  }

  return { oldValue, newValue, changes, summary }
}
