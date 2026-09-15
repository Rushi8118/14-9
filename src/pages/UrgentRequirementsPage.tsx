import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Flame, Clock, Users, ArrowRight, Search, MapPin, Briefcase,
  DollarSign, Sparkles, Filter, CheckCircle2
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SeoHead } from '@/components/seo/SeoHead'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUrgentRequirements, getRemainingDays, isRequirementExpired } from '@/hooks/useUrgentRequirements'
import { FlagIcon } from '@/components/flag-icon'

export default function UrgentRequirementsPage() {
  const { requirements, isLoading } = useUrgentRequirements()
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')

  const countries = useMemo(() => {
    const countryList = Array.from(
      new Set(requirements.map((r) => r.country))
    ).filter(Boolean).sort()
    return ['all', ...countryList]
  }, [requirements])

  const countriesWithCodes = useMemo(() => {
    const map = new Map<string, string>()
    requirements.forEach(r => {
      if (r.country && r.country_code) {
        map.set(r.country, r.country_code)
      }
    })
    return map
  }, [requirements])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requirements.filter((r) => {
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        (r.summary && r.summary.toLowerCase().includes(q))
      
      const matchCountry = selectedCountry === 'all' || r.country === selectedCountry

      return matchSearch && matchCountry
    })
  }, [requirements, search, selectedCountry])

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SeoHead
        title="Urgent Overseas Job & Work Visa Requirements for Indian Applicants"
        description="Current overseas job openings and work visa requirements handled by Siddhivinayak Overseas, Surat. Check eligibility, deadlines and how to apply."
        path="/urgent-requirements"
        jsonLd={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Urgent Requirements', path: '/urgent-requirements' },
        ])}
      />
      <SiteHeader />

      <main className="flex-1 pb-24 pt-28 md:pt-36">
        {/* Header Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
            <Flame className="h-4 w-4 text-red-500 fill-red-500" />
            Active Urgent Visa & Job Mandates
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground tracking-tight max-w-3xl mx-auto">
            Urgent Overseas Requirements & Fast-Track Openings
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Verified employer sponsorship, fast-track priority visas, and direct placement opportunities from Siddhivinayak Overseas Surat.
          </p>

          {/* Search & Country Filter Controls */}
          <div className="mt-8 max-w-4xl mx-auto space-y-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by job title, skill, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-full bg-card border-border/80 text-sm shadow-sm w-full"
              />
            </div>
            
            {/* Country Filter Pills */}
            {countries.length > 2 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {countries.map((c) => {
                  const countryCode = countriesWithCodes.get(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCountry(c)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        selectedCountry === c
                          ? 'bg-primary text-primary-foreground font-semibold shadow-md scale-105'
                          : 'bg-card hover:bg-muted/60 text-muted-foreground border border-border/60 hover:border-primary/30'
                      }`}
                    >
                      {c === 'all' ? (
                        <><span aria-hidden="true">🌐</span> All Countries</>
                      ) : (
                        <><FlagIcon country={c} code={countryCode} className="mr-1.5 inline-block align-[-0.1em]" /> {c}</>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Requirements Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-border/60 bg-card p-6 h-72 animate-pulse space-y-4">
                  <div className="h-5 w-24 bg-muted/60 rounded-full" />
                  <div className="h-6 w-3/4 bg-muted/80 rounded-lg" />
                  <div className="h-20 bg-muted/40 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border border-border/60 bg-card max-w-xl mx-auto space-y-4">
              <Flame className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-lg font-bold text-foreground">No matching requirements right now</h3>
              <p className="text-xs text-muted-foreground">
                Try searching for a different keyword or check back soon as our Surat team updates vacancies daily.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearch(''); setSelectedCountry('all') }}
                className="rounded-full text-xs"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((req, idx) => {
                const remainingDays = getRemainingDays(req.expires_at)
                const isClosed = isRequirementExpired(req)

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-md hover:shadow-xl hover:border-primary/50 transition-all"
                  >
                    {/* Urgency glow on hover */}
                    <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-500/5 group-hover:bg-amber-500/15 blur-2xl transition pointer-events-none" />

                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <FlagIcon country={req.country} code={req.country_code} className="text-lg rounded-xs border border-border/40" />
                          <span className="text-xs font-semibold text-foreground">{req.country}</span>
                        </div>

                        {remainingDays !== null && !isClosed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
                            <Clock className="h-3 w-3" />
                            {remainingDays > 0 ? `${remainingDays}d left` : 'Closing today!'}
                          </span>
                        )}
                      </div>

                      {/* Image Thumbnail if available */}
                      {req.image_url && (
                        <div className="relative rounded-xl overflow-hidden aspect-[16/9] mb-4 border border-border/50 bg-muted/30">
                          <img
                            src={req.image_url}
                            alt={req.title}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-background/90 backdrop-blur-md text-[10px] font-semibold text-primary">
                            {req.category}
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <Link to={`/urgent-requirements/${req.slug}`}>
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {req.title}
                        </h3>
                      </Link>

                      {/* Summary */}
                      {req.summary && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {req.summary}
                        </p>
                      )}

                      {/* Highlights */}
                      <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-primary" /> Openings
                          </span>
                          <span className="font-semibold text-foreground">{req.vacancies} Positions</span>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Salary
                          </span>
                          <span className="font-semibold text-emerald-400 truncate max-w-[170px]">{req.salary}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-5 pt-3 border-t border-border/60">
                      <Button
                        asChild
                        className="w-full rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all shadow-sm"
                      >
                        <Link to={`/urgent-requirements/${req.slug}`}>
                          View Details & Fast-Track Apply
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
