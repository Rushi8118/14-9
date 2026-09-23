import { Suspense, lazy, Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const InteractiveGlobe = lazy(() => import('@/components/interactive-globe'))

function GlobePoster() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-transparent">
      <div className="relative h-64 w-64 rounded-full overflow-hidden shadow-[0_0_60px_rgba(245,184,61,0.4)] ring-1 ring-amber-300/40">
        {/* Homepage LCP element. 768px covers the 256px container at 2x DPR; the
            AVIF is ~56KB against 501KB for the full-size blue-marble texture. */}
        <picture>
          <source srcSet="/earth-poster-768.avif" type="image/avif" />
          <source srcSet="/earth-poster-768.webp" type="image/webp" />
          <img
            src="/earth-poster-768.jpg"
            alt="Rotating globe illustrating the countries Siddhivinayak Overseas supports"
            width={768}
            height={768}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover scale-150"
          />
        </picture>
      </div>
    </div>
  )
}

/**
 * The 3D globe is decorative and costs a three.js bundle plus texture downloads,
 * so phones and data-saver users get the poster image instead.
 */
function useGlobeEnabled() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData) return

    const query = window.matchMedia('(min-width: 1024px)')
    const apply = () => setEnabled(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return enabled
}

function GlobeError() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-transparent">
      <div className="text-center opacity-70">
        <span className="text-3xl" role="img" aria-label="Globe">🌍</span>
        <p className="mt-2 text-sm text-muted-foreground">3D globe unavailable</p>
      </div>
    </div>
  )
}

class GlobeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return <GlobeError />
    return this.props.children
  }
}

export function Hero() {
  const showGlobe = useGlobeEnabled()
  const [inView, setInView] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '80px', threshold: 0.05 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const renderGlobe = showGlobe && inView

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative overflow-hidden bg-background pt-24 pb-8 text-foreground sm:pt-28 md:pt-32 md:pb-10"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 md:px-6 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-6">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            aria-label="Trusted by 500 plus work visa clients"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Trusted by 500+ work visa clients
          </div>

          <h1
            className="mt-5 font-serif font-semibold leading-[1.08] tracking-tight text-balance text-foreground"
            style={{ fontSize: 'clamp(1.75rem, 8vw, 4rem)' }}
          >
            Your gateway to a <span className="gold-gradient-text">global career</span>
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-6 md:text-base lg:text-lg">
            Siddhivinayak Overseas is your specialist partner for{' '}
            <span className="font-semibold text-foreground">Work Visas</span> and{' '}
            <span className="font-semibold text-foreground">Study Visas</span> across Europe, Asia,
            Oceania, North America, Gulf and Africa — with counselling from Surat.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              <Link to="/contact" className="group flex items-center justify-center">
                Start Your Visa Journey
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full sm:w-auto"
            >
              <Link to="/work-visa">Explore Work Visas</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Surat-based consultancy
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-semibold text-foreground">6+</span>
              <span className="text-muted-foreground">years expertise</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-semibold text-foreground">38+</span>
              <span className="text-muted-foreground">work destinations</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative mx-auto w-full flex items-center justify-center">
            <div
              className="relative w-full overflow-visible bg-transparent"
              style={{ height: 'clamp(340px, 46vw, 480px)' }}
              aria-hidden="true"
            >
              {renderGlobe ? (
                <GlobeErrorBoundary>
                  <Suspense fallback={<GlobePoster />}>
                    <InteractiveGlobe
                      className="h-full w-full"
                      showMarkers={true}
                      enableZoom={false}
                      aria-hidden
                    />
                  </Suspense>
                </GlobeErrorBoundary>
              ) : (
                <GlobePoster />
              )}

              <div
                className="pointer-events-none absolute bottom-1 right-1 rounded-2xl border border-border/60 bg-card/85 p-3 text-foreground shadow-lg backdrop-blur-md sm:bottom-2 sm:right-2 sm:p-3.5"
                role="note"
              >
                <p className="text-[10px] uppercase font-bold tracking-wider text-primary">Fast Processing</p>
                <p className="mt-0.5 text-base font-serif font-bold text-foreground">UK: 8 weeks</p>
                <p className="text-[10px] text-muted-foreground">Europe / Tier 1: 5–6 mos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 md:grid-cols-3 md:px-6">
        {[
          { title: 'Work Permits', text: '38+ countries across Europe, Asia, Oceania, Americas, Gulf & Africa.' },
          { title: 'Study Abroad', text: 'UK, France, Germany, Spain, Dubai and Singapore pathways.' },
          { title: 'Surat Counselling', text: 'Free consultation with clear next steps and documentation support.' },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border/60 bg-card/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
