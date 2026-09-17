import { supabase } from '@/lib/supabase/client'

const SESSION_KEY = 'svo_visit_session_id'
const LAST_PATH_KEY = 'svo_last_tracked_path'
const THROTTLE_MS = 1500

let lastWriteAt = 0

const COUNTRY_KEY = 'svo_visit_country'
let countryPromise: Promise<string | null> | null = null

async function lookupCountry(url: string, parse: (body: string) => string | null): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  try {
    const res = await fetch(url, { signal: controller.signal, credentials: 'omit' })
    if (!res.ok) return null
    const code = parse(await res.text())
    return code && /^[A-Z]{2}$/.test(code) ? code : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Visitor country (ISO 3166-1 alpha-2) for analytics. Resolved once per browser
 * session from free, keyless geo-IP lookups; only the 2-letter code is kept —
 * the IP address is never stored.
 */
export function getVisitorCountry(): Promise<string | null> {
  if (countryPromise) return countryPromise
  countryPromise = (async () => {
    try {
      const cached = sessionStorage.getItem(COUNTRY_KEY)
      if (cached) return cached === '-' ? null : cached
    } catch {
      // storage unavailable
    }
    const code =
      (await lookupCountry('https://api.country.is/', (body) => {
        try { return String(JSON.parse(body)?.country || '').toUpperCase() } catch { return null }
      })) ??
      (await lookupCountry('https://www.cloudflare.com/cdn-cgi/trace', (body) => {
        const match = body.match(/^loc=([A-Z]{2})$/m)
        return match && match[1] !== 'XX' ? match[1] : null
      }))
    try {
      sessionStorage.setItem(COUNTRY_KEY, code ?? '-')
    } catch {
      // ignore
    }
    return code
  })()
  return countryPromise
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getVisitSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = createId()
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return createId()
  }
}

export function detectDeviceType(): string {
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return 'mobile'
  if (/Tablet|iPad/i.test(ua)) return 'tablet'
  return 'desktop'
}

export function detectBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
  return 'Other'
}

/** Event types written by the tracker today (schema also allows password_change / application_status_change for later). */
export type TrackableEventType =
  | 'page_view'
  | 'login'
  | 'logout'
  | 'failed_login'
  | 'signup'
  | 'application_submitted'

export type TrackEventInput = {
  eventType: TrackableEventType
  path?: string
  title?: string
  userId?: string | null
  /** Signed-in administrator: store in the separate admin_access_logs table, never the visitor log. */
  admin?: boolean
  metadata?: Record<string, unknown>
}

export async function trackSiteEvent(input: TrackEventInput): Promise<void> {
  if (typeof window === 'undefined') return

  const now = Date.now()
  if (input.eventType === 'page_view' && now - lastWriteAt < THROTTLE_MS) return

  const path = input.path || `${window.location.pathname}${window.location.search}`
  if (input.eventType === 'page_view') {
    try {
      const lastPath = sessionStorage.getItem(LAST_PATH_KEY)
      if (lastPath === path && now - lastWriteAt < 8000) return
      sessionStorage.setItem(LAST_PATH_KEY, path)
    } catch {
      // ignore
    }
  }

  lastWriteAt = now

  const sessionId = getVisitSessionId()
  // A stable, deterministic key for page views (session + path + a 10s time
  // bucket) means a duplicate write — e.g. React StrictMode double-invoking
  // an effect, or a retried request — collides on the same key instead of
  // creating a second row. Other event types get a fresh random id since
  // they are rare enough that a real duplicate almost always means retry.
  const requestId =
    input.eventType === 'page_view'
      ? `pv:${sessionId}:${path}:${Math.floor(now / 10_000)}`.slice(0, 300)
      : (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${input.eventType}_${now}_${Math.random().toString(36).slice(2)}`)

  const countryCode = await getVisitorCountry()

  try {
    // Plain insert, not upsert: `ON CONFLICT` makes Postgres also apply SELECT row-level
    // security, and visitors (anon) cannot read the log, so upserts were rejected with 401.
    // The unique request_id index still de-duplicates; a duplicate just returns 23505.
    const { error } = await supabase.from(input.admin && input.userId ? 'admin_access_logs' : 'interactions').insert(
      {
        event_type: input.eventType,
        page_path: path.slice(0, 500),
        page_title: (input.title || document.title || '').slice(0, 200) || null,
        referrer: document.referrer ? document.referrer.slice(0, 500) : null,
        session_id: sessionId,
        user_id: input.userId || null,
        device_type: detectDeviceType(),
        browser: detectBrowser(),
        request_id: requestId,
        country_code: countryCode,
        metadata: {
          href: window.location.href,
          language: navigator.language,
          ...(input.metadata || {}),
        },
      },
    )
    if (error && error.code !== '23505') {
      // Common cause: CHECK constraint missing application_submitted / logout / failed_login
      console.warn('[site-visit-tracker] insert failed:', error.message)
    }
  } catch {
    // Never break the public site for analytics failures
  }
}

export async function markUserLogin(userId: string): Promise<void> {
  try {
    await Promise.all([
      supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId),
      trackSiteEvent({
        eventType: 'login',
        path: window.location.pathname,
        title: 'User login',
        userId,
      }),
    ])
  } catch {
    // ignore
  }
}

/** Call BEFORE clearing auth storage so session_id / user_id are still available. */
export async function markUserLogout(userId: string): Promise<void> {
  try {
    await trackSiteEvent({
      eventType: 'logout',
      path: typeof window !== 'undefined' ? window.location.pathname : '/logout',
      title: 'User logout',
      userId,
    })
  } catch {
    // ignore
  }
}

export async function markFailedLogin(email?: string): Promise<void> {
  try {
    await trackSiteEvent({
      eventType: 'failed_login',
      path: typeof window !== 'undefined' ? window.location.pathname : '/login',
      title: 'Failed login',
      metadata: email ? { email: email.slice(0, 200) } : {},
    })
  } catch {
    // ignore
  }
}

export async function markApplicationSubmitted(
  userId: string | null,
  applicationId?: string,
  applicationType?: string,
): Promise<void> {
  try {
    await trackSiteEvent({
      eventType: 'application_submitted',
      path: typeof window !== 'undefined' ? window.location.pathname : '/apply',
      title: 'Application Submitted',
      userId,
      metadata: { application_id: applicationId, application_type: applicationType },
    })
  } catch {
    // ignore
  }
}
