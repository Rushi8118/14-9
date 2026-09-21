import React, { useEffect, useId, useState } from 'react'
import { motion } from 'framer-motion'
import { useApplications, Application } from '@/hooks/useApplications'
import { useAuth } from '@/hooks/use-auth'
import {
  Briefcase,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MessageCircle,
  Send,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhoneInputField, isValidPhoneNumber } from '@/components/ui/phone-input-field'
import { FlagIcon } from '@/components/flag-icon'
import { toast } from 'sonner'

const WORK_COUNTRIES = [
  'Japan',
  'Australia',
  'Canada',
  'United Kingdom',
  'Germany',
  'New Zealand',
  'Russia',
  'United States',
  'Other / Not sure',
]

const STUDY_COUNTRIES = [
  'United Kingdom',
  'Germany',
  'France',
  'Canada',
  'Australia',
  'New Zealand',
  'United States',
  'Ireland',
  'Other / Not sure',
]

const WORK_CATEGORIES = [
  'Skilled / Specified Worker (Japan SSW)',
  'Australia 482 / 186 / 491',
  'Canada Express Entry / LMIA',
  'UK Skilled Worker / Health & Care',
  'Germany EU Blue Card / Opportunity Card',
  'New Zealand AEWV',
  'Russia HQS',
  'USA H-1B / EB-3',
  'Not sure — please advise',
]

type FormState = 'idle' | 'loading' | 'done'

export default function ApplicationsPage() {
  const { user, profile } = useAuth()
  const { applications, isLoading, submitInquiry } = useApplications()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Completed' | 'Rejected'>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formCollapsed, setFormCollapsed] = useState(false)

  // Form states - identical to contact page
  const [workState, setWorkState] = useState<FormState>('idle')
  const [studyState, setStudyState] = useState<FormState>('idle')

  const [workPhone, setWorkPhone] = useState<string | undefined>()
  const [workWhatsapp, setWorkWhatsapp] = useState<string | undefined>()
  const [studyPhone, setStudyPhone] = useState<string | undefined>()
  const [studyWhatsapp, setStudyWhatsapp] = useState<string | undefined>()

  const [workCountry, setWorkCountry] = useState('')
  const [workCategory, setWorkCategory] = useState('')
  const [studyCountry, setStudyCountry] = useState('')

  // Prefill user details from profile if available
  useEffect(() => {
    const userPhone = profile?.phone || (user?.user_metadata?.phone as string | undefined)
    if (userPhone) {
      if (!workPhone) setWorkPhone(userPhone)
      if (!workWhatsapp) setWorkWhatsapp(userPhone)
      if (!studyPhone) setStudyPhone(userPhone)
      if (!studyWhatsapp) setStudyWhatsapp(userPhone)
    }
  }, [profile, user])

  const formId = useId()
  const searchFieldId = `${formId}-search`

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleSubmit = (
    setter: React.Dispatch<React.SetStateAction<FormState>>,
    type: 'work' | 'study'
  ) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const enteredPhone = type === 'work' ? workPhone : studyPhone
    const enteredWhatsapp = type === 'work' ? workWhatsapp : studyWhatsapp

    if (!isValidPhoneNumber(enteredPhone)) {
      toast.error('Please enter a valid phone number', {
        description: 'Enter the country code first (e.g. 91), then your full mobile number — 10 digits for India.',
      })
      document.getElementById(type === 'work' ? 'w-phone' : 's-phone')?.focus()
      return
    }

    if (enteredWhatsapp && !isValidPhoneNumber(enteredWhatsapp)) {
      toast.error('Please check the WhatsApp number', {
        description: 'Enter the country code first, then the full mobile number, or leave it empty.',
      })
      document.getElementById(type === 'work' ? 'w-whatsapp' : 's-whatsapp')?.focus()
      return
    }

    setter('loading')

    try {
      const formData = new FormData(e.currentTarget)
      const data = Object.fromEntries(formData.entries())

      const finalCountry =
        (data.country === 'Other / Not sure' && data.other_country)
          ? data.other_country.toString()
          : data.country?.toString() || (type === 'work' ? workCountry : studyCountry)

      const finalCategory =
        (data.category === 'Not sure — please advise' && data.other_category)
          ? data.other_category.toString()
          : data.category?.toString() || (type === 'work' ? workCategory : (data.level?.toString() || 'Study Program'))

      await submitInquiry({
        type,
        phone: enteredPhone,
        whatsapp: enteredWhatsapp,
        preferred_country: finalCountry,
        visa_category: finalCategory,
        user_notes: {
          ...data,
          source: 'dashboard_applications_page',
          submitted_at: new Date().toISOString(),
        },
      })

      setter('done')
    } catch (err: any) {
      setter('idle')
      toast.error(err.message || 'Failed to submit application.')
    }
  }

  const filtered = applications.filter((app) => {
    const countryName = app.countries?.name || (app.personal_info as any)?.preferred_country || ''
    const visaName = app.visa_programs?.name || (app.personal_info as any)?.visa_category || ''
    const matchesSearch =
      countryName.toLowerCase().includes(search.toLowerCase()) ||
      visaName.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (activeTab === 'All') return true
    if (activeTab === 'Active') {
      return ['draft', 'submitted', 'under_review', 'requested', 'scheduled', 'confirmed'].includes(app.status)
    }
    if (activeTab === 'Completed') return ['approved', 'completed'].includes(app.status)
    if (activeTab === 'Rejected') return ['rejected', 'cancelled', 'withdrawn'].includes(app.status)

    return true
  })

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'requested':
        return { label: 'Submitted', color: 'bg-blue-600/15 text-blue-800 border-blue-600/30' }
      case 'under_review':
      case 'scheduled':
      case 'confirmed':
        return { label: 'In Review', color: 'bg-[var(--ud-copper)]/20 text-[#8a3d14] border-[var(--ud-copper)]/40' }
      case 'approved':
      case 'completed':
        return { label: 'Approved', color: 'bg-emerald-600/15 text-emerald-800 border-emerald-600/30' }
      case 'rejected':
      case 'cancelled':
        return { label: 'Rejected', color: 'bg-red-600/15 text-red-800 border-red-600/30' }
      case 'withdrawn':
        return { label: 'Withdrawn', color: 'bg-gray-500/15 text-gray-800 border-gray-500/30' }
      default:
        return { label: 'Draft', color: 'bg-amber-500/15 text-amber-900 border-amber-500/30' }
    }
  }

  const getTimelineSteps = (app: Application) => {
    const isSuccess = ['approved', 'completed'].includes(app.status)
    const isRejected = ['rejected', 'cancelled', 'withdrawn'].includes(app.status)
    const isReview = ['under_review', 'scheduled', 'confirmed'].includes(app.status)
    const isSubmitted = ['submitted', 'requested'].includes(app.status) || isReview || isSuccess || isRejected

    return [
      { key: 'draft', label: 'File Draft', description: 'Application initialized by applicant.', done: true },
      {
        key: 'submitted',
        label: 'Submitted',
        description: 'Visa folder forwarded to case officer.',
        done: isSubmitted,
      },
      {
        key: 'under_review',
        label: 'Under Review',
        description: 'Documents verification under MEA & embassy guidelines.',
        done: isReview || isSuccess || isRejected,
      },
      {
        key: 'approved',
        label: 'Decision Released',
        description: isRejected ? 'Application was not approved.' : 'Visa successfully approved!',
        done: isSuccess || isRejected,
        failed: isRejected,
      },
    ]
  }

  const defaultName = profile?.full_name || user?.user_metadata?.full_name || ''
  const defaultEmail = user?.email || ''

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* START AN APPLICATION - Exact Contact Page Format Centered with Proportional Max-Width */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 md:p-7 shadow-sm w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-border/40">
          <div>
            <h2 className="ud-display text-base sm:text-lg font-bold text-foreground">
              Start an application
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Same consultation application as our contact desk. Fill your details to apply.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFormCollapsed((prev) => !prev)}
            className="h-8 text-xs px-3 rounded-full shrink-0 font-medium"
          >
            {formCollapsed ? (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1 text-primary" />
                Open Form
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Minimize
              </>
            )}
          </Button>
        </div>

        {!formCollapsed && (
          <Tabs defaultValue="work" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-background/60 p-1 mb-5">
              <TabsTrigger
                value="work"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm font-semibold"
              >
                Work Visa Inquiry
              </TabsTrigger>
              <TabsTrigger
                value="study"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm font-semibold"
              >
                Study Visa Inquiry
              </TabsTrigger>
            </TabsList>

            {/* WORK VISA FORM */}
            <TabsContent value="work" className="mt-0">
              {workState === 'done' ? (
                <SuccessState
                  title="Thank you!"
                  message="Your work visa enquiry has been received. A case officer will reach out within one business day."
                  onReset={() => setWorkState('idle')}
                />
              ) : (
                <form
                  onSubmit={handleSubmit(setWorkState, 'work')}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  <Field id="w-name" label="Full name">
                    <Input
                      id="w-name"
                      name="name"
                      required
                      defaultValue={defaultName}
                      placeholder="Your full name"
                    />
                  </Field>
                  <Field id="w-email" label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="w-email"
                        name="email"
                        type="email"
                        required
                        defaultValue={defaultEmail}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                  </Field>
                  <Field id="w-phone" label="Phone Number">
                    <PhoneInputField
                      id="w-phone"
                      name="phone"
                      value={workPhone}
                      onChange={setWorkPhone}
                      defaultCountry="IN"
                      placeholder="e.g. 98765 43210"
                      icon={<Phone className="h-4 w-4 text-blue-500" />}
                    />
                  </Field>
                  <Field id="w-whatsapp" label="WhatsApp Number">
                    <div className="space-y-1.5">
                      <PhoneInputField
                        id="w-whatsapp"
                        name="whatsapp"
                        value={workWhatsapp}
                        onChange={setWorkWhatsapp}
                        defaultCountry="IN"
                        placeholder="e.g. 98765 43210"
                        icon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
                      />
                      {workPhone && workPhone !== workWhatsapp && (
                        <button
                          type="button"
                          onClick={() => setWorkWhatsapp(workPhone)}
                          className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          Same as Phone Number
                        </button>
                      )}
                    </div>
                  </Field>
                  <Field id="w-country" label="Preferred country">
                    <CountrySelect
                      id="w-country"
                      options={WORK_COUNTRIES}
                      value={workCountry}
                      onChange={setWorkCountry}
                    />
                    {workCountry === 'Other / Not sure' && (
                      <div className="mt-3">
                        <Input
                          name="other_country"
                          placeholder="Enter country name"
                          className="h-10 border-primary/30 focus:border-primary"
                        />
                      </div>
                    )}
                  </Field>
                  <Field id="w-category" label="Visa category">
                    <Select name="category" onValueChange={setWorkCategory}>
                      <SelectTrigger id="w-category" className="border-border/70 bg-background/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {workCategory === 'Not sure — please advise' && (
                      <div className="mt-3">
                        <Input
                          name="other_category"
                          placeholder="Describe your requirement"
                          className="h-10 border-primary/30 focus:border-primary"
                        />
                      </div>
                    )}
                  </Field>
                  <Field id="w-experience" label="Years of experience">
                    <Input
                      id="w-experience"
                      name="experience"
                      type="number"
                      min={0}
                      placeholder="e.g. 4"
                    />
                  </Field>
                  <Field id="w-role" label="Current role / industry">
                    <Input id="w-role" name="role" placeholder="e.g. Nurse, Welder, IT" />
                  </Field>
                  <Field id="w-message" label="Tell us more" full>
                    <Textarea
                      id="w-message"
                      name="message"
                      rows={3}
                      placeholder="English proficiency, qualifications, target role, timeline..."
                    />
                  </Field>
                  <SubmitRow
                    loading={workState === 'loading'}
                    label="Request work visa consultation"
                  />
                </form>
              )}
            </TabsContent>

            {/* STUDY VISA FORM */}
            <TabsContent value="study" className="mt-0">
              {studyState === 'done' ? (
                <SuccessState
                  title="Thank you!"
                  message="Your study visa enquiry has been received. Our academic advisors will reach out shortly."
                  onReset={() => setStudyState('idle')}
                />
              ) : (
                <form
                  onSubmit={handleSubmit(setStudyState, 'study')}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  <Field id="s-name" label="Full name">
                    <Input
                      id="s-name"
                      name="name"
                      required
                      defaultValue={defaultName}
                      placeholder="Your full name"
                    />
                  </Field>
                  <Field id="s-email" label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="s-email"
                        name="email"
                        type="email"
                        required
                        defaultValue={defaultEmail}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                  </Field>
                  <Field id="s-phone" label="Phone Number">
                    <PhoneInputField
                      id="s-phone"
                      name="phone"
                      value={studyPhone}
                      onChange={setStudyPhone}
                      defaultCountry="IN"
                      placeholder="e.g. 98765 43210"
                      icon={<Phone className="h-4 w-4 text-blue-500" />}
                    />
                  </Field>
                  <Field id="s-whatsapp" label="WhatsApp Number">
                    <div className="space-y-1.5">
                      <PhoneInputField
                        id="s-whatsapp"
                        name="whatsapp"
                        value={studyWhatsapp}
                        onChange={setStudyWhatsapp}
                        defaultCountry="IN"
                        placeholder="e.g. 98765 43210"
                        icon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
                      />
                      {studyPhone && studyPhone !== studyWhatsapp && (
                        <button
                          type="button"
                          onClick={() => setStudyWhatsapp(studyPhone)}
                          className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          Same as Phone Number
                        </button>
                      )}
                    </div>
                  </Field>
                  <Field id="s-country" label="Preferred country">
                    <CountrySelect
                      id="s-country"
                      options={STUDY_COUNTRIES}
                      value={studyCountry}
                      onChange={setStudyCountry}
                    />
                    {studyCountry === 'Other / Not sure' && (
                      <div className="mt-3">
                        <Input
                          name="other_country"
                          placeholder="Enter country name"
                          className="h-10 border-primary/30 focus:border-primary"
                        />
                      </div>
                    )}
                  </Field>
                  <Field id="s-level" label="Study level">
                    <Select name="level">
                      <SelectTrigger id="s-level" className="border-border/70 bg-background/50">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
                        <SelectItem value="masters">Master&apos;s / Post-Grad</SelectItem>
                        <SelectItem value="diploma">Diploma / Vocational</SelectItem>
                        <SelectItem value="phd">PhD / Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="s-intake" label="Target intake">
                    <Input
                      id="s-intake"
                      name="intake"
                      placeholder="e.g. Sep 2026 / Jan 2027"
                    />
                  </Field>
                  <Field id="s-field" label="Field of study">
                    <Input
                      id="s-field"
                      name="field"
                      placeholder="e.g. Data Science, Nursing"
                    />
                  </Field>
                  <Field id="s-message" label="Tell us about you" full>
                    <Textarea
                      id="s-message"
                      name="message"
                      rows={3}
                      placeholder="Academic background, IELTS / TOEFL scores, scholarship interest..."
                    />
                  </Field>
                  <SubmitRow
                    loading={studyState === 'loading'}
                    label="Request study visa consultation"
                  />
                </form>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center bg-card border border-border/60 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor={searchFieldId} className="sr-only">
            Search applications by country or program
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" aria-hidden="true" />
          <Input
            id={searchFieldId}
            type="search"
            placeholder="Search by country or program…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 border-border/60 bg-[var(--ud-canvas)]/20 focus-visible:ring-[var(--ud-copper)]"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter applications by status"
          className="flex bg-[var(--ud-canvas)]/60 p-1 rounded-xl border border-border/40 w-full sm:w-auto overflow-x-auto scrollbar-thin gap-0.5"
        >
          {(['All', 'Active', 'Completed', 'Rejected'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none min-h-10 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ud-copper)] focus-visible:ring-offset-2 ${
                activeTab === tab
                  ? 'bg-[var(--ud-ink)] text-[var(--ud-canvas)] shadow-sm'
                  : 'text-foreground/70 hover:text-[var(--ud-ink)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* APPLICATIONS TABLE (DESKTOP) */}
      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading applications">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 sm:py-20 text-center bg-card rounded-2xl border border-border/60 shadow-sm px-4">
          <Briefcase className="h-14 w-14 sm:h-16 sm:w-16 text-foreground/25 mx-auto mb-4" aria-hidden="true" />
          <h3 className="ud-display text-base font-bold text-[var(--ud-ink)]">No applications found</h3>
          <p className="text-sm text-foreground/65 mt-1.5 max-w-xs mx-auto">
            Try adjusting your search criteria or submit a new application using the form above.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm" aria-label="Applications">
              <thead className="bg-[var(--ud-canvas)]/70 border-b border-border/50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold text-[var(--ud-ink)]">
                    Destination
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-[var(--ud-ink)]">
                    Program
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-[var(--ud-ink)]">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-[var(--ud-ink)]">
                    Applied
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-[var(--ud-ink)] text-right">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((app) => {
                  const config = getStatusConfig(app.status)
                  const expanded = expandedId === app.id
                  const panelId = `app-panel-${app.id}`
                  const countryName = app.countries?.name || (app.personal_info as any)?.preferred_country || 'Destination'
                  const programName = app.visa_programs?.name || (app.personal_info as any)?.visa_category || (app.application_type === 'study' ? 'Study Visa' : 'Work Visa')

                  return (
                    <React.Fragment key={app.id}>
                      <tr className="hover:bg-[var(--ud-canvas)]/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span aria-hidden="true">
                              {countryName && countryName !== 'Preferred Country' && countryName !== 'Destination' ? (
                                <FlagIcon country={countryName} className="text-xl" />
                              ) : (
                                '✈️'
                              )}
                            </span>
                            <div>
                              <p className="font-semibold text-[var(--ud-ink)]">
                                {countryName}
                              </p>
                              {app.application_id && (
                                <p className="text-xs text-foreground/60 font-mono">{app.application_id}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {programName}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex text-xs font-bold border rounded-full px-2.5 py-1 ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9"
                            aria-expanded={expanded}
                            aria-controls={panelId}
                            onClick={() => toggleExpand(app.id)}
                          >
                            {expanded ? 'Hide' : 'View'}
                            {expanded ? (
                              <ChevronUp className="h-4 w-4 ml-1" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
                            )}
                          </Button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 bg-[var(--ud-canvas)]/20" id={panelId}>
                            <ApplicationDetails app={app} steps={getTimelineSteps(app)} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE / TABLET CARDS */}
          <div className="md:hidden space-y-3 sm:space-y-4" role="list" aria-label="Applications">
            {filtered.map((app) => {
              const config = getStatusConfig(app.status)
              const expanded = expandedId === app.id
              const panelId = `app-card-panel-${app.id}`
              const steps = getTimelineSteps(app)
              const countryName = app.countries?.name || (app.personal_info as any)?.preferred_country || 'Destination'
              const programName = app.visa_programs?.name || (app.personal_info as any)?.visa_category || (app.application_type === 'study' ? 'Study Visa' : 'Work Visa')

              return (
                <article
                  key={app.id}
                  role="listitem"
                  className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(app.id)}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className="w-full p-4 sm:p-5 flex flex-col gap-3 text-left select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ud-copper)] focus-visible:ring-inset"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl shrink-0" aria-hidden="true">
                          {countryName && countryName !== 'Preferred Country' && countryName !== 'Destination' ? (
                            <FlagIcon country={countryName} className="text-2xl" />
                          ) : (
                            '✈️'
                          )}
                        </span>
                        <div className="leading-tight space-y-1 min-w-0">
                          <h3 className="ud-display text-sm sm:text-base font-bold text-[var(--ud-ink)] truncate">
                            {countryName}
                          </h3>
                          <p className="text-xs text-foreground/65 font-medium truncate">
                            {programName}
                          </p>
                          {app.application_id && (
                            <p className="text-[11px] text-foreground/55 font-mono">{app.application_id}</p>
                          )}
                        </div>
                      </div>
                      <span className="p-2 rounded-full text-foreground/60 shrink-0" aria-hidden="true">
                        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold border rounded-full px-3 py-1 ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-foreground/60">
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>

                  {expanded && (
                    <div
                      id={panelId}
                      className="border-t border-border/40 bg-[var(--ud-canvas)]/20 p-4 sm:p-5 space-y-5"
                    >
                      <ApplicationDetails app={app} steps={steps} />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ---------------- Helpers (exact match with contact-section.tsx) ---------------- */

function Field({
  id,
  label,
  children,
  full,
}: {
  id: string
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="mt-1.5 form-field-glow rounded-md [&_input]:border-border/70 [&_input]:bg-background/50 [&_textarea]:border-border/70 [&_textarea]:bg-background/50">
        {children}
      </div>
    </div>
  )
}

function CountrySelect({
  id,
  options,
  value,
  onChange,
}: {
  id: string
  options: string[]
  value?: string
  onChange?: (val: string) => void
}) {
  return (
    <Select name="country" value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="border-border/70 bg-background/50">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SubmitRow({ loading, label }: { loading: boolean; label: string }) {
  return (
    <div className="md:col-span-2 pt-2">
      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="btn-glow btn-cta-sweep w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 h-11 text-sm font-semibold shadow-sm"
      >
        {loading ? (
          <>
            <span className="submit-spinner mr-2" aria-hidden="true" />
            Sending...
          </>
        ) : (
          <>
            {label}
            <Send className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="mt-2.5 text-center text-xs text-muted-foreground">
        By submitting, you agree to be contacted about your enquiry. We never share your data.
      </p>
    </div>
  )
}

function SuccessState({
  title,
  message,
  onReset,
}: {
  title: string
  message: string
  onReset?: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="success-pop">
        <CheckCircle2 className="h-12 w-12 text-primary" />
      </div>
      <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{message}</p>
      {onReset && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="mt-4 rounded-full text-xs font-medium"
        >
          Submit Another Application
        </Button>
      )}
    </div>
  )
}

function ApplicationDetails({
  app,
  steps,
}: {
  app: Application
  steps: Array<{
    key: string
    label: string
    description: string
    done: boolean
    failed?: boolean
  }>
}) {
  const pInfo = (typeof app.personal_info === 'object' && app.personal_info !== null) ? app.personal_info : {}
  const phone = pInfo.phone || pInfo.phone_number
  const whatsapp = pInfo.whatsapp || pInfo.whatsapp_number
  const roleOrLevel = pInfo.role || pInfo.level
  const expOrIntake = pInfo.experience ? `${pInfo.experience} years experience` : pInfo.intake
  const notes = pInfo.message || pInfo.notes

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm text-foreground/70">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--ud-copper)] shrink-0" aria-hidden="true" />
          <div>
            <dt className="sr-only">Applied date</dt>
            <dd>
              Applied:{' '}
              <strong className="text-[var(--ud-ink)] font-semibold">
                {new Date(app.created_at).toLocaleDateString()}
              </strong>
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[var(--ud-copper)] shrink-0" aria-hidden="true" />
          <div>
            <dt className="sr-only">Case officer</dt>
            <dd>
              Case Officer:{' '}
              <strong className="text-[var(--ud-ink)] font-semibold">
                {app.assigned_consultant ? 'Officer Assigned' : 'Siddhivinayak Desk'}
              </strong>
            </dd>
          </div>
        </div>
        {app.estimated_completion && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--ud-copper)] shrink-0" aria-hidden="true" />
            <div>
              <dt className="sr-only">Estimated completion</dt>
              <dd>
                Est. Completion:{' '}
                <strong className="text-[var(--ud-ink)] font-mono font-semibold">
                  {new Date(app.estimated_completion).toLocaleDateString()}
                </strong>
              </dd>
            </div>
          </div>
        )}
      </dl>

      {(phone || whatsapp || roleOrLevel || expOrIntake) && (
        <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-foreground/80">
          {phone && (
            <div>
              <span className="text-foreground/50 block text-[11px] uppercase font-semibold">Phone</span>
              <span className="font-medium">{phone}</span>
            </div>
          )}
          {whatsapp && (
            <div>
              <span className="text-foreground/50 block text-[11px] uppercase font-semibold">WhatsApp</span>
              <span className="font-medium">{whatsapp}</span>
            </div>
          )}
          {roleOrLevel && (
            <div>
              <span className="text-foreground/50 block text-[11px] uppercase font-semibold">
                {app.application_type === 'study' ? 'Study Level' : 'Role / Industry'}
              </span>
              <span className="font-medium capitalize">{roleOrLevel}</span>
            </div>
          )}
          {expOrIntake && (
            <div>
              <span className="text-foreground/50 block text-[11px] uppercase font-semibold">
                {app.application_type === 'study' ? 'Target Intake' : 'Experience'}
              </span>
              <span className="font-medium">{expOrIntake}</span>
            </div>
          )}
        </div>
      )}

      {notes && (
        <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 text-xs sm:text-sm space-y-1">
          <span className="text-foreground/50 block text-[11px] uppercase font-semibold">Applicant Statement</span>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="ud-display text-sm font-bold text-[var(--ud-ink)]">Immigration Status</h4>
        <ol className="relative pl-6 border-l-2 border-border/70 space-y-5 py-1 ml-2">
          {steps.map((step) => {
            const done = step.done
            const failed = step.failed

            return (
              <li key={step.key} className="relative space-y-0.5">
                <span
                  className={`absolute -left-[31px] top-0 p-0.5 rounded-full border border-card bg-card shrink-0 ${
                    failed ? 'text-red-600' : done ? 'text-emerald-600' : 'text-foreground/30'
                  }`}
                  aria-hidden="true"
                >
                  {failed ? (
                    <XCircle className="h-4 w-4" />
                  ) : done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </span>
                <p
                  className={`text-sm font-bold ${
                    failed ? 'text-red-700' : done ? 'text-[var(--ud-ink)]' : 'text-foreground/55'
                  }`}
                >
                  {step.label}
                  <span className="sr-only">
                    {failed ? ' — failed' : done ? ' — completed' : ' — pending'}
                  </span>
                </p>
                <p className="text-xs text-foreground/65">{step.description}</p>
              </li>
            )
          })}
        </ol>
      </div>

      {app.consultant_notes && (
        <aside className="bg-[var(--ud-copper)]/10 border border-[var(--ud-copper)]/25 p-4 rounded-xl text-sm space-y-1">
          <strong className="text-[var(--ud-ink)] font-bold">Advisory Notes</strong>
          <p className="text-foreground/75 leading-normal italic">&ldquo;{app.consultant_notes}&rdquo;</p>
        </aside>
      )}
    </div>
  )
}

