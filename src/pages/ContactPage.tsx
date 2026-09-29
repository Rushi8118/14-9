import { SiteHeader } from '@/components/site-header'
import { SiteFooter, WhatsAppFab } from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { ContactSection } from '@/components/contact-section'
import { SeoHead } from '@/components/seo/SeoHead'
import { NAP } from '@/lib/seo/site'
import {
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  webpageSchema,
  websiteSchema,
} from '@/lib/seo/schema'

export default function ContactPage() {
  return (
    <>
      <SeoHead
        title="Contact Visa Consultants in Surat | Siddhivinayak Overseas"
        description={`Contact Siddhivinayak Overseas in Surat for free study and work visa counselling. Call ${NAP.phoneINDisplay} or WhatsApp us.`}
        path="/contact"
        keywords="contact visa consultants Surat, Siddhivinayak Overseas phone, study visa counselling Surat"
        jsonLd={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          webpageSchema({
            title: 'Contact Visa Consultants in Surat',
            description: 'Book a free consultation with Siddhivinayak Overseas in Surat.',
            path: '/contact',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
        ]}
      />
      <SiteHeader />
      <main id="main-content" className="relative overflow-hidden premium-page">
        <PageHero
          eyebrow="Surat office · Free counselling"
          title="Contact Visa Consultants in Surat"
          description={`Visit ${NAP.streetAddress}, or call ${NAP.phoneINDisplay}. We'll review your profile and map a realistic study or work pathway.`}
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
        />
        <ContactSection />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  )
}
