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
  educationalOrganizationSchema,
  localBusinessSchema,
  organizationSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

export default function HomePage() {
  return (
    <>
      <SeoHead
        title="Study & Work Visa Consultants in Surat | India & South Asia"
        description="Study visa, work visa and post-study transition consultants in Surat, serving India, Nepal, Bangladesh, Pakistan and Sri Lanka."
        path="/"
        keywords="visa consultants in Surat, overseas education consultants India, student visa to work visa with job and salary, convert study visa to work visa, renew student visa on work visa, switch countries on study visa, study abroad consultants India 28 states, visa consultancy Bangladesh Nepal Sri Lanka Pakistan, UK skilled worker visa, Canada PGWP to PR, Australia 485 to employer sponsorship, Germany Blue Card, Siddhivinayak Overseas"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          educationalOrganizationSchema(),
          webpageSchema({
            title: 'Overseas Education & Visa Consultants in Surat & Pan-India',
            description:
              'Study and work visa consultancy for Canada, the UK, Australia, the USA, Germany, Japan and Europe.',
            path: '/',
          }),
        ]}
      />
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
