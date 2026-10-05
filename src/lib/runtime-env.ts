/**
 * Which environment a log row was produced in, so development noise never
 * mixes with real visitor activity.
 *
 * Every log writer stamps this on the row; the admin access log then filters on
 * it and defaults to `production`. The database re-derives the value from the
 * page URL on insert (see the log-environment migration), so a row cannot be
 * mislabelled by a stale client build.
 *
 *   production — the live site (siddhivinayakoverseas.com and any other
 *                non-local host)
 *   local      — `npm run dev` / `vite preview` on this machine, a LAN IP, or
 *                any *.localhost / *.local / *.test host
 *   build      — the headless browser that `scripts/prerender.mjs` drives
 *                during `npm run build`; it loads every route for real, so
 *                without this each build wrote a page view per page
 */
export type LogEnvironment = 'production' | 'local' | 'build'

export const LOG_ENVIRONMENTS: readonly LogEnvironment[] = ['production', 'local', 'build'] as const

export const LOG_ENVIRONMENT_LABELS: Record<LogEnvironment, string> = {
  production: 'Live site',
  local: 'Localhost',
  build: 'Build / prerender',
}

/** Which rows the access log should show. `local` covers both local and build. */
export type LogEnvironmentFilter = 'production' | 'local' | 'all'

export const LOG_ENVIRONMENT_FILTER_LABELS: Record<LogEnvironmentFilter, string> = {
  production: 'Live site',
  local: 'Local & test',
  all: 'All records',
}

/** Environment values matched by a given filter. */
export const LOG_ENVIRONMENT_FILTER_VALUES: Record<
  Exclude<LogEnvironmentFilter, 'all'>,
  LogEnvironment[]
> = {
  production: ['production'],
  local: ['local', 'build'],
}

/**
 * Flag set by scripts/prerender.mjs through Playwright's addInitScript, before
 * any application code runs.
 */
export const PRERENDER_FLAG = '__SVO_PRERENDER__'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

/** Private / link-local IPv4 ranges — a phone testing the dev server over Wi-Fi. */
const PRIVATE_IPV4 =
  /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/

/** Is this hostname a development host rather than the live site? */
export function isLocalHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (!host) return true
  if (LOCAL_HOSTNAMES.has(host)) return true
  if (/\.(localhost|local|test|internal)$/.test(host)) return true
  if (PRIVATE_IPV4.test(host)) return true
  return false
}

/**
 * The environment the current page is running in. Read fresh each call — the
 * prerender flag and `window.location` are both set before any log is written,
 * but a cached value would survive a client-side navigation between them.
 */
export function detectLogEnvironment(): LogEnvironment {
  if (typeof window === 'undefined') return 'build'

  if ((window as unknown as Record<string, unknown>)[PRERENDER_FLAG] === true) {
    return 'build'
  }

  if (isLocalHostname(window.location.hostname)) return 'local'

  // A production build served from a non-local host is the live site. The dev
  // flag is checked last so a dev server bound to a public hostname still reads
  // as local, and optionally so this module stays importable outside Vite
  // (a node script, a test) where `import.meta.env` does not exist.
  return import.meta.env?.DEV ? 'local' : 'production'
}

/** True while running anywhere other than the live site. */
export function isNonProductionLogEnvironment(): boolean {
  return detectLogEnvironment() !== 'production'
}

/**
 * PostgREST errors that mean the `environment` column has not been added yet
 * (the migration is applied by hand — see CLAUDE.md). Callers degrade to
 * unfiltered reads and unstamped writes rather than losing the log entirely.
 */
export function isMissingEnvironmentColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const { code, message } = error as { code?: string; message?: string }
  if (code === '42703' || code === 'PGRST204') return true
  return typeof message === 'string' && /environment/i.test(message) &&
    /(column|schema cache|does not exist)/i.test(message)
}
