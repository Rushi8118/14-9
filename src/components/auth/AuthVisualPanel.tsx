import { Suspense, lazy, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CanvasErrorBoundary } from '@/components/not-found/CanvasErrorBoundary'
import { useInView, useMediaQuery, usePageVisible } from '@/components/not-found/useEnvironment'
import { hasWebGL } from '@/components/not-found/webgl'
import type { AuthSceneVariant } from './AuthScene'

const AuthScene = lazy(() => import('./AuthScene'))

export type AuthVisualContent = {
  heading: string
  text: string
  highlights: Array<{ icon: LucideIcon; title: string; text: string }>
}

// Static backdrop: shown under the canvas, and on its own when WebGL is unavailable.
const STATIC_BACKDROP = {
  login:
    'radial-gradient(60% 45% at 70% 25%, rgba(240,192,100,0.22), transparent 70%), radial-gradient(50% 40% at 15% 60%, rgba(120,150,255,0.16), transparent 70%)',
  register:
    'radial-gradient(60% 45% at 30% 25%, rgba(90,210,240,0.2), transparent 70%), radial-gradient(50% 40% at 85% 60%, rgba(240,192,100,0.18), transparent 70%)',
} satisfies Record<AuthSceneVariant, string>

function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
}

export function AuthVisualPanel({ variant, heading, text, highlights }: AuthVisualContent & { variant: AuthSceneVariant }) {
  const panelRef = useRef<HTMLElement>(null)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const pageVisible = usePageVisible()
  const inView = useInView(panelRef)
  const [webgl, setWebgl] = useState(() => hasWebGL())
  const lowPower = useMemo(isLowPowerDevice, [])

  return (
    <aside
      ref={panelRef}
      aria-label="Why create an account"
      className="relative isolate flex min-h-[640px] flex-col justify-end overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1430] text-white shadow-2xl shadow-[#0a1430]/30"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{
          background: `${STATIC_BACKDROP[variant]}, radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px) 0 0 / 24px 24px, #0a1430`,
        }}
      />

      {webgl ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <CanvasErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <AuthScene
                variant={variant}
                animate={!reducedMotion && pageVisible && inView}
                interactive={!reducedMotion}
                lowPower={lowPower}
                onContextLost={() => setWebgl(false)}
              />
            </Suspense>
          </CanvasErrorBoundary>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-[#0a1430] via-[#0a1430]/85 to-transparent"
      />

      <div className="p-10 xl:p-12">
        <h2 className="max-w-md font-serif text-3xl font-semibold leading-tight xl:text-4xl">{heading}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">{text}</p>
        <ul className="mt-8 grid gap-3">
          {highlights.map(({ icon: Icon, title, text: detail }) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary" aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <strong className="block text-sm font-semibold">{title}</strong>
                <span className="text-xs text-white/70">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
