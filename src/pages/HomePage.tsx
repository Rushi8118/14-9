import { Helmet } from 'react-helmet-async'
import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { UrgentRequirementBanner } from '@/components/urgent-requirement-banner'
import { FeaturedWorkCountries } from '@/components/featured-work-countries'
import { StudyVisaSection } from '@/components/study-visa-section'
import { ProcessSection } from '@/components/process-section'
import { WhyUs } from '@/components/why-us'
import { Testimonials } from '@/components/testimonials'
import { SeoContentSection } from '@/components/seo-content-section'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { CtaBand } from '@/components/seo/CtaBand'
import { SeoHead } from '@/components/seo/SeoHead'
import {
  localBusinessSchema,
  organizationSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

export default function HomePage() {
  return (
    <>
      <SeoHead
        title="Overseas Education & Visa Consultants in Surat | Study & Work Abroad"
        description="Siddhivinayak Overseas — study visa and work visa consultants in Surat for Canada, UK, Australia, USA, Germany and Japan. Free counselling at Pragti IT Park."
        path="/"
        keywords="visa consultants in Surat, overseas education consultants Surat, study visa consultants Surat, work visa consultants Surat, Siddhivinayak Overseas"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          webpageSchema({
            title: 'Overseas Education & Visa Consultants in Surat',
            description:
              'Study and work visa consultancy in Surat for Canada, UK, Australia, USA, Germany and Japan.',
            path: '/',
          }),
        ]}
      />
      {/* The hero globe image is the homepage LCP, so only this page preloads it. */}
      <Helmet>
        <link rel="preload" as="image" href="/earth-blue-marble.jpg" fetchPriority="high" />
      </Helmet>
      <SiteHeader />
      <main id="main-content" className="relative premium-page">
        <Hero />
        <UrgentRequirementBanner />
        <FeaturedWorkCountries />
        <StudyVisaSection />
        <ProcessSection />
        <WhyUs />
        <Testimonials />
        <SeoContentSection />
        <CtaBand />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  )
}
