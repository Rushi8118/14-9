/**
 * Diffing and change-tracking utility for audit and activity logs.
 * Computes field-level differences between original database records and submitted values,
 * producing structured change records with friendly labels, formatted values,
 * and safe handling for sensitive fields.
 */

export type ChangeItem = {
  field: string
  field_name: string
  old_value: string
  new_value: string
  fromRaw?: unknown
  toRaw?: unknown
}

export type FieldDiff = {
  field: string
  label: string
  from: unknown
  to: unknown
  fromFormatted: string
  toFormatted: string
  type: 'changed' | 'added' | 'removed'
}

export type DetailedChangeResult = {
  table_name: string
  record_id: string
  action_type: 'Created' | 'Updated' | 'Deleted'
  changes: ChangeItem[]
  hasChanges: boolean
  old_value: Record<string, unknown>
  new_value: Record<string, unknown>
  summary: string
}

const IGNORED_DIFF_KEYS = new Set([
  'id',
  'created_at',
  'updated_at',
  'source',
  'raw',
  'created_by',
  'updated_by',
])

const SENSITIVE_KEY_PATTERN = /password|token|secret|api_key|auth_token|cvv|otp|pin|salt|hash|bearer/i

export function isSensitiveField(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key)
}

const FRIENDLY_FIELD_NAMES: Record<string, string> = {
  // Countries
  name: 'Country name',
  avg_processing_days: 'Average processing time',
  is_active: 'Status',
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
  sort_order: 'Sort Order',
  meta_title: 'SEO Meta Title',
  meta_desc: 'SEO Meta Description',
  eligibility_criteria: 'General Eligibility Requirements',
  work_eligibility_criteria: 'Work Visa Eligibility',
  study_eligibility_criteria: 'Study Visa Eligibility',
  images: 'Gallery Images',
  success_rate: 'Visa Success Rate (%)',
  monthly_living_cost: 'Monthly Living Cost',
  monthly_family_cost: 'Monthly Family Cost',

  // Blog Posts
  title: 'Title',
  slug: 'URL Slug',
  summary: 'Summary Overview',
  content: 'Body Content',
  excerpt: 'Excerpt',
  status: 'Status',
  featured_image: 'Featured Image',
  published_at: 'Published At',

  // Urgent Requirements & Jobs
  job_title: 'Job Title',
  vacancies: 'Open Vacancies',
  salary: 'Salary / Compensation',
  category: 'Category / Visa Type',
  employer: 'Employer Name',
  country: 'Destination Country',
  deadline_at: 'Application Deadline',
  expires_at: 'Expiration Date',

  // Users & Roles
  user_role: 'User Role',
  role: 'User Role',
  full_name: 'Full Name',
  email: 'Email Address',
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

function isEmptyValue(val: unknown): boolean {
  if (val === null || val === undefined) return true
  if (typeof val === 'string' && val.trim() === '') return true
  if (Array.isArray(val) && val.length === 0) return true
  return false
}

export function formatDiffValue(val: unknown, key?: string): string {
  if (isEmptyValue(val)) return '—'

  if (typeof val === 'boolean') {
    const isStatusKey = key && (key.includes('active') || key.includes('status'))
    if (isStatusKey) {
      return val ? 'Active' : 'Inactive'
    }
    return val ? 'Yes' : 'No'
  }

  if (typeof val === 'number') {
    if (key === 'avg_processing_days' || key === 'processing_days') {
      return `${val} days`
    }
    return String(val)
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return '—'
    return trimmed
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return '—'
    if (val.every((item) => typeof item === 'string' || typeof item === 'number')) {
      return val.join(', ')
    }
    try {
      return JSON.stringify(val)
    } catch {
      return '[Array]'
    }
  }

  if (typeof val === 'object') {
    try {
      const str = JSON.stringify(val)
      return str === '{}' ? '—' : str
    } catch {
      return '[Object]'
    }
  }

  return String(val)
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (isEmptyValue(a) && isEmptyValue(b)) return true
  if (isEmptyValue(a) || isEmptyValue(b)) return false

  if (a === b) return true

  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Boolean(a) === Boolean(b)
  }

  if (typeof a === 'number' || typeof b === 'number') {
    const numA = Number(a)
    const numB = Number(b)
    if (!isNaN(numA) && !isNaN(numB)) return numA === numB
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim() === b.trim()
  }

  if (typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }

  return false
}

/**
 * Detailed change computation comparing original database record with submitted values.
 * Handles 'Created', 'Updated', and 'Deleted' action types.
 */
export function computeDetailedChanges(
  originalRecord: unknown,
  submittedRecord: unknown,
  actionType: 'Created' | 'Updated' | 'Deleted',
  options: {
    tableName?: string
    recordId?: string
    ignoredKeys?: string[]
  } = {}
): DetailedChangeResult {
  const ignore = new Set([...IGNORED_DIFF_KEYS, ...(options.ignoredKeys || [])])
  const tableName = options.tableName || 'record'
  const recordId = options.recordId || ''
  const changes: ChangeItem[] = []
  const oldValueObj: Record<string, unknown> = {}
  const newValueObj: Record<string, unknown> = {}

  const orig = (typeof originalRecord === 'object' && originalRecord !== null ? originalRecord : {}) as Record<string, unknown>
  const subm = (typeof submittedRecord === 'object' && submittedRecord !== null ? submittedRecord : {}) as Record<string, unknown>

  if (actionType === 'Created') {
    // For created records: old value is "—", new value is the submitted value
    for (const [key, val] of Object.entries(subm)) {
      if (ignore.has(key) || isSensitiveField(key)) continue
      if (isEmptyValue(val)) continue

      const fieldLabel = getFieldLabel(key)
      const formattedNew = formatDiffValue(val, key)

      changes.push({
        field: key,
        field_name: fieldLabel,
        old_value: '—',
        new_value: formattedNew,
        fromRaw: null,
        toRaw: val,
      })
      newValueObj[key] = val
    }
  } else if (actionType === 'Deleted') {
    // For deleted records: old value is the record value, new value is "—"
    for (const [key, val] of Object.entries(orig)) {
      if (ignore.has(key) || isSensitiveField(key)) continue
      if (isEmptyValue(val)) continue

      const fieldLabel = getFieldLabel(key)
      const formattedOld = formatDiffValue(val, key)

      changes.push({
        field: key,
        field_name: fieldLabel,
        old_value: formattedOld,
        new_value: '—',
        fromRaw: val,
        toRaw: null,
      })
      oldValueObj[key] = val
    }
  } else {
    // Action 'Updated': Compare original with submitted
    const allKeys = new Set([...Object.keys(orig), ...Object.keys(subm)])

    for (const key of allKeys) {
      if (ignore.has(key) || isSensitiveField(key)) continue

      // Only check keys present in either original or submitted
      const oldVal = orig[key]
      const newVal = key in subm ? subm[key] : oldVal

      // If key wasn't in submitted changes and exists in original, it wasn't edited
      if (!(key in subm)) continue

      if (!areValuesEqual(oldVal, newVal)) {
        const fieldLabel = getFieldLabel(key)
        const oldFormatted = formatDiffValue(oldVal, key)
        const newFormatted = formatDiffValue(newVal, key)

        changes.push({
          field: key,
          field_name: fieldLabel,
          old_value: oldFormatted,
          new_value: newFormatted,
          fromRaw: oldVal,
          toRaw: newVal,
        })
        oldValueObj[key] = oldVal
        newValueObj[key] = newVal
      }
    }
  }

  const hasChanges = changes.length > 0

  let summary = ''
  if (!hasChanges) {
    summary = 'No values changed'
  } else if (actionType === 'Created') {
    summary = `Created new ${tableName} (${changes.length} fields)`
  } else if (actionType === 'Deleted') {
    summary = `Deleted ${tableName}`
  } else if (changes.length <= 3) {
    summary = changes
      .map((c) => `${c.field_name}: "${c.old_value}" ➔ "${c.new_value}"`)
      .join('; ')
  } else {
    const first3 = changes.slice(0, 3).map((c) => c.field_name).join(', ')
    summary = `${changes.length} fields updated: ${first3} (+${changes.length - 3} more)`
  }

  return {
    table_name: tableName,
    record_id: recordId,
    action_type: actionType,
    changes,
    hasChanges,
    old_value: oldValueObj,
    new_value: newValueObj,
    summary,
  }
}

/**
 * Backward compatibility: Compute differences between two states.
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

  const allKeys = new Set([...Object.keys(oldRec), ...Object.keys(newRec)])

  for (const key of allKeys) {
    if (ignore.has(key) || isSensitiveField(key)) continue

    const hasOld = key in oldRec
    const hasNew = key in newRec

    const oldVal = oldRec[key]
    const newVal = newRec[key]

    if (!hasOld && hasNew) {
      if (isEmptyValue(newVal)) continue
      diffs.push({
        field: key,
        label: getFieldLabel(key),
        from: undefined,
        to: newVal,
        fromFormatted: '—',
        toFormatted: formatDiffValue(newVal, key),
        type: 'added',
      })
    } else if (hasOld && !hasNew) {
      diffs.push({
        field: key,
        label: getFieldLabel(key),
        from: oldVal,
        to: undefined,
        fromFormatted: formatDiffValue(oldVal, key),
        toFormatted: '—',
        type: 'removed',
      })
    } else if (!areValuesEqual(oldVal, newVal)) {
      diffs.push({
        field: key,
        label: getFieldLabel(key),
        from: oldVal,
        to: newVal,
        fromFormatted: formatDiffValue(oldVal, key),
        toFormatted: formatDiffValue(newVal, key),
        type: 'changed',
      })
    }
  }

  return diffs
}

/**
 * Backward compatibility helper for legacy callers.
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
  const detailed = computeDetailedChanges(oldObj, newObj, 'Updated', { ignoredKeys })

  const changes = detailed.changes.map((c) => ({
    field: c.field,
    label: c.field_name,
    from: c.old_value,
    to: c.new_value,
  }))

  return {
    oldValue: detailed.old_value,
    newValue: detailed.new_value,
    changes,
    summary: detailed.summary,
  }
}
