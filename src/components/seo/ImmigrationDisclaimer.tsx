import { Link } from 'react-router-dom'
import { Briefcase, MessageCircle, Phone, ShieldAlert } from 'lucide-react'
import { NAP } from '@/lib/seo/site'

/** Bump when the static country/visa content is revised. */
export const CONTENT_LAST_UPDATED = '2026-09-17'

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
          {/*
            This block is the disclaimer that appears on every study, work and
            immigration page, and until now it did not actually disclaim
            anything: it described the service and stopped. It said nothing about
            rules changing, nothing about who decides, and carried no date, so 88
            pages presented volatile immigration guidance with no caveat at all.

            The wording below is taken from /immigration-disclaimer, which already
            states it correctly, so nothing new is claimed here. Keep the two in
            agreement — if that page's position changes, change this with it.
          */}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Siddhivinayak Overseas provides information, counselling and application-preparation support for applicants
            exploring lawful study, work and migration pathways.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Immigration rules, fees, eligibility requirements and processing times change often. The information on this
            page is general guidance only and may not reflect the latest official rules. Always check the official
            government source before you apply or pay any fee.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Visa decisions rest with the relevant immigration authority, and hiring decisions rest with the employer.
            Eligibility, processing times, fees and outcomes vary from case to case.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Last reviewed:{' '}
            <time dateTime={CONTENT_LAST_UPDATED}>
              {new Date(`${CONTENT_LAST_UPDATED}T00:00:00Z`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
            {' · '}
            <Link to="/immigration-disclaimer" className="text-primary hover:underline">
              Read the full disclaimer
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
