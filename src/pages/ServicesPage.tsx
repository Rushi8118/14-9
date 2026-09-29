import { SeoHead } from '@/components/seo/SeoHead'
import {
  breadcrumbSchema,
  organizationSchema,
  serviceSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  GraduationCap,
  Plane,
  FileCheck2,
  Languages,
  Building2,
  Coins,
  Headphones,
  RefreshCw,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Button } from '@/components/ui/button'

const SERVICES = [
  {
    icon: RefreshCw,
    title: 'Post-Study Work Visa',
    desc: 'Transition from student to professional. Graduate Route, Subclass 485, PGWP & more for international students already abroad.',
    href: '/post-study-work-visa',
  },
  {
    icon: Briefcase,
    title: 'Work Visa Filing',
    desc: 'End-to-end work visa filing for Japan, Australia, Canada, UK, Germany, NZ, Russia, USA — from skill assessment to embassy submission.',
    href: '/work-visa',
  },
  {
    icon: GraduationCap,
    title: 'Study Visa & Admissions',
    desc: 'University shortlisting, applications, scholarship guidance, and student visa filing across 6 countries.',
    href: '/study-visa',
  },
  {
    icon: Languages,
    title: 'Language Coaching',
    desc: 'IELTS, PTE, TOEFL for English-speaking countries; JLPT / JFT for Japan; A1 / B1 German for Blue Card.',
    href: '/contact',
  },
  {
    icon: FileCheck2,
    title: 'Documentation & SOPs',
    desc: 'Statement of Purpose, LORs, CVs, employer cover letters, and embassy forms drafted by experts.',
    href: '/contact',
  },
  {
    icon: Building2,
    title: 'Employer Connects',
    desc: 'Direct partnerships with vetted employers — interviews, contract review, CoS / LMIA support.',
    href: '/contact',
  },
  {
    icon: Coins,
    title: 'Forex & Education Loans',
    desc: 'Best-rate forex, education loans through partner banks, and proof-of-funds guidance.',
    href: '/contact',
  },
  {
    icon: Plane,
    title: 'Pre-Departure Briefing',
    desc: 'Flight, accommodation, SIM, banking, and on-arrival checklists so you land confident.',
    href: '/contact',
  },
  {
    icon: Headphones,
    title: 'Post-Landing Support',
    desc: 'Settlement help, registration, and follow-up — even after you reach your destination.',
    href: '/contact',
  },
]

export default function ServicesPage() {
  return (
    <>
      <SeoHead
        title="Overseas Education & Visa Services"
        description="Overseas education services in India for students and fresh graduates. Work visas, study visas, IELTS coaching and more for the USA, UK, Canada and Australia."
        path="/services"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          webpageSchema({
            title: 'Overseas Education & Visa Services',
            description: 'Overseas education services in India: work visas, study visas and IELTS coaching.',
            path: '/services',
          }),
          serviceSchema({
            name: 'Overseas Education & Visa Services',
            description: 'Overseas education services in India: work visas, study visas and IELTS coaching.',
            path: '/services',
            serviceType: 'Visa and overseas education consultancy',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
        ]}
      />
      <SiteHeader />
      <main className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="What we do"
          title="End-to-end services for your overseas journey"
          description="From the very first eligibility check to your first day abroad, our team handles every moving piece with calm precision."
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Services' }]}
        />

        <section className="pb-20 md:pb-28">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((s) => (
                <Link
                  key={s.title}
                  to={s.href}
                  className="lift-card group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/0 blur-3xl transition-all duration-500 group-hover:bg-primary/20"
                  />
                  <div className="card-icon flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold text-primary">
                    Learn more →
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center md:flex-row md:text-left">
              <div>
                <h3 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                  Not sure which service you need?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground md:text-base">
                  Book a free 30-minute consultation. We'll review your profile and
                  recommend the right path.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="btn-glow rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/contact">Book free consultation</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
