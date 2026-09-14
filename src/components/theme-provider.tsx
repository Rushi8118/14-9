import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * next-themes renders an inline anti-flash <script> meant for server rendering. In this
 * client-only app React never executes it and React 19 logs "Encountered a script tag
 * while rendering React component", so mark it as inert data instead.
 */
export function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider scriptProps={{ type: 'application/json', ...scriptProps }} {...props}>
      {children}
    </NextThemesProvider>
  )
}
