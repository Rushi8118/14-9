import { Link } from 'react-router-dom'
import { ArrowUpRight, Route } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { SeoHead } from '@/components/seo/SeoHead'
import { CtaBand } from '@/components/seo/CtaBand'
import { ImmigrationDisclaimer } from '@/components/seo/ImmigrationDisclaimer'
import { PATHWAY_GROUPS, PATHWAYS_BY_SLUG } from '@/content/pathways'
import { breadcrumbSchema, organizationSchema, webpageSchema, websiteSchema } from '@/lib/seo/schema'

const TITLE = 'Study to Work & Country Move Visa Pathways'
const DESCRIPTION = 'Lawful routes to stay and work after study, move from the UK to Australia, Canada, New Zealand or Europe, or move from India, Pakistan, Bangladesh and Sri Lanka.'

export default function PathwaysPage() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        path="/pathways"
        keywords="student visa to work visa, stay and work after study abroad, move from uk to australia, move from uk to canada, india to uk work visa, pakistan to uk work visa, europe work visa for pakistani"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          webpageSchema({ title: TITLE, description: DESCRIPTION, path: '/pathways' }),
          breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Pathways', path: '/pathways' }]),
        ]}
      />
      <SiteHeader />
      <main id="main-content" className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="Visa pathways"
          title="Stay, Switch or Move Countries — Lawfully"
          description="Guides for students and workers already abroad and for applicants from South Asia. Every route depends on official rules and a genuine employer or institution."
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Pathways' }]}
        />
        {PATHWAY_GROUPS.map((group) => (
          <section key={group.title} className="py-10 md:py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
              <h2 className="font-serif text-2xl font-semibold text-foreground">{group.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.slugs.map((slug) => {
                  const page = PATHWAYS_BY_SLUG[slug]
                  if (!page) return null
                  return (
                    <Link key={slug} to={page.path} className="group rounded-2xl border border-border/60 bg-card/60 p-6 transition hover:border-primary/40">
                      <Route className="h-5 w-5 text-primary" aria-hidden="true" />
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary">{page.h1}</h3>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{page.description}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        ))}
        <ImmigrationDisclaimer jobs />
        <CtaBand />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  )
}
