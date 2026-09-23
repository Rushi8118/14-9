import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://siddhivinayakoverseas.com'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, BookOpen, Globe2, CheckCircle2, ArrowRight, Building2, MapPin, Award, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FlagIcon } from '@/components/flag-icon'

const PARTNER_UNIVERSITIES = [
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    href: "/study-in-uk",
    description: "Unlock world-class education and build a global future with 2-year post-study work visa options.",
    universities: [
      "University of Huddersfield", "University of Leicester", "University of Roehampton",
      "Coventry University", "Buckinghamshire New University", "Northumbria University QAHE",
      "Ulster University QAHE", "Aston University - London Campus", "University of Greenwich",
      "Middlesex University", "University of Law", "University of Wales Trinity Saint David",
      "University of West London", "University of East London", "University of Hull - London",
      "Anglia Ruskin University", "University of Chester", "Royal Holloway University of London",
      "Swansea University", "Teesside University", "University of Bedfordshire",
      "Cardiff Metropolitan University", "Edinburgh Napier University", "Glasgow Caledonian University",
      "London Metropolitan University", "Oxford Brookes University", "De Montfort University",
      "UCLAN", "Navitas Foundation"
    ]
  },
  {
    country: "France",
    flag: "🇫🇷",
    href: "/study-in-france",
    description: "A destination for innovation, culture & excellence with affordable tuition and great career opportunities.",
    universities: [
      "Schiller International University, Paris Campus", "Burgundy School of Business",
      "ICN Business School", "MediaSchool Paris", "EDC Paris Business School",
      "Aura International School of Management", "Neoma Business School",
      "ISC Paris School of Business", "Paris School of Business", "Skema Business School",
      "EPITA", "Rennes School of Business", "Toulouse Business School",
      "Montpellier Business School", "Aivancity School of AI & Data Science",
      "FH (Institut Francais De l'Hôtellerie)", "ISTEC"
    ]
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    href: "/study-in-germany",
    description: "Top-ranked universities with 18-month post-study work opportunities and high quality of life.",
    universities: [
      "Schiller University", "EU Business School", "ISM - International School of Management",
      "Arden University", "UE (Univ. of Europe for Applied Sciences)",
      "MDH (MediaDesign Hochschule)", "EBS Universitat", "Lancaster Uni Leipzig Campus"
    ]
  },
  {
    country: "Spain",
    flag: "🇪🇸",
    href: "/study-in-spain",
    description: "European study options with Spanish and English-taught programs across business, design and hospitality.",
    universities: [
      "EU Business School Barcelona", "Schiller International University Madrid",
      "IE University pathways", "CETT Barcelona Hospitality", "Barcelona School of Management options"
    ]
  },
  {
    country: "Dubai",
    flag: "🇦🇪",
    href: "/study-in-dubai",
    description: "International campuses in Dubai / UAE with strong business, hospitality and aviation pathways.",
    universities: [
      "Heriot-Watt University Dubai", "Middlesex University Dubai",
      "University of Birmingham Dubai", "Amity University Dubai", "Manipal Academy Dubai"
    ]
  },
  {
    country: "Singapore",
    flag: "🇸🇬",
    href: "/study-in-singapore",
    description: "Premium Asian education hub with rigorous admissions and Student Pass pathways for enrolled students.",
    universities: [
      "National University of Singapore pathways", "Nanyang Technological University pathways",
      "Singapore Management University pathways", "PSB Academy", "Kaplan Singapore", "James Cook University Singapore"
    ]
  }
]

export default function StudyVisaPage() {
  return (
    <>
      <Helmet>
        <title>Study Visa Consultants in Surat | UK, France, Germany, Spain, Dubai, Singapore</title>
        <meta
          name="description"
          content="Study visa consultants in Surat for UK, France, Germany, Spain, Dubai and Singapore. University admissions, documentation and student-visa counselling."
        />
        <meta name="keywords" content="study visa consultants in Surat, study in UK France Germany Spain Dubai Singapore, overseas education consultants Surat" />
        <link rel="canonical" href={`${SITE_URL}/study-visa`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/study-visa`} />
        <meta property="og:title" content="Study Visa Consultants in Surat | UK, France, Germany, Spain, Dubai, Singapore" />
        <meta property="og:description" content="Study abroad counselling in Surat for UK, France, Germany, Spain, Dubai and Singapore." />
        <meta property="og:image" content={`${SITE_URL}/consultant-office.jpg`} />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:site_name" content="Siddhivinayak Overseas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Study Visa Consultants in Surat | Siddhivinayak Overseas" />
        <meta name="twitter:description" content="Study abroad counselling in Surat for Canada, UK, Australia, USA and Europe." />
        <meta name="twitter:image" content={`${SITE_URL}/consultant-office.jpg`} />
      </Helmet>
      <SiteHeader />
      <main className="premium-page min-h-screen bg-background pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative mb-12 overflow-hidden px-4 md:mb-20 md:px-6">
          <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <GraduationCap className="h-3.5 w-3.5" />
                  STUDY ABROAD PROGRAMS 2026
                </div>
                <h1
                  className="mb-5 font-serif font-bold leading-tight text-foreground"
                  style={{ fontSize: "clamp(2rem, 8vw, 4.5rem)" }}
                >
                  Study Visa Consultants <br />
                  <span className="text-primary">in Surat</span>
                </h1>
                <p className="mb-7 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                  Primary study destinations: UK, France, Germany, Spain, Dubai and Singapore — plus additional pathways where your profile fits. Course shortlisting to student-visa documentation.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button asChild size="lg" className="btn-glow h-12 rounded-full bg-primary px-8 text-primary-foreground">
                    <Link to="/contact">Apply for Admission</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 rounded-full border-primary/20 hover:bg-primary/5 px-8">
                    Explore Universities
                  </Button>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border/60 pt-8 md:gap-8">
                  <div>
                    <p className="text-3xl font-bold text-foreground">70+</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Partner Unis</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">6</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Study Countries</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">24/7</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Expert Support</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative overflow-hidden rounded-3xl border border-border/60 shadow-2xl"
              >
                <div className="relative h-[340px] sm:h-[440px] md:h-[520px] lg:h-[600px] w-full overflow-hidden rounded-3xl">
                  <img
                    src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80"
                    alt="Students with passports and global study visa planning"
                    width={1200}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-card/75 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Intake Status: Open</p>
                  </div>
                  <p className="text-sm text-foreground/90 font-medium">Now accepting applications for Sept 2026 intake across all partner institutions.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Support Services */}
        <section className="py-20 bg-primary/5">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {[
                { icon: <Users className="h-6 w-6" />, label: "Expert Counselling" },
                { icon: <Building2 className="h-6 w-6" />, label: "Admission Support" },
                { icon: <Award className="h-6 w-6" />, label: "Visa Filing & Prep" },
                { icon: <Globe2 className="h-6 w-6" />, label: "Worldwide Opportunities" },
                { icon: <CheckCircle2 className="h-6 w-6" />, label: "Post-Arrival Support" }
              ].map((service, i) => (
                <div key={i} className="group flex flex-col items-center text-center gap-3">
                  <div className="service-icon-hover h-14 w-14 rounded-2xl bg-background border border-primary/20 flex items-center justify-center text-primary shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40 group-hover:bg-primary/10">
                    {service.icon}
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight transition-colors duration-300 group-hover:text-primary">
                    {service.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Countries & Universities */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold text-foreground">Our Partner <span className="text-primary">Universities</span></h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">We exclusively represent prestigious institutions across Europe and the UK.</p>
            </div>

            <div className="space-y-20">
              {PARTNER_UNIVERSITIES.map((country, idx) => (
                <motion.div
                  key={country.country}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-border pb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <FlagIcon country={country.country} className="text-2xl" />
                        <h3 className="text-3xl font-bold text-foreground">Study in {country.country}</h3>
                      </div>
                      <p className="text-muted-foreground max-w-xl">{country.description}</p>
                      {'href' in country && country.href ? (
                        <Link to={country.href} className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
                          Open {country.country} study page →
                        </Link>
                      ) : null}
                    </div>
                    <Button asChild variant="link" className="text-primary font-bold p-0 h-auto">
                      <Link to="/contact">Apply for {country.country} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {country.universities.map((uni, i) => (
                      <div
                        key={i}
                        className="group flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card/70 transition duration-300 hover:border-primary/30 hover:bg-primary/10 hover:shadow-xl hover:shadow-primary/5"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                          {i + 1}
                        </div>
                        <span className="uni-name-hover text-sm font-medium text-foreground/90 transition duration-300 group-hover:text-primary motion-safe:group-hover:scale-[1.02] motion-safe:group-hover:translate-x-1">
                          {uni}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 md:px-6 md:py-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary p-8 text-center text-primary-foreground shadow-glow md:p-12">
            <Globe2 className="absolute -bottom-20 -right-20 h-80 w-80 rotate-12 text-white/10" />
            <h2 className="relative z-10 mb-4 font-serif font-bold md:mb-6" style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)" }}>Ready to start your journey?</h2>
            <p className="relative z-10 mx-auto mb-7 max-w-2xl text-base text-primary-foreground/90 md:mb-8 md:text-lg">
              Get personalized counselling from our experts and secure your seat in one of our partner universities today.
            </p>
            <Button asChild size="lg" variant="secondary" className="relative z-10 rounded-full h-12 px-10 font-bold">
              <Link to="/contact">Book Free Consultation</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
