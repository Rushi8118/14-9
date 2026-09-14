import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { warmRoutesWhenIdle } from '@/lib/route-prefetch'
import { useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { AdminErrorBoundary } from '@/components/AdminErrorBoundary'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import MfaChallengeGate from './MfaChallengeGate'

const COLLAPSE_KEY = 'svo_dashboard_sidebar_collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  useEffect(() => warmRoutesWhenIdle('/dashboard'), [])
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore unavailable storage
    }
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
    setScrolled(false)
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  if (!user) return null

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={250}>
        <MfaChallengeGate>
        <div className="premium-desk applicant-desk flex h-dvh w-full overflow-hidden">
          <a href="#dashboard-main" className="skip-to-content">
            Skip to main content
          </a>

          <aside
            id="dashboard-sidebar"
            aria-label="Dashboard sidebar"
            className="desk-sidebar hidden h-dvh shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 ease-out lg:flex"
            style={{ width: collapsed ? 78 : 260 }}
          >
            <DashboardSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
          </aside>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              id="dashboard-mobile-nav"
              side="left"
              className="applicant-desk w-[min(86vw,300px)] gap-0 border-r border-[var(--desk-line)] bg-[var(--desk-surface)] p-0 text-[var(--desk-navy)] lg:hidden [&>button:last-child]:hidden"
            >
              <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Move between your workspace, support and account pages.
              </SheetDescription>
              <DashboardSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex h-dvh min-w-0 flex-1 flex-col">
            <DashboardTopbar scrolled={scrolled} mobileOpen={mobileOpen} onOpenMenu={() => setMobileOpen(true)} />
            <main
              ref={mainRef}
              id="dashboard-main"
              tabIndex={-1}
              onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 4)}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-8"
            >
              <div className="mx-auto w-full max-w-[1320px]">
                <AdminErrorBoundary key={location.pathname}>
                  <Suspense fallback={<ShellContentSkeleton />}>{children}</Suspense>
                </AdminErrorBoundary>
              </div>
            </main>
          </div>
        </div>
        </MfaChallengeGate>
      </TooltipProvider>
    </MotionConfig>
  )
}

/** Shown in the content area only, so the shell stays mounted while a page chunk loads. */
function ShellContentSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-4 animate-pulse">
      <div className="h-8 w-64 max-w-full rounded-lg bg-[var(--desk-line)]/60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--desk-line)]/50" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-[var(--desk-line)]/40" />
    </div>
  )
}
