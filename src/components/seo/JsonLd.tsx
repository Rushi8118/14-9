import { useEffect } from 'react'

/**
 * Adds a JSON-LD structured-data block to <head> outside React's tree.
 *
 * Rendering <script> elements from React makes React 19 log "Encountered a script tag
 * while rendering React component", and Helmet's `script` prop does not emit them in this
 * setup, so the element is created directly and removed when the page unmounts.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = data == null ? '' : JSON.stringify(data)

  useEffect(() => {
    if (!json) return
    const element = document.createElement('script')
    element.type = 'application/ld+json'
    element.setAttribute('data-json-ld', '')
    element.text = json
    document.head.appendChild(element)
    return () => element.remove()
  }, [json])

  return null
}
