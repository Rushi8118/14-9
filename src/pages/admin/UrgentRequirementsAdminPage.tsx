import React, { useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Flame, Plus, Sparkles, Pencil, Trash2, Eye, EyeOff, Clock, Users,
  CheckCircle2, XCircle, Search, RefreshCw, Calendar, Loader2,
  ExternalLink, DollarSign, Briefcase, Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
} from '@/hooks/useUrgentRequirements'
import { generateUrgentRequirementWithAi } from '@/lib/ai/urgent-requirement-generator'
import { BlogContent } from '@/components/blog/BlogContent'
import { FlagIcon } from '@/components/flag-icon'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { MEDIA_BUCKET } from '@/hooks/useFileManager'

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all')

  // Modal Dialog State
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [country, setCountry] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [category, setCategory] = useState('Healthcare / Work Visa')
  const [vacancies, setVacancies] = useState(10)
  const [salary, setSalary] = useState('£24,500 – £28,000 / year + Overtime')
  const [experienceRequired, setExperienceRequired] = useState('1+ Year relevant experience')
  const [durationDays, setDurationDays] = useState(14)
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [imageUrl, setImageUrl] = useState('')
  const [detailImageUrl, setDetailImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<'main' | 'detail' | null>(null)
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const detailImageInputRef = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'active' | 'closed'>('active')

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  // Filtered requirements
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
        (statusFilter === 'active' && r.status === 'active' && !isRequirementExpired(r)) ||
        (statusFilter === 'closed' && (r.status === 'closed' || isRequirementExpired(r)))

      return matchSearch && matchStatus
    })
  }, [requirements, search, statusFilter])

  // Statistics
  const activeCount = requirements.filter((r) => r.status === 'active' && !isRequirementExpired(r)).length
  const totalVacancies = requirements.reduce((acc, r) => acc + (r.vacancies || 0), 0)
  const expiringSoonCount = requirements.filter((r) => {
    const d = getRemainingDays(r.expires_at)
    return r.status === 'active' && d !== null && d > 0 && d <= 7
  }).length
  const closedCount = requirements.filter((r) => r.status === 'closed' || isRequirementExpired(r)).length

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingId(null)
    setTitle('')
    setSlug('')
    setCountry('')
    setCountryCode('')
    setCategory('Healthcare / Work Visa')
    setVacancies(10)
    setSalary('£24,500 – £28,000 / year + Overtime')
    setExperienceRequired('1+ Year relevant experience')
    setDurationDays(14)
    setExpiresAt('')
    setImageUrl('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80')
    setDetailImageUrl('')
    setSummary('')
    setContent('')
    setStatus('active')
    setAiPrompt('')
    setActiveTab('edit')
    setIsOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (req: UrgentRequirement) => {
    setEditingId(req.id)
    setTitle(req.title)
    setSlug(req.slug)
    setCountry(req.country)
    setCountryCode(req.country_code)
    setCategory(req.category)
    setVacancies(req.vacancies)
    setSalary(req.salary)
    setExperienceRequired(req.experience_required || '')
    const rem = getRemainingDays(req.expires_at)
    setDurationDays(rem && rem > 0 ? rem : 14)
    
    // Format expires_at for the date input (YYYY-MM-DD)
    if (req.expires_at) {
      const date = new Date(req.expires_at)
      setExpiresAt(date.toISOString().split('T')[0])
    } else {
      setExpiresAt('')
    }
    
    setImageUrl(req.image_url || '')
    setDetailImageUrl(req.detail_image_url || '')
    setSummary(req.summary || '')
    setContent(req.content)
    setStatus(req.status === 'closed' || isRequirementExpired(req) ? 'closed' : 'active')
    setActiveTab('edit')
    setIsOpen(true)
  }

  // AI Write Trigger
  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a short prompt (e.g. "25 NHS Care Workers in UK" or "Japan SSW Food 15")')
      return
    }

    setIsGeneratingAi(true)
    try {
      const generated = await generateUrgentRequirementWithAi(aiPrompt, country)
      setTitle(generated.title)
      setSlug(generated.slug)
      setCountry(generated.country)
      setCountryCode(generated.country_code)
      setCategory(generated.category)
      setVacancies(generated.vacancies)
      setSalary(generated.salary)
      setExperienceRequired(generated.experience_required)
      setImageUrl(generated.image_url)
      setDetailImageUrl('')
      setSummary(generated.summary)
      setContent(generated.content)
      setDurationDays(generated.duration_days || 14)
      toast.success('AI generated complete urgent requirement!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate with AI')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'main' | 'detail',
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
      toast.error('Please select a JPG, PNG, WEBP, GIF, or AVIF image.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be smaller than 20 MB.')
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
      if (target === 'main') setImageUrl(data.publicUrl)
      else setDetailImageUrl(data.publicUrl)
      toast.success(target === 'main' ? 'Main image uploaded' : 'Detail image uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload cover image')
    } finally {
      setUploadingImage(false)
      setUploadTarget(null)
    }
  }

  // Save Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Title and Content are required')
      return
    }
    if (!country.trim()) {
      toast.error('Country is required')
      return
    }

    // Validate expiration date if provided
    if (expiresAt) {
      const selectedDate = new Date(expiresAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        toast.error('Expiration date must be in the future')
        return
      }
    }

    const payload: UrgentRequirementInput = {
      id: editingId || undefined,
      title: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      country,
      country_code: countryCode,
      category,
      vacancies: Number(vacancies) || 1,
      salary,
      experience_required: experienceRequired,
      image_url: imageUrl,
      detail_image_url: detailImageUrl,
      summary,
      content,
      status,
      // If expiresAt is set, use it directly; otherwise calculate from duration_days
      ...(expiresAt 
        ? { expires_at: new Date(expiresAt).toISOString() }
        : { duration_days: Number(durationDays) || 14 }
      ),
    }

    try {
      await saveRequirement(payload)
      setIsOpen(false)
    } catch (err) {
      // toast handled in hook
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-foreground">
            <Flame className="h-6 w-6 text-red-500 fill-red-500" />
            Urgent Requirements & Fast-Track Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage live urgent openings displayed on the website banner and details pages. Automatically expires or close when filled.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-md btn-glow"
          >
            <Plus className="h-4 w-4" />
            Add Urgent Requirement
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-red-500" /> Active Openings
          </span>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> Total Vacancies
          </span>
          <p className="text-2xl font-bold text-foreground">{totalVacancies}</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Expiring Soon (≤7d)
          </span>
          <p className="text-2xl font-bold text-amber-400">{expiringSoonCount}</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Closed / Filled
          </span>
          <p className="text-2xl font-bold text-muted-foreground">{closedCount}</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/70">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center rounded-xl bg-muted/40 p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                statusFilter === 'all' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({requirements.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                statusFilter === 'active' ? 'bg-background text-emerald-400 shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                statusFilter === 'closed' ? 'bg-background text-muted-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchAll} className="h-8 w-8 p-0 rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Requirements Table */}
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
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading urgent requirements...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No urgent requirements found. Click "Add Urgent Requirement" or generate with AI.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const remainingDays = getRemainingDays(req.expires_at)
                  const isExpired = isRequirementExpired(req)
                  const isActive = req.status === 'active' && !isExpired

                  return (
                    <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                      {/* Title & Country */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center p-1 bg-muted/40 rounded border border-border/50 shrink-0">
                            <FlagIcon country={req.country} code={req.country_code} className="text-2xl rounded-xs shadow-xs" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/urgent-requirements/${req.slug}`}
                              target="_blank"
                              className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
                            >
                              {req.title}
                              <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">{req.country}</span>
                              <span className="text-[11px] text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded font-medium">
                                {req.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vacancies */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-foreground bg-muted/40 px-2 py-1 rounded-md">
                          <Users className="h-3 w-3 text-primary" />
                          {req.vacancies}
                        </span>
                      </td>

                      {/* Salary */}
                      <td className="py-3.5 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                        {req.salary}
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {isActive ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Clock className="h-3 w-3" />
                                {remainingDays !== null && remainingDays > 0 ? `${remainingDays}d remaining` : 'Ends today'}
                              </span>
                              <button
                                type="button"
                                onClick={() => extendDuration(req.id, 7)}
                                className="text-[10px] text-primary hover:underline font-medium"
                                title="Extend deadline by +7 days"
                              >
                                +7d
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Closed / Completed
                            </span>
                          )}
                          {req.expires_at && (
                            <p className="text-[10px] text-muted-foreground">
                              Deadline: {new Date(req.expires_at).toLocaleDateString('en-GB')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleStatus(req.id, isActive ? 'closed' : 'active')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-muted text-muted-foreground border border-border/70 hover:bg-muted/80'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> Stopped
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(req.id, isActive ? 'closed' : 'active')}
                            className={`h-8 w-8 p-0 rounded-lg transition ${
                              isActive
                                ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                            title={isActive ? 'Active on website (click to hide)' : 'Hidden (click to show)'}
                          >
                            {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>

                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            title="View Public Details Page"
                          >
                            <Link to={`/urgent-requirements/${req.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(req)}
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary"
                            title="Edit Requirement"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete urgent requirement "${req.title}"?`)) {
                                removeRequirement(req.id)
                              }
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

      {/* Create / Edit Dialog with AI Writer */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              {editingId ? 'Edit Urgent Requirement' : 'Create New Urgent Requirement'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Fill in the job and visa opening details or use AI to generate a complete structured mandate.
            </DialogDescription>
          </DialogHeader>

          {/* AI Generator Banner inside Modal */}
          <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Write & Auto-Generate Details
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono">1-Click Synthesis</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="e.g. 25 UK NHS Care Workers, £28k salary, priority visa..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="h-9 text-xs bg-background"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleGenerateWithAi()
                  }
                }}
              />
              <Button
                type="button"
                disabled={isGeneratingAi}
                onClick={handleGenerateWithAi}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shrink-0"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'edit' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Edit Fields
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'preview' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Live Preview
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <button
                type="button"
                onClick={() => setStatus(status === 'active' ? 'closed' : 'active')}
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {status === 'active' ? '🟢 Active' : '🔴 Closed'}
              </button>
            </div>
          </div>

          {activeTab === 'edit' ? (
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Requirement Title *</Label>
                  <Input
                    required
                    placeholder="e.g. Urgent Requirement: 25 Senior Healthcare Assistants (UK NHS)"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (!editingId) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80))
                      }
                    }}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">URL Slug *</Label>
                  <Input
                    required
                    placeholder="e.g. urgent-uk-healthcare-assistants"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Country *</Label>
                  <div className="flex items-center gap-2">
                    {country && (
                      <FlagIcon country={country} code={countryCode} className="shrink-0 text-lg rounded-xs border border-border/40" />
                    )}
                    <Input
                      required
                      list="urgent-country-suggestions"
                      placeholder="Type or pick any country"
                      value={country}
                      onChange={(e) => {
                        const val = e.target.value
                        setCountry(val)
                        const found = COUNTRIES_LIST.find((c) => c.name.toLowerCase() === val.toLowerCase())
                        setCountryCode(found ? found.code : countryCode)
                      }}
                      className="h-9 text-xs"
                    />
                  </div>
                  <datalist id="urgent-country-suggestions">
                    {COUNTRIES_LIST.map((c) => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                  <div className="flex items-center gap-2 pt-1">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">ISO code</Label>
                    <Input
                      placeholder="e.g. GB"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                      className="h-7 w-20 text-xs uppercase"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Category, Vacancies, Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category / Industry *</Label>
                  <Input
                    placeholder="e.g. Healthcare, IT, SSW"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Vacancies (Openings) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={vacancies}
                    onChange={(e) => setVacancies(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Timeline Duration (Days to show) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={durationDays}
                    onChange={(e) => {
                      setDurationDays(Number(e.target.value))
                      // Clear custom date if duration days is changed
                      if (expiresAt) setExpiresAt('')
                    }}
                    className="h-9 text-xs"
                    disabled={!!expiresAt}
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {expiresAt ? 'Disabled (using custom date below)' : 'Auto-calculate expiration'}
                  </p>
                </div>
              </div>

              {/* Custom Expiration Date */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  Custom Expiration Date (Optional)
                </Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Leave empty to use duration days, or pick a specific deadline date
                </p>
              </div>

              {/* Salary & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Salary / Package *</Label>
                  <Input
                    placeholder="e.g. £24,500 – £28,000 / year + Overtime"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Experience Required</Label>
                  <Input
                    placeholder="e.g. 1+ Year Caregiving or Nursing"
                    value={experienceRequired}
                    onChange={(e) => setExperienceRequired(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Separate listing and detail images */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Main Page Image</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Shown on the urgent openings listing card.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Main image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <input
                    ref={mainImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={(event) => void handleImageUpload(event, 'main')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 gap-1.5 text-xs"
                    disabled={uploadingImage}
                    onClick={() => mainImageInputRef.current?.click()}
                  >
                    {uploadingImage && uploadTarget === 'main' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {uploadingImage && uploadTarget === 'main' ? 'Uploading...' : 'Upload main'}
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Inside Vacancy Image</Label>
                  <p className="text-[10px] text-muted-foreground">
                    A separate image shown inside the vacancy details page.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Detail image URL"
                    value={detailImageUrl}
                    onChange={(e) => setDetailImageUrl(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <input
                    ref={detailImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={(event) => void handleImageUpload(event, 'detail')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 gap-1.5 text-xs"
                    disabled={uploadingImage}
                    onClick={() => detailImageInputRef.current?.click()}
                  >
                    {uploadingImage && uploadTarget === 'detail' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    {uploadingImage && uploadTarget === 'detail' ? 'Uploading...' : 'Upload detail'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Upload an image or paste a public URL. Maximum 20 MB per image.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <Label className="text-xs">Short Summary / Alert Pitch</Label>
                <Textarea
                  rows={2}
                  placeholder="2-3 sentence overview shown in cards and alert banners..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              {/* Full Content Markdown */}
              <div className="space-y-1">
                <Label className="text-xs">Full Details (Markdown Supported) *</Label>
                <Textarea
                  rows={8}
                  placeholder="## Urgent Opportunity Overview&#10;&#10;### Key Highlights & Benefits&#10;- Free visa sponsorship&#10;&#10;### Eligibility Criteria..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save & Publish'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Live Preview */
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-card border border-border/70">
                <div className="flex items-center gap-2 mb-2">
                  <FlagIcon country={country} code={countryCode} className="text-xl rounded-xs border border-border/40" />
                  <span className="text-xs font-bold text-foreground">{country}</span>
                  <span className="text-xs font-semibold text-primary">({vacancies} Vacancies)</span>
                  <span className="text-xs font-bold text-emerald-400 ml-auto">{salary}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{title || 'Untitled Requirement'}</h2>
                {summary && <p className="text-xs text-muted-foreground mt-1">{summary}</p>}
              </div>

              {imageUrl && (
                <div className="rounded-xl overflow-hidden aspect-video max-h-52">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              {detailImageUrl && detailImageUrl !== imageUrl && (
                <div className="rounded-xl overflow-hidden aspect-video max-h-52">
                  <img src={detailImageUrl} alt="Detail preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="rounded-2xl bg-card border border-border/70 p-5">
                <BlogContent content={content || '*No content written yet.*'} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
