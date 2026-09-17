import { supabase } from '@/lib/supabase/client'
import { detectBrowser, detectDeviceType, getVisitSessionId } from '@/lib/site-visit-tracker'

/**
 * Stores every click, navigation, form submit and application error in
 * `activity_logs`. Events are batched and flushed every few seconds (and when
 * the tab is hidden) so logging never slows the site down.
 *
 * Privacy: input values are never read. Clicks record the element's label;
 * text inside password/email/phone fields or anything marked
 * `data-log-ignore` is never captured.
 */

type Category = 'click' | 'navigation' | 'form_submit' | 'error' | 'api_error' | 'app'

type ActivityEvent = {
  category: Category
  action: string
  page_path: string
  target: string | null
  details: Record<string, unknown>
  occurred_at: string
  session_id: string
  device_type: string
  browser: string
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
  })
  if (queue.length >= MAX_BATCH) void flush()
}

async function flush() {
  if (flushing || queue.length === 0) return
  flushing = true
  const batch = queue.splice(0, MAX_BATCH)
  try {
    const { error } = await supabase.from('activity_logs').insert(batch)
    if (error && import.meta.env.DEV) console.warn('[activity-logger] insert failed:', error.message)
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
