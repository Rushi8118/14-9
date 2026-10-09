import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Flame, Clock, Users, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react'
import { useUrgentRequirements, getRemainingDays } from '@/hooks/useUrgentRequirements'
import { FlagIcon } from '@/components/flag-icon'
import { Button } from '@/components/ui/button'

export function UrgentRequirementBanner() {
  const { requirements, isLoading } = useUrgentRequirements()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (requirements.length <= 1 || paused || prefersReducedMotion) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % requirements.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [requirements.length, paused, prefersReducedMotion])

  if (isLoading || requirements.length === 0) return null

  const current = requirements[currentIndex] || requirements[0]
  const remainingDays = getRemainingDays(current.expires_at)
  const isClosingSoon = remainingDays !== null && remainingDays <= 3

  return (
    <section
      className="relative z-20 px-4 py-5 sm:px-6 sm:py-6 lg:px-8"
      aria-label="Urgent job openings"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <div className="mx-auto max-w-7xl">
        <article className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-[0_12px_32px_-18px_rgba(26,35,64,0.35)]">
          {/* Brand accent rail */}
          <div
            className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary via-[#E8B84B] to-primary"
            aria-hidden="true"
          />

          {/* Soft ivory wash + gold tip */}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,#FFF8E7_0%,#FCFBF8_42%,#F5F0E8_100%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col gap-5 p-4 pl-5 sm:p-5 sm:pl-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-6 lg:pl-7">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A2340] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#FFF8E7]">
                  <Flame className="h-3.5 w-3.5 text-[#E8B84B]" aria-hidden="true" />
                  Urgent Opening
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1A2340]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#1A2340]">
                  <FlagIcon
                    country={current.country}
                    code={current.country_code}
                    className="text-sm rounded-[2px]"
                  />
                  {current.country}
                </span>

                {current.vacancies > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-[#8a6a1a]">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {current.vacancies} {current.vacancies === 1 ? 'Vacancy' : 'Vacancies'}
                  </span>
                )}

                {remainingDays !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      isClosingSoon
                        ? 'border-red-700/25 bg-red-50 text-red-800'
                        : 'border-primary/30 bg-primary/10 text-[#8a6a1a]'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {remainingDays > 0
                      ? `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`
                      : 'Closing today'}
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <Link
                    to={`/urgent-requirements/${current.slug}`}
                    className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B] focus-visible:ring-offset-2"
                  >
                    {/* h2, not h3. This banner renders immediately after the hero <h1> on the
                        homepage and is the first heading after it, so an h3 skipped a level --
                        reported as "Gaps: H1->H3". A screen-reader user navigating by heading
                        hits this before any h2 exists, and the jump reads as a missing section. */}
                    <h2 className="font-serif text-lg font-semibold leading-snug text-[#1A2340] transition-colors group-hover:text-primary sm:text-xl line-clamp-2">
                      {current.title}
                    </h2>
                    {current.summary && (
                      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C6478] line-clamp-2">
                        {current.summary}
                      </p>
                    )}
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 border-t border-primary/15 pt-4 sm:w-auto sm:flex-row sm:items-center sm:border-t-0 sm:pt-0">
              {requirements.length > 1 && (
                <div
                  className="flex items-center justify-center gap-1.5 sm:justify-start"
                  role="group"
                  aria-label="Browse urgent openings"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex(
                        (prev) => (prev - 1 + requirements.length) % requirements.length,
                      )
                    }
                    className="tap-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1A2340]/12 bg-white text-[#1A2340] transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B] focus-visible:ring-offset-2"
                    aria-label="Previous urgent opening"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="min-w-[2.75rem] text-center text-xs font-semibold tabular-nums text-[#5C6478]">
                    <span className="sr-only">Opening </span>
                    {currentIndex + 1}
                    <span aria-hidden="true"> / </span>
                    <span className="sr-only">of </span>
                    {requirements.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % requirements.length)}
                    className="tap-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1A2340]/12 bg-white text-[#1A2340] transition hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B] focus-visible:ring-offset-2"
                    aria-label="Next urgent opening"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              <Button
                asChild
                className="h-11 w-full rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_-12px_rgba(196,154,43,0.7)] hover:bg-primary/90 btn-glow sm:w-auto"
              >
                <Link to={`/urgent-requirements/${current.slug}`}>
                  View Details & Apply
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          {requirements.length > 1 && (
            <div className="relative z-10 flex justify-center gap-1.5 pb-3 sm:hidden" aria-hidden="true">
              {requirements.map((req, index) => (
                <span
                  key={req.id}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex ? 'w-5 bg-primary' : 'w-1.5 bg-[#1A2340]/20'
                  }`}
                />
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default UrgentRequirementBanner
