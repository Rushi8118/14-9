import { Link } from 'react-router-dom'
import { Briefcase, MessageCircle, Phone, ShieldAlert } from 'lucide-react'
import { NAP } from '@/lib/seo/site'

type ImmigrationDisclaimerProps = {
  /** Kept for call-site compatibility; the short notice is the same for every country. */
  country?: string
  updated?: string
  jobs?: boolean
}

/** Shown on every immigration, study and work-visa page. */
export function ImmigrationDisclaimer(_props: ImmigrationDisclaimerProps) {
  return (
    <section aria-label="Important information and job enquiries" className="px-4 py-10 md:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Briefcase className="h-5 w-5 text-primary" aria-hidden="true" />
            More openings in other countries
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Besides our urgent vacancies, we also receive regular job openings for <strong className="text-foreground">work visas in many other countries</strong>.
            Tell us the country and job you are interested in and our team will share the openings currently available for your profile.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`${NAP.whatsappUrl}?text=${encodeURIComponent('Hello, I would like to know about work visa job openings for')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp {NAP.phoneINDisplay}
            </a>
            <a
              href={`tel:${NAP.phoneIN}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call us
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Apply online
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Important information
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Siddhivinayak Overseas provides information, counselling and application-preparation support for applicants
            exploring lawful study, work and migration pathways.
          </p>
        </div>
      </div>
    </section>
  )
}

/** Bump when the static country/visa content is revised. */
export const CONTENT_LAST_UPDATED = '2026-09-17'
