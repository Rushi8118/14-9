/**
 * Renders structured data as a single JSON-LD block.
 *
 * This used to append a <script> to document.head from a useEffect. That
 * duplicated every block: the prerenderer snapshots the DOM *after* effects have
 * run, so the generated HTML already contained the scripts, and then React
 * appended them again on load. 56 of 67 pages shipped Organization, WebSite and
 * LocalBusiness twice in the HTML and three times in the live DOM.
 *
 * Rendering declaratively cannot double-append. `dangerouslySetInnerHTML` is what
 * keeps React 19 from logging "Encountered a script tag while rendering React
 * component" — that warning is about script *children*, not the element.
 *
 * Several entities are emitted as one @graph rather than one <script> each, so a
 * page has exactly one JSON-LD block and each entity appears exactly once. The
 * build-time validator enforces both.
 */

import { completeGraph } from '@/lib/seo/schema'

const SCHEMA_CONTEXT = 'https://schema.org'

type SchemaObject = Record<string, unknown>

function toGraph(data: unknown): string | null {
  if (data == null) return null

  const items = (Array.isArray(data) ? data : [data]).filter(
    (item): item is SchemaObject => item != null && typeof item === 'object',
  )
  if (!items.length) return null

  // Pulls in any entity the page refers to by `@id` without defining it, so a
  // `provider`/`author` reference always resolves inside this block. See
  // completeGraph() for the 19 pages this was silently wrong on.
  const complete = completeGraph(items)

  if (complete.length === 1) {
    const only = complete[0]
    return JSON.stringify(only['@context'] ? only : { '@context': SCHEMA_CONTEXT, ...only })
  }

  // One @context for the document, none on the members — repeating it inside a
  // graph is redundant and makes the block noticeably larger on every page.
  const graph = complete.map(({ '@context': _context, ...rest }) => rest)
  return JSON.stringify({ '@context': SCHEMA_CONTEXT, '@graph': graph })
}

export function JsonLd({ data }: { data: unknown }) {
  const json = toGraph(data)
  if (!json) return null

  return (
    <script
      type="application/ld+json"
      data-json-ld=""
      // JSON.stringify output is not HTML-escaped, so close any `</script>` that
      // could appear inside a string value and end the block early.
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  )
}
