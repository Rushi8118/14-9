import { ImmigrationDisclaimer } from '@/components/seo/ImmigrationDisclaimer'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Globe2,
  ArrowLeft,
  ArrowRight,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Bookmark,
  FileText,
  ListChecks,
  GraduationCap,
  Building2,
  ChevronRight,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FlagIcon } from '@/components/flag-icon'

export default function ProgramPage() {
  const { slug, programSlug } = useParams<{ slug: string; programSlug: string }>()
  const [program, setProgram] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProgramData() {
      if (!slug || !programSlug) {
        setLoading(false)
        return
      }

      try {
        // maybeSingle: an unknown program slug is a normal "not found", not an error
        // (single() makes PostgREST answer 406 and surfaced its raw message to visitors).
        const { data: programData, error: err } = await supabase
          .from('public_visa_programs')
          .select('*')
          .eq('country_slug', slug)
          .eq('slug', programSlug)
          .maybeSingle()

        if (err) {
          console.warn('[ProgramPage] fetch error:', err.message)
          setError('We could not load this program right now. Please try again in a moment.')
          return
        }

        if (programData) {
          setProgram(programData)
        }
      } catch (err: unknown) {
        console.error('[ProgramPage] Unexpected error:', err)
        setError('Failed to load program data.')
      } finally {
        setLoading(false)
      }
    }

    fetchProgramData()
  }, [slug, programSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Globe2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-foreground">Unable to load program</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>
          <Button asChild className="mt-4">
            <Link to="/countries">Back to Countries</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Program not found</h1>
          <Button asChild className="mt-4">
            <Link to="/countries">Back to Countries</Link>
          </Button>
        </div>
      </div>
    )
  }

  const eligibility = Array.isArray(program.eligibility) ? program.eligibility : []
  const requirements = Array.isArray(program.requirements) ? program.requirements : []
  const documents = Array.isArray(program.documents_needed) ? program.documents_needed : []
  const sectors = Array.isArray(program.popular_sectors) ? program.popular_sectors : []
  const universities = Array.isArray(program.universities) ? program.universities : []

  return (
    <>
      <Helmet>
        <title>{program.meta_title || `${program.name} | ${program.country_name} | Siddhivinayak Overseas`}</title>
        <meta
          name="description"
          content={program.meta_desc || `Details, eligibility, and requirements for ${program.name} in ${program.country_name}.`}
        />
        <link rel="canonical" href={`https://siddhivinayakoverseas.com/countries/${slug}/programs/${programSlug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://siddhivinayakoverseas.com/countries/${slug}/programs/${programSlug}`} />
        <meta property="og:title" content={program.meta_title || `${program.name} | ${program.country_name} | Siddhivinayak Overseas`} />
        <meta property="og:description" content={program.meta_desc || `${program.name} visa program in ${program.country_name}.`} />
        <meta property="og:image" content="https://siddhivinayakoverseas.com/consultant-office.jpg" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={program.meta_title || `${program.name} | ${program.country_name} | Siddhivinayak Overseas`} />
        <meta name="twitter:description" content={program.meta_desc || `${program.name} visa program in ${program.country_name}.`} />
        <meta name="twitter:image" content="https://siddhivinayakoverseas.com/consultant-office.jpg" />
      </Helmet>
      <SiteHeader />
      <main className="min-h-screen bg-background premium-page">
        <section className="border-b border-border/40 px-4 pt-28 pb-8 md:px-6 md:pt-36 md:pb-12">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/countries" className="hover:text-primary">Countries</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to={`/countries/${slug}`} className="hover:text-primary">{program.country_name}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{program.name}</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <FlagIcon country={program.country_name} className="text-3xl" />
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {program.program_type.replace("_", " ").toUpperCase()} VISA
              </span>
            </div>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {program.name}
            </h1>
            <p className="mt-3 text-muted-foreground md:text-lg">{program.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="btn-glow rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to={`/contact?country=${slug}&program=${programSlug}`}>
                  Start Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to={`/countries/${slug}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to {program.country_name}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {program.processing_time && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <Clock className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">{program.processing_time}</p>
                  <p className="text-xs text-muted-foreground">Processing Time</p>
                </div>
              )}
              {program.visa_duration && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <Bookmark className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">{program.visa_duration}</p>
                  <p className="text-xs text-muted-foreground">Visa Duration</p>
                </div>
              )}
              {program.cost_inr && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <DollarSign className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">₹{program.cost_inr.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Starting From</p>
                </div>
              )}
              {program.success_rate && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <Star className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">{program.success_rate}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-12">
              {eligibility.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl font-semibold">Eligibility</h2>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                    <ul className="space-y-3">
                      {eligibility.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {requirements.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl font-semibold">Requirements</h2>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                    <ul className="space-y-3">
                      {requirements.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {documents.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl font-semibold">Documents Needed</h2>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                    <ul className="space-y-3">
                      {documents.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {sectors.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl font-semibold">Popular Sectors</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sectors.map((sector: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {universities.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl font-semibold">Top Universities</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {universities.map((uni: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 p-3 text-sm text-foreground"
                      >
                        <GraduationCap className="h-4 w-4 text-primary" />
                        {uni}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/50 p-5">
                <h3 className="mb-4 font-serif text-lg font-semibold">Program Highlights</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">PR Pathway</span>
                    {program.pathway_to_pr ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spousal Rights</span>
                    {program.spousal_rights ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Work While Study</span>
                    {program.work_while_study ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  {program.post_study_work && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Post-Study Work</span>
                      <span className="font-medium text-foreground">{program.post_study_work}</span>
                    </div>
                  )}
                  {program.cost_local && program.cost_currency && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Local Fee</span>
                      <span className="font-medium text-foreground">
                        {program.cost_currency} {program.cost_local.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <Button asChild className="mt-6 w-full btn-glow rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to={`/contact?country=${slug}&program=${programSlug}`}>
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <ImmigrationDisclaimer />
      </main>
      <SiteFooter />
    </>
  )
}
