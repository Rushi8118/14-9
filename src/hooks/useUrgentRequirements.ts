import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { writeAuditLog } from '@/lib/audit-log'
import { createDiffPayload } from '@/lib/diff-utils'

export type UrgentRequirementFaqItem = { question: string; answer: string }

export type UrgentRequirement = {
  id: string
  title: string
  slug: string
  employer?: string
  country: string
  country_code: string
  city?: string
  visa_type?: string
  category: string
  vacancies: number
  salary: string
  currency?: string
  experience_required?: string
  education?: string
  skills?: string[]
  benefits?: string[]
  contract_type?: string
  working_hours?: string
  image_url?: string
  detail_image_url?: string
  image_alt?: string
  summary: string
  content: string
  application_instructions?: string
  eligibility?: string[]
  required_documents?: string[]
  seo_title?: string
  meta_description?: string
  focus_keyword?: string
  related_keywords?: string[]
  long_tail_keywords?: string[]
  tags?: string[]
  faq?: UrgentRequirementFaqItem[]
  admin_input_required?: string[]
  ai_generated?: boolean
  status: 'draft' | 'active' | 'closed' | 'expired'
  expires_at: string | null
  deadline_at?: string | null
  created_at: string
  updated_at: string
}

export type UrgentRequirementInput = {
  id?: string
  title: string
  slug: string
  employer?: string
  country: string
  country_code: string
  city?: string
  visa_type?: string
  category: string
  vacancies: number
  salary: string
  currency?: string
  experience_required?: string
  education?: string
  skills?: string[]
  benefits?: string[]
  contract_type?: string
  working_hours?: string
  image_url?: string
  detail_image_url?: string
  image_alt?: string
  summary: string
  content: string
  application_instructions?: string
  eligibility?: string[]
  required_documents?: string[]
  seo_title?: string
  meta_description?: string
  focus_keyword?: string
  related_keywords?: string[]
  long_tail_keywords?: string[]
  tags?: string[]
  faq?: UrgentRequirementFaqItem[]
  admin_input_required?: string[]
  ai_generated?: boolean
  status?: 'draft' | 'active' | 'closed' | 'expired'
  duration_days?: number
  expires_at?: string | null
  deadline_at?: string | null
}

const LOCAL_URGENT_KEY = 'svo_admin_urgent_reqs_v3'

// Check if a requirement is expired based on its expiration date
export function isRequirementExpired(req: UrgentRequirement): boolean {
  if (req.status === 'closed') return true
  if (req.status === 'expired') return true
  if (!req.expires_at) return false
  return new Date(req.expires_at).getTime() < Date.now()
}

// Calculate remaining days for display
export function getRemainingDays(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * There is deliberately no hardcoded list of openings here.
 *
 * This file used to carry a ten-row placeholder array with invented
 * employers, salaries ("EUR 42,000 - 65,000 / year") and vacancy counts,
 * substituted whenever Supabase could not be reached. Nine of the ten slugs
 * matched no database row, and useUrgentRequirementBySlug resolved an unknown
 * slug against them -- so /urgent-requirements/<any of those slugs> answered
 * 200 with ~800 words of invented vacancy content and "index, follow",
 * outside the sitemap and with no internal link to it. Search Console had
 * already picked one up: /urgent-requirements/ireland-it-critical-skills-urgent,
 * 5 impressions at average position 12.6 over the 90 days to 2026-10-06.
 *
 * Inventing a job offer is the one thing this codebase must never do, so the
 * rows are gone rather than guarded. When the database is unreachable the
 * public pages show an empty state and an error; a real, previously-fetched
 * list may still come from the localStorage cache below.
 */

/**
 * True for a placeholder row: `id` begins with `fallback-`.
 *
 * No code produces one any more, but a browser that visited before those rows
 * were removed may still hold them in its localStorage cache — the old failure
 * path wrote them there — so every read of that cache filters them out. The
 * two components that count a country's live openings
 * (components/seo/CountryVacancies, pages/work-visa/WorkVisaCountryPage) also
 * still apply it: an invented vacancy must never be the reason a thin country
 * page claims openings or gets indexed.
 */
export const isFallbackRequirement = (r: Pick<UrgentRequirement, 'id'>) =>
  typeof r.id === 'string' && r.id.startsWith('fallback-')

/**
 * The columns the public LIST views actually read, rather than `*`.
 *
 * Measured against production on 2026-10-09: `select('*')` returned **136 kB**
 * for 14 rows where these columns return **~15 kB**. The difference is not the
 * job descriptions — it is SEO research being shipped to visitors. Per row, the
 * heaviest fields were `long_tail_keywords` (3,761 B) and `related_keywords`
 * (3,421 B), neither of which any public view renders, plus 48 kB of `content`
 * markdown across all rows that only the detail page uses.
 *
 * It was paid three times over, because the same hook backs
 * /urgent-requirements, RelatedRequirements on every detail page, and
 * CountryVacancies on every /work-visa/* country page. It was then
 * JSON.stringify'd into localStorage at that size on each fetch.
 *
 * The union of what the three consumers read:
 *   UrgentRequirementsPage  id title slug country country_code category
 *                           vacancies salary summary image_url expires_at
 *   RelatedRequirements     title slug country category
 *   CountryVacancies        id title slug country city salary vacancies
 *                           contract_type working_hours
 * plus `status` and `expires_at` for this hook's own active/expiry filtering and
 * `created_at` for the ordering.
 *
 * The by-slug detail query deliberately keeps `select('*')`: that page renders
 * the content, the FAQ and the schema, so it needs the whole row. Narrowing
 * this list means a new field on a card needs adding here too — which is the
 * trade, and the reason the list is spelled out next to what reads it.
 */
// One unbroken literal, deliberately: supabase-js derives the row type from the
// literal type of this string, so splitting it across a `+` concatenation turns
// the result into GenericStringError[] and the cast below stops compiling.
const PUBLIC_LIST_COLUMNS =
  'id,title,slug,country,country_code,city,category,vacancies,salary,summary,image_url,contract_type,working_hours,status,expires_at,created_at' as const

/**
 * Real openings this browser has already fetched. Empty on a first visit and
 * for every crawler, which is correct: an empty list is honest, an invented
 * one is not.
 */
function getCachedRequirements(): UrgentRequirement[] {
  try {
    const cached = localStorage.getItem(LOCAL_URGENT_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed)) {
        // A cache written before the placeholder rows were removed can still
        // contain them. Drop those rather than serve an invented opening.
        const real = (parsed as UrgentRequirement[]).filter((r) => !isFallbackRequirement(r))
        if (real.length > 0) return real
      }
    }
  } catch {}
  return []
}

/**
 * Public hook to fetch active urgent requirements
 */
export function usePublicUrgentRequirements() {
  const [requirements, setRequirements] = useState<UrgentRequirement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActive = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Always try database first
      const { data, error: dbError } = await supabase
        .from('urgent_requirements')
        .select(PUBLIC_LIST_COLUMNS)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!dbError && data) {
        // Database query succeeded - filter for active & non-expired
        const now = Date.now()
        const active = (data as UrgentRequirement[]).filter((item) => {
          if (item.status === 'closed' || item.status === 'expired') return false
          if (!item.expires_at) return true
          return new Date(item.expires_at).getTime() > now
        })
        
        console.log('[usePublicUrgentRequirements] Loaded from database:', active.length, 'active items')
        setRequirements(active)
        
        // Update cache with fresh data
        try {
          localStorage.setItem(LOCAL_URGENT_KEY, JSON.stringify(active))
        } catch {}
      } else {
        // The query failed. Serve this browser's cache if it has one,
        // otherwise nothing -- never a placeholder opening.
        console.warn('[usePublicUrgentRequirements] Database error:', dbError?.message || 'Unknown error')
        setError(dbError?.message || 'Could not load current openings')
        setRequirements(getCachedRequirements())
      }
    } catch (err: any) {
      console.warn('[usePublicUrgentRequirements] fetch error:', err)
      setError(err?.message || 'Could not load current openings')
      setRequirements(getCachedRequirements())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActive()
    
    // Debounced refetch on window focus (prevent excessive refetching)
    let focusTimeout: NodeJS.Timeout | null = null
    
    const handleFocus = () => {
      // Clear any pending refetch
      if (focusTimeout) clearTimeout(focusTimeout)
      
      // Debounce: only refetch if focus was regained after 2 seconds
      focusTimeout = setTimeout(() => {
        console.log('[usePublicUrgentRequirements] Window focused, refetching...')
        fetchActive()
      }, 2000)
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      if (focusTimeout) clearTimeout(focusTimeout)
    }
  }, [fetchActive])

  return {
    requirements,
    isLoading,
    error,
    refetch: fetchActive,
  }
}

export const useUrgentRequirements = usePublicUrgentRequirements

/**
 * Public hook to fetch a single urgent requirement by slug
 */
export function useUrgentRequirementBySlug(slug: string | undefined) {
  const [requirement, setRequirement] = useState<UrgentRequirement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOne = useCallback(async () => {
    if (!slug) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: dbErr } = await supabase
        .from('urgent_requirements')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (data) {
        setRequirement(data as UrgentRequirement)
      } else {
        // The query succeeded and no public row has this slug. The page
        // renders its noindex "Requirement Not Found" branch.
        setRequirement(null)
      }
    } catch (err: any) {
      // A transport failure, not a verdict on the slug. Only a real opening
      // this browser has already seen may stand in for it.
      setError(err?.message || 'Could not load this opening')
      const cached = getCachedRequirements().find((r) => r.slug === slug || r.id === slug)
      setRequirement(cached || null)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchOne()
  }, [fetchOne])

  return {
    requirement,
    isLoading,
    error,
    refetch: fetchOne,
  }
}

/**
 * Admin Hook for Managing Urgent Requirements (Full CRUD)
 */
export function useAdminUrgentRequirements() {
  const [requirements, setRequirements] = useState<UrgentRequirement[]>(getCachedRequirements())
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Save to local storage cache
  const saveToLocal = useCallback((items: UrgentRequirement[]) => {
    try {
      localStorage.setItem(LOCAL_URGENT_KEY, JSON.stringify(items))
    } catch {}
  }, [])

  // Fetch all requirements for admin (both active and closed)
  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
      const query = supabase
        .from('urgent_requirements')
        .select('*')
        .order('created_at', { ascending: false })

      const result = await Promise.race([query, timeout])

      if (result && 'data' in result && Array.isArray(result.data)) {
        setRequirements(result.data as UrgentRequirement[])
        saveToLocal(result.data as UrgentRequirement[])
      } else {
        // Use fallback data if database is not set up yet
        setRequirements(getCachedRequirements())
      }
    } catch (err: any) {
      console.warn('[useAdminUrgentRequirements] fetch warning:', err)
      // Use fallback data on error
      setRequirements(getCachedRequirements())
    } finally {
      setIsLoading(false)
    }
  }, [saveToLocal])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Save (Create or Update) — routed through the save_urgent_requirement
  // SECURITY DEFINER RPC, which enforces the admin-tier role check and a
  // server-side slug-uniqueness check. State/local-cache are only updated
  // from the confirmed saved row, never optimistically, so a failed or
  // still-draft save can never leak into the public fallback cache.
  const saveRequirement = async (input: UrgentRequirementInput): Promise<UrgentRequirement> => {
    setSaving(true)
    try {
      let expires_at = input.expires_at ?? null
      if (input.duration_days && !expires_at) {
        const d = new Date()
        d.setDate(d.getDate() + Number(input.duration_days))
        expires_at = d.toISOString()
      }

      const payload = {
        id: input.id || null,
        title: input.title,
        slug: input.slug,
        employer: input.employer || null,
        country: input.country,
        country_code: input.country_code || 'XX',
        city: input.city || null,
        visa_type: input.visa_type || null,
        category: input.category,
        vacancies: Number(input.vacancies) || 1,
        salary: input.salary,
        currency: input.currency || null,
        experience_required: input.experience_required || null,
        education: input.education || null,
        skills: input.skills || [],
        benefits: input.benefits || [],
        contract_type: input.contract_type || null,
        working_hours: input.working_hours || null,
        image_url: input.image_url || null,
        detail_image_url: input.detail_image_url || input.image_url || null,
        image_alt: input.image_alt || null,
        summary: input.summary || '',
        content: input.content,
        application_instructions: input.application_instructions || null,
        eligibility: input.eligibility || [],
        required_documents: input.required_documents || [],
        seo_title: input.seo_title || null,
        meta_description: input.meta_description || null,
        focus_keyword: input.focus_keyword || null,
        related_keywords: input.related_keywords || [],
        long_tail_keywords: input.long_tail_keywords || [],
        tags: input.tags || [],
        faq: input.faq || [],
        admin_input_required: input.admin_input_required || [],
        ai_generated: Boolean(input.ai_generated),
        status: input.status || 'draft',
        expires_at,
        deadline_at: input.deadline_at ?? null,
      }

      const { data, error: rpcError } = await supabase.rpc('save_urgent_requirement', { payload })
      if (rpcError) throw new Error(rpcError.message)

      const saved = data as UrgentRequirement
      setRequirements((current) => {
        const exists = current.some((r) => r.id === saved.id)
        return exists ? current.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...current]
      })

      toast.success(
        saved.status === 'active'
          ? `"${saved.title}" is now live.`
          : `"${saved.title}" saved as ${saved.status}.`,
      )
      try {
        const existing = requirements.find((r) => r.id === input.id || r.slug === input.slug)
        if (existing) {
          const diff = createDiffPayload(existing, input)
          void writeAuditLog({
            action: (saved.status === 'active' ? 'urgent_requirement.published' : saved.status === 'closed' ? 'urgent_requirement.closed' : 'urgent_requirement.updated'),
            resource: 'urgent_requirements',
            resourceId: saved.id,
            oldValue: diff.oldValue,
            newValue: diff.newValue,
            summary: diff.summary || `Updated urgent requirement "${saved.title}"`,
          })
        } else {
          void writeAuditLog({
            action: 'urgent_requirement.created',
            resource: 'urgent_requirements',
            resourceId: saved.id,
            newValue: {
              title: saved.title,
              slug: saved.slug,
              country: saved.country,
              vacancies: saved.vacancies,
              salary: saved.salary,
              status: saved.status,
            },
            summary: `Created urgent opening "${saved.title}"`,
          })
        }
      } catch {
        // Logging should not throw
      }
      return saved
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save!')
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Toggle status (active / closed)
  const toggleStatus = async (id: string, newStatus: 'active' | 'closed') => {
    try {
      const target = requirements.find(r => r.id === id || r.slug === id)
      if (!target) {
        toast.error('Requirement not found')
        return
      }

      // Show immediate feedback
      const statusText = newStatus === 'active' ? 'Active on website' : 'Hidden / Closed'
      toast.loading(`Updating status to ${statusText}...`, { id: 'toggle-status' })

      // Reactivating a listing whose expiry has already passed drops the stale
      // date so saveRequirement derives a fresh one from duration_days.
      // Carrying it over would satisfy status='active' but fail the RLS
      // policy's `expires_at > NOW()`, so the listing would stay invisible.
      const lapsed =
        newStatus === 'active' &&
        target.expires_at !== null &&
        new Date(target.expires_at).getTime() <= Date.now()

      await saveRequirement({
        ...target,
        status: newStatus,
        ...(lapsed ? { expires_at: undefined, duration_days: 14 } : {}),
      })
      
      // Clear public cache to force fresh data on user-facing pages
      try {
        localStorage.removeItem(LOCAL_URGENT_KEY)
      } catch {}

      // Refetch to ensure consistency
      await fetchAll()

      // Show success
      toast.success(`Requirement is now ${statusText}`, { id: 'toggle-status' })
    } catch (err: any) {
      toast.error('Failed to update requirement status', { id: 'toggle-status' })
      console.error('[toggleStatus] Error:', err)
    }
  }

  // Delete requirement
  const deleteRequirement = async (id: string) => {
    try {
      const target = requirements.find(r => r.id === id || r.slug === id)
      const nextList = requirements.filter((r) => r.id !== id && r.slug !== id)
      setRequirements(nextList)
      saveToLocal(nextList)

      if (target?.slug) {
        await supabase.from('urgent_requirements').delete().eq('slug', target.slug)
      }

      // Clear public cache to force fresh data on user-facing pages
      try {
        localStorage.removeItem(LOCAL_URGENT_KEY)
      } catch {}

      toast.success('Urgent requirement deleted')
      void writeAuditLog({
        action: 'urgent_requirement.deleted',
        resource: 'urgent_requirements',
        resourceId: target?.id || id,
        severity: 'warning',
        oldValue: target ? { title: target.title, slug: target.slug } : undefined,
      })
    } catch (err: any) {
      toast.error('Failed to delete requirement')
    }
  }

  // Extend duration
  const extendDuration = async (id: string, daysToAdd: number = 7) => {
    try {
      const target = requirements.find(r => r.id === id || r.slug === id)
      if (!target) return
      const currentExpiry = target.expires_at ? new Date(target.expires_at).getTime() : Date.now()
      const newExpiry = new Date(Math.max(currentExpiry, Date.now()) + daysToAdd * 24 * 60 * 60 * 1000).toISOString()
      await saveRequirement({ ...target, expires_at: newExpiry, status: 'active' })
      toast.success(`Extended deadline by +${daysToAdd} days!`)
    } catch (err: any) {
      toast.error('Failed to extend duration')
    }
  }

  return {
    requirements,
    isLoading,
    saving,
    error,
    refetch: fetchAll,
    fetchAll,
    saveRequirement,
    toggleStatus,
    deleteRequirement,
    removeRequirement: deleteRequirement,
    extendDuration,
  }
}
