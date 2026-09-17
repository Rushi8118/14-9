import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, CheckCircle2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { WorkVisaSection } from '@/components/work-visa-section'
import { ProcessSection } from '@/components/process-section'
import { Button } from '@/components/ui/button'
import { SeoHead } from '@/components/seo/SeoHead'
import { FaqSection } from '@/components/seo/FaqSection'
import { CtaBand } from '@/components/seo/CtaBand'
import { WORK_COUNTRIES } from '@/content/work-countries'
import {
  breadcrumbSchema,
  faqSchema,
  localBusinessSchema,
  organizationSchema,
  serviceSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

const ELIGIBILITY = [
  'Age and occupation fit for the target country',
  'Relevant qualification or trade certificate',
  'Language test where required (IELTS / JLPT / German / others)',
  'Experience letters that match your claimed role',
  'Clear medical & character documents when requested',
]

const FAQS = [
  {
    question: 'Which countries do you cover for work visas?',
    answer:
      'We counsel work-permit pathways across Europe, Asia, Oceania and North America — including UK, Germany, France, Japan, Singapore, Canada, Australia, USA, Gulf and selected African destinations. Browse the full country list on this page.',
  },
  {
    question: 'Do you provide jobs?',
    answer:
      'We provide counselling, documentation and process guidance. Genuine employment depends on licensed employers/sponsors. We do not sell fake job guarantees.',
  },
  {
    question: 'Can I start from Surat?',
    answer:
      'Yes. Visit our Pragti IT Park office or consult online. We assess eligibility before recommending a country.',
  },
]

export default function WorkVisaPage() {
  return (
    <>
      <SeoHead
        title={`Work Visa Consultants in Surat | ${WORK_COUNTRIES.length}+ Countries`}
        description="Work permits for Indians in Europe, Japan, Canada, the Gulf and 40+ countries. Surat work visa consultants for overseas jobs, documents, cost and timelines."
        path="/work-visa"
        keywords="work visa consultants in Surat, work visa consultant near me, Europe work permit for Indian, Europe work visa for Indian cost, overseas jobs for Indians, abroad jobs for Indians, how can an Indian get a job abroad, Gulf work visa, Japan work visa for Indians, Germany work visa for Indian, Canada work permit from India, Poland work permit for Indian, Croatia work permit for Indian, Malta work permit for Indian"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          webpageSchema({
            title: 'Work Visa Consultants in Surat',
            description: 'Work permit counselling for 38+ countries from Surat.',
            path: '/work-visa',
          }),
          serviceSchema({
            name: 'Work Visa Consultancy',
            description: 'Work permit and employment visa counselling from Surat.',
            path: '/work-visa',
            serviceType: 'Work visa consultancy',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Work Visa', path: '/work-visa' },
          ]),
          faqSchema(FAQS),
        ]}
      />
      <SiteHeader />
      <main id="main-content" className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="Work Permit Visas · Surat"
          title="Work Visa Consultants in Surat — 38+ Countries"
          description="From Europe and Asia to Oceania, North America, Gulf and Africa — we map your profile to a realistic work-permit pathway and guide documentation step by step."
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Work Visa' }]}
        />

        <WorkVisaSection />

        <section className="py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 md:grid-cols-12 md:px-6">
            <div className="md:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Briefcase className="h-3.5 w-3.5" />
                Eligibility checklist
              </span>
              <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-balance text-foreground md:text-4xl">
                Are you eligible to work abroad?
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
                Requirements vary by country, but most work-permit routes share these baseline checks.
              </p>
              <ul className="mt-6 space-y-3">
                {ELIGIBILITY.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-sm text-foreground/90"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-6 rounded-3xl border border-border/60 bg-card/60 p-6 md:p-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground">Popular starting points</h2>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ['Japan', '/work-visa/japan'],
                  ['Germany', '/work-visa/germany'],
                  ['United Kingdom', '/work-visa/uk'],
                  ['Canada', '/work-visa/canada'],
                  ['Australia', '/work-visa/australia'],
                  ['Singapore', '/work-visa/singapore'],
                  ['Gulf Region', '/work-visa/gulf'],
                  ['USA', '/work-visa/usa'],
                ].map(([label, to]) => (
                  <Link
                    key={to}
                    to={to}
                    className="rounded-xl border border-border/50 px-4 py-3 text-sm font-medium hover:border-primary/40 hover:bg-primary/5"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <Button asChild className="mt-6 rounded-full">
                <Link to="/contact">
                  Book free work-visa counselling
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <ProcessSection />
        <FaqSection faqs={FAQS} />
        <CtaBand title="Not sure which country fits you?" />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  )
}
