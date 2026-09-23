export const GA_EVENTS = {
  PHONE_CLICK: "phone_click",
  WHATSAPP_CLICK: "whatsapp_click",
  FORM_SUBMIT: "form_submit",
} as const

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
const GTM_ID = import.meta.env.VITE_GTM_ID as string | undefined

function dataLayer(): unknown[] {
  const w = window as any
  w.dataLayer = w.dataLayer || []
  return w.dataLayer
}

/**
 * Loads GA4 (or GTM, if VITE_GTM_ID is set instead) at runtime so the tag id stays
 * out of the repository. Without either env var nothing is injected and every
 * trackEvent call is a no-op, which is the correct behaviour for local builds.
 */
export function initAnalytics() {
  if (typeof window === "undefined") return
  const w = window as any
  if (w.__analyticsReady) return

  const id = GTM_ID || MEASUREMENT_ID
  if (!id) return

  w.__analyticsReady = true
  dataLayer()
  w.gtag = function gtag() {
    // gtag requires the raw arguments object, so this cannot be a rest parameter.
    dataLayer().push(arguments)
  }

  const script = document.createElement("script")
  script.async = true

  if (GTM_ID) {
    dataLayer().push({ "gtm.start": Date.now(), event: "gtm.js" })
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`
  } else {
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID!)}`
    w.gtag("js", new Date())
    // React Router changes the URL without a reload, so page_view is sent manually.
    w.gtag("config", MEASUREMENT_ID, { send_page_view: false })
  }

  document.head.appendChild(script)
}

/** Sends a page_view on client-side navigation, which GA4 cannot detect on its own. */
export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") return
  const w = window as any
  const payload = {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  }
  if (typeof w.gtag === "function" && MEASUREMENT_ID && !GTM_ID) {
    w.gtag("event", "page_view", payload)
  } else if (w.dataLayer) {
    dataLayer().push({ event: "page_view", ...payload })
  }
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
) {
  if (typeof window === "undefined") return

  const payload: Record<string, unknown> = {
    event_category: category,
    event_label: label,
  }

  if (typeof value === "number") {
    payload.value = value
  }

  if (typeof (window as any).gtag === "function") {
    ;(window as any).gtag("event", action, payload)
  } else if (typeof (window as any).dataLayer !== "undefined") {
    ;(window as any).dataLayer.push({
      event: action,
      ...payload,
    })
  }
}
