import { Link } from 'react-router-dom'
import { Award, Globe2, HeartHandshake, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Button } from '@/components/ui/button'
import { SeoHead } from '@/components/seo/SeoHead'
import {
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Integrity first',
    desc: "Honest assessments — even if it means saying you aren't ready yet.",
  },
  {
    icon: HeartHandshake,
    title: 'Client-led',
    desc: 'Your goals shape our recommendations, not our commissions.',
  },
  {
    icon: Sparkles,
    title: 'Excellence',
    desc: 'Documents reviewed three times. Files filed only when perfect.',
  },
  {
    icon: Globe2,
    title: 'Global mindset',
    desc: 'Local expertise in every embassy we work with — across 8 countries.',
  },
]

const STATS = [
  { value: '500+', label: 'Work visa clients' },
  { value: 'Surat', label: 'Home office' },
  { value: '6', label: 'Study visa countries' },
  { value: '6+', label: 'Years of expertise' },
]

export default function AboutPage() {
  return (
    <>
      <SeoHead
        title="About Siddhivinayak Overseas | Visa Consultants in Surat"
        description="Siddhivinayak Overseas: study and work visa consultants in Surat, Gujarat, with 6+ years of guidance for Canada, the UK, Australia and more."
        path="/about"
        keywords="about Siddhivinayak Overseas, visa consultants Surat, immigration consultants Surat"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          webpageSchema({
            title: 'About Siddhivinayak Overseas',
            description: 'Visa and overseas education consultants based in Surat, Gujarat.',
            path: '/about',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ]}
      />
      <SiteHeader />
      <main id="main-content" className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="About Siddhivinayak Overseas · Surat"
          title="Visa & Overseas Education Consultants in Surat"
          description="We help students and skilled professionals with honest counselling, documentation support and clear pathways to study or work abroad."
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "About" }]}
        />

        {/* Story */}
        <section className="py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 md:grid-cols-12 md:gap-14 md:px-6">
            <div className="md:col-span-7">
              <h2 className="font-serif text-3xl font-semibold leading-tight text-balance text-foreground md:text-4xl">
                Our story
              </h2>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
                <p>
                  Siddhivinayak Overseas began with a simple belief: every aspiring student
                  and skilled worker deserves a clear, honest path to their dream destination.
                  With 6+ years of dedicated guidance, we have helped thousands of families turn that dream
                  into a passport stamp.
                </p>
                <p>
                  Our work-visa specialists handle Japan SSW, Australian skilled migration,
                  Canadian Express Entry & LMIA, UK Skilled Worker, Germany EU Blue Card, New
                  Zealand AEWV, Russia HQS, and US H-1B / EB-3 routes — each with documented
                  process workbooks and dedicated case officers.
                </p>
                <p>
                  Our study counsellors place students at top-ranked universities across the
                  UK, Germany, France, Canada, Australia, NZ, USA and Ireland, with thoughtful
                  scholarship support and pre-departure care.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="btn-glow rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link to="/contact">Talk to a counsellor</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-border/70 bg-transparent hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                >
                  <Link to="/services">Our services</Link>
                </Button>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="lift-card rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm"
                  >
                    <p className="font-serif text-3xl font-semibold text-foreground md:text-4xl">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-5">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground/90">
                  Backed by an in-house team of immigration consultants, language coaches, and
                  documentation experts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Award className="h-3.5 w-3.5" />
                Our values
              </span>
              <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-balance text-foreground md:text-4xl">
                What guides every case we handle
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="lift-card rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm"
                >
                  <div className="card-icon flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                    <v.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  )
}
