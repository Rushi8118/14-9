import { Link } from 'react-router-dom'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="lbb-footer">
      <div className="lbb-container lbb-footer__inner">
        <p className="lbb-footer__tagline">Your journey to a new future starts with the right direction.</p>
        <div className="lbb-footer__meta">
          <p>© {year} Siddhivinayak Overseas. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
