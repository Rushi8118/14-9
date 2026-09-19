import { useId } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Home, MessageCircle } from 'lucide-react'

/** A thin animated route that "lands" on the Return Home button. */
function RouteLead() {
  const gradientId = `${useId().replace(/:/g, '')}-route-lead`
  const path = 'M146 4 C 100 4, 44 8, 24 40'

  return (
    <svg className="lbb-route-lead" viewBox="0 0 150 44" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="1" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#46dcf7" stopOpacity="0" />
          <stop offset="55%" stopColor="#46dcf7" />
          <stop offset="100%" stopColor="#f0c064" />
        </linearGradient>
      </defs>
      <path className="lbb-route-lead__base" d={path} />
      <path className="lbb-route-lead__flow" d={path} stroke={`url(#${gradientId})`} />
      <circle cx="146" cy="4" r="2.4" fill="#46dcf7" />
      <circle className="lbb-route-lead__end" cx="24" cy="40" r="3" fill="#f0c064" />
    </svg>
  )
}

export function HeroContent() {
  return (
    <div className="lbb-hero">
      <p className="lbb-eyebrow" data-reveal>
        <span className="lbb-eyebrow__dot" aria-hidden="true" />
        Navigation error <span aria-hidden="true">/</span> 404
      </p>

      <h1 className="lbb-title" data-reveal>
        Page <span className="lbb-title__accent">not found</span>
      </h1>

      <p className="lbb-lead" data-reveal>
        The page you are looking for may have moved, expired, or no longer exists. Let us help you find the right
        destination for your study or career journey.
      </p>

      <div className="lbb-actions" data-reveal>
        <div className="lbb-primary-wrap">
          <RouteLead />
          <Link to="/" className="lbb-btn lbb-btn--primary">
            <Home aria-hidden="true" />
            Go to homepage
            <ArrowRight className="lbb-btn__arrow" aria-hidden="true" />
          </Link>
        </div>
        <div className="lbb-secondary">
          <Link to="/study-visa" className="lbb-btn lbb-btn--glass">
            <Compass aria-hidden="true" />
            Explore study visas
          </Link>
          <Link to="/work-visa" className="lbb-btn lbb-btn--glass">
            <Compass aria-hidden="true" />
            Explore work visas
          </Link>
          <Link to="/contact" className="lbb-btn lbb-btn--text">
            <MessageCircle aria-hidden="true" />
            Contact our experts
          </Link>
        </div>
      </div>

      <p className="lbb-help" data-reveal>
        Followed a link from our site? <Link to="/contact">Tell us</Link> and we’ll fix the route.
      </p>
    </div>
  )
}
