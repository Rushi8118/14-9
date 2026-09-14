import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

const FALLBACK_URGENT_REQUIREMENTS: UrgentRequirement[] = [
  {
    id: 'fallback-1',
    title: 'Urgent: 25 Specified Skilled Workers (SSW Caregivers) for Japan',
    slug: 'japan-ssw-caregiver-urgent',
    country: 'Japan',
    country_code: 'JP',
    category: 'Specified Skilled Worker (SSW-1)',
    vacancies: 25,
    salary: '¥220,000 - ¥280,000 / month (~₹1.25L - ₹1.6L)',
    experience_required: 'JLPT N4 / NAT-TEST & Caregiving Skill Test',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    summary: 'Direct hospital placement in Tokyo and Osaka with fast-track visa sponsorship, subsidized accommodation, and JLPT training support.',
    content: `### Urgent Placement Mandate for Japan SSW Caregivers
Siddhivinayak Overseas Surat has received an official priority mandate to recruit **25 Qualified Caregivers** for leading healthcare groups in Tokyo and Osaka.

#### Key Benefits:
- **Direct Employer Sponsorship:** 5-year renewable SSW-1 visa.
- **Flight & Housing:** Flight ticket allowance & subsidized accommodation.
- **High Salary:** Up to ¥280,000/month with overtime opportunities.
- **Fast-Track Processing:** COE (Certificate of Eligibility) issued within 45-60 days.

#### Requirements:
1. JLPT N4 or NAT-TEST Level 4 certification (or currently enrolled).
2. Nursing / GNM diploma OR Nursing Assistant training certificate.
3. Valid Indian Passport with minimum 18 months validity.`,
    status: 'active',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    title: 'Urgent: 15 Health & Care Staff for UK NHS Trust Hospitals',
    slug: 'uk-nhs-healthcare-assistant-urgent',
    country: 'United Kingdom',
    country_code: 'GB',
    category: 'Health & Care Worker Visa',
    vacancies: 15,
    salary: '£23,400 - £28,000 / year (~₹24L - ₹29L)',
    experience_required: '1+ Year Healthcare / Nursing experience & IELTS 5.0+',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    summary: 'NHS-approved healthcare assistant positions with COS (Certificate of Sponsorship) and fast 3-week UK visa processing.',
    content: `### Immediate Openings for UK NHS Healthcare Support Workers
Recruiting 15 dedicated Health & Care workers for NHS Trust Partner Hospitals across London, Manchester, and Birmingham.

#### Offer Details:
- **COS Provided:** Tier 2 / Health & Care Worker Sponsorship (3-Year renewable).
- **Relocation Package:** First month free accommodation + NHS relocation grant.
- **Family Visa:** Spousal work permit & free NHS healthcare coverage for dependents.

#### Eligibility Criteria:
1. GNM Nursing / B.Sc Nursing / ANM diploma with minimum 1 year clinical experience.
2. UKVI IELTS General score 5.0+ or PTE Academic UKVI 43+.
3. Clean Police Clearance Certificate from RPO Gujarat.`,
    status: 'active',
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    title: 'Urgent: 30 Opportunity Card IT & Engineering Candidates for Germany',
    slug: 'germany-chancenkarte-it-engineers-urgent',
    country: 'Germany',
    country_code: 'DE',
    category: 'Opportunity Card (Chancenkarte)',
    vacancies: 30,
    salary: '€45,000 - €65,000 / year (~₹40L - ₹58L)',
    experience_required: 'Degree in Engineering / CS & German A2 or English B2',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    summary: 'Fast-track Chancenkarte visa processing for software developers, CNC machinists, electrical engineers, and mechanical technicians.',
    content: `### Germany Opportunity Card (Chancenkarte) Priority Pool
Siddhivinayak Overseas is facilitating direct Opportunity Card applications for qualified Indian engineers and tech professionals looking to work in Munich, Stuttgart, and Berlin.

#### Key Advantages:
- **No Prior Job Offer Required:** Move to Germany on a 1-year job seeker visa with work rights.
- **Part-Time Work Allowed:** Earn up to 20 hours/week while interviewing.
- **Fast-Track PR:** Convert to EU Blue Card after securing employment.

#### Qualification Points:
1. Recognized Engineering or IT Degree (Anabin H+ listed).
2. German language A2 certificate OR English B2 score.
3. 2+ years of relevant industry experience.`,
    status: 'active',
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-4',
    title: 'Urgent: 20 Construction & MEP Supervisors for Croatia (Schengen)',
    slug: 'croatia-mep-construction-supervisors-urgent',
    country: 'Croatia',
    country_code: 'HR',
    category: 'Work & Residence Permit (Schengen)',
    vacancies: 20,
    salary: '€1,200 - €1,600 / month (~₹1.1L - ₹1.45L)',
    experience_required: 'ITI / Diploma & 3+ Years Site Experience',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&auto=format&fit=crop&q=80',
    summary: 'Schengen work permit mandate for commercial construction projects in Zagreb and Split with free food and accommodation provided.',
    content: `### Croatia Schengen Work Permit Placement Drive
Urgent opening for 20 Construction Foremen, MEP Technicians, Electricians, and Welders for major infrastructure projects in Croatia.

#### Package Details:
- **Free Accommodation & Food:** Provided by employer.
- **Schengen Visa:** Full travel rights across 29 Schengen member states.
- **Contract Duration:** 1-Year renewable work permit.

#### Candidate Requirements:
1. ITI / Vocational Diploma in Civil, Electrical, or Mechanical.
2. Minimum 3 years site experience in India or Gulf.
3. Clean Police Clearance Certificate with MEA Apostille.`,
    status: 'active',
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-5',
    title: 'Urgent: 40 Manufacturing Workers for Poland (Automotive & Electronics)',
    slug: 'poland-manufacturing-workers-urgent',
    country: 'Poland',
    country_code: 'PL',
    category: 'Type A Work Permit',
    vacancies: 40,
    salary: '4,500 - 6,000 PLN / month (~₹95K - ₹1.3L)',
    experience_required: 'ITI / 12th Pass & Manufacturing Experience',
    image_url: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&auto=format&fit=crop&q=80',
    summary: 'Direct recruitment for automotive assembly line workers and electronics manufacturing technicians with company-provided accommodation.',
    content: `### Poland Manufacturing Sector Urgent Hiring
Major automotive and electronics manufacturers in Warsaw and Wrocław are recruiting 40 production workers immediately.

#### Key Benefits:
- **Work Permit Provided:** Type A Zezwolenie na pracę with 2-year validity.
- **Accommodation:** Company dormitory or housing allowance.
- **EU Access:** Schengen visa for 29 European countries.
- **Overtime Pay:** Time-and-a-half for extra hours.

#### Requirements:
1. 12th pass or ITI certificate.
2. 1+ year experience in manufacturing/assembly.
3. Basic English communication.
4. Apostilled PCC from RPO.`,
    status: 'active',
    expires_at: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-6',
    title: 'Urgent: 35 Restaurant & Hospitality Staff for Dubai UAE',
    slug: 'dubai-hospitality-restaurant-staff-urgent',
    country: 'United Arab Emirates',
    country_code: 'AE',
    category: 'Employment Visa',
    vacancies: 35,
    salary: 'AED 2,500 - 4,500 / month (~₹58K - ₹1L)',
    experience_required: 'Hotel/Restaurant Experience & Basic English',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    summary: '5-star hotel and premium restaurant chain hiring chefs, waiters, housekeeping staff with visa and accommodation provided.',
    content: `### Dubai Premium Hospitality Urgent Recruitment
Leading 5-star hotel groups and restaurant chains in Dubai are urgently recruiting hospitality professionals.

#### Positions Available:
- Commis Chef / Chef de Partie (10 positions)
- Waiters / Stewards (15 positions)
- Housekeeping Staff (10 positions)

#### Package:
- **Visa Sponsored:** 2-year employment visa.
- **Accommodation:** Shared company housing.
- **Free Food:** Staff meals during duty hours.
- **Medical Insurance:** Covered by employer.
- **Service Charge:** Monthly tips distributed to staff.

#### Requirements:
1. 2+ years experience in hospitality sector.
2. Basic English communication skills.
3. Attested certificates from UAE Embassy.
4. Medical fitness certificate.`,
    status: 'active',
    expires_at: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-7',
    title: 'Urgent: 12 Agriculture Workers for Canada LMIA Jobs',
    slug: 'canada-agriculture-lmia-workers-urgent',
    country: 'Canada',
    country_code: 'CA',
    category: 'LMIA Work Permit',
    vacancies: 12,
    salary: 'CAD 16 - 19 / hour (~₹1L - ₹1.25L per month)',
    experience_required: 'Farm/Agriculture Experience (Training Provided)',
    image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80',
    summary: 'LMIA-approved farm positions in Ontario and British Columbia with direct PR pathway after 1 year of work.',
    content: `### Canada Agriculture LMIA Work Permit Program
Approved LMIA positions for greenhouse workers, farm laborers, and livestock handlers with clear pathway to Permanent Residence.

#### Why This Program:
- **PR Pathway:** Qualify for Express Entry after 1 year.
- **LMIA Approved:** No need to search for employer.
- **Family Sponsorship:** Bring spouse and children.
- **Free Healthcare:** Canadian health insurance coverage.

#### Job Duties:
- Planting, harvesting, and crop maintenance
- Operating farm equipment
- Greenhouse operations
- Livestock feeding and care

#### Requirements:
1. 10th pass (minimum education).
2. Physical fitness for farm work.
3. Basic English (IELTS 4.0+ preferred but not mandatory).
4. Valid passport and PCC.

#### PR Eligibility:
After 1 year of work, apply for:
- Canadian Experience Class (CEC)
- Provincial Nominee Program (PNP)
- Atlantic Immigration Program (AIP)`,
    status: 'active',
    expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-8',
    title: 'Urgent: 18 IT Professionals for Ireland Critical Skills Permit',
    slug: 'ireland-it-critical-skills-urgent',
    country: 'Ireland',
    country_code: 'IE',
    category: 'Critical Skills Employment Permit',
    vacancies: 18,
    salary: '€42,000 - €65,000 / year (~₹38L - ₹58L)',
    experience_required: 'IT Degree + 2 Years Experience in Software/Cloud',
    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    summary: 'Critical Skills Permit for software developers, cloud engineers, and data analysts with fast 2-year PR pathway.',
    content: `### Ireland Critical Skills Tech Jobs - Direct PR Route
Dublin-based tech companies are hiring Indian IT professionals for Critical Skills Employment Permit with accelerated PR pathway.

#### Positions:
- Software Developers (Java, Python, React, Node.js)
- Cloud Engineers (AWS, Azure, GCP)
- Data Analysts & Data Engineers
- DevOps Engineers

#### Benefits:
- **Fast PR:** Eligible for Stamp 4 after just 2 years.
- **Family Rights:** Spouse can work immediately.
- **EU Access:** Irish passport = EU citizenship.
- **High Salaries:** €42K - €65K starting range.
- **No Labour Market Test:** Critical Skills permit exempt.

#### Requirements:
1. Bachelor's degree in Computer Science/IT/Engineering.
2. 2+ years of professional IT experience.
3. IELTS 6.5+ or equivalent.
4. Resume demonstrating relevant skills.

#### Processing:
- Critical Skills Permit: 6-8 weeks
- Visa processing: 4-6 weeks
- Total timeline: 3 months approx`,
    status: 'active',
    expires_at: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-9',
    title: 'Urgent: 25 Welders & Pipefitters for Romania Oil & Gas Projects',
    slug: 'romania-welders-pipefitters-urgent',
    country: 'Romania',
    country_code: 'RO',
    category: 'Work Authorization (EU Schengen)',
    vacancies: 25,
    salary: '€1,400 - €2,200 / month (~₹1.25L - ₹2L)',
    experience_required: 'Welding Certification & 3+ Years Industrial Experience',
    image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    summary: 'Oil & gas infrastructure projects hiring certified welders and pipefitters with free accommodation and Schengen work permit.',
    content: `### Romania Oil & Gas Sector Urgent Welding Jobs
Major energy infrastructure projects in Bucharest and Ploiești require skilled welders and pipefitters immediately.

#### Job Details:
- **Welding Types:** TIG, MIG, Arc, Gas welding
- **Projects:** Pipeline construction, refineries, petrochemical plants
- **Contract:** 1-2 year renewable contracts
- **Schengen Benefits:** Travel across 29 EU countries

#### Salary & Benefits:
- Base: €1,400 - €2,200/month
- Overtime: 150% of hourly rate
- Free accommodation in work camps
- Free transportation to site
- Medical insurance covered

#### Requirements:
1. Valid welding certification (ASME, AWS, or equivalent).
2. 3+ years industrial welding experience.
3. ITI/Diploma in welding or mechanical.
4. Apostilled PCC from India.
5. Medical fitness certificate.

#### Documents Needed:
- Welding certificates (original + apostilled)
- Work experience certificates
- Passport with 18+ months validity
- Educational certificates`,
    status: 'active',
    expires_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-10',
    title: 'Urgent: 50 Warehouse & Logistics Workers for Netherlands',
    slug: 'netherlands-warehouse-logistics-urgent',
    country: 'Netherlands',
    country_code: 'NL',
    category: 'TWV Work Permit',
    vacancies: 50,
    salary: '€2,100 - €2,800 / month (~₹1.9L - ₹2.5L)',
    experience_required: 'Warehouse/Logistics Experience Preferred',
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    summary: 'Major logistics hubs in Amsterdam and Rotterdam hiring warehouse workers, forklift operators, and inventory specialists.',
    content: `### Netherlands Logistics Sector Mass Recruitment
Dutch logistics and warehouse companies urgently need 50 workers for e-commerce fulfillment centers and distribution hubs.

#### Positions Available:
- Warehouse Operators (30 positions)
- Forklift Drivers (10 positions)  
- Inventory Controllers (5 positions)
- Packing & Dispatch Staff (5 positions)

#### Why Netherlands:
- **High Wages:** €2,100 - €2,800/month + overtime
- **Schengen Access:** Work and travel in EU
- **Quality of Life:** Excellent healthcare and safety
- **Bike Culture:** Free bicycle for commute
- **English Friendly:** Most Dutch speak English

#### Package:
- TWV (Tewerkstellingsvergunning) work permit
- Shared accommodation (€300-400/month deducted)
- Medical insurance
- Bicycle provided
- Shift allowances (evening/night extra pay)

#### Requirements:
1. 12th pass minimum.
2. Previous warehouse/logistics experience (preferred).
3. Forklift license (for operator roles).
4. Basic English communication.
5. Physically fit for standing/walking shifts.

#### Work Schedule:
- 40 hours/week standard
- Overtime available
- 3-shift rotation possible
- Weekend work with extra pay`,
    status: 'active',
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const FALLBACK_URGENT_REQUIREMENTS_OLD = [
  {
    id: 'fallback-1',
    title: 'Urgent: 25 Specified Skilled Workers (SSW Caregivers) for Japan',
    slug: 'japan-ssw-caregiver-urgent',
    country: 'Japan',
    country_code: 'JP',
    category: 'Specified Skilled Worker (SSW-1)',
    vacancies: 25,
    salary: '¥220,000 - ¥280,000 / month (~₹1.25L - ₹1.6L)',
    content: `### Croatia Schengen Work Permit Placement Drive
Urgent opening for 20 Construction Foremen, MEP Technicians, Electricians, and Welders for major infrastructure projects in Croatia.

#### Package Details:
- **Free Accommodation & Food:** Provided by employer.
- **Schengen Visa:** Full travel rights across 29 Schengen member states.
- **Contract Duration:** 1-Year renewable work permit.

#### Candidate Requirements:
1. ITI / Vocational Diploma in Civil, Electrical, or Mechanical.
2. Minimum 3 years site experience in India or Gulf.
3. Clean Police Clearance Certificate with MEA Apostille.`,
    status: 'active',
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getInitialRequirements(): UrgentRequirement[] {
  try {
    const cached = localStorage.getItem(LOCAL_URGENT_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return FALLBACK_URGENT_REQUIREMENTS
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
        .select('*')
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
        // Database query failed - use fallback
        console.warn('[usePublicUrgentRequirements] Database error:', dbError?.message || 'Unknown error')
        setRequirements(FALLBACK_URGENT_REQUIREMENTS)
      }
    } catch (err: any) {
      console.warn('[usePublicUrgentRequirements] fetch error:', err)
      // Use fallback data on error
      setRequirements(FALLBACK_URGENT_REQUIREMENTS)
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
        const local = getInitialRequirements()
        const found = local.find(r => r.slug === slug || r.id === slug)
        setRequirement(found || null)
      }
    } catch (err: any) {
      const local = getInitialRequirements()
      const found = local.find(r => r.slug === slug || r.id === slug)
      setRequirement(found || null)
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
  const [requirements, setRequirements] = useState<UrgentRequirement[]>(FALLBACK_URGENT_REQUIREMENTS)
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
        setRequirements(FALLBACK_URGENT_REQUIREMENTS)
        saveToLocal(FALLBACK_URGENT_REQUIREMENTS)
      }
    } catch (err: any) {
      console.warn('[useAdminUrgentRequirements] fetch warning:', err)
      // Use fallback data on error
      setRequirements(FALLBACK_URGENT_REQUIREMENTS)
      saveToLocal(FALLBACK_URGENT_REQUIREMENTS)
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

      // Update in database
      await saveRequirement({ ...target, status: newStatus })
      
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
