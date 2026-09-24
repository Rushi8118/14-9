import { SeoHead } from '@/components/seo/SeoHead'
import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Globe2, ArrowRight, TrendingUp, Search, Filter, ShieldCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FlagIcon } from '@/components/flag-icon'
import { useAdminCountries } from '@/hooks/useAdminCountries'
import { WORK_COUNTRY_BY_SLUG } from '@/content/work-countries'

/** Work slugs that also have a /study-in-{slug} page. */
const STUDY_PAGES = new Set([
  'uk', 'france', 'germany', 'spain', 'dubai', 'singapore',
  'canada', 'australia', 'usa', 'ireland', 'new-zealand',
])
const WORK_SLUG_ALIAS: Record<string, string> = {
  'united-kingdom': 'uk',
  'united-states': 'usa',
  'united-arab-emirates': 'gulf',
  dubai: 'gulf',
}
const STUDY_SLUG_ALIAS: Record<string, string> = {
  'united-kingdom': 'uk',
  'united-states': 'usa',
  'united-arab-emirates': 'dubai',
}

/**
 * Where a country card should send the reader.
 *
 * This hub used to link to `/country/{slug}` — singular, a route that has never
 * existed — so every card 404'd. The `/countries/{slug}` pages it was meant to
 * reach have since been retired (they duplicated these destinations and shipped
 * unpopulated Supabase empty states), so cards now point at the real pages.
 */
function destinationsFor(slug: string) {
  const workSlug = WORK_SLUG_ALIAS[slug] ?? slug
  const studySlug = STUDY_SLUG_ALIAS[slug] ?? slug
  return {
    work: WORK_COUNTRY_BY_SLUG[workSlug] ? `/work-visa/${workSlug}` : null,
    study: STUDY_PAGES.has(studySlug) ? `/study-in-${studySlug}` : null,
  }
}

export default function CountriesPage() {
  const { countries: adminCountries, isLoading } = useAdminCountries()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')

  // Filter only active countries published by admin
  const activeCountries = useMemo(() => {
    return adminCountries.filter(c => c.is_active)
  }, [adminCountries])

  // Extract unique regions
  const regions = useMemo(() => {
    const allRegions = activeCountries.map((c) => c.region).filter(Boolean)
    return ['all', ...new Set(allRegions)]
  }, [activeCountries])

  // Filter countries based on search and region
  const filteredCountries = useMemo(() => {
    return activeCountries.filter((country) => {
      const matchesSearch =
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (country.capital && country.capital.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (country.code && country.code.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesRegion =
        filterRegion === 'all' || country.region.toLowerCase() === filterRegion.toLowerCase()
      return matchesSearch && matchesRegion
    })
  }, [activeCountries, searchQuery, filterRegion])

  return (
    <>
      <SeoHead
        title="Global Visa Destinations | Work & Study Visas"
        description="Explore study and work visa pathways for 40+ countries including Germany, UK, Japan, Croatia, Canada, USA and GCC destinations, with free counselling in Surat."
        path="/countries"
      />
      <SiteHeader />
      <main className="min-h-screen bg-background premium-page">
        {/* Hero Section */}
        <section className="border-b border-border/40 px-4 pt-28 pb-12 md:px-6 md:pt-36 md:pb-16">
          <div className="mx-auto max-w-7xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-4">
              <Globe2 className="h-4 w-4" />
              Global Opportunities Hub
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Work & Study Destinations
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
              Explore verified eligibility requirements, visa processing times, and career pathways for 40+ worldwide destinations.
            </p>

            {/* Search and Filters Bar */}
            <div className="mt-8 mx-auto max-w-3xl flex flex-col gap-3 sm:flex-row sm:items-center bg-card p-3 rounded-2xl border border-border/60 shadow-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search destination, capital, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 bg-transparent focus-visible:ring-0"
                />
              </div>

              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0">
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((reg) => (
                      <SelectItem key={reg} value={reg} className="capitalize">
                        {reg === 'all' ? 'All Regions' : reg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Countries Cards Grid */}
        <section className="px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-7xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/60 p-8 max-w-md mx-auto">
                <Globe2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">No destinations matched</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search terms or filter selection.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchQuery(''); setFilterRegion('all') }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCountries.map((country) => (
                  <div
                    key={country.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FlagIcon country={country.name} code={country.code} className="text-3xl rounded-xs shadow-xs border border-border/40 shrink-0" />
                          <div>
                            <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {country.name}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              {country.capital ? `${country.capital} · ` : ''}{country.region}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase text-secondary-foreground">
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                        {country.description || 'Explore career & education pathways for this destination.'}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-3 mb-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{country.success_rate}% Success</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>{country.avg_processing_days} Days Avg.</span>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const { work, study } = destinationsFor(country.slug)
                      if (!work && !study) return null
                      return (
                        <div className="flex flex-col gap-2">
                          {work ? (
                            <Button asChild variant="outline" className="w-full justify-between rounded-xl group-hover:bg-primary group-hover:text-primary-foreground">
                              <Link to={work}>
                                <span>{country.name} work visa</span>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          ) : null}
                          {study ? (
                            <Button asChild variant="ghost" className="w-full justify-between rounded-xl">
                              <Link to={study}>
                                <span>Study in {country.name}</span>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
