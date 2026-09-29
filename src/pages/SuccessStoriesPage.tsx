import { SiteHeader } from '@/components/site-header'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { SeoHead } from '@/components/seo/SeoHead'
import { CtaBand } from '@/components/seo/CtaBand'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { customerReviews } from '@/lib/reviews-data'
import {
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

export default function SuccessStoriesPage() {
  const stories = customerReviews.slice(0, 12)

  return (
    <>
      <SeoHead
        title="Client Success Stories | Siddhivinayak Overseas"
        description="Read client feedback for Siddhivinayak Overseas in Surat — work visa and study visa journeys shared by applicants we supported."
        path="/success-stories"
        keywords="Siddhivinayak Overseas success stories, Surat visa consultants reviews, study visa success India"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          webpageSchema({
            title: 'Success Stories',
            description: 'Client feedback and journeys from Siddhivinayak Overseas Surat.',
            path: '/success-stories',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Success Stories', path: '/success-stories' },
          ]),
        ]}
      />
      <SiteHeader />
      <main id="main-content" className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="Outcomes & feedback"
          title="Success Stories from Our Surat Clients"
          description="Real applicant feedback from work and study journeys. Individual results vary — we never guarantee visas."
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Success Stories' }]}
        />
        <section className="py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 md:grid-cols-2 lg:grid-cols-3 md:px-6">
            {stories.map((story) => (
              <article
                key={story.id}
                className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {story.visa} · {story.country}
                </p>
                <h2 className="mt-3 font-serif text-lg font-semibold text-foreground">{story.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{'★'.repeat(story.rating)}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{story.text}</p>
              </article>
            ))}
          </div>
        </section>
        <RelatedLinks
          links={[
            { label: 'All reviews', to: '/reviews' },
            { label: 'Work visa options', to: '/work-visa' },
            { label: 'Study visa options', to: '/study-visa' },
            { label: 'Contact Surat office', to: '/contact' },
          ]}
        />
        <CtaBand />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  )
}
