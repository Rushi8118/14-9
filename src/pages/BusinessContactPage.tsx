import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SeoHead } from '@/components/seo/SeoHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'
import { NAP, SITE_NAME } from '@/lib/seo/site'
import { breadcrumbSchema } from '@/lib/seo/schema'

/**
 * B2B enquiry form: employers and recruitment partners.
 *
 * Writes to `consultations` with consultation_type 'b2b_enquiry' rather than
 * getting its own table. The row shape already fits, the admin panel already
 * lists it, and a migration for a second lead table would mean two places to
 * look for a lead -- which is how leads get missed.
 *
 * It then calls the notify-enquiry Edge Function with enquiry_type
 * 'b2b_enquiry', so a partner enquiry is distinguishable from an applicant
 * enquiry in the inbox without opening the admin panel.
 *
 * A failure to notify is surfaced, not swallowed. The row is written first, so
 * the lead is never lost to a mail problem -- the previous contact form posted
 * to an endpoint that did not exist and hid the 404, and no enquiry
 * notification was sent for the life of the site.
 */
export default function BusinessContactPage() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('loading')

    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form.entries()) as Record<string, string>

    try {
      const { data: session } = await supabase.auth.getSession()

      const { error } = await supabase.from('consultations').insert([
        {
          consultation_type: 'b2b_enquiry',
          status: 'requested',
          scheduled_at: new Date().toISOString(),
          phone_number: data.phone || null,
          whatsapp_number: data.whatsapp || data.phone || null,
          preferred_country: data.country || null,
          user_notes: { ...data, source: 'b2b_contact', submitted_at: new Date().toISOString() },
          user_id: session?.session?.user?.id ?? null,
        },
      ] as any)

      if (error) throw new Error(error.message)

      setState('done')
      toast.success('Enquiry received. We will get back to you.')
      trackEvent(GA_EVENTS.FORM_SUBMIT, 'Form', `B2B - ${data.enquiry_kind || 'partner'}`)

      supabase.functions
        .invoke('notify-enquiry', {
          body: {
            enquiry_type: 'b2b_enquiry',
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            country: data.country,
            requirement: data.enquiry_kind,
            message: data.message,
          },
        })
        .then(({ error: fnError }) => {
          if (fnError) throw fnError
        })
        .catch((err: unknown) => {
          console.error('notify-enquiry failed:', err)
          toast.warning(
            `We have your enquiry, but our email alert did not go through. For a faster reply, message ${NAP.phoneINDisplay} on WhatsApp.`,
          )
        })
    } catch (err) {
      setState('idle')
      toast.error(
        `Could not send: ${err instanceof Error ? err.message : 'unknown error'}. Please email ${NAP.email} instead.`,
      )
    }
  }

  return (
    <>
      <SeoHead
        title="Business Enquiry | Employers & Recruitment Partners"
        description={`Business enquiry form for employers hiring from South Asia and recruitment partners across India. ${SITE_NAME}, Surat.`}
        path="/for-business/contact"
        keywords="recruitment partnership enquiry india, employer hiring enquiry india, b2b visa consultancy contact"
        jsonLd={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'For businesses', path: '/for-business' },
          { name: 'Business enquiry', path: '/for-business/contact' },
        ])}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <nav className="text-sm text-muted-foreground">
          <Link to="/for-business" className="hover:text-primary">
            For businesses
          </Link>
          <span className="mx-2">/</span>
          <span>Business enquiry</span>
        </nav>

        <h1 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
          Business enquiry
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          For employers hiring from South Asia, and for consultancies and agents in any Indian
          state. Tell us what you are proposing and we will tell you plainly whether it is
          something we can do. Commercial terms are agreed per arrangement — there is no rate
          card, because what each side does varies too much for one number to be honest.
        </p>

        {state === 'done' ? (
          <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="font-semibold text-foreground">Enquiry received</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We will come back to you. If it is urgent, message {NAP.phoneINDisplay} on WhatsApp
              or email {NAP.email}.
            </p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={() => setState('idle')}>
              Send another enquiry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="b-company">Company or consultancy *</Label>
                <Input id="b-company" name="company" required placeholder="Registered name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-name">Contact person *</Label>
                <Input id="b-name" name="name" required placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-email">Business email *</Label>
                <Input id="b-email" name="email" type="email" required placeholder="you@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-phone">Phone / WhatsApp *</Label>
                <Input id="b-phone" name="phone" required placeholder="With country code" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-kind">I am enquiring as *</Label>
                <select
                  id="b-kind"
                  name="enquiry_kind"
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select</option>
                  <option value="recruitment_partner">A recruitment partner / agent in India</option>
                  <option value="employer">An employer hiring from South Asia</option>
                  <option value="institution">An institution or training provider</option>
                  <option value="other">Something else</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-country">Country or state</Label>
                <Input id="b-country" name="country" placeholder="e.g. Punjab, or Romania" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-message">What are you proposing? *</Label>
              <Textarea
                id="b-message"
                name="message"
                required
                rows={6}
                placeholder="Roles and volumes if you are an employer; where you operate and what you handle in-house if you are an agent."
              />
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              We do not sell job offers, guarantee visa outcomes or promise placement volumes. Visa
              decisions rest with the immigration authority and hiring decisions with the employer.
              Overseas recruitment from India is subject to Indian emigration law; we confirm what
              applies to a specific arrangement before it starts.
            </p>

            <Button type="submit" disabled={state === 'loading'} className="rounded-full px-8">
              {state === 'loading' ? 'Sending…' : 'Send business enquiry'}
            </Button>
          </form>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
