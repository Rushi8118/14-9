import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'

export type FloatingInfoCardProps = {
  title: string
  detail: string
  icon: LucideIcon
  /** Corner around the globe on larger screens (cards form a grid on mobile). */
  position: 'tl' | 'tr' | 'bl' | 'br'
  /** Seconds to offset the gentle float so cards don't move together. */
  delay?: number
  accent?: 'gold' | 'cyan'
}

export function FloatingInfoCard({ title, detail, icon: Icon, position, delay = 0, accent = 'cyan' }: FloatingInfoCardProps) {
  return (
    <li
      className={`lbb-card lbb-card--${position}${accent === 'gold' ? ' lbb-card--gold' : ''}`}
      style={{ '--float-delay': `${delay}s` } as CSSProperties}
      data-card
    >
      {/* GSAP animates the <li>; the CSS float runs on this inner element so they never fight. */}
      <div className="lbb-card__inner">
        <span className="lbb-card__icon" aria-hidden="true">
          <Icon />
        </span>
        <span>
          <strong>{title}</strong>
          <span className="lbb-card__detail">{detail}</span>
        </span>
      </div>
    </li>
  )
}
