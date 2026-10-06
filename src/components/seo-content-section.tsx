import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, CheckCircle2, BookOpen, Award, Users, Globe2, Landmark, Sun, TrendingUp, Briefcase, Building2 } from 'lucide-react'
import { FlagIcon } from '@/components/flag-icon'

const STATS = [
  { value: '500+', label: 'Work Visa Clients' },
  { value: 'Free', label: 'First Consultation' },
  { value: '38+', label: 'Work Permit Countries' },
  { value: '6', label: 'Study Visa Countries' },
]

const FEATURES = [
  { icon: GraduationCap, title: 'University Shortlisting', desc: 'Personalised university matching based on your profile, budget, and career goals.' },
  { icon: Award, title: 'Scholarship Guidance', desc: 'Merit-based scholarships, tuition waivers, and education loan facilitation.' },
  { icon: BookOpen, title: 'SOP & Applications', desc: 'Expert-crafted Statements of Purpose, LORs, and complete application handling.' },
  { icon: CheckCircle2, title: 'Visa Assistance', desc: 'End-to-end visa filing, documentation, and mock interview preparation.' },
]

const COUNTRIES = [
  { href: '/study-in-usa', flag: '🇺🇸', name: 'USA', desc: 'STEM OPT up to 3 years. 8 of world\'s top 20 universities.', icon: Globe2 },
  { href: '/study-in-uk', flag: '🇬🇧', name: 'UK', desc: '2-year PSW visa. Shorter 1-year master\'s programs.', icon: Landmark },
  { href: '/study-in-canada', flag: '🇨🇦', name: 'Canada', desc: 'Clear PR pathway. Most affordable among English-speaking countries.', icon: Award },
  { href: '/study-in-australia', flag: '🇦🇺', name: 'Australia', desc: 'PSW up to 4 years. 7 universities in global top 100.', icon: Sun },
]

export function SeoContentSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            Trusted Overseas Education Consultants
          </div>
          <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Overseas Education Consultants in India &ndash; Siddhivinayak Overseas
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Welcome to Siddhivinayak Overseas, a trusted name among <strong>overseas education consultants in India</strong>. We help students & fresh graduates (18-34) achieve their dreams &mdash; whether studying abroad at top universities or securing a work visa abroad. From university selection to work visa filing, our <strong>overseas education services</strong> provide end-to-end <strong>international education & migration guidance</strong> tailored to your goals.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card/50 p-4 text-center backdrop-blur-sm">
              <p className="font-serif text-2xl font-semibold text-foreground md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              Why Choose Us
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <h3 className="mt-5 text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
            Why Choose Siddhivinayak Overseas?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground">
            We assign a dedicated case officer who stays with you from your first consultation until you land on campus. Personalised attention, honest eligibility checks and transparent, itemised pricing.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="lift-card group rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                <div className="card-icon flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="mt-4 font-serif text-lg font-semibold text-foreground">{f.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Globe2 className="h-3.5 w-3.5" />
              Destinations
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <h3 className="mt-5 text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
            Destinations for Study & Work Visas
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground">
            As leading <strong>overseas education consultants in India</strong>, we offer study abroad guidance for top universities &amp; work visas for skilled professionals aged 18-34 across multiple countries.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRIES.map((c) => (
              <Link
                key={c.name}
                to={c.href}
                className="lift-card group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition hover:border-primary/40"
              >
                <FlagIcon country={c.name} className="text-4xl" />
                <h4 className="mt-3 font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary">{c.name}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Learn more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Priority Strategy: Study-to-Work Transition (Fixed Job & Salary) & Country Switch */}
        <div className="mt-16 rounded-3xl border border-border/80 bg-card/60 p-8 backdrop-blur-md md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Briefcase className="h-3.5 w-3.5" />
                Strategic Overseas Pathways
              </span>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                Finishing Studies Abroad or Want to Switch Countries?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                We specialize in helping international students from all 28 states &amp; 8 UTs in India, Bangladesh, Nepal, Pakistan, and Sri Lanka transition to lawful work visas with <strong>a written job contract, a salary that meets the destination’s statutory minimum, and company benefits</strong>.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                to="/regional-coverage"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
              >
                <Globe2 className="h-4 w-4" />
                All 28 States &amp; South Asia Directory →
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h4 className="mt-3 font-serif text-base font-semibold text-foreground">
                Study to Work Visa (Fixed Job &amp; Salary)
              </h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Nearing graduation in UK, Canada, Australia or Germany? Transition to an employer-sponsored work visa with a binding salary contract and health benefits.
              </p>
              <Link
                to="/pathways/student-visa-to-work-visa-with-job-and-salary"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Learn transition process <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Globe2 className="h-5 w-5" />
              </div>
              <h4 className="mt-3 font-serif text-base font-semibold text-foreground">
                Switch Countries on Study Visa
              </h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Currently in UK, Canada, Australia or Europe and want to relocate? Move with secured sponsor employer offers, fixed salary, and relocation assistance.
              </p>
              <Link
                to="/pathways/switch-countries-with-job-and-salary"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Explore relocation guide <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="mt-3 font-serif text-base font-semibold text-foreground">
                Pan-India &amp; South Asia Hubs
              </h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Comprehensive document checklists, State Board / University verification, MEA Apostille, and RPO clearance for all 28 states &amp; UTs.
              </p>
              <Link
                to="/regional-coverage"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Find your state guidelines <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-primary/30 bg-primary/5 p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Your Journey Abroad, Simplified
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              From profile assessment and university shortlisting to work visa filing, documentation, and pre-departure briefing &mdash; our <strong>overseas education services</strong> cover everything. Whether you want to study abroad or work overseas, we facilitate the entire process so you focus on what matters: your future.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              When you choose us as your <strong>overseas education consultants in India</strong>, you&apos;re not just applying &mdash; you&apos;re building a global career with a team that has helped thousands succeed.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="btn-glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Book Free Consultation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-primary/5"
              >
                Read Student Reviews
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
