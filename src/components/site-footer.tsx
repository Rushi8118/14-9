import { useState } from "react"
import { trackEvent, GA_EVENTS } from "@/lib/analytics"
import { NAP } from "@/lib/seo/site"
import { SocialLinks } from "@/components/social-links"
import { Link } from "react-router-dom"
import {
  Globe2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  Zap,
  Clock,
  Heart,
} from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="footer-gold-border border-t border-primary/10 bg-background/95">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">

        {/* Main Footer */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-10">

          {/* Company Info */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/95 ring-1 ring-primary/20 overflow-hidden">
                <img
                  src="/favicon/android-chrome-512x512.png"
                  alt="Siddhivinayak Overseas logo"
                  className="h-8 w-8 object-contain"
                />
              </span>

              <div className="flex flex-col leading-tight">
                <span className="font-serif text-2xl font-bold text-foreground">
                  Siddhivinayak
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Overseas
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              Premium overseas education consultancy for UK, Germany & France.
              Trusted by Indian students and families for admissions,
              UK Visa & COS assistance.
            </p>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">
                  Free Consultation
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">
                  Fast Response
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5">
                <Heart className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium">
                  Expert Guidance
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium">
                  24/7 Support
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.15em] text-primary">Follow us</p>
              <SocialLinks source="Footer" />
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Services
            </h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/study-visa"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Study in UK
                </Link>
              </li>

              <li>
                <Link
                  to="/study-visa"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Study in Germany
                </Link>
              </li>

              <li>
                <Link
                  to="/study-visa"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Study in France
                </Link>
              </li>

              <li>
                <Link
                  to="/services"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  UK Visa & COS
                </Link>
              </li>

              <li>
                <Link
                  to="/services"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  University Admissions
                </Link>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Destinations
            </h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/study-in-usa"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  USA
                </Link>
              </li>
              <li>
                <Link
                  to="/study-in-uk"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  United Kingdom
                </Link>
              </li>
              <li>
                <Link
                  to="/study-in-canada"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Canada
                </Link>
              </li>
              <li>
                <Link
                  to="/study-in-australia"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Australia
                </Link>
              </li>
              <li>
                <Link
                  to="/study-in-germany"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Germany
                </Link>
              </li>
              <li>
                <Link
                  to="/study-in-ireland"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Ireland
                </Link>
              </li>
              <li>
                <Link
                  to="/work-visa/japan"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Japan Work Visa
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Company
            </h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/visa-consultants-in-surat"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Surat Office
                </Link>
              </li>

              <li>
                <Link
                  to="/urgent-requirements"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary flex items-center gap-1.5"
                >
                  <span className="text-red-500">🔥</span> Urgent Openings
                </Link>
              </li>

              <li>
                <Link
                  to="/blog"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Blog
                </Link>
              </li>

              <li>
                <Link
                  to="/success-stories"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Success Stories
                </Link>
              </li>

              <li>
                <Link
                  to="/reviews"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Reviews
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="min-w-[260px]">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Contact
            </h3>

            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary footer-icon-hover" />
                <span className="text-muted-foreground">
                  620, 6th Floor, Pragti IT Park,
                  Kiran Chowk to Yogi Chowk Road,
                  Surat, Gujarat, India
                </span>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary footer-icon-hover" />
                <a
                  href={`tel:${NAP.phoneIN}`}
                  onClick={() => trackEvent(GA_EVENTS.PHONE_CLICK, 'Engagement', 'Phone Click - Footer IN')}
                  className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  {NAP.phoneINDisplay}
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary footer-icon-hover" />
                <a
                  href={`tel:${NAP.phone2IN}`}
                  onClick={() => trackEvent(GA_EVENTS.PHONE_CLICK, 'Engagement', 'Phone Click - Footer IN Alt')}
                  className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  {NAP.phone2INDisplay}
                </a>
              </li>

              <li className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500 footer-icon-hover" />
                <a
                  href="https://wa.me/919925064666"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent(GA_EVENTS.WHATSAPP_CLICK, 'Engagement', 'WhatsApp Click - Footer')}
                  className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  WhatsApp Us
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary footer-icon-hover" />
                <a
                  href="mailto:info@siddhivinayakoverseas.com"
                  onClick={() => trackEvent(GA_EVENTS.FORM_SUBMIT, 'Engagement', 'Email Click - Footer')}
                  className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  info@siddhivinayakoverseas.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Siddhivinayak Overseas.
            All Rights Reserved.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              Terms of Service
            </Link>

            <Link
              to="/privacy"
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              Cookie Policy
            </Link>

            <Link
              to="/"
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Floating WhatsApp FAB — meant to be placed at page level (e.g. HomePage) */
export function WhatsAppFab() {
  const [interacted, setInteracted] = useState(false)

  return (
    <a
      href="https://wa.me/919925064666"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setInteracted(true)
        trackEvent(GA_EVENTS.WHATSAPP_CLICK, 'Engagement', 'WhatsApp Click - FAB')
      }}
      className={`whatsapp-fab ${interacted ? 'interacted' : ''}`}
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  )
}