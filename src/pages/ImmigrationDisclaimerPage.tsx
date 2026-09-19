import { Link } from 'react-router-dom'
import { SeoHead } from '@/components/seo/SeoHead'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { NAP } from '@/lib/seo/site'
import { CONTENT_LAST_UPDATED } from '@/components/seo/ImmigrationDisclaimer'

const OFFICIAL_LINKS = [
  { label: 'Immigration, Refugees and Citizenship Canada', url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html' },
  { label: 'GOV.UK — Visas and immigration', url: 'https://www.gov.uk/browse/visas-immigration' },
  { label: 'Australian Department of Home Affairs', url: 'https://immi.homeaffairs.gov.au/' },
  { label: 'Immigration New Zealand', url: 'https://www.immigration.govt.nz/' },
  { label: 'EU Immigration Portal', url: 'https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal_en' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export default function ImmigrationDisclaimerPage() {
  return (
    <>
      <SeoHead
        title="Immigration Disclaimer"
        description="What Siddhivinayak Overseas does and does not do: no visa or job guarantees, decisions by governments and employers, fees, and official sources."
        path="/immigration-disclaimer"
      />
      <SiteHeader />
      <main className="min-h-screen bg-background px-4 pb-16 pt-28 md:px-6 md:pt-36">
        <article className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold text-foreground md:text-4xl">Immigration Disclaimer</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(`${CONTENT_LAST_UPDATED}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </header>

          <Section title="Who we are">
            <p>
              Siddhivinayak Overseas is a private consultancy based in Surat, India. We provide information, counselling,
              and help preparing applications and documents for people exploring lawful study, work and migration options.
            </p>
          </Section>

          <Section title="No guarantees">
            <p>
              A job offer or company offer letter does not by itself give you a visa or extend your current immigration
              permission. You must meet the destination country&apos;s official requirements and apply through its
              official process.
            </p>
          </Section>

          <Section title="Jobs and employers">
            <p>
              Where we share overseas job openings, the hiring decision rests only with the employer. We never sell job
              offers, offer letters, sponsorship certificates or documents, and we never create, alter or backdate
              documents. If anyone offers you a &quot;guaranteed&quot; or &quot;free visa&quot; job without genuine interviews and checks,
              treat it as a warning sign.
            </p>
          </Section>

          <Section title="Information on this website">
            <p>
              Immigration rules, fees, eligibility requirements and processing times change often. The information on
              this website is general guidance only and may not reflect the latest official rules. Always check the
              official government source before you apply or pay any fee.
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              {OFFICIAL_LINKS.map((link) => (
                <li key={link.url}>
                  <a className="text-primary underline underline-offset-2" href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Fees">
            <p>
              Our service charges are separate from government visa fees, test fees, translation, medical and travel
              costs. We give you a written, itemised quote before you pay us, and receipts for every payment. Government
              fees are paid to the authority and are set by it.
            </p>
          </Section>

          <Section title="Questions or complaints">
            <p>
              If you have a concern about our service, contact us at{' '}
              <a className="text-primary underline underline-offset-2" href={`mailto:${NAP.email}`}>{NAP.email}</a> or{' '}
              {NAP.phoneINDisplay}. You can also visit our office at {NAP.fullAddress}. See our{' '}
              <Link className="text-primary underline underline-offset-2" to="/terms">Terms of Service</Link> and{' '}
              <Link className="text-primary underline underline-offset-2" to="/privacy">Privacy Policy</Link>.
            </p>
          </Section>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
