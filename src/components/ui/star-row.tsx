/**
 * Star ratings rendered from one shared SVG symbol instead of one SVG each.
 *
 * WHY
 *
 * Lucide renders a complete inline <svg> per icon instance: for the star, 649
 * bytes of identical path data every time. The homepage rendered 35 of them --
 * 22.6 KB, 14% of a 163 KB document, for a shape that appears once. That is the
 * single largest reducible component of the page's HTML, and an external audit
 * flagged the document size (159.9 KB against a 100 KB guideline).
 *
 * A <symbol> defined once plus a <use> per star costs roughly 90 bytes each, so
 * the same 35 stars cost about 3 KB instead of 22.6 KB.
 *
 * The path, viewBox and stroke attributes below are copied verbatim out of the
 * rendered Lucide output so the stars look identical -- this is a transport
 * change, not a design change. If Lucide's star path ever changes upstream, the
 * two will diverge silently, which is why StarRow is used everywhere rather than
 * some components keeping <Star> and others not.
 *
 * `aria-hidden` throughout: every call site already treated these as decorative
 * and supplied the rating in text. A screen reader should hear "4.8 out of 5",
 * not five images named "star".
 */

/** The shared symbol. Must be rendered once per page, before or alongside any StarRow. */
export function StarSprite() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <symbol
        id="sv-star"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
      </symbol>
    </svg>
  )
}

type StarRowProps = {
  /** How many stars to draw. */
  count?: number
  /** How many of them are filled. Defaults to all. */
  filled?: number
  /** Applied to each star, e.g. "h-3 w-3". */
  starClassName?: string
  /** Class for a filled star. */
  filledClassName?: string
  /** Class for an unfilled star. */
  emptyClassName?: string
  /** Class for the wrapper. */
  className?: string
}

export function StarRow({
  count = 5,
  filled,
  starClassName = 'h-4 w-4',
  filledClassName = 'fill-primary text-primary',
  emptyClassName = 'text-muted-foreground/30',
  className = 'flex gap-1',
}: StarRowProps) {
  const lit = filled ?? count
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className={`${starClassName} ${i < lit ? filledClassName : emptyClassName}`}
          aria-hidden="true"
          focusable="false"
        >
          <use href="#sv-star" />
        </svg>
      ))}
    </div>
  )
}
