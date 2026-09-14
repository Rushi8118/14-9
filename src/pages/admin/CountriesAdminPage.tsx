import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Briefcase,
  CircleDashed,
  DatabaseZap,
  Eye,
  EyeOff,
  Globe2,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useAdminCountries, type AdminCountryItem } from '@/hooks/useAdminCountries'
import { usePermissions } from '@/hooks/usePermissions'
import { generateCountryEligibilityWithAi } from '@/lib/ai/country-eligibility-generator'
import { cn } from '@/lib/utils'
import { FlagIcon } from '@/components/flag-icon'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import CountryEditorDialog, { COUNTRY_REGIONS } from '@/components/admin/countries/CountryEditorDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PageHeader, { Reveal } from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
import InlineError from '@/components/dashboard/InlineError'
import { StatusPill } from '@/components/dashboard/StatusPill'

type StatusFilter = 'all' | 'published' | 'hidden' | 'attention'
type VisaFilter = 'all' | 'work' | 'study'
type SortKey = 'order' | 'name' | 'updated'

const COMPANY_CONTEXT =
  'Siddhivinayak Overseas is a leading visa consultancy in Surat, Gujarat, India specializing in work and study visa applications for destinations worldwide. We help Indian students and professionals with visa applications, document verification, and immigration guidance.'

function attentionReasons(country: AdminCountryItem) {
  const reasons: string[] = []
  if (!country.description.trim()) reasons.push('No overview')
  if (country.has_work_visa && country.work_eligibility_criteria.length === 0) reasons.push('No work rules')
  if (country.has_study_visa && country.study_eligibility_criteria.length === 0) reasons.push('No study rules')
  if (!country.capital.trim()) reasons.push('No capital')
  if (country.source === 'starter') reasons.push('Not in database')
  return reasons
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
  loading,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone: string
  active?: boolean
  onClick?: () => void
  loading: boolean
}) {
  const content = (
    <>
      <span className={cn('grid h-9 w-9 place-items-center rounded-lg', tone)}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span>
        {loading ? (
          <Skeleton className="h-7 w-10 bg-[var(--desk-line)]/60" />
        ) : (
          <span className="desk-display block text-2xl font-semibold tabular-nums text-[var(--desk-navy)]">{value}</span>
        )}
        <span className="block text-sm text-[var(--desk-muted)]">{label}</span>
      </span>
    </>
  )
  const className = cn('desk-card flex h-full w-full items-center gap-3 p-4 text-left', onClick && 'desk-card-interactive', active && 'ring-2 ring-[var(--desk-gold)]/60')
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}

export default function CountriesAdminPage() {
  const {
    countries,
    isLoading,
    isFetching,
    error,
    isFallback,
    dataUpdatedAt,
    refetch,
    starterCountries,
    saveCountry,
    isSaving,
    deleteCountry,
    isDeleting,
    toggleCountryActive,
    importStarterCountries,
    isImporting,
  } = useAdminCountries()
  const { can } = usePermissions()
  const canCreate = can('countries.create')
  const canUpdate = can('countries.update')
  const canDelete = can('countries.delete')

  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [visa, setVisa] = useState<VisaFilter>('all')
  const [sort, setSort] = useState<SortKey>('order')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCountryItem | null>(null)
  const [seed, setSeed] = useState<Partial<AdminCountryItem> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCountryItem | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const regions = useMemo(
    () => [...new Set([...COUNTRY_REGIONS, ...countries.map((c) => c.region).filter(Boolean)])].sort(),
    [countries],
  )

  const stats = useMemo(
    () => ({
      total: countries.length,
      published: countries.filter((c) => c.is_active).length,
      hidden: countries.filter((c) => !c.is_active).length,
      work: countries.filter((c) => c.has_work_visa).length,
      study: countries.filter((c) => c.has_study_visa).length,
      attention: countries.filter((c) => attentionReasons(c).length > 0).length,
    }),
    [countries],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = countries.filter((c) => {
      if (term && ![c.name, c.capital, c.code, c.slug, c.language].some((v) => v.toLowerCase().includes(term))) return false
      if (region !== 'all' && c.region !== region) return false
      if (visa === 'work' && !c.has_work_visa) return false
      if (visa === 'study' && !c.has_study_visa) return false
      if (status === 'published' && !c.is_active) return false
      if (status === 'hidden' && c.is_active) return false
      if (status === 'attention' && attentionReasons(c).length === 0) return false
      return true
    })
    return [...rows].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      return a.sort_order - b.sort_order || a.name.localeCompare(b.name)
    })
  }, [countries, search, region, visa, status, sort])

  const hasFilters = !!search || region !== 'all' || visa !== 'all' || status !== 'all'
  const clearFilters = () => {
    setSearch('')
    setRegion('all')
    setVisa('all')
    setStatus('all')
  }

  const openEditor = (country: AdminCountryItem | null, seedData: Partial<AdminCountryItem> | null = null) => {
    setEditing(country)
    setSeed(seedData)
    setEditorOpen(true)
  }

  const handleToggle = async (country: AdminCountryItem) => {
    if (togglingId) return
    setTogglingId(country.id)
    try {
      const saved = await toggleCountryActive(country)
      toast.success(`${saved.name} is now ${saved.is_active ? 'published' : 'hidden'}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'We could not change the visibility.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCountry(deleteTarget)
      toast.success(`${deleteTarget.name} was deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'We could not delete this country.')
      setDeleteTarget(null)
    }
  }

  const handleImport = async () => {
    try {
      const count = await importStarterCountries(starterCountries)
      toast.success(`${count} starter ${count === 1 ? 'country' : 'countries'} saved to the database.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed. Please try again.')
    }
  }

  const handleGenerate = async () => {
    if (!aiPrompt.trim() || aiLoading) return
    setAiLoading(true)
    try {
      const generated = await generateCountryEligibilityWithAi(aiPrompt, undefined, COMPANY_CONTEXT)
      setAiOpen(false)
      setAiPrompt('')
      const existing = countries.find((c) => c.slug === generated.slug)
      if (existing) {
        toast.info(`${existing.name} already exists. Opening it so you can merge the AI suggestions.`)
        openEditor(existing)
        return
      }
      openEditor(null, { ...generated, has_work_visa: true, has_study_visa: generated.study_eligibility_criteria.length > 0 })
      toast.success('AI draft ready. Review every field before saving.')
    } catch {
      toast.error('AI generation is unavailable right now. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const statusTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'published', label: 'Published', count: stats.published },
    { value: 'hidden', label: 'Hidden', count: stats.hidden },
    { value: 'attention', label: 'Needs attention', count: stats.attention },
  ]

  const selectClass = 'h-11 w-full rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-sm sm:w-44'

  return (
    <div className="applicant-desk space-y-6 pb-10">
      <PageHeader
        title="Countries & eligibility"
        description="Edit every country detail in one place. Changes save to the database and refresh the public pages automatically."
        meta={
          <>
            <StatusPill tone={isFallback ? 'warning' : 'success'} icon={DatabaseZap}>
              {isFallback ? 'Showing starter data' : 'Connected to database'}
            </StatusPill>
            {dataUpdatedAt > 0 && (
              <StatusPill tone="neutral" icon={RefreshCw}>
                {isFetching ? 'Syncing…' : `Synced ${formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}`}
              </StatusPill>
            )}
          </>
        }
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching} className="min-h-11 rounded-full border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]">
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
            {canCreate && (
              <>
                <Button type="button" variant="outline" onClick={() => setAiOpen(true)} className="min-h-11 rounded-full border-[var(--desk-gold)]/50 bg-[var(--desk-gold)]/10 text-[#7a5c12] hover:bg-[var(--desk-gold)]/20">
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  AI draft
                </Button>
                <Button type="button" onClick={() => openEditor(null)} className="min-h-11 rounded-full bg-[var(--desk-navy)] px-5 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add country
                </Button>
              </>
            )}
          </>
        }
      />

      {error && (
        <InlineError
          title="We could not reach the countries database."
          description="You are seeing bundled starter data, and edits cannot be saved until the connection returns."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {!isLoading && !error && starterCountries.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--desk-warning)]" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[var(--desk-navy)]">
                {starterCountries.length} starter {starterCountries.length === 1 ? 'country is' : 'countries are'} not in the database
              </p>
              <p className="text-sm text-[var(--desk-muted)]">
                {isFallback
                  ? 'The database has no countries yet, so the website is using bundled data.'
                  : 'They won’t appear on the website until you save them to the database.'}{' '}
                {starterCountries.slice(0, 4).map((c) => c.name).join(', ')}
                {starterCountries.length > 4 ? '…' : ''}
              </p>
            </div>
          </div>
          {canCreate && (
            <Button type="button" onClick={() => void handleImport()} disabled={isImporting} className="min-h-11 shrink-0 rounded-full bg-[var(--desk-navy)] text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]">
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <DatabaseZap className="mr-2 h-4 w-4" aria-hidden="true" />}
              Import to database
            </Button>
          )}
        </div>
      )}

      <Reveal className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Countries" value={stats.total} icon={Globe2} tone="bg-[#c49a2b]/12 text-[#8a6a1a]" loading={isLoading} active={status === 'all' && visa === 'all'} onClick={clearFilters} />
        <Stat label="Published" value={stats.published} icon={Eye} tone="bg-emerald-100/80 text-[#20875a]" loading={isLoading} active={status === 'published'} onClick={() => setStatus('published')} />
        <Stat label="Hidden" value={stats.hidden} icon={EyeOff} tone="bg-slate-100 text-slate-600" loading={isLoading} active={status === 'hidden'} onClick={() => setStatus('hidden')} />
        <Stat label="Work routes" value={stats.work} icon={Briefcase} tone="bg-amber-100/80 text-[#a66a00]" loading={isLoading} active={visa === 'work'} onClick={() => setVisa('work')} />
        <Stat label="Study routes" value={stats.study} icon={GraduationCap} tone="bg-sky-100/80 text-[#2876b8]" loading={isLoading} active={visa === 'study'} onClick={() => setVisa('study')} />
        <Stat label="Need attention" value={stats.attention} icon={CircleDashed} tone="bg-red-100/80 text-[#b42318]" loading={isLoading} active={status === 'attention'} onClick={() => setStatus('attention')} />
      </Reveal>

      <Reveal delay={0.05}>
        <section aria-labelledby="countries-directory-heading" className="desk-card p-4 sm:p-5">
          <h2 id="countries-directory-heading" className="sr-only">
            Country directory
          </h2>

          <div role="tablist" aria-label="Filter by status" className="desk-scroll-x -mx-1 flex gap-1 overflow-x-auto px-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => setStatus(tab.value)}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                  status === tab.value ? 'bg-[var(--desk-navy)] text-[#fff8e7]' : 'text-[var(--desk-muted)] hover:bg-[var(--desk-surface-soft)] hover:text-[var(--desk-navy)]',
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', status === tab.value ? 'bg-white/15' : 'bg-[var(--desk-line)]/60')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label htmlFor="countries-search" className="sr-only">
                Search countries
              </label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--desk-muted)]" aria-hidden="true" />
              <Input
                id="countries-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, capital, code or language…"
                className="h-11 rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] pl-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex">
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger aria-label="Filter by region" className={selectClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visa} onValueChange={(v) => setVisa(v as VisaFilter)}>
                <SelectTrigger aria-label="Filter by visa type" className={selectClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All visa types</SelectItem>
                  <SelectItem value="work">Work visa</SelectItem>
                  <SelectItem value="study">Study visa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger aria-label="Sort countries" className={selectClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Display order</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--desk-muted)]" aria-live="polite">
              <span>
                {filtered.length} of {stats.total} countries
              </span>
              <button type="button" onClick={clearFilters} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[var(--desk-line)] px-2.5 font-semibold text-[var(--desk-navy)] hover:bg-[var(--desk-surface-soft)]">
                <X className="h-3 w-3" aria-hidden="true" />
                Clear filters
              </button>
            </div>
          )}

          <div className="mt-5">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status">
                <span className="sr-only">Loading countries…</span>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl bg-[var(--desk-line)]/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={hasFilters ? Search : Globe2}
                title={hasFilters ? 'No countries match these filters' : 'No countries yet'}
                description={hasFilters ? 'Try another search or clear the filters.' : 'Add your first destination to publish it on the website.'}
                actions={
                  hasFilters ? (
                    <Button type="button" variant="outline" onClick={clearFilters} className="min-h-11 rounded-full border-[var(--desk-line)]">
                      Clear filters
                    </Button>
                  ) : canCreate ? (
                    <Button type="button" onClick={() => openEditor(null)} className="min-h-11 rounded-full bg-[var(--desk-navy)] text-[#fff8e7]">
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Add country
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((country) => {
                  const reasons = attentionReasons(country)
                  return (
                    <li key={country.id}>
                      <article
                        className={cn(
                          'group flex h-full flex-col rounded-2xl border bg-[var(--desk-surface)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--desk-gold)]/45 hover:shadow-[0_16px_32px_-24px_rgba(26,35,64,0.45)]',
                          country.is_active ? 'border-[var(--desk-line)]' : 'border-dashed border-[var(--desk-line)] bg-[var(--desk-surface-soft)]',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className={cn('grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--desk-line)] bg-white text-3xl', !country.is_active && 'grayscale')}>
                            <FlagIcon country={country.name} code={country.code} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-semibold text-[var(--desk-navy)]">{country.name}</h3>
                            <p className="truncate text-xs text-[var(--desk-muted)]">
                              <span className="font-mono">{country.code}</span>
                              {country.capital && ` · ${country.capital}`}
                              {country.region && ` · ${country.region}`}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" aria-label={`More actions for ${country.name}`} className="h-10 w-10 shrink-0 rounded-xl text-[var(--desk-muted)]">
                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onSelect={() => openEditor(country)}>
                                <PencilLine className="mr-2 h-4 w-4" aria-hidden="true" />
                                {canUpdate ? 'Edit details' : 'View details'}
                              </DropdownMenuItem>
                              {canUpdate && (
                                <DropdownMenuItem onSelect={() => void handleToggle(country)} disabled={togglingId === country.id}>
                                  {country.is_active ? <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" /> : <Eye className="mr-2 h-4 w-4" aria-hidden="true" />}
                                  {country.is_active ? 'Hide from website' : 'Publish on website'}
                                </DropdownMenuItem>
                              )}
                              {country.source === 'database' && country.is_active && (
                                <DropdownMenuItem asChild>
                                  <a href={`/countries/${country.slug}`} target="_blank" rel="noreferrer">
                                    <Globe2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                    View live page
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {canDelete && country.source === 'database' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => setDeleteTarget(country)} className="text-[var(--desk-danger)] focus:bg-red-50 focus:text-[var(--desk-danger)]">
                                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Delete country
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <StatusPill tone={country.is_active ? 'success' : 'neutral'} icon={country.is_active ? Eye : EyeOff}>
                            {country.is_active ? 'Published' : 'Hidden'}
                          </StatusPill>
                          {country.has_work_visa && (
                            <StatusPill tone="warning" icon={Briefcase}>
                              Work · {country.work_eligibility_criteria.length}
                            </StatusPill>
                          )}
                          {country.has_study_visa && (
                            <StatusPill tone="info" icon={GraduationCap}>
                              Study · {country.study_eligibility_criteria.length}
                            </StatusPill>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm text-[var(--desk-muted)]">
                          {country.description || <span className="italic">No overview yet.</span>}
                        </p>

                        <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[var(--desk-surface-soft)] p-2.5 text-center text-xs">
                          <div>
                            <dt className="text-[var(--desk-muted)]">Success</dt>
                            <dd className="font-semibold tabular-nums text-[var(--desk-navy)]">{country.success_rate}%</dd>
                          </div>
                          <div>
                            <dt className="text-[var(--desk-muted)]">Processing</dt>
                            <dd className="font-semibold tabular-nums text-[var(--desk-navy)]">{country.avg_processing_days}d</dd>
                          </div>
                          <div>
                            <dt className="text-[var(--desk-muted)]">Living</dt>
                            <dd className="font-semibold tabular-nums text-[var(--desk-navy)]">₹{Math.round(country.monthly_living_cost / 1000)}k</dd>
                          </div>
                        </dl>

                        {reasons.length > 0 && (
                          <p className="mt-3 flex items-start gap-1.5 text-xs text-[var(--desk-warning)]">
                            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {reasons.join(' · ')}
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                          <span className="text-xs text-[var(--desk-muted)]">
                            {country.source === 'database' ? `Updated ${formatDistanceToNow(new Date(country.updated_at), { addSuffix: true })}` : 'Starter data'}
                          </span>
                          <Button type="button" onClick={() => openEditor(country)} className="min-h-10 rounded-full bg-[var(--desk-navy)] px-4 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]">
                            <PencilLine className="mr-1.5 h-4 w-4" aria-hidden="true" />
                            {canUpdate ? 'Edit' : 'View'}
                          </Button>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </Reveal>

      <CountryEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        country={editing}
        seed={seed}
        allCountries={countries}
        onSave={saveCountry}
        isSaving={isSaving}
        canSave={editing ? canUpdate : canCreate}
      />

      <Dialog open={aiOpen} onOpenChange={(open) => !aiLoading && setAiOpen(open)}>
        <DialogContent className="applicant-desk rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]">
          <DialogHeader className="text-left">
            <DialogTitle className="desk-display flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-[var(--desk-gold)]" aria-hidden="true" />
              Draft a country with AI
            </DialogTitle>
            <DialogDescription className="text-[var(--desk-muted)]">
              Describe a destination or visa route. AI prepares a draft in the editor — nothing is saved until you review it.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleGenerate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="ai-country-prompt">Country or visa route</Label>
              <Input
                id="ai-country-prompt"
                autoFocus
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Germany Opportunity Card, Japan SSW"
                className="h-11 rounded-xl border-[var(--desk-line)] bg-white"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading} className="min-h-11 rounded-full border-[var(--desk-line)]">
                Cancel
              </Button>
              <Button type="submit" disabled={aiLoading || !aiPrompt.trim()} className="min-h-11 rounded-full bg-[var(--desk-navy)] text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]">
                {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />}
                {aiLoading ? 'Drafting…' : 'Create draft'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        title={`Delete ${deleteTarget?.name ?? 'this country'}?`}
        description="This permanently removes the country from the database and every public page. To keep it for later, hide it instead."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete country'}
        variant="destructive"
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
