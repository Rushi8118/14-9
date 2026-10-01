import { Quote, ArrowRight } from 'lucide-react'
import { StarRow } from '@/components/ui/star-row'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { customerReviews, getReviewInitials } from '@/lib/reviews-data'
import { TrustedUsers } from '@/components/trusted-users'

export function Testimonials() {
  const homeReviews = customerReviews.slice(0, 6)

  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-semibold leading-tight text-balance text-foreground md:text-4xl">
            Real journeys. <span className="text-primary">Real outcomes.</span>
          </h2>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
            Hear from candidates we supported with study and work visa journeys.
          </p>
          <div className="mt-6 flex justify-center">
            <TrustedUsers
              initials={homeReviews.slice(0, 4).map((r) => getReviewInitials(r.name))}
              totalUsersText={500}
            />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {homeReviews.map((t) => (
            <figure
              key={t.id}
              className="lift-card relative flex flex-col rounded-2xl border border-border/60 bg-card/60 p-5"
            >
              <Quote aria-hidden="true" className="absolute right-4 top-4 h-7 w-7 text-primary/20" />
              <div className="mb-3 flex items-center gap-3">
                <div className="card-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {getReviewInitials(t.name)}
                </div>
                <StarRow
                  count={5}
                  filled={t.rating}
                  starClassName="h-3 w-3"
                  className="flex gap-0.5"
                />
              </div>
              <blockquote className="grow text-sm leading-relaxed text-foreground/90 italic">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 border-t border-border/60 pt-3">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.visa} · {t.country}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/reviews" className="inline-flex items-center gap-2">
              Read all reviews
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
