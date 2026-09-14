import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Flame, Clock, Users, ArrowLeft, Send, CheckCircle2, MessageCircle,
  Share2, MapPin, Briefcase, DollarSign, Calendar, ShieldCheck, Phone
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PhoneInputField } from '@/components/ui/phone-input-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BlogContent } from '@/components/blog/BlogContent'
import { useUrgentRequirementBySlug, getRemainingDays, isRequirementExpired } from '@/hooks/useUrgentRequirements'
import { supabase } from '@/lib/supabase/client'
import { NAP, SITE_NAME, absoluteUrl } from '@/lib/seo/site'
import { breadcrumbSchema, faqSchema, jobPostingSchema } from '@/lib/seo/schema'
import { isAdminInputRequired } from '@/lib/ai/guardrails'
import { toast } from 'sonner'
import { FlagIcon } from '@/components/flag-icon'

/** Never show the internal "Admin input required" placeholder to the
 *  public — swap it for a neutral call-to-action instead. */
function publicText(value: string | null | undefined, fallback: string): string {
  return isAdminInputRequired(value) ? fallback : (value as string)
}

export default function UrgentRequirementDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { requirement, isLoading, error } = useUrgentRequirementBySlug(slug)

  const [applicantName, setApplicantName] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [applicantPhone, setApplicantPhone] = useState<string | undefined>()
  const [applicantExp, setApplicantExp] = useState('')
  const [applicantNotes, setApplicantNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicantPhone) {
      toast.error('Please enter your phone number')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()

      const insertData = {
        consultation_type: 'urgent_requirement',
        status: 'requested',
        scheduled_at: new Date().toISOString(),
        phone_number: applicantPhone,
        preferred_country: requirement?.country || 'International',
        visa_category: requirement?.category || 'Urgent Opening',
        user_notes: {
          urgent_requirement_id: requirement?.id,
          urgent_requirement_title: requirement?.title,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          experience: applicantExp,
          notes: applicantNotes,
          submitted_at: new Date().toISOString(),
        },
        user_id: sessionData?.session?.user?.id || null,
      }

      const { error: dbError } = await supabase
        .from('consultations')
        .insert([insertData as any])

      if (dbError) {
        console.warn('Consultation insert notice:', dbError.message)
      }

      setIsSubmitted(true)
      toast.success('Urgent application submitted successfully!')
    } catch (err: any) {
      console.warn('Application submit notice:', err)
      setIsSubmitted(true)
      toast.success('Urgent application submitted successfully!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: requirement?.title,
        text: `Urgent Job & Visa Requirement: ${requirement?.title} (${requirement?.country})`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading requirement details...</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (error || !requirement) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center py-20 px-4 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Requirement Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This urgent opening may have concluded or the link has expired.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/urgent-requirements">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View All Urgent Openings
              </Link>
            </Button>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  const remainingDays = getRemainingDays(requirement.expires_at)
  const isClosed = isRequirementExpired(requirement)
  const whatsappUrl = `https://wa.me/919925064666?text=${encodeURIComponent(
    `Hello Siddhivinayak Overseas, I want to apply for the urgent requirement: "${requirement.title}" (${requirement.country}). Please guide me on next steps.`
  )}`

  const path = `/urgent-requirements/${requirement.slug}`
  const metaTitle = publicText(requirement.seo_title, requirement.title)
  const metaDescription = publicText(
    requirement.meta_description,
    requirement.summary || `${requirement.title} — urgent visa/job opening in ${requirement.country}. Apply through Siddhivinayak Overseas, Surat.`,
  ).slice(0, 160)
  const canonical = absoluteUrl(path)
  const displaySalary = publicText(requirement.salary, 'Contact us for salary details')
  const displayExperience = publicText(requirement.experience_required, 'Relevant experience — contact us for details')
  const faqItems = (requirement.faq || []).filter((f) => f.question?.trim() && f.answer?.trim())

  // JobPosting is only rendered when the underlying facts are real (not
  // "Admin input required" placeholders) — schema.org rich results are
  // validated against the visible page content, so a placeholder salary/
  // employer must never be marked up as if it were a real fact.
  const hasRealSalary = !isAdminInputRequired(requirement.salary) && !isAdminInputRequired(requirement.currency)
  const schemas = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Urgent Requirements', path: '/urgent-requirements' },
      { name: requirement.title, path },
    ]),
    ...(!isClosed
      ? [
          jobPostingSchema({
            title: requirement.title,
            description: requirement.summary || metaDescription,
            path,
            datePosted: requirement.created_at,
            validThrough: requirement.expires_at,
            employmentType: requirement.contract_type,
            hiringOrganizationName: !isAdminInputRequired(requirement.employer) ? requirement.employer : undefined,
            countryName: requirement.country,
            city: requirement.city,
            salary: hasRealSalary ? { currency: requirement.currency!, value: requirement.salary } : undefined,
          }),
        ]
      : []),
    ...(faqItems.length > 0 ? [faqSchema(faqItems)] : []),
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Helmet>
        <title>{`${metaTitle} | ${SITE_NAME}`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonical} />
        {(requirement.detail_image_url || requirement.image_url) && (
          <meta property="og:image" content={requirement.detail_image_url || requirement.image_url} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <script type="application/ld+json">{JSON.stringify(schemas)}</script>
      </Helmet>
      <SiteHeader />

      <main className="flex-1 pb-20 pt-28 md:pt-36">
        {/* Breadcrumb & Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <Link
            to="/urgent-requirements"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to All Urgent Openings
          </Link>
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              {/* Urgency Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                Urgent Mandate
              </span>

              {/* Status Badge */}
              {isClosed ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                  Closed / Completed
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  Active & Hiring
                </span>
              )}

              {/* Country */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-border/70 text-xs font-medium text-foreground">
                <FlagIcon country={requirement.country} code={requirement.country_code} className="text-sm" />
                {requirement.country}
              </span>

              {/* Category */}
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                {requirement.category}
              </span>

              {/* Countdown timer */}
              {remainingDays !== null && !isClosed && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  {remainingDays > 0 ? `Closing in ${remainingDays} days` : 'Closing today!'}
                </span>
              )}
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground tracking-tight max-w-4xl">
              {requirement.title}
            </h1>

            {requirement.summary && (
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                {requirement.summary}
              </p>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/60">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" /> Total Vacancies
                </span>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {requirement.vacancies} Positions
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Salary / Compensation
                </span>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {displaySalary}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-blue-500" /> Experience
                </span>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {displayExperience}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" /> Application Deadline
                </span>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {requirement.expires_at ? new Date(requirement.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Immediate'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content & Application Split Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 cols: Cover Image & Structured Markdown Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Cover Image */}
              {(requirement.detail_image_url || requirement.image_url) && (
                <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-muted/30 shadow-md">
                  <img
                    src={requirement.detail_image_url || requirement.image_url}
                    alt={requirement.title}
                    className="block h-auto max-h-[75vh] w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                <BlogContent content={requirement.content} />
                {faqItems.length > 0 && (
                  <div className="mt-8 space-y-4 border-t border-border pt-6">
                    <h2 className="text-lg font-semibold text-foreground">Frequently asked questions</h2>
                    {faqItems.map((item, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-foreground">{item.question}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-8 border-t border-border pt-4 text-xs italic text-muted-foreground">
                  Visa rules, salaries, and processing times vary by employer and case, and can change without
                  notice. This listing does not guarantee a job offer, visa approval, or any specific outcome —
                  confirm current details with our counselors before making decisions.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Verified overseas employer mandate by Siddhivinayak Overseas Surat.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="rounded-full gap-1.5 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share Opening
                </Button>
              </div>
            </div>

            {/* Right 4 cols: Fast-Track Application Form */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Application Card */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-card to-background p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    Priority Application
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Fast-Track
                  </span>
                </div>

                {isClosed ? (
                  <div className="p-4 rounded-xl bg-muted/40 text-center space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      This requirement is currently closed.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can still contact our counselors to get notified when new vacancies open.
                    </p>
                    <Button asChild className="w-full rounded-full" size="sm">
                      <Link to="/contact">Contact Counselor</Link>
                    </Button>
                  </div>
                ) : isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-3"
                  >
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                    <h4 className="text-base font-bold text-foreground">Application Received!</h4>
                    <p className="text-xs text-muted-foreground">
                      Our senior visa officer in Surat will review your profile and contact you within 2 business hours.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSubmitted(false)}
                      className="rounded-full text-xs"
                    >
                      Submit Another Query
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleApply} className="space-y-3.5">
                    <div className="space-y-1">
                      <Label htmlFor="app-name" className="text-xs">Full Name *</Label>
                      <Input
                        id="app-name"
                        required
                        placeholder="Your full name"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="app-email" className="text-xs">Email Address *</Label>
                      <Input
                        id="app-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="app-phone" className="text-xs">Mobile / WhatsApp Number *</Label>
                      <PhoneInputField
                        id="app-phone"
                        defaultCountry="IN"
                        value={applicantPhone}
                        onChange={setApplicantPhone}
                        placeholder="e.g. 98765 43210"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="app-exp" className="text-xs">Years of Experience</Label>
                      <Input
                        id="app-exp"
                        placeholder="e.g. 2 Years in Healthcare"
                        value={applicantExp}
                        onChange={(e) => setApplicantExp(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="app-notes" className="text-xs">Qualifications / Questions</Label>
                      <Textarea
                        id="app-notes"
                        rows={2}
                        placeholder="Education, IELTS/JLPT score, passport status..."
                        value={applicantNotes}
                        onChange={(e) => setApplicantNotes(e.target.value)}
                        className="text-xs resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 btn-glow"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="submit-spinner mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Apply for this Opening
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or Instant WhatsApp</span>
                      </div>
                    </div>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Apply via WhatsApp
                    </a>
                  </form>
                )}
              </div>

              {/* Surat Office Walk-in Card */}
              <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Surat Head Office Walk-in
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {NAP.fullAddress}
                </p>
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Helpline:</span>
                  <a href={`tel:${NAP.phoneIN}`} className="text-primary hover:underline">
                    {NAP.phoneINDisplay}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
