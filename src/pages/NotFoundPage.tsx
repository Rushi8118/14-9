import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Helmet } from 'react-helmet-async'
import { gsap } from 'gsap'
import { FileCheck2, Globe2, GraduationCap, Landmark } from 'lucide-react'
import { Header } from '@/components/not-found/Header'
import { HeroContent } from '@/components/not-found/HeroContent'
import { FloatingInfoCard, type FloatingInfoCardProps } from '@/components/not-found/FloatingInfoCard'
import { Footer } from '@/components/not-found/Footer'
import { GlobeFallback } from '@/components/not-found/GlobeFallback'
import { CanvasErrorBoundary } from '@/components/not-found/CanvasErrorBoundary'
import { useInView, useMediaQuery, usePageVisible } from '@/components/not-found/useEnvironment'
import { hasWebGL } from '@/components/not-found/webgl'
import '@/components/not-found/not-found.css'

// three, @react-three/fiber and drei live in their own chunk, downloaded only when
// someone actually lands on a missing page.
const GlobeScene = lazy(() => import('@/components/not-found/GlobeScene'))

const INFO_CARDS: FloatingInfoCardProps[] = [
  { title: 'Visa Guidance', detail: 'Document checks & filing', icon: FileCheck2, position: 'tl', delay: 0 },
  { title: 'Study & Work Abroad', detail: 'Admissions to work permits', icon: GraduationCap, position: 'tr', delay: 1.2 },
  { title: 'Permanent Residency', detail: 'Pathways built to last', icon: Landmark, position: 'bl', delay: 2.1, accent: 'gold' },
  { title: 'Global Mobility', detail: 'Relocation, end to end', icon: Globe2, position: 'br', delay: 0.6 },
]

/** Staggered entrance: header, then copy, then globe, hologram and cards. Skipped for reduced motion. */
function useEntranceAnimation(root: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(element)
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from(q('[data-anim="header"]'), { y: -16, autoAlpha: 0, duration: 0.7 })
        .from(q('[data-reveal]'), { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, '-=0.35')
        .from(q('[data-anim="hologram"]'), { scale: 0.9, autoAlpha: 0, duration: 1.5, ease: 'power2.out' }, 0.2)
        .from(q('[data-anim="globe"]'), { y: 36, scale: 0.94, autoAlpha: 0, duration: 1.3 }, 0.25)
        .from(q('[data-card], [data-reveal-late]'), { y: 14, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, '-=0.7')
    })
    return () => media.revert()
  }, [root])
}

/** A faint light that follows the cursor. Fine pointers only; off for reduced motion. */
function useCursorGlow(glow: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const element = glow.current
    if (!element || !enabled || !window.matchMedia('(pointer: fine)').matches) return
    let frame = 0
    let x = 0
    let y = 0
    const onMove = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        element.style.setProperty('--cursor-x', `${x}px`)
        element.style.setProperty('--cursor-y', `${y}px`)
        element.dataset.active = 'true'
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
      delete element.dataset.active
    }
  }, [glow, enabled])
}

export default function NotFoundPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<HTMLDivElement>(null)

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const compact = useMediaQuery('(max-width: 767px)')
  const pageVisible = usePageVisible()
  const globeInView = useInView(globeRef)
  const [webglAvailable, setWebglAvailable] = useState(() => hasWebGL())

  // The render loop only runs while it can be seen and motion is welcome.
  const animate = !reducedMotion && pageVisible && globeInView

  useEntranceAnimation(rootRef)
  useCursorGlow(glowRef, !reducedMotion)

  return (
    <div ref={rootRef} className="lbb">
      <Helmet>
        <title>Page Not Found | Siddhivinayak Overseas</title>
        <meta name="description" content="This page does not exist. Explore study visas, work visas or contact Siddhivinayak Overseas in Surat." />
        <meta name="robots" content="noindex, follow" />
        <meta
          name="description"
          content="The page you're looking for has moved or no longer exists. Find your way back to Siddhivinayak Overseas immigration and visa services."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </Helmet>

      <a href="#lbb-main" className="lbb-skip">
        Skip to main content
      </a>

      <div className="lbb-bg" aria-hidden="true">
        <span className="lbb-bg__aurora" />
        <span className="lbb-bg__grid" />
      </div>
      <div ref={glowRef} className="lbb-cursor-glow" aria-hidden="true" />

      <Header />

      <main id="lbb-main" className="lbb-main" tabIndex={-1}>
        <div className="lbb-container lbb-layout">
          <HeroContent />

          <section className="lbb-visual" aria-labelledby="lbb-visual-title">
            <h2 id="lbb-visual-title" className="sr-only">
              Where we help people go
            </h2>

            <div className="lbb-hologram" aria-hidden="true">
              <span data-anim="hologram">404</span>
            </div>

            <div
              ref={globeRef}
              className="lbb-globe"
              data-anim="globe"
              role="img"
              aria-label="A glowing globe with routes travelling from India to Canada, the United Kingdom, Germany, Australia, the United Arab Emirates, Japan, the United States and New Zealand."
            >
              {webglAvailable ? (
                <CanvasErrorBoundary fallback={<GlobeFallback />}>
                  <Suspense fallback={<GlobeFallback loading />}>
                    <GlobeScene
                      animate={animate}
                      compact={compact}
                      reducedMotion={reducedMotion}
                      onContextLost={() => setWebglAvailable(false)}
                    />
                  </Suspense>
                </CanvasErrorBoundary>
              ) : (
                <GlobeFallback />
              )}
            </div>

            <p className="lbb-status" data-reveal-late>
              <span className="lbb-status__pulse" aria-hidden="true" />
              Searching for your next destination…
            </p>

            <ul className="lbb-cards" aria-label="How we can help">
              {INFO_CARDS.map((card) => (
                <FloatingInfoCard key={card.title} {...card} />
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
