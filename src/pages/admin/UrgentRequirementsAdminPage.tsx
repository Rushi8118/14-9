import React, { useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame, Plus, Sparkles, Pencil, Trash2, Eye, EyeOff, Clock, Users,
  CheckCircle2, XCircle, Search, RefreshCw, Calendar, Loader2,
  ExternalLink, Image as ImageIcon, AlertTriangle, Undo2, X, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ThemeDatePicker } from '@/components/ui/theme-date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAdminUrgentRequirements,
  getRemainingDays,
  isRequirementExpired,
  type UrgentRequirement,
  type UrgentRequirementInput,
  type UrgentRequirementFaqItem,
} from '@/hooks/useUrgentRequirements'
import { synthesizeUrgentRequirement, type GeneratedUrgentRequirement } from '@/lib/ai/urgent-requirement-generator'
import { BlogContent } from '@/components/blog/BlogContent'
import { SeoPanel } from '@/components/admin/SeoPanel'
import { FlagIcon } from '@/components/flag-icon'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { MEDIA_BUCKET } from '@/hooks/useFileManager'
import { validateImageFile } from '@/lib/security/sanitizeHtml'
import { ADMIN_INPUT_REQUIRED } from '@/lib/ai/guardrails'

function getFlagEmoji(countryCode: string): string {
  try {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
  } catch {
    return '🌍'
  }
}

const COUNTRIES_LIST = [
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Japan', code: 'JP' },
  { name: 'Canada', code: 'CA' },
  { name: 'Australia', code: 'AU' },
  { name: 'Germany', code: 'DE' },
  { name: 'United States', code: 'US' },
  { name: 'UAE / Dubai', code: 'AE' },
  { name: 'Singapore', code: 'SG' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'France', code: 'FR' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Poland', code: 'PL' },
  { name: 'Hungary', code: 'HU' },
  { name: 'Other', code: 'IN' },
]

type FormState = {
  title: string
  slug: string
  employer: string
  country: string
  countryCode: string
  city: string
  visaType: string
  category: string
  vacancies: number
  salary: string
  currency: string
  experienceRequired: string
  education: string
  skills: string[]
  benefits: string[]
  contractType: string
  workingHours: string
  durationDays: number
  expiresAt: string
  deadlineAt: string
  imageUrl: string
  detailImageUrl: string
  imageAlt: string
  summary: string
  content: string
  applicationInstructions: string
  eligibility: string[]
  requiredDocuments: string[]
  seoTitle: string
  metaDescription: string
  focusKeyword: string
  relatedKeywords: string[]
  longTailKeywords: string[]
  tags: string[]
  faq: UrgentRequirementFaqItem[]
  status: 'draft' | 'active' | 'closed'
  adminInputRequired: string[]
  aiGenerated: boolean
}

function emptyForm(): FormState {
  return {
    title: '', slug: '', employer: '', country: '', countryCode: '', city: '', visaType: '',
    category: 'Healthcare / Work Visa', vacancies: 10, salary: '', currency: '', experienceRequired: '',
    education: '', skills: [], benefits: [], contractType: '', workingHours: '', durationDays: 14,
    expiresAt: '', deadlineAt: '', imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    detailImageUrl: '', imageAlt: '', summary: '', content: '', applicationInstructions: '',
    eligibility: [], requiredDocuments: [], seoTitle: '', metaDescription: '', focusKeyword: '',
    relatedKeywords: [], longTailKeywords: [], tags: [], faq: [], status: 'draft',
    adminInputRequired: [], aiGenerated: false,
  }
}

function formFromRequirement(req: UrgentRequirement): FormState {
  const rem = getRemainingDays(req.expires_at)
  return {
    title: req.title, slug: req.slug, employer: req.employer || '', country: req.country,
    countryCode: req.country_code, city: req.city || '', visaType: req.visa_type || '',
    category: req.category, vacancies: req.vacancies, salary: req.salary, currency: req.currency || '',
    experienceRequired: req.experience_required || '', education: req.education || '',
    skills: req.skills || [], benefits: req.benefits || [], contractType: req.contract_type || '',
    workingHours: req.working_hours || '', durationDays: rem && rem > 0 ? rem : 14,
    expiresAt: req.expires_at ? new Date(req.expires_at).toISOString().split('T')[0] : '',
    deadlineAt: req.deadline_at ? new Date(req.deadline_at).toISOString().split('T')[0] : '',
    imageUrl: req.image_url || '', detailImageUrl: req.detail_image_url || '', imageAlt: req.image_alt || '',
    summary: req.summary || '', content: req.content, applicationInstructions: req.application_instructions || '',
    eligibility: req.eligibility || [], requiredDocuments: req.required_documents || [],
    seoTitle: req.seo_title || '', metaDescription: req.meta_description || '', focusKeyword: req.focus_keyword || '',
    relatedKeywords: req.related_keywords || [], longTailKeywords: req.long_tail_keywords || [], tags: req.tags || [],
    faq: req.faq || [],
    status: req.status === 'expired' ? 'closed' : req.status,
    adminInputRequired: req.admin_input_required || [], aiGenerated: Boolean(req.ai_generated),
  }
}

function ChipsInput({ values, onChange, placeholder }: { values: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-input bg-background p-2">
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
          <span className="truncate max-w-[12rem]">{v}</span>
          <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} aria-label={`Remove ${v}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder={placeholder}
        className="min-w-[5rem] flex-1 border-none bg-transparent text-xs outline-none"
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ',') return
          e.preventDefault()
          const value = e.currentTarget.value.trim()
          if (value && !values.includes(value)) onChange([...values, value])
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}

function ListEditor({ values, onChange, placeholder }: { values: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={v} onChange={(e) => { const next = [...values]; next[i] = e.target.value; onChange(next) }} className="h-8 text-xs" />
          <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} aria-label="Remove item">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => onChange([...values, ''])}>
        <Plus className="mr-1 h-3 w-3" /> {placeholder}
      </Button>
    </div>
  )
}

function fieldFlag(name: string, value: string) {
  return value.trim() === '' || value.trim() === ADMIN_INPUT_REQUIRED
}

export default function UrgentRequirementsAdminPage() {
  const {
    requirements,
    isLoading,
    saving,
    fetchAll,
    saveRequirement,
    toggleStatus,
    extendDuration,
    removeRequirement,
  } = useAdminUrgentRequirements()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'draft'>('all')

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'seo' | 'preview'>('edit')
  const [dirty, setDirty] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)

  const [form, setForm] = useState<FormState>(emptyForm())
  const [history, setHistory] = useState<FormState[]>([])
  const [flaggedClaims, setFlaggedClaims] = useState<string[]>([])

  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<'main' | 'detail' | null>(null)
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const detailImageInputRef = useRef<HTMLInputElement>(null)

  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const updateForm = (patch: Partial<FormState>) => {
    setForm((current) => {
      setHistory((h) => [...h.slice(-9), current])
      return { ...current, ...patch }
    })
    setDirty(true)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requirements.filter((r) => {
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'draft' && r.status === 'draft') ||
        (statusFilter === 'active' && r.status === 'active' && !isRequirementExpired(r)) ||
        (statusFilter === 'closed' && (r.status === 'closed' || isRequirementExpired(r)))

      return matchSearch && matchStatus
    })
  }, [requirements, search, statusFilter])

  const activeCount = requirements.filter((r) => r.status === 'active' && !isRequirementExpired(r)).length
  const draftCount = requirements.filter((r) => r.status === 'draft').length
  const totalVacancies = requirements.reduce((acc, r) => acc + (r.vacancies || 0), 0)
  const expiringSoonCount = requirements.filter((r) => {
    const d = getRemainingDays(r.expires_at)
    return r.status === 'active' && d !== null && d > 0 && d <= 7
  }).length
  const closedCount = requirements.filter((r) => r.status === 'closed' || isRequirementExpired(r)).length
  const existingSlugs = useMemo(() => requirements.map((r) => r.slug), [requirements])
  const existingTitles = useMemo(() => requirements.map((r) => r.title), [requirements])

  const requestClose = () => {
    if (dirty) setCloseConfirmOpen(true)
    else setIsOpen(false)
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setHistory([])
    setFlaggedClaims([])
    setAiPrompt('')
    setActiveTab('edit')
    setDirty(false)
    setIsOpen(true)
  }

  const handleOpenEdit = (req: UrgentRequirement) => {
    setEditingId(req.id)
    setForm(formFromRequirement(req))
    setHistory([])
    setFlaggedClaims([])
    setActiveTab('edit')
    setDirty(false)
    setIsOpen(true)
  }

  const applyGenerated = (generated: GeneratedUrgentRequirement) => {
    setHistory((h) => [...h.slice(-9), form])
    setForm({
      title: generated.title, slug: generated.slug, employer: generated.employer,
      country: generated.country, countryCode: generated.country_code, city: generated.city,
      visaType: generated.visa_type, category: generated.category, vacancies: generated.vacancies,
      salary: generated.salary, currency: generated.currency, experienceRequired: generated.experience_required,
      education: generated.education, skills: generated.skills, benefits: generated.benefits,
      contractType: generated.contract_type, workingHours: generated.working_hours,
      durationDays: generated.duration_days || 14, expiresAt: '', deadlineAt: '',
      imageUrl: generated.image_url, detailImageUrl: '', imageAlt: generated.image_alt,
      summary: generated.summary, content: generated.content,
      applicationInstructions: generated.application_instructions, eligibility: generated.eligibility,
      requiredDocuments: generated.required_documents, seoTitle: generated.seo_title,
      metaDescription: generated.meta_description, focusKeyword: generated.focus_keyword,
      relatedKeywords: generated.related_keywords, longTailKeywords: generated.long_tail_keywords,
      // Regenerating an existing listing keeps its status so a live post isn't silently turned into a draft.
      tags: generated.tags, faq: generated.faq, status: editingId ? form.status : 'draft',
      adminInputRequired: generated.adminInputRequired, aiGenerated: true,
    })
    setFlaggedClaims(generated.flaggedClaims)
    setDirty(true)
  }

  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a short prompt (e.g. "25 NHS Care Workers in UK" or "Japan SSW Food 15")')
      return
    }
    if (isGeneratingAi) return // duplicate-submit guard
    setIsGeneratingAi(true)
    try {
      const generated = await synthesizeUrgentRequirement(aiPrompt, form.country)
      applyGenerated(generated)
      toast.success(
        generated.adminInputRequired.length
          ? `Draft generated — ${generated.adminInputRequired.length} field(s) need admin input before publishing.`
          : 'AI generated a complete urgent requirement draft.',
      )
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate with AI')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleUndo = () => {
    setHistory((h) => {
      if (h.length === 0) return h
      const previous = h[h.length - 1]
      setForm(previous)
      return h.slice(0, -1)
    })
  }

  const handleClear = () => {
    setHistory((h) => [...h.slice(-9), form])
    setForm({ ...emptyForm(), status: form.status })
    setFlaggedClaims([])
    setDirty(true)
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'main' | 'detail',
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setUploadingImage(true)
    setUploadTarget(target)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `urgent-requirements/${target}-${Date.now()}-${safeName}`
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        cacheControl: '15552000',
        upsert: false,
      })
      if (error) throw error

      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
      if (target === 'main') updateForm({ imageUrl: data.publicUrl })
      else updateForm({ detailImageUrl: data.publicUrl })
      toast.success(target === 'main' ? 'Main image uploaded' : 'Detail image uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload cover image')
    } finally {
      setUploadingImage(false)
      setUploadTarget(null)
    }
  }

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required'
    if (!form.content.trim()) return 'Content is required'
    if (!form.country.trim()) return 'Country is required'
    if (form.expiresAt) {
      const selectedDate = new Date(form.expiresAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) return 'Expiration date must be in the future'
    }
    return null
  }

  const buildPayload = (status: 'draft' | 'active' | 'closed'): UrgentRequirementInput => ({
    id: editingId || undefined,
    title: form.title.trim(),
    slug: form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    employer: form.employer, country: form.country, country_code: form.countryCode, city: form.city,
    visa_type: form.visaType, category: form.category, vacancies: Number(form.vacancies) || 1,
    salary: form.salary, currency: form.currency, experience_required: form.experienceRequired,
    education: form.education, skills: form.skills.filter(Boolean), benefits: form.benefits.filter(Boolean),
    contract_type: form.contractType, working_hours: form.workingHours, image_url: form.imageUrl,
    detail_image_url: form.detailImageUrl, image_alt: form.imageAlt, summary: form.summary, content: form.content,
    application_instructions: form.applicationInstructions, eligibility: form.eligibility.filter(Boolean),
    required_documents: form.requiredDocuments.filter(Boolean), seo_title: form.seoTitle,
    meta_description: form.metaDescription, focus_keyword: form.focusKeyword,
    related_keywords: form.relatedKeywords, long_tail_keywords: form.longTailKeywords, tags: form.tags,
    faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()), admin_input_required: form.adminInputRequired,
    ai_generated: form.aiGenerated, status,
    ...(form.expiresAt ? { expires_at: new Date(form.expiresAt).toISOString() } : { duration_days: Number(form.durationDays) || 14 }),
    deadline_at: form.deadlineAt ? new Date(form.deadlineAt).toISOString() : null,
  })

  const handleSaveDraft = async () => {
    const error = validate()
    if (error) { toast.error(error); return }
    try {
      await saveRequirement(buildPayload('draft'))
      setDirty(false)
      setIsOpen(false)
    } catch {}
  }

  const handlePublish = async () => {
    const error = validate()
    if (error) { toast.error(error); return }
    try {
      await saveRequirement(buildPayload('active'))
      setDirty(false)
      setPublishConfirmOpen(false)
      setIsOpen(false)
    } catch {}
  }

  /** Saves edits to a live listing without unpublishing it (Save Draft would take it offline). */
  const handleUpdateLive = async () => {
    const error = validate()
    if (error) { toast.error(error); return }
    try {
      await saveRequirement(buildPayload('active'))
      setDirty(false)
      setIsOpen(false)
    } catch {}
  }

  const handleSaveClosed = async () => {
    const error = validate()
    if (error) { toast.error(error); return }
    try {
      await saveRequirement(buildPayload('closed'))
      setDirty(false)
      setIsOpen(false)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-foreground">
            <Flame className="h-6 w-6 text-red-500 fill-red-500" />
            Urgent Requirements & Fast-Track Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage live urgent openings displayed on the website banner and details pages.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl gap-1.5 font-semibold shadow-md">
          <Plus className="h-4 w-4" />
          Add Urgent Requirement
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-red-500" /> Active Openings</span>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-slate-400" /> Drafts</span>
          <p className="text-2xl font-bold text-foreground">{draftCount}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Total Vacancies</span>
          <p className="text-2xl font-bold text-foreground">{totalVacancies}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> Expiring Soon</span>
          <p className="text-2xl font-bold text-amber-400">{expiringSoonCount}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Closed / Filled</span>
          <p className="text-2xl font-bold text-muted-foreground">{closedCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/70">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Search requirements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs rounded-xl bg-background" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center rounded-xl bg-muted/40 p-0.5 border border-border/60">
            {(['all', 'active', 'draft', 'closed'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition ${statusFilter === key ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {key === 'all' ? `All (${requirements.length})` : key === 'active' ? `Active (${activeCount})` : key === 'draft' ? `Draft (${draftCount})` : `Closed (${closedCount})`}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAll} className="h-8 w-8 p-0 rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b border-border/60 text-muted-foreground uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Title & Country</th>
                <th className="py-3 px-4">Vacancies</th>
                <th className="py-3 px-4">Salary Package</th>
                <th className="py-3 px-4">Timeline / Status</th>
                <th className="py-3 px-4 text-center">Active Toggle</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />Loading urgent requirements...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No urgent requirements found. Click "Add Urgent Requirement" or generate with AI.</td></tr>
              ) : (
                filtered.map((req) => {
                  const remainingDays = getRemainingDays(req.expires_at)
                  const isExpired = isRequirementExpired(req)
                  const isActive = req.status === 'active' && !isExpired
                  const isDraft = req.status === 'draft'

                  return (
                    <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center p-1 bg-muted/40 rounded border border-border/50 shrink-0">
                            <FlagIcon country={req.country} code={req.country_code} className="text-2xl rounded-xs shadow-xs" />
                          </div>
                          <div className="min-w-0">
                            {isDraft ? (
                              <span className="font-bold text-foreground line-clamp-1 flex items-center gap-1.5">
                                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />{req.title}
                              </span>
                            ) : (
                              <Link to={`/urgent-requirements/${req.slug}`} target="_blank" className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5">
                                {req.title}
                                <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                              </Link>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">{req.country}</span>
                              <span className="text-[11px] text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded font-medium">{req.category}</span>
                              {(req.admin_input_required?.length || 0) > 0 && (
                                <span className="text-[11px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                                  <AlertTriangle className="h-2.5 w-2.5" /> {req.admin_input_required!.length} to fill
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-foreground bg-muted/40 px-2 py-1 rounded-md">
                          <Users className="h-3 w-3 text-primary" />{req.vacancies}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                        {fieldFlag('salary', req.salary) ? <span className="text-muted-foreground italic">{ADMIN_INPUT_REQUIRED}</span> : req.salary}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {isDraft ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Draft — not published</span>
                          ) : isActive ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Clock className="h-3 w-3" />
                                {remainingDays !== null && remainingDays > 0 ? `${remainingDays}d remaining` : 'Ends today'}
                              </span>
                              <button type="button" onClick={() => extendDuration(req.id, 7)} className="text-[10px] text-primary hover:underline font-medium" title="Extend deadline by +7 days">+7d</button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Closed / Completed</span>
                          )}
                          {req.expires_at && <p className="text-[10px] text-muted-foreground">Deadline: {new Date(req.expires_at).toLocaleDateString('en-GB')}</p>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleStatus(req.id, isActive ? 'closed' : 'active')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-muted text-muted-foreground border border-border/70 hover:bg-muted/80'}`}
                        >
                          {isActive ? <><CheckCircle2 className="h-3 w-3" /> Active</> : <><XCircle className="h-3 w-3" /> {isDraft ? 'Publish' : 'Stopped'}</>}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(req.id, isActive ? 'closed' : 'active')} className={`h-8 w-8 p-0 rounded-lg transition ${isActive ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`} title={isActive ? 'Active on website (click to hide)' : 'Hidden (click to show)'}>
                            {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          {!isDraft && (
                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground" title="View Public Details Page">
                              <Link to={`/urgent-requirements/${req.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(req)} className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary" title="Edit Requirement"><Pencil className="h-4 w-4" /></Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => {
                              if (confirm(`Delete urgent requirement "${req.title}"?`)) removeRequirement(req.id)
                            }}
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete Requirement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) requestClose(); else setIsOpen(true) }}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-5xl sm:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-x-hidden overflow-y-auto rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-2xl">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500 shrink-0" />
              <span className="truncate">{editingId ? 'Edit Urgent Requirement' : 'Create New Urgent Requirement'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Fill in the job and visa opening details or use AI to generate a complete structured draft, then review every field before publishing.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">AI Write & Auto-Generate Details</span>
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0 whitespace-nowrap">1-Click Synthesis</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="e.g. 25 UK NHS Care Workers, priority visa..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="h-9 text-xs bg-background min-w-0 flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleGenerateWithAi() } }}
              />
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <Button type="button" disabled={isGeneratingAi} onClick={() => void handleGenerateWithAi()} className="h-9 px-4 rounded-xl font-bold text-xs shrink-0">
                  {isGeneratingAi ? (<><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Generating...</>) : (<><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate</>)}
                </Button>
                <Button type="button" variant="outline" className="h-9 px-3 text-xs shrink-0" disabled={history.length === 0} onClick={handleUndo}><Undo2 className="h-3.5 w-3.5 mr-1" />Undo</Button>
                <Button type="button" variant="outline" className="h-9 px-3 text-xs shrink-0" onClick={handleClear}>Clear</Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              AI never invents an employer, salary, deadline, or guaranteed visa/job outcome — anything it can't determine is marked "{ADMIN_INPUT_REQUIRED}" for you to fill in.
            </p>
          </div>

          {flaggedClaims.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Guaranteed-outcome language was found and neutralized</p>
                <p className="mt-1">Detected: {flaggedClaims.join(', ')}. Please review the content before publishing.</p>
              </div>
            </div>
          )}
          {form.adminInputRequired.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">Admin input required before publishing</p>
              <p className="mt-1">{form.adminInputRequired.join(', ')}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-border/60 pb-2 gap-2 flex-wrap">
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {(['edit', 'seo', 'preview'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${activeTab === tab ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab === 'edit' ? 'Edit Fields' : tab === 'seo' ? 'SEO & AI Visibility' : 'Live Preview'}
                </button>
              ))}
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${form.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : form.status === 'draft' ? 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300' : 'bg-muted text-muted-foreground'}`}>
              {form.status === 'active' ? '🟢 Active' : form.status === 'draft' ? '⚪ Draft' : '🔴 Closed'}
            </span>
          </div>

          {activeTab === 'edit' && (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Job Title *</Label>
                  <Input required value={form.title} onChange={(e) => { const t = e.target.value; updateForm({ title: t, slug: editingId ? form.slug : t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) }) }} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">URL Slug *</Label>
                  <Input required value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Employer</Label>
                  <Input value={form.employer} onChange={(e) => updateForm({ employer: e.target.value })} placeholder={ADMIN_INPUT_REQUIRED} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Country *</Label>
                  <div className="flex items-center gap-2">
                    {form.country && <FlagIcon country={form.country} code={form.countryCode} className="shrink-0 text-lg rounded-xs border border-border/40" />}
                    <Input required list="urgent-country-suggestions" value={form.country} onChange={(e) => { const val = e.target.value; const found = COUNTRIES_LIST.find((c) => c.name.toLowerCase() === val.toLowerCase()); updateForm({ country: val, countryCode: found ? found.code : form.countryCode }) }} className="h-9 text-xs" />
                  </div>
                  <datalist id="urgent-country-suggestions">{COUNTRIES_LIST.map((c) => <option key={c.name} value={c.name} />)}</datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input value={form.city} onChange={(e) => updateForm({ city: e.target.value })} className="h-9 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Visa Type</Label>
                  <Input value={form.visaType} onChange={(e) => updateForm({ visaType: e.target.value })} placeholder="e.g. Skilled Worker Visa" className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Job Category / Industry *</Label>
                  <Input value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vacancies *</Label>
                  <Input type="number" min={1} value={form.vacancies} onChange={(e) => updateForm({ vacancies: Number(e.target.value) })} className="h-9 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Salary / Package</Label>
                  <Input value={form.salary} onChange={(e) => updateForm({ salary: e.target.value })} placeholder={ADMIN_INPUT_REQUIRED} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Currency</Label>
                  <Input value={form.currency} onChange={(e) => updateForm({ currency: e.target.value.toUpperCase().slice(0, 3) })} placeholder="GBP" className="h-9 text-xs uppercase" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contract Type</Label>
                  <Input value={form.contractType} onChange={(e) => updateForm({ contractType: e.target.value })} placeholder="Full-time, Fixed-term…" className="h-9 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Experience Required</Label>
                  <Input value={form.experienceRequired} onChange={(e) => updateForm({ experienceRequired: e.target.value })} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Education</Label>
                  <Input value={form.education} onChange={(e) => updateForm({ education: e.target.value })} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Working Hours</Label>
                  <Input value={form.workingHours} onChange={(e) => updateForm({ workingHours: e.target.value })} placeholder="e.g. 40 hrs/week" className="h-9 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Skills</Label>
                  <ChipsInput values={form.skills} onChange={(v) => updateForm({ skills: v })} placeholder="Add skill…" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Benefits</Label>
                  <ChipsInput values={form.benefits} onChange={(v) => updateForm({ benefits: v })} placeholder="Add benefit…" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Listing Duration (Days)</Label>
                  <Input type="number" min={1} max={180} value={form.durationDays} onChange={(e) => { updateForm({ durationDays: Number(e.target.value) }); if (form.expiresAt) updateForm({ expiresAt: '' }) }} className="h-9 text-xs" disabled={!!form.expiresAt} />
                  <p className="text-[10px] text-muted-foreground">{form.expiresAt ? 'Disabled (custom date set)' : 'Auto-calculated when set'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-amber-500" />Listing Expires On</Label>
                  <ThemeDatePicker
                    value={form.expiresAt}
                    onChange={(val) => updateForm({ expiresAt: val })}
                    minDate={new Date()}
                    placeholder="Select expiry date"
                    variant="admin"
                    showShortcuts={false}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-red-500" />Application Deadline</Label>
                  <ThemeDatePicker
                    value={form.deadlineAt}
                    onChange={(val) => updateForm({ deadlineAt: val })}
                    placeholder="Select deadline date"
                    variant="admin"
                    showShortcuts={false}
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">When candidates must apply by (separate from listing expiry).</p>
                </div>
              </div>

              <div className="space-y-3">
                <div><Label className="text-xs">Main Page Image</Label></div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={form.imageUrl} onChange={(e) => updateForm({ imageUrl: e.target.value })} className="h-9 text-xs" />
                  <input ref={mainImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(event) => void handleImageUpload(event, 'main')} />
                  <Button type="button" variant="outline" className="h-9 shrink-0 gap-1.5 text-xs" disabled={uploadingImage} onClick={() => mainImageInputRef.current?.click()}>
                    {uploadingImage && uploadTarget === 'main' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {uploadingImage && uploadTarget === 'main' ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                <div><Label className="text-xs">Inside Vacancy Image</Label></div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={form.detailImageUrl} onChange={(e) => updateForm({ detailImageUrl: e.target.value })} className="h-9 text-xs" />
                  <input ref={detailImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(event) => void handleImageUpload(event, 'detail')} />
                  <Button type="button" variant="outline" className="h-9 shrink-0 gap-1.5 text-xs" disabled={uploadingImage} onClick={() => detailImageInputRef.current?.click()}>
                    {uploadingImage && uploadTarget === 'detail' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {uploadingImage && uploadTarget === 'detail' ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Image alt text</Label>
                  <Input value={form.imageAlt} onChange={(e) => updateForm({ imageAlt: e.target.value })} placeholder="Describe the image for accessibility & image search" className="h-9 text-xs" />
                </div>
                <p className="text-[10px] text-muted-foreground">Upload an image or paste a public URL. Maximum 20 MB per image.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Short Summary</Label>
                <Textarea rows={2} value={form.summary} onChange={(e) => updateForm({ summary: e.target.value })} className="text-xs resize-none" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Full Details (Markdown Supported) *</Label>
                <Textarea rows={8} value={form.content} onChange={(e) => updateForm({ content: e.target.value })} className="text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Application Instructions</Label>
                <Textarea rows={3} value={form.applicationInstructions} onChange={(e) => updateForm({ applicationInstructions: e.target.value })} className="text-xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Eligibility Criteria</Label>
                  <ListEditor values={form.eligibility} onChange={(v) => updateForm({ eligibility: v })} placeholder="Add eligibility rule" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Required Documents</Label>
                  <ListEditor values={form.requiredDocuments} onChange={(v) => updateForm({ requiredDocuments: v })} placeholder="Add document" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">FAQ</Label>
                <div className="space-y-2">
                  {form.faq.map((item, i) => (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <input value={item.question} onChange={(e) => { const next = [...form.faq]; next[i] = { ...next[i], question: e.target.value }; updateForm({ faq: next }) }} className="w-full border-none bg-transparent text-sm font-medium outline-none" placeholder="Question" />
                        <button type="button" onClick={() => updateForm({ faq: form.faq.filter((_, idx) => idx !== i) })} aria-label="Remove FAQ item"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      </div>
                      <textarea value={item.answer} onChange={(e) => { const next = [...form.faq]; next[i] = { ...next[i], answer: e.target.value }; updateForm({ faq: next }) }} rows={2} className="mt-1 w-full border-none bg-transparent text-sm text-muted-foreground outline-none" placeholder="Answer" />
                    </div>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={() => updateForm({ faq: [...form.faq, { question: '', answer: '' }] })}><Plus className="mr-1 h-3.5 w-3.5" /> Add FAQ item</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">SEO title</Label>
                  <Input value={form.seoTitle} onChange={(e) => updateForm({ seoTitle: e.target.value.slice(0, 60) })} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Focus keyword</Label>
                  <Input value={form.focusKeyword} onChange={(e) => updateForm({ focusKeyword: e.target.value })} className="h-9 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Meta description</Label>
                <Textarea rows={2} value={form.metaDescription} onChange={(e) => updateForm({ metaDescription: e.target.value.slice(0, 160) })} className="text-xs" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Related keywords (AI suggestions)</Label>
                  <ChipsInput values={form.relatedKeywords} onChange={(v) => updateForm({ relatedKeywords: v })} placeholder="Add and press Enter…" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Long-tail keywords (AI suggestions)</Label>
                  <ChipsInput values={form.longTailKeywords} onChange={(v) => updateForm({ longTailKeywords: v })} placeholder="Add and press Enter…" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tags</Label>
                <ChipsInput values={form.tags} onChange={(v) => updateForm({ tags: v })} placeholder="Add tag…" />
              </div>
            </form>
          )}

          {activeTab === 'seo' && (
            <SeoPanel
              layout="full"
              pathPrefix="/urgent-requirements"
              title={form.title}
              metaTitle={form.seoTitle}
              metaDescription={form.metaDescription}
              slug={form.slug}
              focusKeyword={form.focusKeyword}
              content={form.content}
              faqCount={form.faq.length}
              imageAlt={form.imageAlt}
              existingSlugs={existingSlugs}
              existingTitles={existingTitles}
              currentSlug={form.slug}
              currentTitle={editingId ? requirements.find((r) => r.id === editingId)?.title : undefined}
              contentFormat="markdown"
              aiFeature="urgent_requirement"
              onApply={(patch) => updateForm({
                ...(patch.title !== undefined && { title: patch.title }),
                ...(patch.metaTitle !== undefined && { seoTitle: patch.metaTitle }),
                ...(patch.metaDescription !== undefined && { metaDescription: patch.metaDescription }),
                ...(patch.focusKeyword !== undefined && { focusKeyword: patch.focusKeyword }),
                ...(patch.content !== undefined && { content: patch.content }),
                ...(patch.imageAlt !== undefined && { imageAlt: patch.imageAlt }),
              })}
              onAddKeywords={(keywords) => updateForm({
                relatedKeywords: Array.from(new Set([...form.relatedKeywords, ...keywords])),
              })}
              socialImage={form.imageUrl}
            />
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-card border border-border/70">
                <div className="flex items-center gap-2 mb-2">
                  <FlagIcon country={form.country} code={form.countryCode} className="text-xl rounded-xs border border-border/40" />
                  <span className="text-xs font-bold text-foreground">{form.country}</span>
                  <span className="text-xs font-semibold text-primary">({form.vacancies} Vacancies)</span>
                  <span className="text-xs font-bold text-emerald-400 ml-auto">{fieldFlag('salary', form.salary) ? ADMIN_INPUT_REQUIRED : form.salary}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{form.title || 'Untitled Requirement'}</h2>
                {form.summary && <p className="text-xs text-muted-foreground mt-1">{form.summary}</p>}
              </div>
              {form.imageUrl && <div className="rounded-xl overflow-hidden aspect-video max-h-52"><img src={form.imageUrl} alt={form.imageAlt || 'Preview'} className="w-full h-full object-cover" /></div>}
              <div className="rounded-2xl bg-card border border-border/70 p-5">
                <BlogContent content={form.content || '*No content written yet.*'} />
                {form.faq.length > 0 && (
                  <div className="mt-6 space-y-3 border-t border-border pt-4">
                    <p className="text-sm font-semibold text-foreground">Frequently asked questions</p>
                    {form.faq.map((item, i) => (
                      <div key={i}><p className="text-sm font-medium text-foreground">{item.question}</p><p className="text-sm text-muted-foreground">{item.answer}</p></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky action bar: visible on every tab and without scrolling to the end of the long form. */}
          <div className="sticky -bottom-4 sm:-bottom-6 z-10 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-card/95 px-4 sm:px-6 py-3 backdrop-blur">
            {editingId ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Status: <strong className="capitalize text-foreground">{form.status}</strong></span>
                {dirty && <span className="text-amber-600 dark:text-amber-400 font-medium">· Unsaved changes</span>}
              </div>
            ) : <div />}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={requestClose} disabled={saving}>Cancel</Button>
              {form.status === 'active' ? (
                <>
                  <Button type="button" variant="outline" disabled={saving} onClick={() => void handleSaveClosed()}>Close Listing</Button>
                  <Button type="button" disabled={saving} className="font-bold px-6" onClick={() => void handleUpdateLive()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Update
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" disabled={saving} onClick={() => void (form.status === 'closed' ? handleSaveClosed() : handleSaveDraft())}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingId ? (form.status === 'closed' ? 'Update' : 'Update Draft') : 'Save Draft'}
                  </Button>
                  <Button type="button" disabled={saving} className="font-bold px-6" onClick={() => setPublishConfirmOpen(true)}>
                    {form.status === 'closed' ? 'Reopen & Publish' : 'Publish'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>You have edits that haven't been saved. Closing now will lose them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setCloseConfirmOpen(false); setIsOpen(false) }}>Discard and close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this urgent requirement?</AlertDialogTitle>
            <AlertDialogDescription>
              It will go live at /urgent-requirements/{form.slug} and appear in the site's urgent alerts.
              {form.adminInputRequired.length > 0 && ` ${form.adminInputRequired.length} field(s) are still marked "${ADMIN_INPUT_REQUIRED}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handlePublish()} disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
