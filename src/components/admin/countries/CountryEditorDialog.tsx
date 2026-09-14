import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  BarChart3,
  Briefcase,
  ExternalLink,
  FileText,
  Globe2,
  GraduationCap,
  Loader2,
  Save,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  type AdminCountryItem,
  type CountryInput,
} from '@/hooks/useAdminCountries'
import { enhanceEligibilityWithAi } from '@/lib/ai/country-eligibility-generator'
import { FlagIcon } from '@/components/flag-icon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { StatusPill } from '@/components/dashboard/StatusPill'
import RuleListEditor from './RuleListEditor'

export const COUNTRY_REGIONS = ['Europe', 'Asia', 'Americas', 'Oceania', 'Middle East', 'Africa']

type EditorTab = 'overview' | 'work' | 'study' | 'content' | 'stats' | 'seo'

const TABS: { value: EditorTab; label: string; icon: LucideIcon }[] = [
  { value: 'overview', label: 'Overview', icon: Globe2 },
  { value: 'work', label: 'Work rules', icon: Briefcase },
  { value: 'study', label: 'Study rules', icon: GraduationCap },
  { value: 'content', label: 'Page content', icon: FileText },
  { value: 'stats', label: 'Stats & costs', icon: BarChart3 },
  { value: 'seo', label: 'SEO & media', icon: Search },
]

type Draft = {
  name: string
  slug: string
  code: string
  flag_emoji: string
  capital: string
  region: string
  subregion: string
  language: string
  currency: string
  currency_code: string
  latitude: string
  longitude: string
  description: string
  why_work: string
  why_study: string
  lifestyle: string
  climate_summary: string
  has_work_visa: boolean
  has_study_visa: boolean
  work: string[]
  study: string[]
  success_rate: string
  avg_processing_days: string
  monthly_living_cost: string
  monthly_family_cost: string
  images: string
  meta_title: string
  meta_desc: string
  is_active: boolean
  sort_order: string
}

type DraftErrors = Partial<Record<keyof Draft, string>>

const FIELD_TAB: Partial<Record<keyof Draft, EditorTab>> = {
  name: 'overview',
  slug: 'overview',
  code: 'overview',
  flag_emoji: 'overview',
  currency_code: 'overview',
  latitude: 'overview',
  longitude: 'overview',
  sort_order: 'overview',
  work: 'work',
  study: 'study',
  success_rate: 'stats',
  avg_processing_days: 'stats',
  monthly_living_cost: 'stats',
  monthly_family_cost: 'stats',
  images: 'seo',
  meta_title: 'seo',
  meta_desc: 'seo',
}

const numberText = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100)

function toDraft(country: Partial<AdminCountryItem> | null, nextSortOrder: number): Draft {
  return {
    name: country?.name ?? '',
    slug: country?.slug ?? '',
    code: country?.code ?? '',
    flag_emoji: country?.flag_emoji ?? '',
    capital: country?.capital ?? '',
    region: country?.region ?? '',
    subregion: country?.subregion ?? '',
    language: country?.language ?? '',
    currency: country?.currency ?? '',
    currency_code: country?.currency_code ?? '',
    latitude: numberText(country?.latitude),
    longitude: numberText(country?.longitude),
    description: country?.description ?? '',
    why_work: country?.why_work ?? '',
    why_study: country?.why_study ?? '',
    lifestyle: country?.lifestyle ?? '',
    climate_summary: country?.climate_summary ?? '',
    has_work_visa: country?.has_work_visa ?? true,
    has_study_visa: country?.has_study_visa ?? true,
    work: [...(country?.work_eligibility_criteria ?? [])],
    study: [...(country?.study_eligibility_criteria ?? [])],
    success_rate: numberText(country?.success_rate),
    avg_processing_days: numberText(country?.avg_processing_days),
    monthly_living_cost: numberText(country?.monthly_living_cost),
    monthly_family_cost: numberText(country?.monthly_family_cost),
    images: (country?.images ?? []).join('\n'),
    meta_title: country?.meta_title ?? '',
    meta_desc: country?.meta_desc ?? '',
    is_active: country?.is_active ?? true,
    sort_order: numberText(country?.sort_order ?? nextSortOrder),
  }
}

const toNumber = (value: string, fallback = 0) => (value.trim() === '' ? fallback : Number(value))
const toNullableNumber = (value: string) => (value.trim() === '' ? null : Number(value))

function toInput(draft: Draft): CountryInput {
  const work = draft.work.map((r) => r.trim()).filter(Boolean)
  const study = draft.study.map((r) => r.trim()).filter(Boolean)
  return {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    code: draft.code.trim().toUpperCase(),
    flag_emoji: draft.flag_emoji.trim(),
    capital: draft.capital,
    region: draft.region,
    subregion: draft.subregion,
    language: draft.language,
    currency: draft.currency,
    currency_code: draft.currency_code,
    latitude: toNullableNumber(draft.latitude),
    longitude: toNullableNumber(draft.longitude),
    description: draft.description,
    why_work: draft.why_work,
    why_study: draft.why_study,
    lifestyle: draft.lifestyle,
    climate_summary: draft.climate_summary,
    has_work_visa: draft.has_work_visa,
    has_study_visa: draft.has_study_visa,
    eligibility_criteria: work.length ? work : study,
    work_eligibility_criteria: work,
    study_eligibility_criteria: study,
    success_rate: toNumber(draft.success_rate),
    avg_processing_days: toNumber(draft.avg_processing_days),
    monthly_living_cost: toNumber(draft.monthly_living_cost),
    monthly_family_cost: toNullableNumber(draft.monthly_family_cost),
    images: draft.images.split(/\r?\n/).map((u) => u.trim()).filter(Boolean),
    meta_title: draft.meta_title,
    meta_desc: draft.meta_desc,
    is_active: draft.is_active,
    sort_order: toNumber(draft.sort_order),
  }
}

function validate(draft: Draft, others: AdminCountryItem[]): DraftErrors {
  const errors: DraftErrors = {}
  const isNumber = (value: string) => value.trim() !== '' && Number.isFinite(Number(value))

  if (!draft.name.trim()) errors.name = 'Enter the country name.'
  else if (draft.name.trim().length > 100) errors.name = 'Keep the name under 100 characters.'

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) errors.slug = 'Use lowercase letters, numbers and hyphens only.'
  else if (others.some((c) => c.slug === draft.slug.trim())) errors.slug = 'Another country already uses this URL slug.'

  if (!/^[A-Za-z]{2,5}$/.test(draft.code.trim())) errors.code = 'Use a 2–5 letter code, e.g. DE or DEU.'
  else if (others.some((c) => c.code.toUpperCase() === draft.code.trim().toUpperCase())) errors.code = 'Another country already uses this code.'

  if (!draft.flag_emoji.trim()) errors.flag_emoji = 'Add a flag emoji.'
  if (draft.currency_code.trim() && !/^[A-Za-z]{3}$/.test(draft.currency_code.trim())) errors.currency_code = 'Use a 3-letter code, e.g. EUR.'

  const hasLat = draft.latitude.trim() !== ''
  const hasLng = draft.longitude.trim() !== ''
  if (hasLat !== hasLng) {
    errors[hasLat ? 'longitude' : 'latitude'] = 'Enter both latitude and longitude, or leave both empty.'
  }
  if (hasLat && (!isNumber(draft.latitude) || Math.abs(Number(draft.latitude)) > 90)) errors.latitude = 'Latitude must be between -90 and 90.'
  if (hasLng && (!isNumber(draft.longitude) || Math.abs(Number(draft.longitude)) > 180)) errors.longitude = 'Longitude must be between -180 and 180.'

  if (draft.sort_order.trim() && !/^-?\d+$/.test(draft.sort_order.trim())) errors.sort_order = 'Use a whole number.'
  if (draft.success_rate.trim() && (!isNumber(draft.success_rate) || Number(draft.success_rate) < 0 || Number(draft.success_rate) > 100)) {
    errors.success_rate = 'Enter a percentage between 0 and 100.'
  }
  for (const key of ['avg_processing_days', 'monthly_living_cost', 'monthly_family_cost'] as const) {
    if (draft[key].trim() && (!isNumber(draft[key]) || Number(draft[key]) < 0)) errors[key] = 'Enter a number of 0 or more.'
  }

  if (draft.has_work_visa && !draft.work.some((r) => r.trim())) errors.work = 'Add at least one work visa rule, or turn off the work visa in Overview.'
  if (draft.has_study_visa && !draft.study.some((r) => r.trim())) errors.study = 'Add at least one study visa rule, or turn off the study visa in Overview.'

  if (draft.meta_title.length > 200) errors.meta_title = 'Meta titles can be at most 200 characters.'
  if (draft.meta_desc.length > 500) errors.meta_desc = 'Meta descriptions can be at most 500 characters.'
  const badUrl = draft.images
    .split(/\r?\n/)
    .map((u) => u.trim())
    .filter(Boolean)
    .find((u) => !/^https?:\/\/\S+$/i.test(u))
  if (badUrl) errors.images = `This is not a valid image URL: ${badUrl.slice(0, 60)}`

  return errors
}

function Field({
  id,
  label,
  error,
  hint,
  required,
  counter,
  className,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  counter?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium text-[var(--desk-navy)]">
          {label}
          {required && (
            <span className="text-[var(--desk-danger)]" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </Label>
        {counter && <span className="text-xs tabular-nums text-[var(--desk-muted)]">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-[var(--desk-danger)]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-[var(--desk-muted)]">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

function ToggleCard({
  id,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--desk-line)] bg-white p-3.5">
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-[var(--desk-navy)]">
          {title}
        </label>
        <p id={`${id}-desc`} className="text-xs text-[var(--desk-muted)]">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-describedby={`${id}-desc`}
        className="mt-0.5 data-[state=checked]:bg-[var(--desk-navy)]"
      />
    </div>
  )
}

const inputClass =
  'h-11 rounded-xl border-[var(--desk-line)] bg-white aria-[invalid=true]:border-[var(--desk-danger)]'
const textareaClass = 'rounded-xl border-[var(--desk-line)] bg-white aria-[invalid=true]:border-[var(--desk-danger)]'

export default function CountryEditorDialog({
  open,
  onOpenChange,
  country,
  seed,
  allCountries,
  onSave,
  isSaving,
  canSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  country: AdminCountryItem | null
  seed?: Partial<AdminCountryItem> | null
  allCountries: AdminCountryItem[]
  onSave: (input: CountryInput, existing: AdminCountryItem | null) => Promise<AdminCountryItem>
  isSaving: boolean
  canSave: boolean
}) {
  const nextSortOrder = useMemo(() => allCountries.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1, [allCountries])
  const [draft, setDraft] = useState<Draft>(() => toDraft(country ?? seed ?? null, nextSortOrder))
  const [baseline, setBaseline] = useState('')
  const [tab, setTab] = useState<EditorTab>('overview')
  const [errors, setErrors] = useState<DraftErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [aiLoading, setAiLoading] = useState<'work' | 'study' | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const initial = toDraft(country ?? seed ?? null, nextSortOrder)
    setDraft(initial)
    setBaseline(JSON.stringify(initial))
    setTab('overview')
    setErrors({})
    setSaveError(null)
    setSlugTouched(!!country)
    // Reset only when the dialog opens for a different record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, country?.id, seed])

  const others = useMemo(
    () => allCountries.filter((c) => (country ? c.id !== country.id && c.slug !== country.slug : true)),
    [allCountries, country],
  )
  const dirty = baseline !== '' && JSON.stringify(draft) !== baseline
  const readOnly = !canSave

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value }
      if (key === 'name' && !slugTouched) next.slug = slugify(String(value))
      return next
    })
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
    setSaveError(null)
  }

  const aria = (key: keyof Draft, hint?: boolean) => ({
    id: `country-${key}`,
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `country-${key}-error` : hint ? `country-${key}-hint` : undefined,
    disabled: readOnly,
  })

  const tabErrors = (value: EditorTab) =>
    (Object.keys(errors) as (keyof Draft)[]).filter((key) => errors[key] && (FIELD_TAB[key] ?? 'overview') === value).length

  const requestClose = () => {
    if (isSaving) return
    if (dirty) setConfirmDiscard(true)
    else onOpenChange(false)
  }

  const switchTab = (value: EditorTab) => {
    setTab(value)
    bodyRef.current?.scrollTo({ top: 0 })
  }

  const handleSave = async () => {
    if (isSaving || readOnly) return
    const nextErrors = validate(draft, others)
    setErrors(nextErrors)
    const firstInvalid = (Object.keys(nextErrors) as (keyof Draft)[])[0]
    if (firstInvalid) {
      const target = FIELD_TAB[firstInvalid] ?? 'overview'
      setTab(target)
      window.setTimeout(() => document.getElementById(`country-${firstInvalid}`)?.focus(), 60)
      toast.error('Please fix the highlighted fields.')
      return
    }
    try {
      const saved = await onSave(toInput(draft), country)
      toast.success(`${saved.name} saved.`, { description: 'Live pages refresh automatically.' })
      setBaseline(JSON.stringify(draft))
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We could not save this country. Please try again.'
      setSaveError(message)
      toast.error(message)
    }
  }

  const handleAiRefine = async (kind: 'work' | 'study') => {
    const name = draft.name.trim()
    if (!name) {
      toast.error('Enter the country name first.')
      switchTab('overview')
      return
    }
    setAiLoading(kind)
    try {
      const refined = await enhanceEligibilityWithAi(name, kind === 'work' ? draft.work : draft.study)
      set(kind, refined)
      toast.success(`AI refined the ${kind} rules. Review them before saving.`)
    } catch {
      toast.error('AI refinement is unavailable right now. Please try again.')
    } finally {
      setAiLoading(null)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      void handleSave()
    }
  }

  const title = country ? `Edit ${country.name}` : seed?.name ? `New country: ${seed.name}` : 'Add a country'
  const imageList = draft.images.split(/\r?\n/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u))

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={onKeyDown}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            requestClose()
          }}
          className="applicant-desk flex h-[min(92dvh,56rem)] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] p-0 text-[var(--desk-navy)] sm:max-w-5xl"
        >
          <header className="flex shrink-0 items-start gap-3 border-b border-[var(--desk-line)] px-4 py-4 sm:px-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--desk-line)] bg-white text-3xl">
              {draft.name || draft.code ? (
                <FlagIcon country={draft.name} code={draft.code} />
              ) : (
                <Globe2 className="h-6 w-6 text-[var(--desk-gold)]" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="desk-display truncate text-xl font-semibold sm:text-2xl">{title}</DialogTitle>
                <StatusPill tone={draft.is_active ? 'success' : 'neutral'}>{draft.is_active ? 'Published' : 'Hidden'}</StatusPill>
                {country && country.source !== 'database' && <StatusPill tone="warning">Not in database yet</StatusPill>}
              </div>
              <DialogDescription className="mt-0.5 text-sm text-[var(--desk-muted)]">
                Every field saves to the database and updates the public country pages automatically.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close editor"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--desk-muted)] transition hover:bg-[var(--desk-surface-soft)] hover:text-[var(--desk-navy)]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div
            role="tablist"
            aria-label="Country sections"
            className="desk-scroll-x flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--desk-line)] px-3 py-2 sm:px-5"
          >
            {TABS.map(({ value, label, icon: Icon }) => {
              const count = tabErrors(value)
              const selected = tab === value
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  id={`country-tab-${value}`}
                  aria-selected={selected}
                  aria-controls="country-editor-panel"
                  onClick={() => switchTab(value)}
                  className={cn(
                    'relative flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition',
                    selected
                      ? 'bg-[var(--desk-navy)] text-[#fff8e7]'
                      : 'text-[var(--desk-muted)] hover:bg-[var(--desk-surface-soft)] hover:text-[var(--desk-navy)]',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                  {value === 'work' && <span className="text-xs opacity-70">{draft.work.length}</span>}
                  {value === 'study' && <span className="text-xs opacity-70">{draft.study.length}</span>}
                  {count > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--desk-danger)] px-1 text-[10px] font-bold text-white">
                      {count}
                      <span className="sr-only"> errors</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div
            ref={bodyRef}
            id="country-editor-panel"
            role="tabpanel"
            aria-labelledby={`country-tab-${tab}`}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
          >
            {readOnly && (
              <p className="mb-4 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] px-4 py-3 text-sm text-[var(--desk-muted)]">
                You can view this country, but your role does not allow editing it.
              </p>
            )}

            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field id="country-name" label="Country name" required error={errors.name}>
                    <Input {...aria('name')} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Germany" className={inputClass} />
                  </Field>
                  <Field id="country-slug" label="URL slug" required error={errors.slug} hint={`Public page: /countries/${draft.slug || 'your-slug'}`}>
                    <Input
                      {...aria('slug', true)}
                      value={draft.slug}
                      onChange={(e) => {
                        setSlugTouched(true)
                        set('slug', e.target.value.toLowerCase())
                      }}
                      placeholder="germany"
                      className={cn(inputClass, 'font-mono')}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field id="country-flag_emoji" label="Flag emoji" required error={errors.flag_emoji}>
                    <Input {...aria('flag_emoji')} value={draft.flag_emoji} onChange={(e) => set('flag_emoji', e.target.value)} placeholder="🇩🇪" className={cn(inputClass, 'text-xl')} />
                  </Field>
                  <Field id="country-code" label="ISO code" required error={errors.code}>
                    <Input {...aria('code')} value={draft.code} maxLength={5} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="DEU" className={cn(inputClass, 'font-mono uppercase')} />
                  </Field>
                  <Field id="country-sort_order" label="Display order" error={errors.sort_order} hint="Lower numbers appear first.">
                    <Input {...aria('sort_order', true)} inputMode="numeric" value={draft.sort_order} onChange={(e) => set('sort_order', e.target.value)} className={inputClass} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field id="country-region" label="Region">
                    <Input {...aria('region')} list="country-region-options" value={draft.region} onChange={(e) => set('region', e.target.value)} placeholder="Europe" className={inputClass} />
                    <datalist id="country-region-options">
                      {COUNTRY_REGIONS.map((region) => (
                        <option key={region} value={region} />
                      ))}
                    </datalist>
                  </Field>
                  <Field id="country-subregion" label="Subregion">
                    <Input {...aria('subregion')} value={draft.subregion} onChange={(e) => set('subregion', e.target.value)} placeholder="Western Europe" className={inputClass} />
                  </Field>
                  <Field id="country-capital" label="Capital city">
                    <Input {...aria('capital')} value={draft.capital} onChange={(e) => set('capital', e.target.value)} placeholder="Berlin" className={inputClass} />
                  </Field>
                  <Field id="country-language" label="Languages">
                    <Input {...aria('language')} value={draft.language} onChange={(e) => set('language', e.target.value)} placeholder="German, English" className={inputClass} />
                  </Field>
                  <Field id="country-currency" label="Currency">
                    <Input {...aria('currency')} value={draft.currency} onChange={(e) => set('currency', e.target.value)} placeholder="Euro" className={inputClass} />
                  </Field>
                  <Field id="country-currency_code" label="Currency code" error={errors.currency_code}>
                    <Input {...aria('currency_code')} maxLength={3} value={draft.currency_code} onChange={(e) => set('currency_code', e.target.value.toUpperCase())} placeholder="EUR" className={cn(inputClass, 'font-mono uppercase')} />
                  </Field>
                  <Field id="country-latitude" label="Latitude" error={errors.latitude}>
                    <Input {...aria('latitude')} inputMode="decimal" value={draft.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="51.1657" className={inputClass} />
                  </Field>
                  <Field id="country-longitude" label="Longitude" error={errors.longitude}>
                    <Input {...aria('longitude')} inputMode="decimal" value={draft.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="10.4515" className={inputClass} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <ToggleCard id="country-is_active" title="Published on website" description="Hidden countries stay saved but disappear from public pages." checked={draft.is_active} onChange={(v) => set('is_active', v)} disabled={readOnly} />
                  <ToggleCard id="country-has_work_visa" title="Offers work visa" description="Shows this country on work visa pathways." checked={draft.has_work_visa} onChange={(v) => set('has_work_visa', v)} disabled={readOnly} />
                  <ToggleCard id="country-has_study_visa" title="Offers study visa" description="Shows this country on study visa pathways." checked={draft.has_study_visa} onChange={(v) => set('has_study_visa', v)} disabled={readOnly} />
                </div>
              </div>
            )}

            {tab === 'work' && (
              <RuleListEditor
                title="Work visa eligibility rules"
                description="Experience, skill assessments, language tests and police clearance needed for work permits."
                tone="work"
                rules={draft.work}
                onChange={(rules) => set('work', rules)}
                placeholder="e.g. Skill assessment from Engineers Australia"
                onAiRefine={() => void handleAiRefine('work')}
                aiLoading={aiLoading === 'work'}
                error={errors.work}
                disabled={readOnly}
              />
            )}

            {tab === 'study' && (
              <RuleListEditor
                title="Study visa eligibility rules"
                description="Offer letters, CAS/CoE, IELTS/PTE scores, funds and academic documents."
                tone="study"
                rules={draft.study}
                onChange={(rules) => set('study', rules)}
                placeholder="e.g. CAS letter from an accredited university"
                onAiRefine={() => void handleAiRefine('study')}
                aiLoading={aiLoading === 'study'}
                error={errors.study}
                disabled={readOnly}
              />
            )}

            {tab === 'content' && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Field id="country-description" label="Overview" counter={`${draft.description.length}`} className="lg:col-span-2" hint="Shown on the country card and at the top of the country page.">
                  <Textarea {...aria('description', true)} rows={4} value={draft.description} onChange={(e) => set('description', e.target.value)} className={textareaClass} />
                </Field>
                <Field id="country-why_work" label="Why work here">
                  <Textarea {...aria('why_work')} rows={5} value={draft.why_work} onChange={(e) => set('why_work', e.target.value)} placeholder="Salaries, sponsorship, PR pathway…" className={textareaClass} />
                </Field>
                <Field id="country-why_study" label="Why study here">
                  <Textarea {...aria('why_study')} rows={5} value={draft.why_study} onChange={(e) => set('why_study', e.target.value)} placeholder="Universities, post-study work rights…" className={textareaClass} />
                </Field>
                <Field id="country-lifestyle" label="Lifestyle & living">
                  <Textarea {...aria('lifestyle')} rows={4} value={draft.lifestyle} onChange={(e) => set('lifestyle', e.target.value)} className={textareaClass} />
                </Field>
                <Field id="country-climate_summary" label="Climate">
                  <Textarea {...aria('climate_summary')} rows={4} value={draft.climate_summary} onChange={(e) => set('climate_summary', e.target.value)} placeholder="Seasons, average temperatures…" className={textareaClass} />
                </Field>
              </div>
            )}

            {tab === 'stats' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="country-success_rate" label="Visa success rate (%)" error={errors.success_rate}>
                    <Input {...aria('success_rate')} inputMode="decimal" value={draft.success_rate} onChange={(e) => set('success_rate', e.target.value)} className={inputClass} />
                  </Field>
                  <Field id="country-avg_processing_days" label="Average processing time (days)" error={errors.avg_processing_days}>
                    <Input {...aria('avg_processing_days')} inputMode="numeric" value={draft.avg_processing_days} onChange={(e) => set('avg_processing_days', e.target.value)} className={inputClass} />
                  </Field>
                  <Field id="country-monthly_living_cost" label="Monthly living cost, single (₹)" error={errors.monthly_living_cost}>
                    <Input {...aria('monthly_living_cost')} inputMode="numeric" value={draft.monthly_living_cost} onChange={(e) => set('monthly_living_cost', e.target.value)} className={inputClass} />
                  </Field>
                  <Field id="country-monthly_family_cost" label="Monthly living cost, family (₹)" error={errors.monthly_family_cost} hint="Optional.">
                    <Input {...aria('monthly_family_cost', true)} inputMode="numeric" value={draft.monthly_family_cost} onChange={(e) => set('monthly_family_cost', e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3" aria-label="Preview of public stats">
                  {[
                    { label: 'Success rate', value: draft.success_rate ? `${draft.success_rate}%` : '—' },
                    { label: 'Processing', value: draft.avg_processing_days ? `${draft.avg_processing_days} days` : '—' },
                    { label: 'Living cost', value: draft.monthly_living_cost ? `₹${Number(draft.monthly_living_cost).toLocaleString('en-IN')}/mo` : '—' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-4">
                      <p className="text-xs text-[var(--desk-muted)]">{stat.label}</p>
                      <p className="desk-display mt-1 text-xl font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'seo' && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-5">
                  <Field id="country-meta_title" label="Meta title" error={errors.meta_title} counter={`${draft.meta_title.length}/60 recommended`} hint="Leave empty to use the automatic title.">
                    <Input {...aria('meta_title', true)} value={draft.meta_title} onChange={(e) => set('meta_title', e.target.value)} className={inputClass} />
                  </Field>
                  <Field id="country-meta_desc" label="Meta description" error={errors.meta_desc} counter={`${draft.meta_desc.length}/160 recommended`}>
                    <Textarea {...aria('meta_desc')} rows={4} value={draft.meta_desc} onChange={(e) => set('meta_desc', e.target.value)} className={textareaClass} />
                  </Field>
                  <Field id="country-images" label="Image URLs" error={errors.images} hint="One https:// URL per line.">
                    <Textarea {...aria('images', true)} rows={4} value={draft.images} onChange={(e) => set('images', e.target.value)} className={cn(textareaClass, 'font-mono text-xs')} />
                  </Field>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--desk-line)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--desk-muted)]">Search preview</p>
                    <p className="mt-2 truncate text-lg text-[#1a0dab]">
                      {draft.meta_title || `${draft.name || 'Country'} Work & Study Visa | Siddhivinayak Overseas`}
                    </p>
                    <p className="truncate text-xs text-[#006621]">siddhivinayakoverseas.com/countries/{draft.slug || 'slug'}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[#545454]">
                      {draft.meta_desc || draft.description || 'Add a meta description to control this snippet.'}
                    </p>
                  </div>
                  {imageList.length > 0 && (
                    <ul className="grid grid-cols-3 gap-2" aria-label="Image previews">
                      {imageList.slice(0, 6).map((url) => (
                        <li key={url} className="aspect-video overflow-hidden rounded-lg border border-[var(--desk-line)] bg-[var(--desk-surface-soft)]">
                          <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-[var(--desk-line)] bg-[var(--desk-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-h-5 text-sm" aria-live="polite">
              {saveError ? (
                <span className="font-medium text-[var(--desk-danger)]">{saveError}</span>
              ) : dirty ? (
                <span className="text-[#8a6a1a]">Unsaved changes · Ctrl+S to save</span>
              ) : (
                <span className="text-[var(--desk-muted)]">No unsaved changes</span>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {country?.source === 'database' && country.is_active && (
                <Button asChild variant="ghost" className="min-h-11 rounded-full text-[var(--desk-navy)]">
                  <a href={`/countries/${country.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    View live page
                  </a>
                </Button>
              )}
              <Button type="button" variant="outline" onClick={requestClose} disabled={isSaving} className="min-h-11 rounded-full border-[var(--desk-line)]">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || readOnly || (!dirty && country?.source === 'database')}
                className="min-h-11 rounded-full bg-[var(--desk-navy)] px-6 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)]"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}
                {isSaving ? 'Saving…' : country?.source === 'database' ? 'Save changes' : 'Save to database'}
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent className="applicant-desk rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="desk-display text-xl">Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--desk-muted)]">
              Your edits to {draft.name || 'this country'} have not been saved to the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-full">Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onOpenChange(false)}
              className="min-h-11 rounded-full bg-[var(--desk-danger)] text-white hover:bg-[#912018]"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
