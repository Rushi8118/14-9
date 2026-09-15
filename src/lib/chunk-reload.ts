import { lazy, type ComponentType } from 'react'

const RELOAD_KEY = 'svo_chunk_reload_at'
const RELOAD_WINDOW_MS = 10_000

/** True when a page chunk failed to download — usually because a new deploy replaced it. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (CSS )?chunk|ChunkLoadError|Unable to preload CSS/i.test(
    message,
  )
}

/**
 * Reload the tab so it fetches the latest index.html and chunk names.
 * Allowed once per 10 seconds so a genuinely broken chunk can never cause a reload loop.
 * Returns true when a reload was started.
 */
export function reloadForNewDeploy(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - last < RELOAD_WINDOW_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // Without storage we cannot guard against loops, so let the error boundary handle it.
    return false
  }
  window.location.reload()
  return true
}

/** React.lazy that recovers from stale deploy chunks by reloading instead of blanking the page. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((error: unknown) => {
      if (isChunkLoadError(error) && reloadForNewDeploy()) {
        // Keep the Suspense fallback on screen while the page reloads.
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }),
  )
}
