import { useId } from 'react'

const MARKERS = [
  { x: 232, y: 214, color: '#f0c064', r: 5 },
  { x: 118, y: 150, color: '#46dcf7', r: 3.5 },
  { x: 286, y: 118, color: '#46dcf7', r: 3.5 },
  { x: 300, y: 268, color: '#46dcf7', r: 3.5 },
] as const

const MERIDIANS = [150, 118, 76, 30]
const PARALLELS = [-100, -50, 0, 50, 100]

/**
 * Lightweight SVG globe used while the 3D scene loads, and permanently when WebGL is
 * unavailable. Same palette and composition, no JavaScript animation.
 */
export function GlobeFallback({ loading = false }: { loading?: boolean }) {
  const id = useId().replace(/:/g, '')

  return (
    <div className={`lbb-fallback${loading ? ' lbb-fallback--loading' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 400 400" focusable="false">
        <defs>
          <radialGradient id={`${id}-core`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#1b3a9e" />
            <stop offset="55%" stopColor="#0a1a4f" />
            <stop offset="100%" stopColor="#050c2a" />
          </radialGradient>
          <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
            <stop offset="62%" stopColor="#46dcf7" stopOpacity="0" />
            <stop offset="78%" stopColor="#46dcf7" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#7a5cff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-route`} x1="0" x2="1">
            <stop offset="0%" stopColor="#f0c064" />
            <stop offset="100%" stopColor="#46dcf7" />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <circle cx="200" cy="200" r="150" />
          </clipPath>
        </defs>

        <circle cx="200" cy="200" r="196" fill={`url(#${id}-halo)`} />
        <circle cx="200" cy="200" r="150" fill={`url(#${id}-core)`} />

        <g clipPath={`url(#${id}-clip)`} fill="none" stroke="#6f93ff" strokeOpacity="0.22" strokeWidth="1">
          {MERIDIANS.map((rx) => (
            <ellipse key={`m-${rx}`} cx="200" cy="200" rx={rx} ry="150" />
          ))}
          {PARALLELS.map((dy) => {
            const rx = Math.sqrt(150 * 150 - dy * dy)
            return <ellipse key={`p-${dy}`} cx="200" cy={200 + dy} rx={rx} ry={rx * 0.16} />
          })}
        </g>
        <circle cx="200" cy="200" r="150" fill="none" stroke="#46dcf7" strokeOpacity="0.35" />

        <g fill="none" strokeWidth="1.6" strokeLinecap="round" stroke={`url(#${id}-route)`}>
          <path className="lbb-fallback__route" d="M232 214 Q 170 120 118 150" />
          <path className="lbb-fallback__route" d="M232 214 Q 300 150 286 118" />
          <path className="lbb-fallback__route" d="M232 214 Q 318 250 300 268" />
        </g>

        {MARKERS.map((marker) => (
          <g key={`${marker.x}-${marker.y}`}>
            <circle cx={marker.x} cy={marker.y} r={marker.r * 3} fill={marker.color} opacity="0.18" />
            <circle cx={marker.x} cy={marker.y} r={marker.r} fill={marker.color} />
          </g>
        ))}
      </svg>
    </div>
  )
}
