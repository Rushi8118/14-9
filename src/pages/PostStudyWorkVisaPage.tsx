import { ImmigrationDisclaimer } from '@/components/seo/ImmigrationDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'
import {
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
  serviceSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'
import { FaqSection } from '@/components/seo/FaqSection'
import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Globe2, CheckCircle2, Award, Clock, BookOpen, Briefcase, Users, TrendingUp, MapPin } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Button } from '@/components/ui/button'
import { FlagIcon } from '@/components/flag-icon'

const SITE_URL = 'https://siddhivinayakoverseas.com'

/**
 * The per-country /post-study-work-visa/* URLs are retired (301 in .htaccess,
 * 404 in the SPA), so `href` links straight to the page that covers each route.
 *
 * `official` is the government page that owns the current fee, processing time
 * and eligibility for that route. It is here, and surfaced on the page, because
 * Search Console shows this page already ranking for "post study work visa
 * fee" (14 impressions) and "post study work visa processing time" (21) and
 * answering neither. Those are government figures that change without notice,
 * so the page names the route precisely and sends the reader to the source
 * rather than carrying a number that quietly goes stale — which is also what
 * CLAUDE.md requires of an official requirement.
 *
 * Every URL below was requested and confirmed to resolve on 2026-10-09. Five
 * are the route's own page. Ireland and France are the portal root instead:
 * the obvious deep links for the Third Level Graduate Programme and the APS
 * both 404'd, and a verified root beats a guessed deep link. If you replace
 * either with a deeper page, open it first.
 */
const COUNTRIES = [
  { flag: '🇬🇧', name: 'United Kingdom', visa: 'Graduate Route', duration: '2 years (3 for PhD)', eligibility: 'Any UK degree', pr: 'Yes (Skilled Worker)', href: '/pathways/uk-graduate-visa-to-skilled-worker-visa', official: 'https://www.gov.uk/graduate-visa', officialName: 'GOV.UK' },
  { flag: '🇦🇺', name: 'Australia', visa: 'Subclass 485', duration: '2-4 years', eligibility: "Bachelor's or higher", pr: 'Yes (strong pathway)', href: '/pathways/australia-485-to-employer-sponsored-visa', official: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-graduate-485', officialName: 'Home Affairs' },
  { flag: '🇨🇦', name: 'Canada', visa: 'PGWP', duration: 'Up to 3 years', eligibility: '8+ month program at DLI', pr: 'Yes (CEC pathway)', href: '/pathways/canada-pgwp-to-pr', official: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation.html', officialName: 'IRCC' },
  { flag: '🇳🇿', name: 'New Zealand', visa: 'Post-Study Work Visa', duration: '1-3 years', eligibility: 'Level 7+ qualification', pr: 'Yes (Skilled Migrant)', href: '/pathways/new-zealand-accredited-employer-work-visa', official: 'https://www.immigration.govt.nz/new-zealand-visas/visas/visa/post-study-work-visa', officialName: 'Immigration NZ' },
  { flag: '🇩🇪', name: 'Germany', visa: 'Job Seeker Visa', duration: '18 months', eligibility: 'German university degree', pr: 'Yes (after 2 years work)', href: '/study-in-germany', official: 'https://www.make-it-in-germany.com/en/visa-residence/types/job-seeker', officialName: 'Make it in Germany' },
  { flag: '🇮🇪', name: 'Ireland', visa: 'Third Level Graduate Programme', duration: '1-2 years', eligibility: 'Irish degree', pr: 'Yes (Critical Skills)', href: '/study-in-ireland', official: 'https://www.irishimmigration.ie/', officialName: 'Irish Immigration Service' },
  { flag: '🇫🇷', name: 'France', visa: 'APS', duration: '12 months', eligibility: "Master's or equivalent", pr: 'Yes (Talent Passport)', href: '/study-in-france', official: 'https://www.campusfrance.org/en', officialName: 'Campus France' },
]

/**
 * Written from this page's own Search Console queries for the 90 days to
 * 2026-10-06 — 568 impressions, 0 clicks, average position 20.8 — not from
 * guesswork about what a reader might ask. Impressions in brackets:
 *
 *   "post study work visa means" (15), "what is it" (1, position 1)
 *   "post study work visa requirements" (16) + "post study visa requirements" (16)
 *   "post study work visa processing time" (21)
 *   "post study work visa fee" (14)
 *   "post study work visa (open)" (14) + "post study open work visa" (10)
 *     + "post study work visa employer assisted" (6)
 *   "post study work visa changes" (12)
 *   "which country is better" (1, position 7) + "australia vs new zealand" (1)
 *   "post graduation visa" (6), "international student post study work visa" (1)
 *
 * Answers stay inside what is verifiable: definitions and process, never a fee
 * or a processing time. FaqSection renders them with <details>, so every answer
 * is in the DOM whether open or shut and the FAQPage schema describes visible
 * content.
 */
const FAQS = [
  {
    question: 'What does "post-study work visa" mean?',
    answer:
      'It is permission to stay in the country where you studied, after you graduate, and work there full time for a fixed period. A student visa normally caps you at part-time hours during term; a post-study work visa lifts that cap. Each country has its own name for it — the Graduate Route in the UK, the Post-Graduation Work Permit in Canada, the Temporary Graduate visa (subclass 485) in Australia, the Post Study Work Visa in New Zealand — so "post-study work visa" is the general term rather than the name of any single visa.',
  },
  {
    question: 'Is a post-study work visa the same as a post-graduation visa or a post-study work permit?',
    answer:
      'In everyday use, yes — they describe the same thing, and which words are correct depends only on the country. Canada issues a "work permit", the UK and Australia issue a "visa", and "post graduation visa" is how many applicants search for it. What matters is which named route you are actually eligible for, because the conditions attach to the route, not to the phrase.',
  },
  {
    question: 'What are the requirements for a post-study work visa?',
    answer:
      'The shape is the same almost everywhere, even though the detail is not: you must have completed a qualifying qualification at a recognised institution in that country, apply from inside the country while your student permission is still valid, apply within the window after your course ends, and show identity, academic completion and in some countries English-language evidence. The qualifying level is the part that differs most — Canada ties eligibility to the length of the programme and the institution being a designated learning institution, New Zealand to the qualification level, the UK to holding a UK degree. Check the official page for your country before you plan around any of it.',
  },
  {
    question: 'How long does a post-study work visa take to process, and what does it cost?',
    answer:
      'Both are set by each government and both change without notice, sometimes mid-year, so a number quoted on a consultancy website is unreliable by the time you read it. Each country publishes its current fee and its current processing times on its own immigration site, and those pages are linked beside every country in the comparison on this page. We will confirm the figure that applies to your route when we assess your profile — what we will not do is quote you a figure we cannot stand behind.',
  },
  {
    question: 'What is the difference between an "open" post-study work visa and an "employer assisted" one?',
    answer:
      'This is New Zealand terminology, and the distinction is historical. New Zealand used to issue two visas: a Post Study Work Visa (Open), which let you work for any employer, and a Post Study Work Visa (Employer Assisted), which tied you to one named employer, occupation and location. The employer-assisted version was withdrawn from 26 November 2018 and post-study work visas there are now granted with open conditions. If you are searching for the employer-assisted route, you are looking for a visa that no longer exists — check Immigration New Zealand for what is currently available at your qualification level.',
  },
  {
    question: 'Which country has the best post-study work visa?',
    answer:
      'There is no single answer, because the right choice depends on how long you need, how strong the permanent-residency route is, and where your field actually hires. Longer permission is worth more if your industry recruits slowly; a clearer residency pathway is worth more if staying is the point. The comparison on this page sets the duration, eligibility and residency route side by side so you can judge it against your own plan rather than a ranking.',
  },
  {
    question: 'When should I apply, and what happens if I miss the window?',
    answer:
      'Apply before your student permission expires and within the window your country allows after your course result is confirmed — missing it is the most common reason an otherwise eligible graduate loses the route, and it is usually not recoverable from inside the country. Start assembling your academic completion documents before results are published, because university certification is the step applicants most often underestimate.',
  },
  {
    question: 'Do you guarantee a post-study work visa or a job?',
    answer:
      'No. The visa decision rests with the immigration authority of the country you are applying to, and employment terms rest with the employer. We assess whether a route is realistic for your profile, prepare documentation that stands up to scrutiny, and tell you plainly when a plan is not viable.',
  },
]

export default function PostStudyWorkVisaPage() {
  return (
    <>
      {/*
        Retitled against this page's own query data rather than house style.
        It had "Post Study Work Visa Guide 2026" and ranked at position 20.8 for
        568 impressions with zero clicks. Two problems: the head terms people
        actually search ("post study work visa" 40, "post study working visa"
        29, "post-study work visa" 26, "post study visa" 23, "post work visa"
        23) were competing with the word "Guide", and the single strongest
        intent on the page is definitional — "post study work visa means" (15
        impressions) and a literal "what is it" sitting at position 1. So the
        title now leads with the term and promises the definition.

        The year is gone deliberately. "2026" in a title has to be maintained
        every January or it reads as stale, and the query that wanted recency
        ("post study work visa changes", 12 impressions) is better served by a
        section that says what changed than by a number in the title.

        The old description also named the USA, which has no row in the
        comparison — the page promised something it did not deliver.
      */}
      <SeoHead
        title="Post-Study Work Visa: What It Means, by Country"
        description="What a post-study work visa means, who qualifies, and how seven study destinations compare on duration, eligibility and residency — with official sources."
        path="/post-study-work-visa"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          webpageSchema({
            title: 'Post-Study Work Visa: What It Means, by Country',
            description: 'What a post-study work visa means, who qualifies, and how seven study destinations compare on duration, eligibility and residency routes.',
            path: '/post-study-work-visa',
          }),
          serviceSchema({
            name: 'Post-Study Work Visa Guidance',
            description: 'Eligibility assessment and documentation support for post-study work visa routes in seven study destinations.',
            path: '/post-study-work-visa',
            serviceType: 'Visa and overseas education consultancy',
          }),
          faqSchema(FAQS),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Post-Study Work Visa', path: '/post-study-work-visa' },
          ]),
        ]}
      />

      <SiteHeader />
      <main className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="Post-Study Work Visa"
          title="Post-Study Work Visa: What It Means, and Where You Can Get One"
          description="A post-study work visa is permission to stay and work full time in the country where you studied, for a fixed period after you graduate. Every destination names it differently and sets its own rules. Here is what the term means, who qualifies, and how seven study destinations compare."
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
                  What a post-study work visa means
                </h2>
                {/*
                  The definition carries the weight of this section: the
                  strongest single intent reaching this page is definitional
                  ("post study work visa means", 15 impressions, and a bare
                  "what is it" at position 1). It is stated in the first
                  sentence, before any benefit framing.

                  The second paragraph names the aliases on purpose. People
                  search "post graduation visa" (6) and "post study work
                  permit", and each country uses a different word for the same
                  thing — so the page says which word belongs to which country
                  instead of assuming the reader already knows.
                */}
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  A post-study work visa is permission to stay in the country where you studied, after you graduate, and work there full time for a fixed period. A student visa normally caps you at part-time hours during term. A post-study work visa lifts that cap, and most of them do not require a job offer before you apply.
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  &ldquo;Post-study work visa&rdquo; is the general term, not the name of any one visa. The UK calls its route the <strong className="font-semibold text-foreground">Graduate Route</strong>, Canada issues a <strong className="font-semibold text-foreground">Post-Graduation Work Permit</strong>, Australia the <strong className="font-semibold text-foreground">Temporary Graduate visa (subclass 485)</strong>, and New Zealand a <strong className="font-semibold text-foreground">Post Study Work Visa</strong>. &ldquo;Post-graduation visa&rdquo; and &ldquo;post-study work permit&rdquo; describe the same idea. The conditions attach to the named route, so that is what you need to identify.
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
                    {/* Says seven because COUNTRIES has seven rows. It claimed
                        "10+", which the table below does not deliver. */}
                    <p className="text-sm font-semibold text-foreground">View full comparison (seven countries)</p>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Priority Strategy: Study-to-Work Transition (Fixed Job & Salary) & Country Switch */}
        <section className="border-t border-border/50 bg-primary/[0.03] py-14 md:py-18">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Briefcase className="h-3.5 w-3.5" />
                Core Transition Services for Graduating Students
              </span>
              <h2 className="mt-4 font-serif text-2xl font-bold text-foreground md:text-3xl">
                Study Finished or Ending Soon? Stay Lawfully on a Work Visa
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                If you arrived from Gujarat, Punjab, Maharashtra, Delhi, or anywhere across India’s 28 states and South Asia on a study visa, graduation means your visa is expiring. We help you renew or switch into a sponsored work visa with a fixed job, compliant salary, and company benefits.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-3xl border border-primary/40 bg-card/80 p-8 shadow-sm transition hover:border-primary">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-foreground">
                  Student Visa to Work Visa (Fixed Job & Salary)
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Avoid returning home or losing legal status. We connect graduating international students with verified employers on official sponsorship registers who issue valid employment contracts meeting statutory salary thresholds.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-foreground/80">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> UK Student / Graduate to Skilled Worker switch</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Canada PGWP to LMIA Employer Work Permit & PR</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Australia Subclass 485 to Skills in Demand (482)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Germany university graduate to EU Blue Card</li>
                </ul>
                <div className="mt-6">
                  <Button asChild className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                    <Link to="/pathways/student-visa-to-work-visa-with-job-and-salary">
                      Explore Fixed Job & Salary Pathway <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card/80 p-8 shadow-sm transition hover:border-primary/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Globe2 className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-foreground">
                  Switch Countries on a Study Visa
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Currently studying in UK, Canada, Australia, Europe or Cyprus and facing strict PR changes? Relocate lawfully to another country with verified employer sponsorship, contract salary, and relocation assistance.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-foreground/80">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Move from UK to Australia with sponsored job</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Move from UK to Canada with LMIA work permit</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Europe / Poland / Cyprus to Germany or UK</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Lodge new visa from current country without flying back</li>
                </ul>
                <div className="mt-6">
                  <Button asChild variant="outline" className="w-full rounded-full text-xs">
                    <Link to="/pathways/switch-countries-with-job-and-salary">
                      Explore Country Relocation Guide <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/regional-coverage"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                Looking for your home state or country guidelines? View All 28 Indian States & South Asia Directory <ArrowRight className="h-3 w-3" />
              </Link>
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
                Duration, eligibility and residency route side by side, with the government page that owns the current fee and processing time for each one.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Country</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Visa Name</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Duration</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Eligibility</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">PR Pathway</th>
                    <th className="p-3 text-left text-sm font-semibold text-foreground">Fee &amp; processing time</th>
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
                      {/*
                        rel="nofollow" is deliberate on an outbound government
                        link: it is a citation, not an endorsement we are
                        passing authority for. noopener is required with
                        target="_blank".
                      */}
                      <td className="p-3 text-sm">
                        <a
                          href={c.official}
                          target="_blank"
                          rel="noopener nofollow"
                          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {c.officialName}
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 -rotate-45" aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/*
              This block exists because the page already ranks for "post study
              work visa fee" (14 impressions) and "post study work visa
              processing time" (21) and answered neither. The honest answer is
              that both are government figures that move, so the page says so
              and points at the source instead of printing a number that would
              be wrong within a year and unverifiable in the meantime.
            */}
            <p className="mx-auto mt-8 max-w-3xl rounded-xl border border-border/60 bg-card/50 p-4 text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">On fees and processing times:</strong>{' '}
              each government sets its own, and both change without notice. We do not reprint them here, because a figure copied onto a consultancy page is unreliable by the time you read it — the official pages linked above are the only current source. We will confirm the figures that apply to your route when we assess your profile.
            </p>
          </div>
        </section>

        {/*
          "Open" vs "employer assisted": 30 impressions across
          "post study work visa (open)" (14), "post study open work visa" (10)
          and "post study work visa employer assisted" (6), at positions 22-27,
          with no clicks. The reason is that the page never explained the terms
          — and the more useful answer is that one of the two routes was
          withdrawn years ago, so anyone searching it is chasing something that
          no longer exists. Sourced to Immigration New Zealand's 2018 change;
          no current duration or fee is stated here, because those have moved
          since and belong on their page, not ours.
        */}
        <section className="border-t border-border/40 bg-primary/[0.03] py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Award className="h-3.5 w-3.5" />
              A term worth clearing up
            </span>
            <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground md:text-3xl">
              &ldquo;Open&rdquo; and &ldquo;employer assisted&rdquo; post-study work visas
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              If you have come across these two phrases, they are New Zealand&rsquo;s, and the distinction is now historical. New Zealand used to issue two separate visas: a <strong className="font-semibold text-foreground">Post Study Work Visa (Open)</strong>, which let you work for any employer, and a <strong className="font-semibold text-foreground">Post Study Work Visa (Employer Assisted)</strong>, which tied you to one named employer, occupation and location.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              The employer-assisted version was withdrawn from <strong className="font-semibold text-foreground">26 November 2018</strong>, and post-study work visas in New Zealand are now granted with open conditions. Graduates already holding an employer-assisted visa at the time could apply to have the employer, occupation and location conditions removed.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              So if you are searching for the employer-assisted route, you are looking for a visa that no longer exists. What matters now is which qualification levels still attract a post-study work visa and for how long — and because that has been revised more than once since 2018, the only reliable source is Immigration New Zealand itself.
            </p>
            <a
              href="https://www.immigration.govt.nz/new-zealand-visas/visas/visa/post-study-work-visa"
              target="_blank"
              rel="noopener nofollow"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Immigration New Zealand — Post Study Work Visa
              <ArrowRight className="h-4 w-4 shrink-0 -rotate-45" aria-hidden="true" />
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              Looking at New Zealand specifically? Our{' '}
              <Link to="/pathways/new-zealand-accredited-employer-work-visa" className="font-medium text-primary underline-offset-2 hover:underline">
                Accredited Employer Work Visa pathway
              </Link>{' '}
              covers the route most graduates move onto next, and{' '}
              <Link to="/study-in-new-zealand" className="font-medium text-primary underline-offset-2 hover:underline">
                studying in New Zealand
              </Link>{' '}
              covers what comes before it.
            </p>
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
        {/*
          FaqSection, not a bespoke accordion: it renders answers through
          <details>, so each one stays in the DOM whether open or shut and the
          FAQPage schema above describes content Google can actually see. A
          Radix accordion unmounted closed panels here once and left 147 of 159
          answers existing only in JSON-LD.
        */}
        <FaqSection
          faqs={FAQS}
          title="Post-study work visa questions"
          description="The questions people actually arrive on this page asking, taken from its Search Console queries."
        />
        <ImmigrationDisclaimer />
      </main>
      <SiteFooter />
    </>
  )
}
