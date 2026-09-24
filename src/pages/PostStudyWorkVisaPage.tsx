import { ImmigrationDisclaimer } from '@/components/seo/ImmigrationDisclaimer'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Globe2, CheckCircle2, Award, Clock, BookOpen, Briefcase, Users, TrendingUp } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Button } from '@/components/ui/button'
import { FlagIcon } from '@/components/flag-icon'

const SITE_URL = 'https://siddhivinayakoverseas.com'

// The per-country /post-study-work-visa/* URLs are retired (301 in .htaccess,
// 404 in the SPA), so link straight to the pages that cover each route.
const COUNTRIES = [
  { flag: '🇬🇧', name: 'United Kingdom', visa: 'Graduate Route', duration: '2 years (3 for PhD)', eligibility: 'Any UK degree', pr: 'Yes (Skilled Worker)', href: '/pathways/uk-graduate-visa-to-skilled-worker-visa' },
  { flag: '🇦🇺', name: 'Australia', visa: 'Subclass 485', duration: '2-4 years', eligibility: "Bachelor's or higher", pr: 'Yes (strong pathway)', href: '/pathways/australia-485-to-employer-sponsored-visa' },
  { flag: '🇨🇦', name: 'Canada', visa: 'PGWP', duration: 'Up to 3 years', eligibility: '8+ month program at DLI', pr: 'Yes (CEC pathway)', href: '/pathways/canada-pgwp-to-pr' },
  { flag: '🇳🇿', name: 'New Zealand', visa: 'Post-Study Work Visa', duration: '1-3 years', eligibility: 'Level 7+ qualification', pr: 'Yes (Skilled Migrant)', href: '/pathways/new-zealand-accredited-employer-work-visa' },
  { flag: '🇩🇪', name: 'Germany', visa: 'Job Seeker Visa', duration: '18 months', eligibility: 'German university degree', pr: 'Yes (after 2 years work)', href: '/study-in-germany' },
  { flag: '🇮🇪', name: 'Ireland', visa: 'Third Level Graduate Scheme', duration: '1-2 years', eligibility: 'Irish degree', pr: 'Yes (Critical Skills)', href: '/study-in-ireland' },
  { flag: '🇫🇷', name: 'France', visa: 'APS Visa', duration: '12 months', eligibility: "Master's or equivalent", pr: 'Yes (Talent Passport)', href: '/study-in-france' },
]

export default function PostStudyWorkVisaPage() {
  return (
    <>
      <Helmet>
        <title>Post Study Work Visa: Complete 2026 Guide (10+ Countries Compared) | Siddhivinayak Overseas</title>
        <meta name="description" content="Complete guide to post-study work visas in UK, Australia, Canada, New Zealand, Germany, Ireland, France & more. Eligibility, process & PR pathways for international students." />
        <meta name="keywords" content="post study work visa, post study work visa UK, post study work visa Australia, post study work visa Canada, post study work visa New Zealand, graduate route visa, PSW visa, work after study abroad, post study work permit, international students work visa" />
        <link rel="canonical" href={`${SITE_URL}/post-study-work-visa`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/post-study-work-visa`} />
        <meta property="og:title" content="Post Study Work Visa: Complete 2026 Guide (10+ Countries Compared) | Siddhivinayak Overseas" />
        <meta property="og:description" content="Complete guide to post-study work visas across 10+ countries. Eligibility, process & PR pathways for international students transitioning from study to work." />
        <meta property="og:image" content={`${SITE_URL}/consultant-office.jpg`} />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:site_name" content="Siddhivinayak Overseas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Post Study Work Visa: Complete 2026 Guide | Siddhivinayak Overseas" />
        <meta name="twitter:description" content="Complete guide to post-study work visas in UK, Australia, Canada, New Zealand, Germany, Ireland, France & more." />
        <meta name="twitter:image" content={`${SITE_URL}/consultant-office.jpg`} />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />
      </Helmet>

      <SiteHeader />
      <main className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="Post-Study Work Visa Guide"
          title="Post Study Work Visa: The Complete 2026 Guide"
          description="If you're an international student approaching graduation, you're likely wondering: can I stay and work after my studies? The answer is yes — most study destinations offer post-study work visas that let you gain valuable international work experience. This guide covers options in 10+ countries."
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Post-Study Work Visa' }]}
        />

        <section className="border-t border-border/40 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Globe2 className="h-3.5 w-3.5" />
                  What is a Post-Study Work Visa?
                </span>
                <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                  Work globally after graduation
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  A post-study work visa allows international students who have completed their degree in a foreign country to remain and work there for a specified period. Unlike study visas that restrict work to 20 hours per week, these visas grant full-time work rights.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Full-time work authorization (40+ hours/week)',
                    'Gain international work experience in your field',
                    'Build professional networks abroad',
                    'Pathway to permanent residency in many countries',
                    'No job offer required for most countries (open work permit)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm md:p-8">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Quick Comparison
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Post-study work rights vary significantly by country. Compare your options below.
                </p>
                <div className="mt-6 space-y-3">
                  {COUNTRIES.slice(0, 4).map((c) => (
                    <Link
                      key={c.name}
                      to={c.href}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition hover:border-primary/40"
                    >
                      <FlagIcon country={c.name} className="text-2xl" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.visa} — {c.duration}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                    </Link>
                  ))}
                  <Link
                    to="#comparison"
                    className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 transition hover:bg-primary/20"
                  >
                    <Globe2 className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">View full comparison (10+ countries)</p>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="comparison" className="border-t border-border/40 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Globe2 className="h-3.5 w-3.5" />
                Country Comparison
              </span>
              <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                Post-Study Work Visa Options by Country
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
                Compare post-study work visa options across popular study destinations for international students.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Country</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Visa Name</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Duration</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Eligibility</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">PR Pathway</th>
                  </tr>
                </thead>
                <tbody>
                  {COUNTRIES.map((c) => (
                    <tr key={c.name} className="border-b border-border/40 transition hover:bg-primary/5">
                      <td className="p-3">
                        <Link to={c.href} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                          <FlagIcon country={c.name} className="mr-1 inline-block align-[-0.1em]" /> {c.name}
                        </Link>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{c.visa}</td>
                      <td className="p-3 text-sm text-muted-foreground">{c.duration}</td>
                      <td className="p-3 text-sm text-muted-foreground">{c.eligibility}</td>
                      <td className="p-3 text-sm text-muted-foreground">{c.pr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              How to Choose
            </span>
            <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground md:text-3xl">
              How to Choose the Right Country for Post-Study Work
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { icon: Briefcase, title: 'Career Goals', desc: 'Consider which countries have strong job markets in your field. Tech graduates may prefer the UK or Germany, while healthcare professionals often find opportunities in Australia and Canada.' },
                { icon: Award, title: 'PR Timeline', desc: "If permanent residency is your goal, Canada's CEC pathway and Australia's skilled migration offer the clearest routes. The UK and Germany also provide strong PR options after a few years of work." },
                { icon: Clock, title: 'Visa Duration', desc: 'Australia offers up to 4 years for PhD graduates, Canada up to 3 years, and the UK 2 years (3 for PhD). Choose based on how much time you need to gain experience and secure sponsorship.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Common Mistakes
                </span>
                <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                  Common Mistakes That Lead to Visa Rejection
                </h2>
                <ul className="mt-6 space-y-4">
                  {[
                    { title: 'Applying After Study Visa Expires', desc: 'Most countries require you to apply within 60-90 days of graduation. Missing this deadline means losing eligibility permanently.' },
                    { title: 'Incomplete Academic Documentation', desc: 'Transcripts and completion letters must be certified by your university. Uncertified copies are the second most common cause of rejection.' },
                    { title: 'Insufficient English Language Scores', desc: 'Many students assume older test scores are valid. Check language validity periods — most countries require scores within the last 2-3 years.' },
                    { title: 'Applying for the Wrong Visa Stream', desc: 'Each country has multiple post-study streams. Applying for the wrong one can result in rejection even if you meet all requirements.' },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive">!</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm md:p-8">
                <h3 className="font-serif text-xl font-semibold text-foreground">How We Can Help You Transition</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  At Siddhivinayak Overseas, we help international students successfully transition from study to work visas across 10+ countries. Our specialized post-study work visa service includes:
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Eligibility assessment for multiple countries',
                    'Document preparation and certification',
                    'Application submission and tracking',
                    'Interview preparation (where required)',
                    'Employer sponsor guidance (if needed)',
                    'PR pathway consultation after visa grant',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="btn-glow mt-6 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/contact">Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Users className="h-3.5 w-3.5" />
              Success Stories
            </span>
            <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground md:text-3xl">Students We Have Helped</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Priya M.', from: 'Mumbai', study: "Master's in IT — University of Melbourne", outcome: '3-year post-study visa granted, now on PR pathway' },
                { name: 'Rahul K.', from: 'Delhi', study: "Bachelor's in Business — Monash University", outcome: '2-year visa granted, employer sponsored in Year 2' },
                { name: 'Ananya S.', from: 'Bangalore', study: "Master's in Finance — University of Birmingham", outcome: 'Graduate Route visa granted, working in London' },
              ].map((s) => (
                <div key={s.name} className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-4 font-serif text-lg font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.from} | {s.study}</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{s.outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center md:p-12">
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Ready to Work Abroad After Your Studies?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                We have helped 200+ international students successfully transition from study to work visas across 10+ countries. Book a free consultation to discuss your options.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="btn-glow rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/contact">Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-primary/20">
                  <Link to="/services">Explore All Services</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Also explore: <Link to="/study-in-uk" className="text-primary hover:underline">Study in UK</Link> &middot; <Link to="/study-in-australia" className="text-primary hover:underline">Study in Australia</Link> &middot; <Link to="/study-in-canada" className="text-primary hover:underline">Study in Canada</Link>
              </p>
            </div>
          </div>
        </section>
        <ImmigrationDisclaimer />
      </main>
      <SiteFooter />
    </>
  )
}
