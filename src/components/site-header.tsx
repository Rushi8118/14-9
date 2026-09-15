import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Menu, X, Globe2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import NotificationBell from './NotificationBell'
import UserProfileDropdown from './UserProfileDropdown'
import { prefetchRoute } from '@/lib/route-prefetch'
import { NAP } from '@/lib/seo/site'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  {
    label: 'Study Visa',
    href: '/study-visa',
    children: [
      { label: 'UK', href: '/study-in-uk' },
      { label: 'France', href: '/study-in-france' },
      { label: 'Germany', href: '/study-in-germany' },
      { label: 'Spain', href: '/study-in-spain' },
      { label: 'Dubai', href: '/study-in-dubai' },
      { label: 'Singapore', href: '/study-in-singapore' },
      { label: 'All study destinations', href: '/study-visa' },
    ],
  },
  {
    label: 'Work Visa',
    href: '/work-visa',
    children: [
      { label: 'Japan', href: '/work-visa/japan' },
      { label: 'Germany', href: '/work-visa/germany' },
      { label: 'UK', href: '/work-visa/uk' },
      { label: 'Canada', href: '/work-visa/canada' },
      { label: 'Australia', href: '/work-visa/australia' },
      { label: 'Singapore', href: '/work-visa/singapore' },
      { label: 'Gulf', href: '/work-visa/gulf' },
      { label: 'View all 38+ countries', href: '/work-visa' },
    ],
  },
  { label: '🔥 Urgent Openings', href: '/urgent-requirements' },
  { label: 'Guides', href: '/guides' },
  { label: 'Blog', href: '/blog' },
  { label: 'Surat Office', href: '/visa-consultants-in-surat' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { user, isLoading } = useAuth()
  const progressRef = useRef<HTMLDivElement>(null)
  const scrolledRef = useRef(false)
  const rafRef = useRef(0)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    let cachedDocHeight = 0
    const calcDocHeight = () => {
      cachedDocHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    }

    const update = () => {
      rafRef.current = 0
      const currentY = window.scrollY
      const nextScrolled = currentY > 12
      if (nextScrolled !== scrolledRef.current) {
        scrolledRef.current = nextScrolled
        setScrolled(nextScrolled)
      }
      if (!cachedDocHeight) calcDocHeight()
      const progress = cachedDocHeight > 0 ? Math.min((currentY / cachedDocHeight) * 100, 100) : 0
      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`
      }
    }

    const onResize = () => {
      cachedDocHeight = 0
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => firstMenuItemRef.current?.focus())
    } else {
      hamburgerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-200 ${
          scrolled
            ? 'border-b border-primary/20 bg-background/98 shadow-sm'
            : 'border-b border-transparent bg-background/95'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 md:px-6 md:py-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 group min-h-0 min-w-0"
            aria-label="Siddhivinayak Overseas – home page"
          >
            <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background/90 ring-1 ring-primary/20 transition group-hover:bg-primary/10 overflow-hidden">
              <img
                src="/favicon/android-chrome-192x192.png"
                alt="Siddhivinayak Overseas logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="whitespace-nowrap font-serif text-sm font-semibold text-foreground sm:text-base md:text-lg">
                Siddhivinayak
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px] md:text-[11px]">
                Overseas
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 lg:flex xl:gap-6" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <div key={item.href} className="group relative">
                <Link
                  to={item.href}
                  data-active={isActive(item.href)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  className="nav-link py-1 text-sm font-medium text-foreground/80 hover:text-foreground"
                >
                  {item.label}
                </Link>
                {'children' in item && item.children ? (
                  <div className="invisible absolute left-0 top-full z-50 min-w-[200px] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                    <div className="rounded-xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur-xl">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          onMouseEnter={() => prefetchRoute(child.href)}
                          onFocus={() => prefetchRoute(child.href)}
                          className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition hover:bg-primary/10 hover:text-primary"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isLoading ? (
              <div className="flex animate-pulse items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-foreground/10" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="hidden md:inline-flex rounded-full border-primary/20 text-foreground hover:bg-primary/10 hover:text-primary text-xs font-semibold px-4 h-9 min-h-0">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <NotificationBell />
                <UserProfileDropdown />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link to="/login" className="min-h-0 min-w-0 rounded px-2.5 py-2 text-xs font-bold text-foreground transition hover:text-primary">
                  Login
                </Link>
                <Button asChild size="sm" variant="outline" className="hidden md:inline-flex rounded-full border-primary/20 text-primary hover:bg-primary/10 text-xs font-semibold px-4 h-9 min-h-0">
                  <Link to="/register">Register</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-4 h-9 btn-glow btn-cta-sweep min-h-0">
                  <Link to="/contact" onMouseEnter={() => prefetchRoute('/contact')} onFocus={() => prefetchRoute('/contact')}>
                    Free Consultation
                  </Link>
                </Button>
              </div>
            )}

            {/* Hamburger – mobile only */}
            <button
              ref={hamburgerRef}
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-card/80 text-foreground transition hover:border-primary/60 hover:text-primary lg:hidden"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              style={{ zIndex: 70 }}
            >
              {open
                ? <X className="h-5 w-5" aria-hidden="true" />
                : <Menu className="h-5 w-5" aria-hidden="true" />
              }
            </button>
          </div>
        </div>
        {/* Scroll progress bar — width updated via ref to avoid React re-renders */}
        <div
          ref={progressRef}
          className="absolute bottom-0 left-0 h-0.5 bg-primary/80"
          style={{ width: '0%' }}
          aria-hidden="true"
        />
      </header>

      {/* Mobile full-screen menu – separate from header so it can be z-60 */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 bg-background lg:hidden"
            style={{ zIndex: 60 }}
          >
            {/* Subtle top accent line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

            {/* Close button inside overlay */}
            <div className="absolute right-4 top-4 z-20">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950/90 text-slate-100 shadow-lg shadow-black/20 transition hover:bg-slate-900"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-20">
              {/* Nav items */}
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {NAV_ITEMS.map((item, idx) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className="space-y-1"
                  >
                    <Link
                      ref={idx === 0 ? firstMenuItemRef : undefined}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      data-active={isActive(item.href)}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className="flex items-center justify-between rounded-2xl px-4 py-4 text-base font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <span>{item.label}</span>
                      {isActive(item.href) && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Link>
                    {'children' in item && item.children
                      ? item.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-xl px-6 py-2 text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary"
                          >
                            {child.label}
                          </Link>
                        ))
                      : null}
                  </motion.div>
                ))}
              </nav>

              {/* Divider */}
              <div className="my-5 h-px bg-border/60" />

              {/* Auth buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: NAV_ITEMS.length * 0.04 + 0.05 }}
                className="flex flex-col gap-3"
              >
                {isLoading ? (
                  <div className="h-12 animate-pulse rounded-2xl bg-foreground/8" />
                ) : user ? (
                  <Button asChild className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base font-bold btn-glow">
                    <Link to="/dashboard" onClick={() => setOpen(false)}>Go to Dashboard →</Link>
                  </Button>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Button asChild variant="outline" className="rounded-2xl h-13 text-sm font-semibold border-foreground/20 hover:bg-primary/10 hover:border-primary hover:text-primary" style={{ height: '52px' }}>
                        <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-2xl text-sm font-semibold border-primary/30 text-primary hover:bg-primary/10" style={{ height: '52px' }}>
                        <Link to="/register" onClick={() => setOpen(false)}>Register</Link>
                      </Button>
                    </div>
                    <Button asChild className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 btn-glow btn-cta-sweep font-bold text-sm" style={{ height: '52px' }}>
                      <Link to="/contact" onClick={() => setOpen(false)}>Free Consultation →</Link>
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Contact info at bottom */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-auto pt-8 text-center text-xs text-muted-foreground"
              >
                <p className="font-medium">📞 {NAP.phoneINDisplay}</p>
                <p className="mt-1">info@siddhivinayakoverseas.com</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
