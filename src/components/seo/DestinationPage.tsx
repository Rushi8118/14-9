import { ImmigrationDisclaimer } from '@/components/seo/ImmigrationDisclaimer'
import { CheckCircle2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { SeoHead } from '@/components/seo/SeoHead'
import { FaqSection } from '@/components/seo/FaqSection'
import { CtaBand } from '@/components/seo/CtaBand'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { CountryVacancies } from '@/components/seo/CountryVacancies'
import type { DestinationContent } from '@/content/destination-types'
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  localBusinessSchema,
  organizationSchema,
  serviceSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

type DestinationPageProps = {
  content: DestinationContent
  showWhatsAppFab?: boolean
}

export function DestinationPage({ content, showWhatsAppFab = true }: DestinationPageProps) {
  const crumbSchema = breadcrumbSchema(
    content.breadcrumbs.map((b) => ({
      name: b.label,
      path: b.to ?? content.path,
    })),
  )

  const jsonLd: Array<Record<string, unknown>> = [
    organizationSchema(),
    websiteSchema(),
    localBusinessSchema(),
    webpageSchema({
      title: content.title,
      description: content.description,
      path: content.path,
    }),
    serviceSchema({
      name: content.h1,
      description: content.description,
      path: content.path,
      serviceType: content.serviceType,
    }),
    crumbSchema,
    faqSchema(content.faqs),
  ]

  if (content.kind === 'guide') {
    jsonLd.push(
      articleSchema({
        title: content.title,
        description: content.description,
        path: content.path,
        datePublished: content.datePublished,
      }),
    )
  }

  return (
    <>
      <SeoHead
        title={content.title}
        description={content.description}
        path={content.path}
        keywords={content.keywords}
        type={content.kind === 'guide' ? 'article' : 'website'}
        noindex={content.noindex}
        jsonLd={jsonLd}
      />
      <SiteHeader />
      <main id="main-content" className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow={content.eyebrow}
          title={content.h1}
          description={content.heroDescription}
          breadcrumbs={content.breadcrumbs}
        />

        {content.processingTime ? (
          <section className="border-b border-border/40 px-4 py-6 md:px-6">
            <div className="mx-auto max-w-7xl">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Typical process time:</span>{' '}
                {content.processingTime} once documents and employer requirements are ready. Timelines
                vary with employer responses, appointments, document gaps and government decisions.
              </p>
            </div>
          </section>
        ) : null}

        {content.highlights.length > 0 ? (
          <section className="py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {content.highlights.map((item) => (
                  <div
                    key={item.title}
                    className="lift-card rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm"
                  >
                    <h2 className="font-serif text-lg font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-t border-border/40 py-16 md:py-20">
          <div className="mx-auto max-w-7xl space-y-14 px-4 md:px-6">
            {content.sections.map((section) => (
              <article key={section.heading} className="max-w-4xl">
                <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-6 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm text-foreground/90">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {(content.eligibility?.length || content.documents?.length) ? (
          <section className="border-t border-border/40 py-16 md:py-20">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-2 md:px-6">
              {content.eligibility?.length ? (
                <div className="rounded-2xl border border-border/60 bg-card/60 p-6 md:p-8">
                  <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                    Eligibility snapshot
                  </h2>
                  <ul className="mt-5 space-y-3">
                    {content.eligibility.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {content.documents?.length ? (
                <div className="rounded-2xl border border-border/60 bg-card/60 p-6 md:p-8">
                  <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                    Documents checklist
                  </h2>
                  <ul className="mt-5 space-y-3">
                    {content.documents.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {content.processSteps?.length ? (
          <section className="border-t border-border/40 py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
              <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
                How we help you
              </h2>
              <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {content.processSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-2xl border border-border/60 bg-card/60 p-5"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Step {index + 1}
                    </span>
                    <h3 className="mt-2 font-medium text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        {content.kind === 'work' && content.country ? (
          <CountryVacancies country={content.country} />
        ) : null}

        <FaqSection faqs={content.faqs} />
        <ImmigrationDisclaimer country={content.country} jobs={content.kind === 'work'} />
        <RelatedLinks links={content.related} />
        <CtaBand />
      </main>
      <SiteFooter />
      {showWhatsAppFab ? <WhatsAppFab /> : null}
    </>
  )
}
