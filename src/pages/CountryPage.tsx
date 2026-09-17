import { ImmigrationDisclaimer } from '@/components/seo/ImmigrationDisclaimer'
import { Link, useParams } from 'react-router-dom'
import { SeoHead } from '@/components/seo/SeoHead'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Globe2,
  ArrowRight,
  Clock,
  DollarSign,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Sun,
  Languages,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FlagIcon } from '@/components/flag-icon'
import { useAdminCountries } from '@/hooks/useAdminCountries'

export default function CountryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { countries: adminCountries } = useAdminCountries()
  
  const [dbCountry, setDbCountry] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [faqs, setFaqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCountryData() {
      if (!slug) return

      try {
        const { data: countryData } = await supabase
          .from('countries')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (countryData) {
          setDbCountry(countryData)

          const { data: programsData } = await supabase
            .from('public_visa_programs')
            .select('*')
            .eq('country_id', countryData.id)
            .order('sort_order', { ascending: true })

          setPrograms(programsData || [])

          const { data: faqsData } = await supabase
            .from('country_faqs')
            .select('*')
            .eq('country_id', countryData.id)
            .order('sort_order', { ascending: true })

          setFaqs(faqsData || [])
        }
      } catch (err: unknown) {
        console.warn('[CountryPage] Supabase fetch notice:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCountryData()
  }, [slug])

  // Merge live admin profile from hook / localStorage with db data
  const adminMatch = useMemo(() => {
    if (!slug) return null
    return adminCountries.find(c => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase())
  }, [adminCountries, slug])

  const country = useMemo(() => {
    if (adminMatch) {
      return {
        id: dbCountry?.id || adminMatch.id,
        name: adminMatch.name,
        slug: adminMatch.slug,
        capital: adminMatch.capital || dbCountry?.capital,
        region: adminMatch.region || dbCountry?.region,
        language: adminMatch.language || dbCountry?.language,
        description: adminMatch.description || dbCountry?.description,
        why_work: adminMatch.why_work || dbCountry?.why_work,
        why_study: adminMatch.why_study || dbCountry?.why_study,
        lifestyle: adminMatch.lifestyle || dbCountry?.lifestyle,
        work_eligibility_criteria: adminMatch.work_eligibility_criteria?.length
          ? adminMatch.work_eligibility_criteria
          : adminMatch.eligibility_criteria,
        study_eligibility_criteria: adminMatch.study_eligibility_criteria?.length
          ? adminMatch.study_eligibility_criteria
          : adminMatch.eligibility_criteria,
        eligibility_criteria: adminMatch.eligibility_criteria,
        visa_stats: {
          success_rate: adminMatch.success_rate,
          avg_processing_days: adminMatch.avg_processing_days,
        },
        cost_of_living: {
          monthly_single: adminMatch.monthly_living_cost,
        },
        meta_title: adminMatch.meta_title || `${adminMatch.name} Work & Study Visa | Siddhivinayak Overseas`,
        meta_desc: adminMatch.meta_desc || `Work and study visa eligibility criteria, living costs and application guidance for ${adminMatch.name}.`,
      }
    }
    return dbCountry
  }, [adminMatch, dbCountry])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <Globe2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-foreground">Country Profile Not Found</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            The requested destination is being updated. Explore all available destinations below.
          </p>
          <Button asChild className="mt-4">
            <Link to="/countries">Browse All Countries</Link>
          </Button>
        </div>
      </div>
    )
  }

  const visaStats = country.visa_stats || {}
  const costOfLiving = country.cost_of_living || {}

  const workRules: string[] = country.work_eligibility_criteria || country.eligibility_criteria || []
  const studyRules: string[] = country.study_eligibility_criteria || country.eligibility_criteria || []

  return (
    <>
      <SeoHead
        title={country.meta_title || `${country.name} Visa Guide: Work & Study Options`}
        description={
          country.meta_desc ||
          `Work and study visa options for ${country.name} from India, with guidance from Siddhivinayak Overseas in Surat.`
        }
        path={`/countries/${slug}`}
        // Profiles without a real description are thin; keep them out of the index
        // (same 150-character rule as scripts/seo-routes.mjs uses for the sitemap).
        noindex={(country.description?.trim().length ?? 0) < 150}
        jsonLd={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Destinations', path: '/countries' },
          { name: country.name, path: `/countries/${slug}` },
        ])}
      />
      <SiteHeader />
      <main className="min-h-screen bg-background premium-page">
        {/* Header Hero */}
        <section className="border-b border-border/40 px-4 pt-28 pb-8 md:px-6 md:pt-36 md:pb-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/countries" className="hover:text-primary">Countries</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{country.name}</span>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <FlagIcon country={country.name} className="text-5xl" />
                  <div>
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                      {country.name}
                    </h1>
                    <p className="text-muted-foreground">{country.capital} · {country.region}</p>
                  </div>
                </div>
                <p className="max-w-2xl text-muted-foreground md:text-lg">
                  {country.description}
                </p>
              </div>
              <Button asChild className="btn-glow rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                <Link to={`/contact?country=${country.slug}`}>
                  Apply for {country.name} Visa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats Banner */}
        <section className="border-b border-border/40 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {visaStats.avg_processing_days && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <Clock className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{visaStats.avg_processing_days}d</p>
                  <p className="text-xs text-muted-foreground">Avg. Processing</p>
                </div>
              )}
              {costOfLiving.monthly_single && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <DollarSign className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-foreground">₹{(costOfLiving.monthly_single / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-muted-foreground">Monthly Living Cost</p>
                </div>
              )}
              {country.language && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <Languages className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{country.language.split(",")[0]}</p>
                  <p className="text-xs text-muted-foreground">Primary Language</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {country.why_work && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
                  <Briefcase className="mb-4 h-8 w-8 text-amber-500" />
                  <h3 className="mb-3 font-serif text-xl font-semibold text-foreground">Why Work in {country.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{country.why_work}</p>
                </div>
              )}
              {country.why_study && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6">
                  <GraduationCap className="mb-4 h-8 w-8 text-blue-500" />
                  <h3 className="mb-3 font-serif text-xl font-semibold text-foreground">Why Study in {country.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{country.why_study}</p>
                </div>
              )}
              {country.lifestyle && (
                <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
                  <Sun className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-3 font-serif text-xl font-semibold text-foreground">Lifestyle & Living</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{country.lifestyle}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEPARATED WORK & STUDY VISA ELIGIBILITY SECTION */}
        <section className="border-t border-border/40 px-4 py-12 md:px-6 md:py-16 bg-muted/20">
          <div className="mx-auto max-w-7xl space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl flex items-center justify-center gap-2">
                <ShieldCheck className="h-7 w-7 text-primary" />
                Visa Eligibility Criteria for {country.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Specific eligibility requirements separated for Work Visa & Study Visa applicants from India.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* WORK VISA ELIGIBILITY BOX */}
              <div className="rounded-2xl border border-amber-500/30 bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                  <Briefcase className="h-6 w-6 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-lg text-foreground">💼 Work Visa Eligibility</h3>
                    <p className="text-xs text-muted-foreground">Employment, trade certification & work permit rules</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {workRules.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No specific work criteria listed.</p>
                  ) : (
                    workRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-xs leading-relaxed text-foreground">{rule}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* STUDY VISA ELIGIBILITY BOX */}
              <div className="rounded-2xl border border-blue-500/30 bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                  <div>
                    <h3 className="font-bold text-lg text-foreground">🎓 Study Visa Eligibility</h3>
                    <p className="text-xs text-muted-foreground">University admission, IELTS/PTE & financial proof rules</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {studyRules.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No specific study criteria listed.</p>
                  ) : (
                    studyRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-xs leading-relaxed text-foreground">{rule}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Programs */}
        {programs.length > 0 && (
          <section className="border-t border-border/40 px-4 py-12 md:px-6 md:py-20">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-8 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                Available Visa Programs
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {programs.map((program) => (
                  <div key={program.id} className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-foreground">{program.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{program.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        <ImmigrationDisclaimer country={country.name} />
      </main>
      <SiteFooter />
    </>
  )
}
