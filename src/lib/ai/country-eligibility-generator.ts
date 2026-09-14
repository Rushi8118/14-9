import { generateAiText, getActiveApiKey, type AiProviderConfig } from './providers'

const LOCAL_AI_KEY = 'svo_admin_ai_settings_v1'

function getStoredAiConfig(): AiProviderConfig {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_AI_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        activeProvider: parsed.activeProvider || 'gemini',
        geminiApiKey: parsed.geminiApiKey || '',
        geminiModel: parsed.geminiModel || 'gemini-2.0-flash',
        openrouterApiKey: parsed.openrouterApiKey || '',
        openrouterModel: parsed.openrouterModel || 'google/gemini-2.0-flash-001',
      }
    }
  } catch {}
  return {
    activeProvider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',
    openrouterApiKey: '',
    openrouterModel: 'google/gemini-2.0-flash-001',
  }
}

export type GeneratedCountryEligibility = {
  name: string
  slug: string
  code: string
  flag_emoji: string
  capital: string
  region: string
  language: string
  description: string
  why_work: string
  why_study: string
  lifestyle: string
  eligibility_criteria: string[]
  work_eligibility_criteria: string[]
  study_eligibility_criteria: string[]
  success_rate: number
  avg_processing_days: number
  monthly_living_cost: number
}

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function getFlagEmoji(country: string): string {
  const c = country.toLowerCase()
  if (c.includes('japan')) return '🇯🇵'
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('britain')) return '🇬🇧'
  if (c.includes('canada')) return '🇨🇦'
  if (c.includes('australia')) return '🇦🇺'
  if (c.includes('germany')) return '🇩🇪'
  if (c.includes('usa') || c.includes('united states')) return '🇺🇸'
  if (c.includes('dubai') || c.includes('uae') || c.includes('united arab emirates')) return '🇦🇪'
  if (c.includes('singapore')) return '🇸🇬'
  if (c.includes('croatia')) return '🇭🇷'
  if (c.includes('france')) return '🇫🇷'
  if (c.includes('new zealand')) return '🇳🇿'
  if (c.includes('ireland')) return '🇮🇪'
  if (c.includes('spain')) return '🇪🇸'
  if (c.includes('italy')) return '🇮🇹'
  if (c.includes('poland')) return '🇵🇱'
  return '🌍'
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() || raw.trim()
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1))
    }
    throw new Error('AI did not return valid JSON. Please try again with a clearer country name.')
  }
}

function normalizeCountryData(data: Record<string, unknown>, prompt: string): GeneratedCountryEligibility {
  const name = String(data.name || prompt).trim()
  const slug = slugify(String(data.slug || name).trim())
  const workRules = Array.isArray(data.work_eligibility_criteria)
    ? data.work_eligibility_criteria.map((item: unknown) => String(item).trim()).filter(Boolean)
    : []
  const studyRules = Array.isArray(data.study_eligibility_criteria)
    ? data.study_eligibility_criteria.map((item: unknown) => String(item).trim()).filter(Boolean)
    : []
  const combinedRules = Array.isArray(data.eligibility_criteria) && data.eligibility_criteria.length > 0
    ? data.eligibility_criteria.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [...workRules, ...studyRules]

  return {
    name,
    slug: slug || `country-${Date.now()}`,
    code: String(data.code || 'XX').toUpperCase().slice(0, 2) || 'XX',
    flag_emoji: String(data.flag_emoji || getFlagEmoji(name)),
    capital: String(data.capital || 'Capital').trim(),
    region: String(data.region || 'Europe').trim(),
    language: String(data.language || 'English').trim(),
    description: String(data.description || '').trim(),
    why_work: String(data.why_work || '').trim(),
    why_study: String(data.why_study || '').trim(),
    lifestyle: String(data.lifestyle || '').trim(),
    work_eligibility_criteria: workRules.length > 0 ? workRules : combinedRules.slice(0, 5),
    study_eligibility_criteria: studyRules.length > 0 ? studyRules : combinedRules.slice(5),
    eligibility_criteria: combinedRules,
    success_rate: Number(data.success_rate) || 95,
    avg_processing_days: Number(data.avg_processing_days) || 45,
    monthly_living_cost: Number(data.monthly_living_cost) || 85000,
  }
}

function getCountryContext(countryName: string): string {
  const lower = countryName.toLowerCase()
  if (lower.includes('germany')) return 'Germany is in Europe with capital Berlin. Primary languages are German and English. Currency is Euro (EUR).'
  if (lower.includes('spain')) return 'Spain is in Europe with capital Madrid. Primary languages are Spanish and English. Currency is Euro (EUR).'
  if (lower.includes('uk') || lower.includes('united kingdom') || lower.includes('britain')) return 'United Kingdom is in Europe with capital London. Primary language is English. Currency is British Pound (GBP).'
  if (lower.includes('france')) return 'France is in Europe with capital Paris. Primary languages are French and English. Currency is Euro (EUR).'
  if (lower.includes('dubai') || lower.includes('uae') || lower.includes('united arab emirates')) return 'United Arab Emirates is in the Middle East with capital Abu Dhabi. Primary languages are Arabic and English. Currency is UAE Dirham (AED).'
  if (lower.includes('singapore')) return 'Singapore is in Asia with capital Singapore. Primary languages are English, Malay, Mandarin, and Tamil. Currency is Singapore Dollar (SGD).'
  if (lower.includes('japan')) return 'Japan is in Asia with capital Tokyo. Primary language is Japanese. Currency is Japanese Yen (JPY).'
  if (lower.includes('australia')) return 'Australia is in Oceania with capital Canberra. Primary language is English. Currency is Australian Dollar (AUD).'
  if (lower.includes('canada')) return 'Canada is in Americas with capital Ottawa. Primary languages are English and French. Currency is Canadian Dollar (CAD).'
  if (lower.includes('usa') || lower.includes('united states')) return 'United States is in Americas with capital Washington DC. Primary language is English. Currency is US Dollar (USD).'
  if (lower.includes('ireland')) return 'Ireland is in Europe with capital Dublin. Primary language is English and Irish. Currency is Euro (EUR).'
  if (lower.includes('new zealand')) return 'New Zealand is in Oceania with capital Wellington. Primary language is English. Currency is New Zealand Dollar (NZD).'
  return `${countryName} is a popular destination for Indian visa applicants seeking work and study opportunities.`
}

function generateProceduralCountryEligibility(prompt: string): GeneratedCountryEligibility {
  const countryName = prompt.trim() || 'Germany'
  const slug = slugify(countryName)
  const flag_emoji = getFlagEmoji(countryName)
  const lower = countryName.toLowerCase()

  let region = 'Europe'
  let capital = 'Berlin'
  let language = 'German, English'
  let code = 'DE'
  let success_rate = 94.5
  let avg_processing_days = 45
  let monthly_living_cost = 85000

  let work_eligibility_criteria: string[] = []
  let study_eligibility_criteria: string[] = []

  if (lower.includes('germany')) {
    region = 'Europe'; capital = 'Berlin'; language = 'German, English'; code = 'DE'
    success_rate = 95.2; avg_processing_days = 45; monthly_living_cost = 90000
    work_eligibility_criteria = [
      'EU Blue Card or Opportunity Card (Chancenkarte) point threshold qualification.',
      'Recognized Bachelor\'s/Master\'s degree or vocational qualification (Anabin ZAB approval).',
      'B1/B2 German language level (or fluent English for STEM / IT roles).',
      'Formal employment contract with minimum salary threshold (€45,300+ for bottleneck occupations).',
      'Police Clearance Certificate (PCC) issued by Indian Regional Passport Office.',
    ]
    study_eligibility_criteria = [
      'Minimum 60%+ in 12th / Bachelor\'s degree from recognized Indian board/university.',
      'Blocked Bank Account (Sperrkonto) with minimum €11,208 per year for living expenses.',
      'IELTS Academic 6.5+ or German language level B2 (for German-taught programs).',
      'APS Certificate mandatory for Indian academic documents verification.',
      'Unconditional admission letter from public/private German university.',
    ]
  } else if (lower.includes('spain')) {
    region = 'Europe'; capital = 'Madrid'; language = 'Spanish, English'; code = 'ES'
    success_rate = 93.8; avg_processing_days = 40; monthly_living_cost = 75000
    work_eligibility_criteria = [
      'Work Authorization (Autorización de Trabajo y Residencia) sponsored by Spanish employer.',
      'Degree validation or official homologation certificate (Homologación).',
      'DELE A2 / B1 Spanish proficiency or documented English fluency for multinational tech firms.',
      'Minimum 1+ year relevant professional experience in target job sector.',
      'Clean criminal record certificate with Hague Apostille legalization.',
    ]
    study_eligibility_criteria = [
      'Formal acceptance letter from accredited Spanish University or Business School.',
      'Proof of financial means (IPREM index equivalent approx €600/month).',
      'Private medical health insurance operating in Spain with full coverage.',
      'Academic transcripts with Hague Apostille translation in Spanish.',
      'Police clearance and medical fitness certificate.',
    ]
  } else if (lower.includes('uk') || lower.includes('united kingdom') || lower.includes('britain')) {
    region = 'Europe'; capital = 'London'; language = 'English'; code = 'GB'
    success_rate = 95.8; avg_processing_days = 21; monthly_living_cost = 110000
    work_eligibility_criteria = [
      'Certificate of Sponsorship (CoS) from a licensed UK Home Office sponsor.',
      'Job offer meeting minimum salary threshold (£38,700/yr or £29,000 for Health & Care roles).',
      'IELTS General 4.0+ or SELT B1 English language proficiency.',
      'Tuberculosis (TB) test clearance from approved Indian diagnostic clinic.',
      'Clean Police Clearance Certificate (PCC).',
    ]
    study_eligibility_criteria = [
      'CAS (Confirmation of Acceptance for Studies) letter from licensed UK university.',
      'IELTS Academic 6.0+ (or MOI waiver where applicable).',
      'Proof of tuition fee payment + 28-day bank balance for living funds (£1,334/mo London, £1,023/mo outside).',
      'Valid Passport and TB test clearance certificate.',
      'Academic transcripts with 55%+ minimum score in 12th/Graduation.',
    ]
  } else if (lower.includes('france')) {
    region = 'Europe'; capital = 'Paris'; language = 'French, English'; code = 'FR'
    success_rate = 92.5; avg_processing_days = 35; monthly_living_cost = 85000
    work_eligibility_criteria = [
      'Talent Passport (Passeport Talent) or standard Salarié Work Permit authorization.',
      'Higher education degree (Master\'s level or specialized technical diploma).',
      'DELF/DALF B1 French proficiency (or English fluency for international corporate hubs).',
      'Official employment contract approved by DIRECCTE / French labor authority.',
      'Police Clearance Certificate and Apostilled documents.',
    ]
    study_eligibility_criteria = [
      'Campus France NOC clearance and EEF procedure completed in India.',
      'Admission letter from recognized French University or Grande École.',
      'Proof of minimum financial maintenance (€615 per month minimum requirement).',
      'IELTS Academic 6.0+ for English-taught master\'s or DELF B2 for French programs.',
      'Proof of accommodation in France for the first 3 months.',
    ]
  } else if (lower.includes('dubai') || lower.includes('uae')) {
    region = 'Middle East'; capital = 'Abu Dhabi'; language = 'Arabic, English'; code = 'AE'
    success_rate = 97.5; avg_processing_days = 14; monthly_living_cost = 95000
    work_eligibility_criteria = [
      'MOHRE Employment Offer Letter & Ministry Work Permit approval.',
      'Attested Educational Certificates by UAE Embassy in India & MOFA in UAE.',
      'Passport with minimum 6 months validity.',
      'Medical Fitness Test (Blood test & X-ray) clearance upon arrival in UAE.',
      'Clean Police Clearance Certificate (PCC).',
    ]
    study_eligibility_criteria = [
      'Offer Letter from KHDA / Ministry of Education accredited UAE university campus.',
      'Sponsorship by university or parent/guardian holding valid UAE residency.',
      'High School Certificate / Bachelor\'s transcripts with UAE Embassy attestation.',
      'Medical fitness screening & UAE Emirates ID registration.',
      'Proof of initial tuition fee deposit payment.',
    ]
  } else if (lower.includes('singapore')) {
    region = 'Asia'; capital = 'Singapore'; language = 'English, Malay, Mandarin'; code = 'SG'
    success_rate = 93.0; avg_processing_days = 25; monthly_living_cost = 120000
    work_eligibility_criteria = [
      'Employment Pass (EP) meeting COMPASS points framework (40+ points) or S-Pass.',
      'Minimum qualifying fixed monthly salary (SGD $5,000 for EP or SGD $3,150 for S-Pass).',
      'Recognized degree from verified higher education institution.',
      'Relevant professional experience in technology, finance, or engineering.',
      'Clean background check & MOM work pass approval.',
    ]
    study_eligibility_criteria = [
      'Solar Student\'s Pass application approval from Singapore ICA (Immigration Authority).',
      'Unconditional acceptance from Autonomous University or PEI accredited college.',
      'Proof of financial capability for tuition fees and SGD $1,500/month living cost.',
      'IELTS Academic 6.0+ or TOEFL equivalent.',
      'Medical screening clearance including HIV & Chest X-Ray.',
    ]
  } else if (lower.includes('japan')) {
    region = 'Asia'; capital = 'Tokyo'; language = 'Japanese'; code = 'JP'
    success_rate = 96.2; avg_processing_days = 45; monthly_living_cost = 75000
    work_eligibility_criteria = [
      'JLPT N4 / NAT-TEST Level 4 language certification (or enrolled in intensive prep).',
      'Prometric Skill Assessment test certificate for SSW-1 (Specified Skilled Worker) sector.',
      'Minimum Qualification: 12th Pass, Nursing Diploma, or Vocational Degree.',
      'COE (Certificate of Eligibility) issued by Japanese Immigration Services Agency.',
      'Medical Fitness Certificate & PCC from Indian Passport Office.',
    ]
    study_eligibility_criteria = [
      'COE from Japanese Language School, University, or Vocational College (Senmon Gakko).',
      'JLPT N5 / NAT-TEST Level 5 basic certification (minimum 150 hours Japanese study).',
      'Financial Sponsor (parent/self) bank balance of approx ₹15-20 Lakhs for 1-year expense.',
      'Clean academic record with minimum 50%+ marks in 10th & 12th.',
      'Relationship proof with financial sponsor.',
    ]
  } else if (lower.includes('australia')) {
    region = 'Oceania'; capital = 'Canberra'; language = 'English'; code = 'AU'
    success_rate = 91.5; avg_processing_days = 60; monthly_living_cost = 115000
    work_eligibility_criteria = [
      'Skills Assessment positive outcome from assessing authority (ACS, Engineers Australia, TRA, VETASSESS).',
      'Points Test qualification (minimum 65 points for Skilled Independent 189 / Nominated 190 / 491 visa).',
      'IELTS General 6.0+ in each band (PTE Academic 50+).',
      'Nomination by Australian employer or State/Territory government.',
      'Clean Police Check (PCC) & Bupa Medical Examination.',
    ]
    study_eligibility_criteria = [
      'CoE (Confirmation of Enrolment) from CRICOS registered Australian University.',
      'Genuine Student (GS) statement demonstrating authentic academic intentions.',
      'IELTS Academic 6.0+ (PTE 50+).',
      'Financial funds proof covering 1-year tuition + AUD $24,505 living expense.',
      'Overseas Student Health Cover (OSHC) for the full duration of study.',
    ]
  } else {
    work_eligibility_criteria = [
      'Valid Indian Passport with minimum 18 months remaining validity.',
      'Recognized Bachelor\'s Degree, Vocational Diploma, or Technical Trade Certificate.',
      'Work Permit / Visa Sponsorship offer letter from accredited employer.',
      'Language proficiency (IELTS 5.0+ or native language equivalent A2/B1).',
      'Clean Police Clearance Certificate (PCC) issued by Indian Regional Passport Office.',
    ]
    study_eligibility_criteria = [
      'Unconditional Admission Letter from recognized international university/college.',
      'Academic transcripts with 55%+ aggregate in 12th / Graduation.',
      'Proof of funds for tuition fees + living expenses in liquid bank balance or student loan.',
      'IELTS Academic 6.0+ or equivalent English/native language test.',
      'Valid Passport & Medical Clearance Certificate.',
    ]
  }

  const eligibility_criteria = [...work_eligibility_criteria, ...study_eligibility_criteria]

  return {
    name: countryName,
    slug,
    code,
    flag_emoji,
    capital,
    region,
    language,
    description: `${countryName} offers exceptional career growth, world-class education, and clear pathways to long-term residence for qualified applicants from India.`,
    why_work: `High base compensation, direct employer sponsorship opportunities, strong labor protections, and permanent residency options.`,
    why_study: `Top-ranked universities, post-study work rights, subsidized tuition options, and global career networking opportunities.`,
    lifestyle: `High standard of living, safe community environment, public transport infrastructure, and vibrant international community.`,
    eligibility_criteria,
    work_eligibility_criteria,
    study_eligibility_criteria,
    success_rate,
    avg_processing_days,
    monthly_living_cost,
  }
}

function buildSystemPrompt(websiteContext: string): string {
  return `You are an expert overseas immigration lawyer and Senior Visa Director at Siddhivinayak Overseas (Surat, India).

Generate precise, 100% accurate, officially verified Country Profile & Eligibility Rules for both Work Visa and Study Visa pathways targeting Indian applicants.

CRITICAL RULES:
- NEVER invent or guess visa rules, salary thresholds, processing times, or fees. Base everything on real, current official immigration rules as of 2025-2026.
- If uncertain about specific details, say "consult our visa experts" rather than providing inaccurate information.
- Every eligibility criterion must be specific, actionable, and verifiable.
- Use exact official terminology (e.g., "Certificate of Sponsorship" not "job letter", "CAS" not "admission letter").
- Salary figures must include currency and exact amounts.
- Language test scores must include exact band/level requirements.

CONTEXT:
${websiteContext}

Return ONLY a single valid JSON object following this exact structure:
{
  "name": "Country Name (e.g. Germany, Spain, United Kingdom, France, Dubai, Singapore, Japan, Australia)",
  "slug": "url-friendly-slug",
  "code": "2-letter ISO code",
  "flag_emoji": "Flag Emoji",
  "capital": "Capital City",
  "region": "Americas | Europe | Asia | Oceania | Middle East",
  "language": "Primary Languages spoken",
  "description": "2-3 sentences overview of work and study opportunities for Indian applicants from Surat",
  "why_work": "Key advantages for Indian professionals seeking employment here",
  "why_study": "Key advantages for Indian students seeking higher education here",
  "lifestyle": "Living conditions, cost of living, culture, and safety overview",
  "work_eligibility_criteria": [
    "5 specific, official, verified work visa rules with exact requirements"
  ],
  "study_eligibility_criteria": [
    "5 specific, official, verified study visa rules with exact requirements"
  ],
  "eligibility_criteria": [
    "Combined array of all work and study criteria"
  ],
  "success_rate": 95,
  "avg_processing_days": 45,
  "monthly_living_cost": 85000
}

WORK eligibility rules MUST include:
- Exact visa/subclass names
- Official salary thresholds with currency
- Required language test scores (IELTS/PTE with band numbers)
- Required educational qualifications and their verification bodies
- Medical and police clearance requirements with specific authorities

STUDY eligibility rules MUST include:
- Specific acceptance letter type (CAS, CoE, I-20, etc.)
- Exact financial fund requirements
- Specific language test score requirements
- Academic percentage/grade requirements
- Medical insurance and health screening specifics

Always phrase requirements with "typically", "as of 2025", or "minimum" to avoid guaranteeing outcomes. Add a CTA paragraph suggesting free consultation at Siddhivinayak Overseas, Surat.`
}

/**
 * Generate full country profile & eligibility list using AI with high precision prompt
 */
export async function generateCountryEligibilityWithAi(
  prompt: string,
  config?: AiProviderConfig,
  websiteContext?: string
): Promise<GeneratedCountryEligibility> {
  const activeConfig = config || getStoredAiConfig()
  const apiKey = getActiveApiKey(activeConfig)

  if (!apiKey) {
    return generateProceduralCountryEligibility(prompt)
  }

  const context = websiteContext || getCountryContext(prompt)
  const system = buildSystemPrompt(context)
  const userPrompt = `Generate real, accurate, officially verified visa eligibility rules and country profile for: ${prompt}

Target audience: Indian students and professionals from Surat, Gujarat applying through Siddhivinayak Overseas consultancy.

Provide exact, specific, and verifiable information. Never guess or invent rules.`

  try {
    const raw = await generateAiText(activeConfig, [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ], 'country_eligibility')

    const data = extractJsonObject(raw)
    const result = normalizeCountryData(data, prompt)

    // Validate critical fields
    if (result.work_eligibility_criteria.length === 0 && result.study_eligibility_criteria.length === 0) {
      throw new Error('AI did not generate eligibility criteria')
    }

    return result
  } catch (error) {
    console.warn('[AI Country Generator] Error, falling back to procedural:', error)
    return generateProceduralCountryEligibility(prompt)
  }
}

/**
 * AI function to enhance / auto-refine existing eligibility text into bulleted rules
 */
export async function enhanceEligibilityWithAi(
  countryName: string,
  existingRules: string[],
  config?: AiProviderConfig,
  websiteContext?: string
): Promise<string[]> {
  const activeConfig = config || getStoredAiConfig()
  const apiKey = getActiveApiKey(activeConfig)

  if (!apiKey || existingRules.length === 0) {
    return [
      ...existingRules,
      'Valid Indian Passport with 18+ months validity.',
      'Clean Police Clearance Certificate (PCC) issued by Regional Passport Office.',
    ]
  }

  const context = websiteContext || getCountryContext(countryName)
  const system = `You are a senior visa documentation officer at Siddhivinayak Overseas (Surat, India).
Refine and enhance the following list of visa eligibility criteria for ${countryName}.

Context: ${context}

CRITICAL: Return ONLY a valid JSON array of strings containing clean, professional, bulleted eligibility rules. Each rule must be specific, official, and verifiable. Never invent rules.

Return ONLY the JSON array — no other text.`

  const userPrompt = `Country: ${countryName}\nExisting Rules:\n${existingRules.join('\n')}\n\nRefine, enhance, and correct these rules. Add any missing official requirements.`

  try {
    const raw = await generateAiText(activeConfig, [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ], 'country_eligibility')
    const data = extractJsonObject(raw)
    const arr = Array.isArray(data) ? data : (data.rules || data.criteria || existingRules)
    if (Array.isArray(arr)) return arr.map((s: unknown) => String(s).trim())
  } catch (e) {
    console.warn('[enhanceEligibilityWithAi] fallback:', e)
  }

  return existingRules
}
