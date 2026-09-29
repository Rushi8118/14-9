import { ChevronDown } from 'lucide-react'
import type { FaqItem } from '@/lib/seo/schema'

/**
 * The one FAQ renderer for the whole site. Every page that emits FAQPage
 * structured data must render its answers through this component.
 *
 * Built on native <details>/<summary> rather than the Radix accordion this used
 * to use. Radix unmounts a closed panel, so the answers were genuinely absent
 * from the DOM — 147 of 159 answers across 51 pages existed only in JSON-LD,
 * which breaks Google's rule that structured data must describe content visible
 * on the page. <details> keeps the answer in the document whether open or shut.
 *
 * It also works with JavaScript disabled and is keyboard accessible without any
 * ARIA of our own, which the accordion needed scripting for.
 */

type FaqSectionProps = {
  title?: string
  description?: string
  faqs: FaqItem[]
  /** Heading level to fit the host page's outline. Defaults to h2. */
  as?: 'h2' | 'h3'
}

export function FaqSection({
  title = 'Frequently asked questions',
  description,
  faqs,
  as: Heading = 'h2',
}: FaqSectionProps) {
  if (!faqs.length) return null

  return (
    <section className="border-t border-border/40 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <Heading className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
          {title}
        </Heading>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}

        <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
