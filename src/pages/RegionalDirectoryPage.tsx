import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Search, Globe2, Briefcase, GraduationCap,
  CheckCircle2, ArrowRight, Filter,
  Building2, FileText, PhoneCall, ShieldCheck, Sparkles, MessageCircle
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { SeoHead } from '@/components/seo/SeoHead'
import { CtaBand } from '@/components/seo/CtaBand'
import { ImmigrationDisclaimer } from '@/components/seo/ImmigrationDisclaimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ALL_REGIONAL_LOCATIONS,
  TOP_WORKING_DESTINATIONS,
  filterRegionalLocations,
  type RegionalLocation,
} from '@/content/regional-coverage'
import { NAP, officeChatWhatsAppUrl } from '@/lib/seo/site'
import {
  organizationSchema,
  websiteSchema,
  localBusinessSchema,
  breadcrumbSchema,
  faqSchema,
  webpageSchema,
} from '@/lib/seo/schema'

const PAGE_TITLE = 'Visa Consultants for All 28 States of India & South Asia'
const PAGE_DESC = 'Regional visa directory covering all 28 Indian states and 8 union territories, plus Bangladesh, Pakistan, Nepal and Sri Lanka.'
const PAGE_PATH = '/regional-coverage'

const REGIONAL_FAQS = [
  {
    question: 'Does Siddhivinayak Overseas provide visa counselling for all 28 states and 8 union territories of India?',
    answer: 'Yes. While our physical head office is in Surat (Pragti IT Park, Gujarat), our specialized visa case officers provide remote digital counselling, document verification, and embassy filing support to applicants across all 28 states, 8 union territories, and neighboring South Asian countries (Bangladesh, Pakistan, Nepal, Sri Lanka).',
  },
  {
    question: 'How do you help students already abroad who need to switch from a student visa to a work visa with a fixed job and salary?',
    answer: 'We connect international students nearing degree completion in the UK, Canada, Australia, Germany, or the USA with vetted, licensed sponsor employers who have active, verified job openings. The employer issues a legally binding employment contract featuring a fixed salary meeting government statutory thresholds (e.g. UK Skilled Worker minimum wage, Australia TSMIT, Germany Blue Card) and full company benefits. We then handle the entire visa switch application.',
  },
  {
    question: 'Can you assist students currently abroad on a study visa who want to switch or move to another country?',
    answer: 'Yes. Many international students in the UK, Canada, Australia, or Europe find better permanent residency opportunities or higher salary packages in a different destination. We coordinate international credential evaluations, introduce you to sponsor employers in the target country with fixed salaries and company benefits, and manage cross-border visa filing from your current country of residence.',
  },
  {
    question: 'What state-level educational and police clearance documents are required from India?',
    answer: 'Requirements depend on your origin state: university transcript verification (e.g., Gujarat University, GTU, Panjab University, Mumbai University, Anna University), State Home Department / HRD attestation, Regional Passport Office (RPO) Police Clearance Certificate (PCC), and MEA Apostille before VFS / Embassy submission.',
  },
  {
    question: 'How do applicants from Bangladesh, Pakistan, Nepal, and Sri Lanka apply?',
    answer: 'We assist applicants and international students from Bangladesh (BMET registration & MOFA attestation), Pakistan (HEC & Bureau of Emigration protector clearance), Nepal (DoFE Labour Permit & MOFA attestation), and Sri Lanka (SLBFE foreign employment registration) with verified employer pathways and complete visa documentation.',
  },
]

export default function RegionalDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState<'all' | 'India' | 'Bangladesh' | 'Pakistan' | 'Nepal' | 'Sri Lanka'>('all')
  const [selectedDestination, setSelectedDestination] = useState<string>('all')

  const filteredLocations = useMemo(() => {
    let results = filterRegionalLocations(searchQuery, countryFilter)
    if (selectedDestination !== 'all') {
      results = results.filter((loc) =>
        loc.popularDestinations.some((d) => d.toLowerCase().includes(selectedDestination.toLowerCase()))
      )
    }
    return results
  }, [searchQuery, countryFilter, selectedDestination])

  return (
    <>
      <SeoHead
        title={PAGE_TITLE}
        description={PAGE_DESC}
        path={PAGE_PATH}
        keywords="visa consultants in india all states, study visa consultancy all cities, work visa consultant punjab gujarat maharashtra delhi, bangladesh to uk work visa, pakistan to uk work visa, nepal to australia work visa, sri lanka to canada work visa, student visa to work visa with fixed job and salary, switch countries on study visa"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          webpageSchema({ title: PAGE_TITLE, description: PAGE_DESC, path: PAGE_PATH }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Regional Directory & All States', path: PAGE_PATH },
          ]),
          faqSchema(REGIONAL_FAQS),
        ]}
      />

      <SiteHeader />

      <main id="main-content" className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="Pan-India & South Asia Regional Directory"
          title="Targeting All 28 States, UTs & South Asia with Working Destinations"
          description="Connecting students, graduates, and professionals across all 28 states & 8 UTs of India — plus Bangladesh, Pakistan, Nepal, and Sri Lanka — to legal study and work visa pathways in the UK, Canada, Australia, Germany, USA, New Zealand, and Europe."
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Regional Coverage & Keyword Explorer' },
          ]}
        />

        {/* Strategic Value Proposition Bar */}
        <section className="border-y border-border/50 bg-primary/5 py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">All 28 States & 8 UTs</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Pan-India coverage with state-level document attestation guidance.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">South Asia Corridors</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Bangladesh, Pakistan, Nepal & Sri Lanka emigration clearance support.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Study to Work Transition</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Fixed job offers, compliant salary contracts & full company benefits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Switch Countries Abroad</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Move from UK, Canada, Australia or Europe with secured employer sponsorship.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Filter & Keyword Explorer Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-md md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Search className="h-3 w-3" />
                    Interactive Search & SEO Route Explorer
                  </span>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                    Find Your State, City & Target Country Pathway
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select your origin region, search by state or city, and explore matching working destinations and high-intent keywords.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={countryFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCountryFilter('all')}
                    className="rounded-full text-xs"
                  >
                    All Regions ({ALL_REGIONAL_LOCATIONS.length})
                  </Button>
                  <Button
                    variant={countryFilter === 'India' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCountryFilter('India')}
                    className="rounded-full text-xs"
                  >
                    🇮🇳 India (28 States & UTs)
                  </Button>
                  <Button
                    variant={countryFilter === 'Bangladesh' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCountryFilter('Bangladesh')}
                    className="rounded-full text-xs"
                  >
                    🇧🇩 Bangladesh
                  </Button>
                  <Button
                    variant={countryFilter === 'Pakistan' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCountryFilter('Pakistan')}
                    className="rounded-full text-xs"
                  >
                    🇵🇰 Pakistan
                  </Button>
                  <Button
                    variant={countryFilter === 'Nepal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCountryFilter('Nepal')}
                    className="rounded-full text-xs"
                  >
                    🇳🇵 Nepal
                  </Button>
                  <Button
                    variant={countryFilter === 'Sri Lanka' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCountryFilter('Sri Lanka')}
                    className="rounded-full text-xs"
                  >
                    🇱🇰 Sri Lanka
                  </Button>
                </div>
              </div>

              {/* Search Bar & Destination Select */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-12">
                <div className="relative sm:col-span-8">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by state, city (Surat, Mumbai, Ludhiana, Dhaka, Lahore, Kathmandu) or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-background/80"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Working Countries</option>
                    {TOP_WORKING_DESTINATIONS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.flag} {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Results Grid */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing <strong>{filteredLocations.length}</strong> matching regional zones & state jurisdictions
                </p>
                <Link
                  to="/pathways/student-visa-to-work-visa-with-job-and-salary"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  International Student? View Fixed Job & Salary Work Visa Transition <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredLocations.map((loc) => (
                  <div
                    key={loc.name}
                    className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {loc.country} · {loc.type === 'ut' ? 'Union Territory' : loc.type === 'state' ? 'State' : 'Country'}
                          </span>
                          <h3 className="mt-1 font-serif text-xl font-bold text-foreground">
                            {loc.name}
                          </h3>
                        </div>
                        {loc.capital && (
                          <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Cap: {loc.capital}
                          </span>
                        )}
                      </div>

                      {/* Major Cities */}
                      <div className="mt-4">
                        <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          Key Targeted Cities:
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {loc.majorCities.join(' • ')}
                        </p>
                      </div>

                      {/* Working Destinations */}
                      <div className="mt-3">
                        <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                          <Globe2 className="h-3.5 w-3.5 text-primary" />
                          Top Working Destinations:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {loc.popularDestinations.map((dest) => (
                            <span
                              key={dest}
                              className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-foreground/80"
                            >
                              {dest}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Regional Hub & Documentation */}
                      <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-3 text-xs">
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          Regional Processing & Documents:
                        </p>
                        <p className="mt-1 text-muted-foreground leading-relaxed text-[11px]">
                          {loc.localDocumentNotes}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          <strong>VAC / Hub:</strong> {loc.regionalHub}
                        </p>
                      </div>

                    </div>

                    {/* Card Actions */}
                    <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2">
                      <Button asChild size="sm" className="w-full text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                        <a
                          href={officeChatWhatsAppUrl(
                            `Hello Siddhivinayak Overseas! I am inquiring from ${loc.name} (${loc.country}) regarding visa consultation for working abroad.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Consult for {loc.name}
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-xl text-xs px-3">
                        <Link to="/contact">
                          Book
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* High-Intent Persona Banners: Study-to-Work and Country-Switching */}
        <section className="border-t border-border/50 bg-muted/20 py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Card 1: Study to Work with Fixed Job & Salary */}
              <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card/80 p-8 shadow-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Primary Strategic Service
                </span>
                <h3 className="mt-4 font-serif text-2xl font-bold text-foreground">
                  Study Finishing Soon? Transition to a Work Visa with Fixed Job & Salary
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  For students from India (all 28 states & UTs), Nepal, Bangladesh, Sri Lanka, and Pakistan currently studying in the UK, Canada, Australia, Germany, or the USA who want to continue living abroad. We coordinate with registered sponsor employers who provide fixed job offers, compliant salary contracts, and employee company benefits.
                </p>
                <ul className="mt-5 space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Verified sponsor employers on official government registers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Fixed salary contract meeting statutory minimum thresholds
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Full company benefits: healthcare, paid annual leave & superannuation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    End-to-end visa transition before your student visa lapses
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                    <Link to="/pathways/student-visa-to-work-visa-with-job-and-salary">
                      Read Full Transition Guide <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full text-xs">
                    <Link to="/contact">Check My Profile Eligibility</Link>
                  </Button>
                </div>
              </div>

              {/* Card 2: Move to Another Country */}
              <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-8 shadow-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Globe2 className="h-3.5 w-3.5" />
                  Cross-Border Relocation
                </span>
                <h3 className="mt-4 font-serif text-2xl font-bold text-foreground">
                  Want to Switch Countries on a Study Visa? Relocate with Job & Benefits
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Already abroad in the UK, Canada, Australia, Europe or Cyprus, but facing restrictive PR points or rule changes? Transfer your qualifications to another high-growth economy through employer sponsorship, with the salary set out in writing before you commit and relocation support where the employer offers it.
                </p>
                <ul className="mt-5 space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    High-demand corridors: UK → Australia, Canada → Australia, Europe → UK
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Credential evaluation and overseas work experience recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Direct employer sponsorship in target country with fixed salary terms
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Lodge visa without returning home if holding valid residency
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                    <Link to="/pathways/switch-countries-with-job-and-salary">
                      Read Relocation Guide <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full text-xs">
                    <Link to="/pathways">View All Pathways</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                Frequently Asked Questions
              </span>
              <h2 className="mt-4 font-serif text-2xl font-bold text-foreground md:text-3xl">
                Regional Coverage & Visa Transition FAQs
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Common questions from applicants across India, South Asia, and international students currently abroad.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {REGIONAL_FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm"
                >
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ImmigrationDisclaimer jobs />
        <CtaBand />
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </>
  )
}
