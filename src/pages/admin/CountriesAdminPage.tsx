import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Plus, Sparkles, Search, Edit3, Trash2, CheckCircle2,
  X, Save, RefreshCw, Eye, EyeOff,
  Briefcase, GraduationCap, ChevronRight, Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAdminCountries, type AdminCountryItem } from '@/hooks/useAdminCountries'
import { generateCountryEligibilityWithAi, enhanceEligibilityWithAi } from '@/lib/ai/country-eligibility-generator'
import { FlagIcon } from '@/components/flag-icon'
import { toast } from 'sonner'

export default function CountriesAdminPage() {
  const { countries, isLoading, saveCountry, deleteCountry, toggleCountryActive } = useAdminCountries()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [activeVisaTab, setActiveVisaTab] = useState<'all' | 'work' | 'study'>('all')

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<AdminCountryItem> | null>(null)

  const [workEligibilityRules, setWorkEligibilityRules] = useState<string[]>([])
  const [studyEligibilityRules, setStudyEligibilityRules] = useState<string[]>([])

  const [newWorkRuleInput, setNewWorkRuleInput] = useState('')
  const [newStudyRuleInput, setNewStudyRuleInput] = useState('')

  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [enhancingRules, setEnhancingRules] = useState<'work' | 'study' | null>(null)

  const regions = ['All', 'Europe', 'Asia', 'Americas', 'Oceania', 'Middle East']

  const filteredCountries = countries.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRegion = selectedRegion === 'All' || c.region === selectedRegion
    return matchesSearch && matchesRegion
  })

  const handleOpenEdit = (item?: AdminCountryItem) => {
    if (item) {
      setEditingItem({ ...item })
      setWorkEligibilityRules([...(item.work_eligibility_criteria || item.eligibility_criteria || [])])
      setStudyEligibilityRules([...(item.study_eligibility_criteria || item.eligibility_criteria || [])])
    } else {
      setEditingItem({
        name: '', slug: '', code: 'DE', flag_emoji: '🌍',
        capital: '', region: 'Europe', language: 'English', description: '',
        why_work: '', why_study: '', lifestyle: '',
        success_rate: 95, avg_processing_days: 30, monthly_living_cost: 85000, is_active: true,
      })
      setWorkEligibilityRules([
        'Valid Passport with at least 18 months validity.',
        'Relevant Skill Assessment / Trade Certification.',
        'Proof of Work Experience letters.',
        'PCC from Regional Passport Office.',
      ])
      setStudyEligibilityRules([
        'Official University Offer Letter / CAS / CoE.',
        'IELTS Academic / PTE score certificate.',
        'Sufficient Liquid Financial Funds in bank account.',
        'Academic Transcripts and Marksheets.',
      ])
    }
    setNewWorkRuleInput('')
    setNewStudyRuleInput('')
    setIsEditOpen(true)
  }

  const handleAddWorkRule = () => {
    if (!newWorkRuleInput.trim()) return
    setWorkEligibilityRules([...workEligibilityRules, newWorkRuleInput.trim()])
    setNewWorkRuleInput('')
  }
  const handleRemoveWorkRule = (index: number) => {
    setWorkEligibilityRules(workEligibilityRules.filter((_, i) => i !== index))
  }
  const handleWorkRuleChange = (index: number, text: string) => {
    const next = [...workEligibilityRules]; next[index] = text; setWorkEligibilityRules(next)
  }

  const handleAddStudyRule = () => {
    if (!newStudyRuleInput.trim()) return
    setStudyEligibilityRules([...studyEligibilityRules, newStudyRuleInput.trim()])
    setNewStudyRuleInput('')
  }
  const handleRemoveStudyRule = (index: number) => {
    setStudyEligibilityRules(studyEligibilityRules.filter((_, i) => i !== index))
  }
  const handleStudyRuleChange = (index: number, text: string) => {
    const next = [...studyEligibilityRules]; next[index] = text; setStudyEligibilityRules(next)
  }

  const handleSaveForm = async () => {
    if (!editingItem?.name) { toast.error('Country name is required'); return }
    const slug = editingItem.slug || editingItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const cleanWork = workEligibilityRules.filter(r => r.trim().length > 0)
    const cleanStudy = studyEligibilityRules.filter(r => r.trim().length > 0)
    await saveCountry({
      ...editingItem, name: editingItem.name, slug,
      work_eligibility_criteria: cleanWork,
      study_eligibility_criteria: cleanStudy,
      eligibility_criteria: cleanWork.length > 0 ? cleanWork : cleanStudy,
    })
    setIsEditOpen(false)
  }

  const handleEnhanceRules = async (kind: 'work' | 'study') => {
    const countryName = editingItem?.name?.trim()
    if (!countryName) { toast.error('Enter a country name first'); return }
    const rules = kind === 'work' ? workEligibilityRules : studyEligibilityRules
    if (rules.length === 0) { toast.error(`Add at least one ${kind} rule first, then AI can refine it.`); return }
    setEnhancingRules(kind)
    try {
      const enhanced = await enhanceEligibilityWithAi(countryName, rules)
      if (kind === 'work') setWorkEligibilityRules(enhanced)
      else setStudyEligibilityRules(enhanced)
      toast.success(`AI refined ${kind} eligibility details for ${countryName}`)
    } catch (err: any) {
      toast.error(err?.message || 'AI enhancement failed')
    } finally {
      setEnhancingRules(null)
    }
  }

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) { toast.error('Please enter a country or visa prompt'); return }
    setIsGeneratingAi(true)
    try {
      const generated = await generateCountryEligibilityWithAi(aiPrompt, undefined, 'Siddhivinayak Overseas is a leading visa consultancy in Surat, Gujarat, India specializing in work and study visa applications for destinations worldwide. We help Indian students and professionals with visa applications, document verification, and immigration guidance.')
      setEditingItem(generated)
      setWorkEligibilityRules(generated.eligibility_criteria)
      setStudyEligibilityRules(generated.eligibility_criteria)
      setIsAiOpen(false)
      setIsEditOpen(true)
      toast.success(`Generated accurate profile and eligibility for ${generated.name}!`)
    } catch (err: any) {
      toast.error('AI generation failed')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
              Live Synchronized
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl mb-2">Countries & Eligibility Manager</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Manage Work & Study Visa rules independently. Updates sync live to public website pages without rebuilds.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button
              onClick={() => setIsAiOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Generate Country
            </Button>
            <Button onClick={() => handleOpenEdit()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Country
            </Button>
          </div>
        </div>
      </div>

      {/* Top Visa Category Switcher Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-1">
        <Button
          variant={activeVisaTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveVisaTab('all')}
          className="gap-2 rounded-xl"
        >
          <Globe className="h-4 w-4" />
          All Visas ({countries.length})
        </Button>
        <div className="w-px h-6 bg-border/40 mx-1" />
        <Button
          variant={activeVisaTab === 'work' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveVisaTab('work')}
          className="gap-2 rounded-xl text-amber-600 dark:text-amber-400 data-[state=active]:bg-amber-500/10"
        >
          <Briefcase className="h-4 w-4" />
          Work Visa Pathways
        </Button>
        <div className="w-px h-6 bg-border/40 mx-1" />
        <Button
          variant={activeVisaTab === 'study' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveVisaTab('study')}
          className="gap-2 rounded-xl text-blue-600 dark:text-blue-400 data-[state=active]:bg-blue-500/10"
        >
          <GraduationCap className="h-4 w-4" />
          Study Visa Pathways
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-border/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search country by name, capital, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {regions.map((reg) => (
            <Button
              key={reg}
              variant={selectedRegion === reg ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRegion(reg)}
              className="rounded-full text-xs shrink-0"
            >
              {reg}
            </Button>
          ))}
        </div>
      </div>

      {/* Countries Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading countries & eligibility data...</span>
        </div>
      ) : filteredCountries.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/60 p-8">
          <Globe className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold">No countries found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            No country matched your search query. Click "Add Country" or use "AI Generate Country" to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredCountries.map((country) => {
            const displayWorkRules = country.work_eligibility_criteria || country.eligibility_criteria || []
            const displayStudyRules = country.study_eligibility_criteria || country.eligibility_criteria || []

            return (
              <motion.div
                key={country.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                  country.is_active
                    ? 'border-border/80 hover:border-primary/40 hover:shadow-md'
                    : 'border-border/40 opacity-60 bg-muted/15'
                }`}
              >
                {/* Glow effect for active cards */}
                {country.is_active && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
                )}

                <div className="space-y-4 relative">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex items-center justify-center p-1 bg-muted/30 rounded-lg border border-border/50 shrink-0">
                        <FlagIcon country={country.name} code={country.code} className="text-3xl rounded-xs shadow-xs" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-foreground truncate">{country.name}</h3>
                          <Badge variant="secondary" className="text-[10px] font-mono uppercase px-1.5 py-0.2 shrink-0">
                          </Badge>
                          {country.has_work_visa && (
                            <Badge variant="outline" className="text-[9px] gap-1 border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 dark:border-amber-500/20 dark:bg-amber-500/10">
                              <Briefcase className="h-2 w-2" /> Work
                            </Badge>
                          )}
                          {country.has_study_visa && (
                            <Badge variant="outline" className="text-[9px] gap-1 border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400 dark:border-blue-500/20 dark:bg-blue-500/10">
                              <GraduationCap className="h-2 w-2" /> Study
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {country.capital ? `${country.capital} · ` : ''}{country.region}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCountryActive(country.id)}
                        title={country.is_active ? 'Active on website (click to hide)' : 'Hidden (click to show)'}
                        className={`h-8 w-8 transition-all ${country.is_active ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >
                        {country.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(country)}
                        title="Edit country & eligibility"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete country profile for "${country.name}"?`)) {
                            deleteCountry(country.id)
                          }
                        }}
                        title="Delete country"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {country.description || 'No description provided.'}
                  </p>

                  {/* WORK VISA ELIGIBILITY SECTION */}
                  {(activeVisaTab === 'all' || activeVisaTab === 'work') && (
                    <div className="space-y-2 pt-3 border-t border-amber-500/15 dark:border-amber-500/25 bg-amber-500/[0.03] dark:bg-amber-500/[0.06] p-3 rounded-xl">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <Briefcase className="h-4 w-4" />
                          Work Visa Requirements ({displayWorkRules.length})
                        </span>
                        <button
                          onClick={() => handleOpenEdit(country)}
                          className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                        >
                          Manage <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {displayWorkRules.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground group">
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <span className="line-clamp-1">{rule}</span>
                          </div>
                        ))}
                        {displayWorkRules.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic pl-5">No work criteria defined.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STUDY VISA ELIGIBILITY SECTION */}
                  {(activeVisaTab === 'all' || activeVisaTab === 'study') && (
                    <div className="space-y-2 pt-3 border-t border-blue-500/15 dark:border-blue-500/25 bg-blue-500/[0.03] dark:bg-blue-500/[0.06] p-3 rounded-xl">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                          <GraduationCap className="h-4 w-4" />
                          Study Visa Requirements ({displayStudyRules.length})
                        </span>
                        <button
                          onClick={() => handleOpenEdit(country)}
                          className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                        >
                          Manage <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {displayStudyRules.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground group">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <span className="line-clamp-1">{rule}</span>
                          </div>
                        ))}
                        {displayStudyRules.length === 0 && (
                          <p className="text-[11px] text-muted-foreground italic pl-5">No study criteria defined.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Footer */}
                <div className="mt-6 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Success: <strong className="text-foreground">{country.success_rate}%</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Processing: <strong className="text-foreground">{country.avg_processing_days}d</strong>
                    </span>
                  </div>
                  <Badge variant={country.is_active ? 'default' : 'outline'} className="text-[10px]">
                    {country.is_active ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* AI Generator Modal */}
      <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI Country & Eligibility Generator
            </DialogTitle>
            <DialogDescription>
              Enter a country or visa prompt (e.g. "Germany Opportunity Card" or "Japan SSW"). AI will auto-create both Work & Study visa rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Country or Visa Target</Label>
              <Input
                placeholder="e.g. Germany, Japan SSW, UK NHS Caregiver, Canada Express Entry"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAi()}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsAiOpen(false)}>Cancel</Button>
            <Button
              onClick={handleGenerateAi}
              disabled={isGeneratingAi || !aiPrompt.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 gap-2"
            >
              {isGeneratingAi ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Profile</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Create Country & Eligibility Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {editingItem?.id ? `Edit ${editingItem.name} Work & Study Rules` : 'Add New Country & Eligibility'}
            </DialogTitle>
            <DialogDescription>
              Separate Work Visa and Study Visa eligibility rules. Changes update live across website pages.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="work-rules" className="w-full mt-2">
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="work-rules" className="gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Briefcase className="h-3.5 w-3.5" /> Work Rules
              </TabsTrigger>
              <TabsTrigger value="study-rules" className="gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <GraduationCap className="h-3.5 w-3.5" /> Study Rules
              </TabsTrigger>
              <TabsTrigger value="basic" className="gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" /> Basic Info
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" /> Highlights
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: WORK VISA RULES */}
            <TabsContent value="work-rules" className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-3 rounded-xl border border-amber-500/20 dark:border-amber-500/30">
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">💼 Work Visa Eligibility Rules</p>
                  <p className="text-[11px] text-muted-foreground">Required experience, skill assessments, language tests & PCC for work permits.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={enhancingRules === 'work'}
                  onClick={() => void handleEnhanceRules('work')}
                  className="shrink-0 gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300"
                  title="Use AI to refine and enhance these details"
                >
                  {enhancingRules === 'work' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI details
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Skill assessment from Engineers Australia / VETASSESS..."
                  value={newWorkRuleInput}
                  onChange={(e) => setNewWorkRuleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWorkRule())}
                />
                <Button onClick={handleAddWorkRule} className="shrink-0 gap-1 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="h-4 w-4" /> Add Work Rule
                </Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {workEligibilityRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-xl">No work eligibility rules added yet. Add a rule above.</p>
                ) : (
                  workEligibilityRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border/60 hover:border-border">
                      <span className="text-xs font-semibold text-muted-foreground w-5 text-center">{idx + 1}.</span>
                      <Input value={rule} onChange={(e) => handleWorkRuleChange(idx, e.target.value)} className="flex-1 text-xs border-none bg-transparent focus-visible:ring-1" />
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveWorkRule(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: STUDY VISA RULES */}
            <TabsContent value="study-rules" className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-3 rounded-xl border border-blue-500/20 dark:border-blue-500/30">
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">🎓 Study Visa Eligibility Rules</p>
                  <p className="text-[11px] text-muted-foreground">University CAS/CoE offer letters, IELTS/PTE scores, blocked account & academic transcripts.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={enhancingRules === 'study'}
                  onClick={() => void handleEnhanceRules('study')}
                  className="shrink-0 gap-1.5 border-blue-500/40 text-blue-700 dark:text-blue-300"
                  title="Use AI to refine and enhance these details"
                >
                  {enhancingRules === 'study' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI details
                </Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="e.g. CAS Letter / Offer of Place from accredited university..." value={newStudyRuleInput} onChange={(e) => setNewStudyRuleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStudyRule())} />
                <Button onClick={handleAddStudyRule} className="shrink-0 gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4" /> Add Study Rule
                </Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {studyEligibilityRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-xl">No study eligibility rules added yet. Add a rule above.</p>
                ) : (
                  studyEligibilityRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border/60 hover:border-border">
                      <span className="text-xs font-semibold text-muted-foreground w-5 text-center">{idx + 1}.</span>
                      <Input value={rule} onChange={(e) => handleStudyRuleChange(idx, e.target.value)} className="flex-1 text-xs border-none bg-transparent focus-visible:ring-1" />
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveStudyRule(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 3: BASIC INFO */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Country Name *</Label>
                  <Input value={editingItem?.name || ''} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="e.g. Germany" />
                </div>
                <div>
                  <Label>URL Slug</Label>
                  <Input value={editingItem?.slug || ''} onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })} placeholder="e.g. germany" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Flag Emoji</Label>
                  <Input value={editingItem?.flag_emoji || ''} onChange={(e) => setEditingItem({ ...editingItem, flag_emoji: e.target.value })} placeholder="🇩🇪" />
                </div>
                <div>
                  <Label>ISO Code</Label>
                  <Input value={editingItem?.code || ''} onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })} placeholder="DE" />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input value={editingItem?.region || ''} onChange={(e) => setEditingItem({ ...editingItem, region: e.target.value })} placeholder="Europe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capital City</Label>
                  <Input value={editingItem?.capital || ''} onChange={(e) => setEditingItem({ ...editingItem, capital: e.target.value })} placeholder="Berlin" />
                </div>
                <div>
                  <Label>Primary Language(s)</Label>
                  <Input value={editingItem?.language || ''} onChange={(e) => setEditingItem({ ...editingItem, language: e.target.value })} placeholder="German, English" />
                </div>
              </div>
              <div>
                <Label>Short Overview / Description</Label>
                <Textarea value={editingItem?.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} placeholder="Overview of study and work opportunities for Indian candidates..." rows={3} />
              </div>
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <Checkbox checked={editingItem?.has_work_visa ?? true} onCheckedChange={(checked) => setEditingItem({ ...editingItem, has_work_visa: !!checked })} />
                  Has Work Visa
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <Checkbox checked={editingItem?.has_study_visa ?? true} onCheckedChange={(checked) => setEditingItem({ ...editingItem, has_study_visa: !!checked })} />
                  Has Study Visa
                </label>
              </div>
            </TabsContent>

            {/* TAB 4: HIGHLIGHTS & STATS */}
            <TabsContent value="stats" className="space-y-4">
              <div>
                <Label>Why Work Here (Work Visa Highlights)</Label>
                <Textarea value={editingItem?.why_work || ''} onChange={(e) => setEditingItem({ ...editingItem, why_work: e.target.value })} placeholder="Salary benefits, sponsorship, PR pathway..." rows={2} />
              </div>
              <div>
                <Label>Why Study Here (Student Visa Highlights)</Label>
                <Textarea value={editingItem?.why_study || ''} onChange={(e) => setEditingItem({ ...editingItem, why_study: e.target.value })} placeholder="Universities, post-study work permits..." rows={2} />
              </div>
              <div>
                <Label>Lifestyle & Living</Label>
                <Textarea value={editingItem?.lifestyle || ''} onChange={(e) => setEditingItem({ ...editingItem, lifestyle: e.target.value })} placeholder="Quality of life, cost of living, cultural scene..." rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Visa Success Rate (%)</Label>
                  <Input type="number" value={editingItem?.success_rate || 95} onChange={(e) => setEditingItem({ ...editingItem, success_rate: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Avg Processing (Days)</Label>
                  <Input type="number" value={editingItem?.avg_processing_days || 30} onChange={(e) => setEditingItem({ ...editingItem, avg_processing_days: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Monthly Living Cost (₹)</Label>
                  <Input type="number" value={editingItem?.monthly_living_cost || 85000} onChange={(e) => setEditingItem({ ...editingItem, monthly_living_cost: Number(e.target.value) })} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveForm} className="gap-2">
              <Save className="h-4 w-4" /> Save Country & Sync Live
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
