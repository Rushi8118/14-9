import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useMediaQuery } from '@/components/not-found/useEnvironment'
import { AuthVisualPanel, type AuthVisualContent } from './AuthVisualPanel'
import type { AuthSceneVariant } from './AuthScene'

type AuthLayoutProps = {
  variant: AuthSceneVariant
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  /** Rendered below the card, e.g. the link to the other auth page. */
  footer?: ReactNode
  visual: AuthVisualContent
}

export function AuthLayout({ variant, eyebrow, title, description, children, footer, visual }: AuthLayoutProps) {
  const reduceMotion = useReducedMotion()
  // The decorative panel (and its Three.js chunk) only mounts on large screens.
  const wide = useMediaQuery('(min-width: 1024px)')
  const titleId = `${variant}-title`

  return (
    <>
      <SiteHeader />
      <main className="premium-page relative overflow-x-clip bg-background px-4 pb-16 pt-24 sm:px-6 lg:pb-20 lg:pt-28">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-md">
              <Link
                to="/"
                className="group mb-6 inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                Back to Home
              </Link>

              <motion.section
                aria-labelledby={titleId}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl shadow-foreground/5 backdrop-blur-sm sm:p-8"
              >
                <header className="mb-7">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    {eyebrow}
                  </p>
                  <h1 id={titleId} className="mt-3 font-serif text-3xl font-semibold leading-tight text-foreground">
                    {title}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </header>
                {children}
              </motion.section>

              {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
            </div>
          </div>

          {wide ? <AuthVisualPanel variant={variant} {...visual} /> : null}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
