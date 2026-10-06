import { CheckCircle2, Users, Headphones, FileCheck2, Globe } from 'lucide-react'

const POINTS = [
  {
    icon: Users,
    title: 'Dedicated case officer',
    desc: 'One expert from start to landing — never a call center.',
  },
  {
    icon: FileCheck2,
    title: 'Transparent pricing',
    desc: 'No hidden fees. Detailed quote before you sign anything.',
  },
  {
    icon: Globe,
    title: 'Global employer network',
    desc: 'Direct partnerships with vetted employers across multiple countries.',
  },
  {
    icon: Headphones,
    title: 'Post-landing support',
    desc: 'Settlement help, banking, SIM, accommodation — even after you land.',
  },
]

export function WhyUs() {
  return (
    <section id="why-us" className="relative scroll-mt-24 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 shadow-xl">
              {/*
                Drawn 588px wide on desktop (max-w-7xl less 48px padding, half of
                a 12-column grid with a 56px gap) and full-viewport below `lg`,
                which is what `sizes` describes. Before this it served one
                1024x1024 file to every viewport and relied on `object-cover` to
                crop it to 3:2 — so a phone downloaded 93KB to display roughly a
                tenth of those pixels. The variants are pre-cropped to 3:2 by
                scripts/optimize-images.mjs, so the intrinsic dimensions below
                now describe the actual file and `object-cover` has nothing left
                to crop.

                WebP first, JPEG second: the WebP is a little over half the size
                and every browser that cannot read it falls through to the JPEG
                srcset rather than to a single large file.
              */}
              <picture>
                <source
                  type="image/webp"
                  srcSet="/consultant-office-400.webp 400w, /consultant-office-800.webp 800w, /consultant-office-1024.webp 1024w"
                  sizes="(min-width: 1024px) 588px, 100vw"
                />
                <img
                  src="/consultant-office-800.jpg"
                  srcSet="/consultant-office-400.jpg 400w, /consultant-office-800.jpg 800w, /consultant-office-1024.jpg 1024w"
                  sizes="(min-width: 1024px) 588px, 100vw"
                  alt="Siddhivinayak Overseas consultant guiding a client through visa documentation"
                  width={800}
                  height={533}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full"
                />
              </picture>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-tr from-background/50 via-transparent to-primary/10"
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-primary/30 bg-background/90 p-3 md:left-auto md:right-4 md:max-w-[240px]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-serif text-xl font-semibold leading-none text-foreground">6+</p>
                  <p className="mt-1 text-xs text-muted-foreground">Years of guidance</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <h2 className="font-serif text-3xl font-semibold leading-tight text-balance text-foreground md:text-4xl">
              Why thousands choose <span className="text-primary">Siddhivinayak Overseas</span>
            </h2>
            <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
              Clear advice, ethical practice, and dedicated follow-through for study and work visa journeys from Surat.
            </p>

            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {POINTS.map((p) => (
                <li
                  key={p.title}
                  className="rounded-2xl border border-border/60 bg-card/50 p-4"
                >
                  <div className="card-icon flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                    <p.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-3 font-semibold text-foreground">{p.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
