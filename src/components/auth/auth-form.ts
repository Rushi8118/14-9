import { useEffect, type RefObject } from 'react'
import { z } from 'zod'

const emailSchema = z.string().email()

export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success
}

/** Trim and collapse inner whitespace so stored names stay tidy. */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/** Only same-site paths are allowed as post-login redirects (blocks `//evil.com` and absolute URLs). */
export function safeRedirectPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}

/**
 * Focus the first field on devices with a fine pointer. Skipped on touch devices,
 * where autofocus would pop the keyboard over the page.
 */
export function useInitialFocus(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) ref.current?.focus({ preventScroll: true })
  }, [ref])
}

/** Moves focus to the first invalid field, in visual order. */
export function focusFirstInvalid<K extends string>(
  errors: Partial<Record<K, string>>,
  fields: ReadonlyArray<[K, RefObject<HTMLElement | null>]>,
) {
  const first = fields.find(([key]) => errors[key])
  first?.[1].current?.focus()
}
