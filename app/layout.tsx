import * as React from 'react'
import { ThemeProvider } from '../components/theme-provider'
import { Toaster } from '../components/ui/sonner'
import './globals.css'

interface Metadata {
  metadataBase?: URL
  title?: { default?: string; template?: string }
  description?: string
  applicationName?: string
  keywords?: string[]
  authors?: { name: string }[]
  creator?: string
  publisher?: string
  category?: string
  alternates?: { canonical?: string }
  openGraph?: Record<string, unknown>
  twitter?: Record<string, unknown>
  robots?: Record<string, unknown>
  icons?: Record<string, unknown>
  manifest?: string
  other?: Record<string, string>
  generator?: string
}

interface Viewport {
  themeColor?: Array<{ media?: string; color: string }>
  width?: string
  initialScale?: number
  maximumScale?: number
  userScalable?: boolean
  colorScheme?: string
}

const SITE_URL = "https://new-siddhivinayakoverseas.vercel.app"
const COMPANY_NAME = "Siddhivinayak Overseas"
const COMPANY_DESCRIPTION = "Overseas education consultants in India. We help students & fresh graduates study abroad or get work visas to USA, UK, Canada, Australia, Japan & more."
const COMPANY_PHONE = "+919925064666"
const COMPANY_EMAIL = "info@siddhivinayakoverseas.com"
const COMPANY_ADDRESS = {
  street: "Office No. 301, 3rd Floor, SNS Square, Opp. Sargam Shopping Center",
  locality: "Surat",
  region: "Gujarat",
  postalCode: "395006",
  country: "IN",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COMPANY_NAME} | Overseas Education Consultants in India — Work & Study Visas`,
    template: `%s | ${COMPANY_NAME}`,
  },
  description: COMPANY_DESCRIPTION,
  applicationName: COMPANY_NAME,
  keywords: [
    "overseas education consultants in India",
    "study abroad consultants",
    "overseas education services",
    "international education guidance",
    "study abroad assistance India",
    "work visa consultant",
    "study visa consultant",
    "student visa consultants",
    "work visa for fresh graduates",
    "work visa age 18 to 34",
    "fresh graduates abroad",
    "Japan work visa",
    "Australia work visa",
    "Canada work visa",
    "UK work visa",
    "Germany work visa",
    "New Zealand work visa",
    "Russia work visa",
    "USA work visa",
    "overseas consultancy India",
    "study in USA consultants",
    "study in UK consultants",
    "study in Canada consultants",
    "study in Australia consultants",
    "best study abroad consultants",
    "immigration consultant Surat",
    "visa consultancy Gujarat",
    "abroad jobs",
    "skilled migration visa",
    "Siddhivinayak Overseas",
  ],
  authors: [{ name: COMPANY_NAME }],
  creator: COMPANY_NAME,
  publisher: COMPANY_NAME,
  category: "Immigration & Visa Consultancy",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: COMPANY_NAME,
    title: `${COMPANY_NAME} | Overseas Education Consultants in India — Work & Study Visas`,
    description: COMPANY_DESCRIPTION,
    images: [
      {
        url: "/consultant-office.jpg",
        width: 1200,
        height: 630,
        alt: `${COMPANY_NAME} — Overseas Education and Visa Consultants`,
      },
    ],
    phoneNumbers: [COMPANY_PHONE],
    emails: [COMPANY_EMAIL],
    countryName: "India",
  },
  twitter: {
    card: "summary_large_image",
    title: `${COMPANY_NAME} | Overseas Education Consultants in India`,
    description: COMPANY_DESCRIPTION,
    images: ["/consultant-office.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  other: {
    "google-site-verification": "YOUR_GOOGLE_VERIFICATION_CODE",
    "msvalidate.01": "YOUR_BING_VERIFICATION_CODE",
    "facebook-domain-verification": "YOUR_FACEBOOK_VERIFICATION_CODE",
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a1a2e" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: COMPANY_NAME,
        description: COMPANY_DESCRIPTION,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon/favicon-32x32.png`,
        image: `${SITE_URL}/consultant-office.jpg`,
        telephone: COMPANY_PHONE,
        email: COMPANY_EMAIL,
        address: {
          "@type": "PostalAddress",
          streetAddress: COMPANY_ADDRESS.street,
          addressLocality: COMPANY_ADDRESS.locality,
          addressRegion: COMPANY_ADDRESS.region,
          postalCode: COMPANY_ADDRESS.postalCode,
          addressCountry: COMPANY_ADDRESS.country,
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: COMPANY_PHONE,
            contactType: "customer service",
            availableLanguage: ["English", "Hindi", "Gujarati"],
          },
          {
            "@type": "ContactPoint",
            telephone: COMPANY_PHONE,
            contactType: "sales",
            availableLanguage: ["English", "Hindi", "Gujarati"],
          },
        ],
        sameAs: [
          `https://${COMPANY_NAME.toLowerCase().replace(/\s+/g, "")}.com`,
          `https://wa.me/${COMPANY_PHONE.replace(/[^0-9]/g, "")}`,
        ],
        areaServed: [
          { "@type": "Country", name: "Japan" },
          { "@type": "Country", name: "Australia" },
          { "@type": "Country", name: "Canada" },
          { "@type": "Country", name: "United Kingdom" },
          { "@type": "Country", name: "Germany" },
          { "@type": "Country", name: "New Zealand" },
          { "@type": "Country", name: "Russia" },
          { "@type": "Country", name: "United States" },
          { "@type": "Country", name: "United Arab Emirates" },
        ],
        serviceType: [
          "Work Visa Consulting",
          "Study Visa Consulting",
          "Student Visa Assistance",
          "University Admissions",
          "Immigration Services",
          "Scholarship Guidance",
          "Visa Documentation",
          "Language Coaching",
        ],
        foundingDate: "2018",
        numberOfEmployees: { "@type": "QuantitativeValue", minValue: 10, maxValue: 50 },
      },
      {
        "@type": "LocalBusiness",
        name: COMPANY_NAME,
        description: COMPANY_DESCRIPTION,
        url: SITE_URL,
        image: `${SITE_URL}/consultant-office.jpg`,
        telephone: COMPANY_PHONE,
        email: COMPANY_EMAIL,
        address: {
          "@type": "PostalAddress",
          streetAddress: COMPANY_ADDRESS.street,
          addressLocality: COMPANY_ADDRESS.locality,
          addressRegion: COMPANY_ADDRESS.region,
          postalCode: COMPANY_ADDRESS.postalCode,
          addressCountry: COMPANY_ADDRESS.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 21.1702,
          longitude: 72.8311,
        },
        openingHoursSpecification: [
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "10:00", closes: "19:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "10:00", closes: "19:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "10:00", closes: "19:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "10:00", closes: "19:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "10:00", closes: "19:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "17:00" },
        ],
        priceRange: "₹₹",
        areaServed: ["India", "Japan", "Australia", "Canada", "United Kingdom", "Germany", "New Zealand", "Russia", "United States"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Visa and Education Services",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Work Visa Filing" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Study Visa & Admissions" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Student Visa Assistance" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Language Coaching" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Documentation & SOPs" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Scholarship Guidance" } },
          ],
        },
      },
      {
        "@type": "WebSite",
        name: COMPANY_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "AggregateRating",
        itemReviewed: {
          "@type": "Organization",
          name: COMPANY_NAME,
        },
        ratingValue: "4.8",
        reviewCount: "5000",
        bestRating: "5",
        worstRating: "1",
      },
    ],
  }

  return (
    <html
      lang="en"
      className="bg-background"
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={COMPANY_NAME} />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && (
          <script
            id="pwa-sw-register"
            dangerouslySetInnerHTML={{
              __html: `
                if ("serviceWorker" in navigator) {
                  window.addEventListener("load", () => {
                    navigator.serviceWorker.register("/sw.js").catch(() => {});
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}