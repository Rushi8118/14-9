import { SOCIAL_LINKS } from '@/lib/seo/site'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'
import { cn } from '@/lib/utils'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  )
}

const PROFILES = [
  { ...SOCIAL_LINKS.instagram, key: 'instagram', Icon: InstagramIcon, hover: 'hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] hover:text-white hover:ring-transparent' },
  { ...SOCIAL_LINKS.facebook, key: 'facebook', Icon: FacebookIcon, hover: 'hover:bg-[#1877f2] hover:text-white hover:ring-transparent' },
] as const

/** Round icon links to the official Instagram and Facebook pages. */
export function SocialLinks({ source, className }: { source: string; className?: string }) {
  return (
    <ul className={cn('flex items-center gap-2', className)} aria-label="Follow Siddhivinayak Overseas">
      {PROFILES.map(({ key, label, url, Icon, hover }) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            title={label}
            onClick={() => trackEvent('social_click', 'Engagement', `${label} Click - ${source}`)}
            className={cn(
              'grid h-10 w-10 place-items-center rounded-full bg-primary/5 text-primary ring-1 ring-primary/20 transition-all duration-200 hover:-translate-y-0.5',
              hover,
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  )
}
