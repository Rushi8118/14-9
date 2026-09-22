import { supabase } from '@/lib/supabase/client'
import { detectBrowser, detectDeviceType, getVisitSessionId } from '@/lib/site-visit-tracker'
import type { ChangeItem } from '@/lib/diff-utils'

/**
 * Stores every click, navigation, form submit and application error in
 * `activity_logs`. Events are batched and flushed every few seconds (and when
 * the tab is hidden) so logging never slows the site down.
 *
 * Privacy: input values are never read for generic events. Clicks record the element's label;
 * text inside password/email/phone fields or anything marked
 * `data-log-ignore` is never captured.
 */

export type Category = 'click' | 'navigation' | 'form_submit' | 'data_change' | 'error' | 'api_error' | 'app'

export type ActivityEvent = {
  category: Category
  action: string
  page_path: string
  target: string | null
  details: Record<string, unknown>
  occurred_at: string
  session_id: string
  device_type: string
  browser: string
  table_name?: string | null
  record_id?: string | null
  action_type?: string | null
  changes?: ChangeItem[] | unknown
  old_value?: unknown
  new_value?: unknown
}

export type LogDataChangeParams = {
  action: string
  table_name: string
  record_id: string
  action_type: 'Created' | 'Updated' | 'Deleted'
  changes: ChangeItem[]
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  summary?: string
  target?: string | null
  immediate?: boolean
}

const FLUSH_MS = 5000
const MAX_BATCH = 50
const MAX_EVENTS_PER_MINUTE = 120

let queue: ActivityEvent[] = []
let started = false
let flushing = false
let minuteStart = Date.now()
let minuteCount = 0

const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '')

function currentPath() {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`.slice(0, 500)
}

export function logActivity(category: Category, action: string, target?: string | null, details: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const now = Date.now()
  if (now - minuteStart > 60_000) { minuteStart = now; minuteCount = 0 }
  if (++minuteCount > MAX_EVENTS_PER_MINUTE) return // runaway loops can't flood the database

  queue.push({
    category,
    action: clip(action, 200) || category,
    page_path: currentPath(),
    target: target ? clip(target, 300) : null,
    details,
    occurred_at: new Date(now).toISOString(),
    session_id: getVisitSessionId(),
    device_type: detectDeviceType(),
    browser: detectBrowser(),
    table_name: (details.table_name as string) || (details.resource as string) || null,
    record_id: (details.record_id as string) || (details.resourceId as string) || null,
    action_type: (details.action_type as string) || null,
    changes: details.changes ?? null,
    old_value: details.old_value ?? details.oldValue ?? null,
    new_value: details.new_value ?? details.newValue ?? null,
  })
  if (queue.length >= MAX_BATCH) void flush()
}

/**
 * Log a structured data modification (Create, Update, Delete) to activity_logs
 * with field-level change history and immediate flush.
 */
export async function logDataChange(params: LogDataChangeParams): Promise<void> {
  if (typeof window === 'undefined') return
  const now = Date.now()

  const detailsPayload: Record<string, unknown> = {
    table_name: params.table_name,
    record_id: params.record_id,
    action_type: params.action_type,
    changes: params.changes,
    old_value: params.old_value,
    new_value: params.new_value,
    oldValue: params.old_value,
    newValue: params.new_value,
    summary: params.summary,
    resource: params.table_name,
    resourceId: params.record_id,
  }

  const event: ActivityEvent = {
    category: 'form_submit',
    action: clip(params.action, 200) || `${params.table_name}.${params.action_type.toLowerCase()}`,
    page_path: currentPath(),
    target: params.target ? clip(params.target, 300) : `${params.table_name}${params.record_id ? ` #${params.record_id.slice(0, 8)}` : ''}`,
    details: detailsPayload,
    occurred_at: new Date(now).toISOString(),
    session_id: getVisitSessionId(),
    device_type: detectDeviceType(),
    browser: detectBrowser(),
    table_name: params.table_name,
    record_id: params.record_id,
    action_type: params.action_type,
    changes: params.changes,
    old_value: params.old_value,
    new_value: params.new_value,
  }

  queue.push(event)

  if (params.immediate !== false) {
    await flush()
  } else if (queue.length >= MAX_BATCH) {
    void flush()
  }
}

export async function flush() {
  if (flushing || queue.length === 0) return
  flushing = true
  const batch = queue.splice(0, MAX_BATCH)
  try {
    const { error } = await supabase.from('activity_logs').insert(batch)
    if (error) {
      // Fallback: If extended columns don't exist yet in the database, insert base columns
      const fallbackBatch = batch.map(({ table_name, record_id, action_type, changes, old_value, new_value, ...base }) => base)
      const { error: fallbackError } = await supabase.from('activity_logs').insert(fallbackBatch)
      if (fallbackError && import.meta.env.DEV) {
        console.warn('[activity-logger] insert failed:', fallbackError.message)
      }
    }
  } catch {
    // never break the site because logging failed
  } finally {
    flushing = false
  }
}

const SENSITIVE_INPUT = /password|email|tel|phone|otp|card|cvv|secret|token/i

function describeElement(el: Element): { label: string; selector: string } | null {
  const interactive = el.closest('a, button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="switch"], input, select, label, summary, [data-log]')
  if (!interactive || interactive.closest('[data-log-ignore]')) return null

  const tag = interactive.tagName.toLowerCase()
  const input = interactive as HTMLInputElement
  let label = interactive.getAttribute('data-log')
    || interactive.getAttribute('aria-label')
    || (tag === 'input' ? '' : (interactive as HTMLElement).innerText)
    || interactive.getAttribute('title')
    || ''
  if (tag === 'input') {
    const kind = input.type || 'text'
    const name = input.name || input.id || input.placeholder || kind
    label = SENSITIVE_INPUT.test(`${kind} ${name}`) ? `${kind} field` : `${kind} field: ${name}`
  }

  const id = interactive.id ? `#${interactive.id}` : ''
  const href = tag === 'a' ? ` → ${(interactive as HTMLAnchorElement).getAttribute('href') ?? ''}` : ''
  return { label: clip(label, 120) || tag, selector: `${tag}${id}${href}`.slice(0, 300) }
}

export function startActivityLogger() {
  if (started || typeof window === 'undefined') return
  started = true

  document.addEventListener('click', (event) => {
    const el = event.target instanceof Element ? event.target : null
    const info = el && describeElement(el)
    if (info) logActivity('click', `Clicked: ${info.label}`, info.selector)
  }, { capture: true, passive: true })

  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement
    if (form.closest('[data-log-ignore]')) return
    const name = form.getAttribute('aria-label') || form.name || form.id || form.querySelector('h1,h2,h3,legend')?.textContent || 'form'
    // Only field NAMES, never values.
    const fields = Array.from(form.elements).map((f) => (f as HTMLInputElement).name).filter(Boolean).slice(0, 30)
    logActivity('form_submit', `Submitted: ${clip(name, 120)}`, form.id ? `form#${form.id}` : 'form', { fields })
  }, { capture: true, passive: true })

  window.addEventListener('error', (event) => {
    logActivity('error', clip(event.message, 200) || 'Script error', event.filename ? `${event.filename}:${event.lineno}` : null, {
      stack: clip((event.error as Error | undefined)?.stack, 2000),
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string; stack?: string } | string
    logActivity('error', clip(typeof reason === 'string' ? reason : reason?.message, 200) || 'Unhandled promise rejection', null, {
      stack: clip(typeof reason === 'string' ? '' : reason?.stack, 2000),
    })
  })

  setInterval(() => void flush(), FLUSH_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush()
  })
  window.addEventListener('pagehide', () => void flush())
}

/** Page changes inside the single-page app. */
export function logNavigation(path: string, title: string) {
  logActivity('navigation', `Viewed: ${clip(title, 150) || path}`, path)
}
