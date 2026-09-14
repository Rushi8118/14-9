import { useEffect, useId, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Immigration Services', to: '/services' },
  { label: 'Destinations', to: '/countries' },
  { label: 'Contact', to: '/contact' },
] as const

/** Original compass-rose mark used as the text logo's emblem. */
function CompassMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
      <path d="M12 3.5 14.2 12 12 20.5 9.8 12Z" fill="currentColor" />
      <path d="M3.5 12 12 10.4 20.5 12 12 13.6Z" fill="#9fe9fb" fillOpacity="0.85" />
      <circle cx="12" cy="12" r="1.4" fill="#050b20" />
    </svg>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="lbb-header" data-anim="header">
      <div className="lbb-container lbb-header__inner">
        <Link to="/" className="lbb-logo" aria-label="Siddhivinayak Overseas home">
          <span className="lbb-logo__mark">
            <CompassMark />
          </span>
          <span className="lbb-logo__text">
            Siddhivinayak
            <small>Overseas</small>
          </span>
        </Link>

        <nav aria-label="Primary">
          <button
            type="button"
            className="lbb-menu-btn"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
          <ul id={menuId} className={`lbb-nav${open ? ' is-open' : ''}`}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className="lbb-nav__link" onClick={() => setOpen(false)}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
