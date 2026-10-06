/**
 * Hands metadata ownership from the edge back to React on hydration.
 *
 * WHY THIS IS NEEDED
 *
 * The Cloudflare SEO Worker (workers/seo-head/) injects <title>, canonical,
 * description, Open Graph, Twitter and JSON-LD into app-shell.html so a newly
 * published post has real metadata in its raw HTML, before any JavaScript runs.
 *
 * React 19 then hydrates and SeoHead renders the same tags. React *prepends* its
 * hoisted tags rather than replacing matching static ones — the exact behaviour
 * that once put two <title> elements on every prerendered page here, and the
 * reason scripts/prerender.mjs has to strip the fallback title from its output.
 * Left alone, an injected page would end up with two of everything.
 *
 * THE RESOLUTION, AND WHY IT IS THIS ONE
 *
 * The Worker tags every element it adds with data-seo-source="cloudflare". Once
 * React has committed its own tags, the marked ones are removed. That leaves
 * exactly one of each, and it is ordered deliberately:
 *
 *   - Removing AFTER commit (useEffect, not before render) means the document is
 *     never without metadata. There is no window where a crawler or an extension
 *     sees a page with no title.
 *   - Removing by marker rather than by tag name means it cannot touch a
 *     prerendered page's real metadata, or anything index.html owns. A
 *     prerendered page has no marked elements, so this is a no-op there.
 *   - If JavaScript never runs — a social scraper, an LLM crawler, a user with
 *     JS disabled — nothing is removed and the injected metadata stands. That is
 *     the whole point of injecting it.
 *
 * The alternative, having SeoHead detect the existing tags and adopt them, would
 * mean SeoHead reading from the DOM and rendering conditionally. That couples the
 * component to document state, breaks its purity, and would still need a marker
 * to know which tags were the edge's. Removal is the smaller mechanism.
 */

/** Must match SEO_SOURCE_ATTR / SEO_SOURCE_VALUE in workers/seo-head/src/metadata.mjs. */
const SERVER_METADATA_SELECTOR = '[data-seo-source="cloudflare"]'

/**
 * Also removes the shell marker scripts/prerender.mjs writes into
 * app-shell.html. It is the Worker's fallback signal for "this response has no
 * metadata" and has no meaning once the page is live.
 */
const SHELL_MARKER_SELECTOR = 'meta[name="x-app-shell"]'

/**
 * Only ever runs once per page load. A client-side navigation re-renders
 * SeoHead, but by then the edge's tags are already gone and the second pass
 * would be pure overhead.
 */
let handedOver = false

/** Test seam: lets the suite reset the once-only guard between cases. */
export function resetServerMetadataHandoff() {
  handedOver = false
}

/**
 * Removes the edge-injected metadata, leaving React's as the only copy.
 *
 * @returns the number of elements removed — used by the tests to assert that a
 *   handoff actually happened rather than silently matching nothing.
 */
export function claimServerRenderedMetadata(): number {
  if (handedOver || typeof document === 'undefined') return 0
  handedOver = true

  const injected = document.querySelectorAll(`${SERVER_METADATA_SELECTOR}, ${SHELL_MARKER_SELECTOR}`)
  for (const element of injected) element.remove()
  return injected.length
}
