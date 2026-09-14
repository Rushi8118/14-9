import { useCallback, useEffect, useId, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { countries as ISO_COUNTRY_CODES } from 'country-flag-icons'

export type AdminCountryItem = {
  id: string
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
  latitude: number | null
  longitude: number | null
  description: string
  why_work: string
  why_study: string
  lifestyle: string
  climate_summary: string
  has_work_visa: boolean
  has_study_visa: boolean
  eligibility_criteria: string[]
  work_eligibility_criteria: string[]
  study_eligibility_criteria: string[]
  success_rate: number
  avg_processing_days: number
  monthly_living_cost: number
  monthly_family_cost: number | null
  images: string[]
  meta_title: string
  meta_desc: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  /**
   * 'database' rows are stored in Supabase. 'starter' rows are bundled defaults and 'world'
   * rows are every other ISO country; neither is saved until an admin saves it.
   */
  source: 'database' | 'starter' | 'world'
  /** Original JSON columns, so saving preserves keys this editor does not manage. */
  raw?: { visa_stats: unknown; cost_of_living: unknown; climate: unknown }
}

export type CountryInput = Omit<AdminCountryItem, 'id' | 'created_at' | 'updated_at' | 'source' | 'raw'>

/** Shape of the bundled starter data used before countries are stored in the database. */
type StarterCountry = {
  id: string
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
  has_work_visa: boolean
  has_study_visa: boolean
  eligibility_criteria: string[]
  work_eligibility_criteria: string[]
  study_eligibility_criteria: string[]
  success_rate: number
  avg_processing_days: number
  monthly_living_cost: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

const STARTER_ROWS: StarterCountry[] = [
  // --- CORE WORK & STUDY DESTINATIONS ---
  {
    id: 'country-germany',
    name: 'Germany',
    slug: 'germany',
    code: 'DEU',
    flag_emoji: '🇩🇪',
    capital: 'Berlin',
    region: 'Europe',
    language: 'German, English',
    description: 'EU Blue Card, Opportunity Card (Chancenkarte), and tuition-free public universities.',
    why_work: 'EU Blue Card PR in 21-27 months, high IT/Engineering demand, Chancenkarte points system.',
    why_study: 'Zero tuition fees at public universities and 18-month post-study job search visa.',
    lifestyle: 'Strong work-life balance, high security, central European travel access.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Opportunity Card (Chancenkarte) 6+ points OR official job offer.',
      'Degree recognized on Anabin database / ZAB Statement of Comparability.',
      'German A2/B1 certificate OR English B2.',
      'Blocked Account (€1,027/month) / Financial Proof.',
      'Clean PCC from RPO Surat.',
    ],
    work_eligibility_criteria: [
      'EU Blue Card job offer (€45,300+ salary) OR Chancenkarte 6+ points.',
      'Degree verification via Anabin or ZAB Statement of Comparability.',
      'German A2/B1 OR English B2 for tech roles.',
      'Passport with 18+ months validity.',
      'PCC from Regional Passport Office Surat.',
    ],
    study_eligibility_criteria: [
      'APS Certificate issued by APS India New Delhi.',
      'University Admit Letter from German State Institution.',
      'Blocked Account with €11,208 deposited.',
      'IELTS Academic 6.5+ or Goethe B2 German.',
      'German Student Health Insurance.',
    ],
    success_rate: 94,
    avg_processing_days: 45,
    monthly_living_cost: 85000,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-uk',
    name: 'United Kingdom',
    slug: 'united-kingdom',
    code: 'GBR',
    flag_emoji: '🇬🇧',
    capital: 'London',
    region: 'Europe',
    language: 'English',
    description: 'Skilled Worker Visa, Health & Care Worker routes, and Graduate Study permits.',
    why_work: 'NHS Certificate of Sponsorship (COS), fast 5-year PR pathway.',
    why_study: 'Graduate Route (2-3 year post-study work visa) and world-leading universities.',
    lifestyle: 'Global financial & healthcare hub with large Indian diaspora.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Valid Certificate of Sponsorship (COS) or CAS letter.',
      'English Proficiency: IELTS UKVI / Academic 5.5+.',
      'Healthcare, IT, or Vocational qualification.',
      'Tuberculosis (TB) Test clearance.',
      'PCC from RPO Surat.',
    ],
    work_eligibility_criteria: [
      'Certificate of Sponsorship (COS) from UK licensed employer.',
      'Minimum Salary threshold (£38,700 or NHS scale).',
      'IELTS UKVI B1 / SELT English test pass.',
      'TB Test clearance from UKVI approved clinic.',
      'Police Clearance Certificate from India.',
    ],
    study_eligibility_criteria: [
      'CAS (Confirmation of Acceptance for Studies) letter.',
      'IELTS Academic 6.0+ or 65%+ in 12th English.',
      '28-day maintained bank balance (£1,334/mo London, £1,023/mo outer).',
      'TB Test Certificate.',
      'Valid Indian Passport.',
    ],
    success_rate: 91,
    avg_processing_days: 30,
    monthly_living_cost: 95000,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-france',
    name: 'France',
    slug: 'france',
    code: 'FRA',
    flag_emoji: '🇫🇷',
    capital: 'Paris',
    region: 'Europe',
    language: 'French, English',
    description: 'Talent Passport (Passeport Talent), Salaried Work Permits, and 5-year post-study Alumni visas.',
    why_work: '4-year Talent Passport permit without labor market test for tech & executives.',
    why_study: '5-year Schengen Alumni Visa for Indian Master graduates.',
    lifestyle: 'High quality of life, 35-hour work week, rich art & tech scene.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Talent Passport Contract or Campus France University Offer.',
      'English B2 for English courses OR DELF B2 for French.',
      'Monthly funds (€615/mo student or SMIC salary work).',
      'OFII Medical registration.',
      'Clean PCC from RPO Surat.',
    ],
    work_eligibility_criteria: [
      'Talent Passport Employment Contract (€42,000+ salary) or DIRECCTE Work Permit.',
      'Degree verification and CV.',
      'OFII Medical Check clearance.',
      'PCC from RPO Surat.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'Campus France Interview Approval (EEF procedure).',
      'Admit Letter from French University or Grande École.',
      'Proof of Funds (€615/month bank balance).',
      'IELTS Academic 6.0+ or DELF B2.',
      'Proof of Housing in France.',
    ],
    success_rate: 93,
    avg_processing_days: 20,
    monthly_living_cost: 70000,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-spain',
    name: 'Spain',
    slug: 'spain',
    code: 'ESP',
    flag_emoji: '🇪🇸',
    capital: 'Madrid',
    region: 'Europe',
    language: 'Spanish, English',
    description: 'Work Authorization, Digital Nomad Visa, and English-taught Master programs in Madrid & Barcelona.',
    why_work: 'Digital Nomad flat tax rate (15%) and full Schengen residency.',
    why_study: 'Vibrant student cities and affordable tuition fees.',
    lifestyle: 'Mediterranean sunshine, relaxed lifestyle, and warm climate.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Work Contract meeting Spanish SMI or Digital Nomad threshold.',
      'Apostilled PCC from RPO Surat.',
      'Private Spanish Medical Insurance.',
      'Valid Passport with 18+ months validity.',
      'Proof of Accommodation.',
    ],
    work_eligibility_criteria: [
      'Spanish Ministry of Migration Work Authorization Approval.',
      'Remote Work contract meeting €2,640/month (Digital Nomad) or employer offer.',
      'Apostilled PCC.',
      'Private Health Insurance.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'Acceptance Letter from Spanish Accredited Institution.',
      'Proof of Financial Means (€600/month IPREM).',
      'Medical Certificate under International Health Regulations 2005.',
      'Apostilled PCC for studies > 180 days.',
      'Spanish Health Insurance Policy.',
    ],
    success_rate: 92,
    avg_processing_days: 25,
    monthly_living_cost: 60000,
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-uae',
    name: 'United Arab Emirates',
    slug: 'united-arab-emirates',
    code: 'ARE',
    flag_emoji: '🇦🇪',
    capital: 'Abu Dhabi',
    region: 'Middle East',
    language: 'Arabic, English',
    description: 'Golden Visa, 2-Year Employment Visas, and Dubai International Academic City study routes.',
    why_work: '100% Tax-Free salaries, zero income tax, top demand in IT, Construction & Healthcare.',
    why_study: 'Global university branch campuses in Dubai Knowledge Park.',
    lifestyle: 'Modern luxury infrastructure, safe environment, 3.5 hour flight to Gujarat.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Attested Degree / ITI Certificate from UAE Embassy Delhi & HRD Gujarat.',
      'Valid Employment Offer from UAE Mainland/Freezone company.',
      'Medical Fitness test clearance in UAE.',
      'Clean PCC from RPO Surat.',
      'Passport with 6+ months validity.',
    ],
    work_eligibility_criteria: [
      'Degree / ITI Certificate attested by UAE Embassy New Delhi & MOFA UAE.',
      'Employment contract from UAE employer.',
      'Medical Fitness test (Blood & X-Ray) passed in UAE.',
      'Clean PCC from Passport Office.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'Offer Letter from Dubai University campus.',
      '12th Marksheet with minimum 55% aggregate.',
      'Tuition Fee deposit receipt.',
      'Student Visa Sponsorship by University.',
      'Medical Examination pass in Dubai.',
    ],
    success_rate: 96,
    avg_processing_days: 20,
    monthly_living_cost: 65000,
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-singapore',
    name: 'Singapore',
    slug: 'singapore',
    code: 'SGP',
    flag_emoji: '🇸🇬',
    capital: 'Singapore',
    region: 'Asia',
    language: 'English, Mandarin',
    description: 'Employment Pass (EP), S Pass, and world-top study programs at NUS & NTU.',
    why_work: 'Low tax rates, premier APAC financial hub, competitive compensation.',
    why_study: 'NUS & NTU ranked in top 15 universities globally.',
    lifestyle: 'Spotless safety, world-class transit, close to India.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'COMPASS 40+ points (EP) or SGD 3,150+ monthly salary (S Pass).',
      'MOM Accredited Background Check verification report.',
      'Degree in IT, Finance, or Engineering.',
      'Passport with 6+ months validity.',
      'PCC from RPO Surat.',
    ],
    work_eligibility_criteria: [
      'COMPASS points pass threshold (40+ points) for EP.',
      'Qualifying Salary: SGD 5,000+ (EP) or SGD 3,150+ (S Pass).',
      'MOM Background Check verification report.',
      'PCC from Passport Office.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'SOLAR Student Pass In-Principle Approval (IPA) letter.',
      'Offer Letter from NUS, NTU, SMU or EduTrust institute.',
      'IELTS Academic 6.5+.',
      'Proof of Financial Solvency.',
      'Medical Checkup pass in Singapore.',
    ],
    success_rate: 90,
    avg_processing_days: 15,
    monthly_living_cost: 105000,
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // --- ADDITIONAL WORK VISA DESTINATIONS (EUROPE, ASIA, OCEANIA, AMERICAS) ---
  {
    id: 'country-albania',
    name: 'Albania',
    slug: 'albania',
    code: 'ALB',
    flag_emoji: '🇦🇱',
    capital: 'Tirana',
    region: 'Europe',
    language: 'Albanian, English',
    description: 'Work Permit and Employment Visa pathways for skilled technicians and construction specialists.',
    why_work: 'Fast-growing Balkan economy with demand in Construction, Hospitality, and Apparel manufacturing.',
    why_study: 'Work visa focused destination.',
    lifestyle: 'Affordable Mediterranean coastline living.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'Work Authorization issued by National Employment and Skills Agency (AKPA).',
      'Valid Employment Contract with Albanian employer.',
      'Apostilled PCC from RPO Surat.',
      'Passport with 18+ months validity.',
      'Medical Fitness clearance.',
    ],
    work_eligibility_criteria: [
      'Work Authorization from Albanian National Employment Agency (AKPA).',
      '10th/12th/ITI or Trade Qualification certificate.',
      'Apostilled PCC from Passport Office.',
      'Valid Passport.',
      'Medical Fitness report.',
    ],
    study_eligibility_criteria: [
      'Study Visa not offered for this destination — Work Visa & Employment Permits available.',
    ],
    success_rate: 94,
    avg_processing_days: 30,
    monthly_living_cost: 35000,
    is_active: true,
    sort_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-armenia',
    name: 'Armenia',
    slug: 'armenia',
    code: 'ARM',
    flag_emoji: '🇦🇲',
    capital: 'Yerevan',
    region: 'Europe',
    language: 'Armenian, English',
    description: 'Work Permit and temporary residence status for IT, Trade, and Construction skilled workers.',
    why_work: 'Simple work visa process with lower documentation thresholds.',
    why_study: 'Work permit focused destination.',
    lifestyle: 'Peaceful Caucasus environment, low cost of living.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'Work Permit Notification from Unified Migration Service of Armenia.',
      'Employment contract with registered company.',
      'Clean PCC from India.',
      'Valid Passport.',
      'Medical Certificate.',
    ],
    work_eligibility_criteria: [
      'Unified Migration Service Work Approval in Armenia.',
      'Signed Work Contract.',
      'PCC from Surat Passport Office.',
      'Valid Passport.',
      'Medical Fitness Clearance.',
    ],
    study_eligibility_criteria: [
      'Study Visa not offered for this destination — Work Visa & Employment Permits available.',
    ],
    success_rate: 95,
    avg_processing_days: 20,
    monthly_living_cost: 30000,
    is_active: true,
    sort_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-austria',
    name: 'Austria',
    slug: 'austria',
    code: 'AUT',
    flag_emoji: '🇦🇹',
    capital: 'Vienna',
    region: 'Europe',
    language: 'German, English',
    description: 'Red-White-Red Card points-based immigration for Very Highly Qualified Workers & Skilled Workers.',
    why_work: 'High EU salaries, direct 2-year Red-White-Red card leading to EU Permanent Residence.',
    why_study: 'Work visa focus for skilled engineering and IT professionals.',
    lifestyle: 'Top global quality of life, Vienna safety & healthcare.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'Red-White-Red Card 55+ points score (Qualifications, Work Experience, Age, Language).',
      'Job Offer meeting Austrian statutory minimum wage threshold.',
      'German A1/A2 or English B1/B2 certificate.',
      'Apostilled Educational Degree & PCC.',
      'Valid Passport.',
    ],
    work_eligibility_criteria: [
      'Red-White-Red Card points assessment pass (55+ points).',
      'Job Offer from Austrian employer meeting minimum salary standard.',
      'Degree evaluation.',
      'German A1/A2 or English B1/B2.',
      'Apostilled PCC from Surat RPO.',
    ],
    study_eligibility_criteria: [
      'Study Visa not offered for this destination — Work Visa & Employment Permits available.',
    ],
    success_rate: 91,
    avg_processing_days: 45,
    monthly_living_cost: 85000,
    is_active: true,
    sort_order: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-croatia',
    name: 'Croatia',
    slug: 'croatia',
    code: 'HRV',
    flag_emoji: '🇭🇷',
    capital: 'Zagreb',
    region: 'Europe',
    language: 'Croatian, English',
    description: 'Schengen Stay and Work Permits for Construction, Hospitality, Logistics, and Tech.',
    why_work: 'Full Schengen entry, high demand for foreign technicians, fast labor market approval.',
    why_study: 'Work visa focused destination.',
    lifestyle: 'Beautiful Adriatic coastline, safe cities, central European connectivity.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'HZZ Labour Market Test approval from Croatian Employment Bureau.',
      'Signed Employment Contract.',
      'Apostilled PCC from RPO Surat.',
      'Valid Passport with 18+ months validity.',
      'Health Insurance.',
    ],
    work_eligibility_criteria: [
      'Croatian Employment Bureau (HZZ) Labour Approval.',
      'Signed Work Contract with Croatian firm.',
      'Apostilled PCC from India.',
      'Valid Passport.',
      'Health Insurance policy.',
    ],
    study_eligibility_criteria: [
      'Study Visa not offered for this destination — Work Visa & Employment Permits available.',
    ],
    success_rate: 95,
    avg_processing_days: 30,
    monthly_living_cost: 45000,
    is_active: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-poland',
    name: 'Poland',
    slug: 'poland',
    code: 'POL',
    flag_emoji: '🇵🇱',
    capital: 'Warsaw',
    region: 'Europe',
    language: 'Polish, English',
    description: 'Type D National Work Visa and Type A Voivodeship Work Permits for IT, Logistics & Manufacturing.',
    why_work: 'Major European IT outsourcing and manufacturing hub with EU PR pathways.',
    why_study: 'Work visa focused destination.',
    lifestyle: 'Vibrant academic atmosphere, rich history, low cost of living.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'Type A Work Permit (Zezwolenie na pracę) issued by Polish Voivode.',
      'Employment contract with Polish company.',
      'Apostilled PCC from RPO Surat.',
      'Proof of Accommodation in Poland.',
      'Valid Passport.',
    ],
    work_eligibility_criteria: [
      'Voivodeship (Wojewoda) Type A Work Permit.',
      '10th/12th/Diploma/Degree Certificate.',
      'Apostilled PCC from Passport Office.',
      'Proof of Accommodation in Poland.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'Study Visa not offered for this destination — Work Visa & Employment Permits available.',
    ],
    success_rate: 93,
    avg_processing_days: 35,
    monthly_living_cost: 50000,
    is_active: true,
    sort_order: 11,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-romania',
    name: 'Romania',
    slug: 'romania',
    code: 'ROU',
    flag_emoji: '🇷🇴',
    capital: 'Bucharest',
    region: 'Europe',
    language: 'Romanian, English',
    description: 'Work Permits for Construction, Manufacturing, Logistics, and Skilled Trades.',
    why_work: 'Full Schengen inclusion, booming job market, employer-sponsored housing.',
    why_study: 'Work visa focused destination.',
    lifestyle: 'Fast internet, natural scenery, low living expenses.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'IGI Romanian Work Authorization (Aviz de muncă).',
      'Technical ITI/Diploma or 10th/12th certificate.',
      'Apostilled PCC from RPO Surat.',
      'Medical Fitness clearance.',
      'Valid Passport.',
    ],
    work_eligibility_criteria: [
      'Romanian Inspectorate for Immigration (IGI) Work Permit.',
      'Trade Skill / Educational Certificate.',
      'Apostilled PCC.',
      'Medical Fitness clearance.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'Study Visa not offered for this destination — Work Visa & Employment Permits available.',
    ],
    success_rate: 96,
    avg_processing_days: 30,
    monthly_living_cost: 40000,
    is_active: true,
    sort_order: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-japan',
    name: 'Japan',
    slug: 'japan',
    code: 'JPN',
    flag_emoji: '🇯🇵',
    capital: 'Tokyo',
    region: 'Asia',
    language: 'Japanese',
    description: 'Specified Skilled Worker (SSW-1 & SSW-2) and Engineer/Specialist in Humanities visas.',
    why_work: '5-year renewable visa, high demand in Nursing, Caregiving, Food Service, Engineering.',
    why_study: 'Japanese language academies and technical university degrees.',
    lifestyle: 'Clean, safe, highly efficient public transit.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'JLPT N4 or NAT-TEST Level 4 certification.',
      'Prometric Skill Test pass certificate for SSW sector.',
      'Minimum 12th pass, Nursing Diploma or Engineering Degree.',
      'Passport with 18+ months validity.',
      'PCC from RPO Surat.',
    ],
    work_eligibility_criteria: [
      'JLPT N4 or NAT-TEST Level 4 pass certificate.',
      'Prometric Skill Assessment pass for SSW sector.',
      '12th Pass / Nursing / Engineering Qualification.',
      'Valid Passport.',
      'PCC from Regional Passport Office Surat.',
    ],
    study_eligibility_criteria: [
      'COE (Certificate of Eligibility) from Japanese Language School.',
      'JLPT N5 / NAT-TEST Level 5 basic certificate.',
      'Sponsor Bank Balance statement (₹15 Lakhs+).',
      'Sponsor 3 years Income Tax Returns.',
      'Valid Passport.',
    ],
    success_rate: 94.5,
    avg_processing_days: 45,
    monthly_living_cost: 75000,
    is_active: true,
    sort_order: 13,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-australia',
    name: 'Australia',
    slug: 'australia',
    code: 'AUS',
    flag_emoji: '🇦🇺',
    capital: 'Canberra',
    region: 'Oceania',
    language: 'English',
    description: 'TSS 482 Employer Sponsorship, Subclass 189/190 General Skilled Migration, Subclass 500 Study.',
    why_work: 'High minimum wages, clear PR points system.',
    why_study: 'Subclass 485 Post-Study Work Visa up to 4 years.',
    lifestyle: 'Pristine beaches, warm climate, high living standards.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Positive Skill Assessment (Engineers Australia, VETASSESS, ACS, TRA).',
      'IELTS General 6.0+ or PTE 50+.',
      '2+ Years relevant post-qualification work experience.',
      'Medical clearance and PCC.',
      'Passport with 18+ months validity.',
    ],
    work_eligibility_criteria: [
      'Skill Assessment outcome from assessing body.',
      'IELTS General 6.0+ or PTE Academic 50+ in each band.',
      '2+ Years relevant post-qualification employment experience.',
      'PCC and Medical clearance.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'CoE from CRICOS registered university.',
      'Genuine Student (GS) statement.',
      'IELTS Academic 6.5+ or PTE 58+.',
      'Financial Proof for tuition + 1 year living AUD 24,505.',
      'OSHC Health Insurance.',
    ],
    success_rate: 91.2,
    avg_processing_days: 60,
    monthly_living_cost: 95000,
    is_active: true,
    sort_order: 14,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-canada',
    name: 'Canada',
    slug: 'canada',
    code: 'CAN',
    flag_emoji: '🇨🇦',
    capital: 'Ottawa',
    region: 'Americas',
    language: 'English, French',
    description: 'Express Entry, LMIA Work Permits, Provincial Nominee Programs (PNP), and DLI Study permits.',
    why_work: 'High wages, direct PR pathways, family spousal work rights.',
    why_study: 'Post-Graduation Work Permit (PGWP) up to 3 years at DLI institution.',
    lifestyle: 'High quality of life, free healthcare, diverse cities.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'WES Educational Credential Assessment (ECA).',
      'LMIA-approved job offer OR Express Entry CLB 7+ score.',
      'IELTS General 6.0+ in each module.',
      '1+ Year continuous skilled work experience.',
      'Medical & PCC clearance.',
    ],
    work_eligibility_criteria: [
      'WES Educational Credential Assessment (ECA).',
      'Valid LMIA-approved Job Offer or PNP Nomination.',
      'IELTS General score CLB 7 (6.0 in each section).',
      '1+ Year continuous skilled work experience in TEER 0-3.',
      'Medical & PCC clearance.',
    ],
    study_eligibility_criteria: [
      'Acceptance Letter from Canadian DLI.',
      'PTE Academic 60+ or IELTS Academic 6.0+.',
      'GIC of CAD 20,635 deposited in Canadian bank.',
      'Full 1st Year Tuition Fee payment receipt.',
      'Provincial Attestation Letter (PAL).',
    ],
    success_rate: 92.8,
    avg_processing_days: 90,
    monthly_living_cost: 90000,
    is_active: true,
    sort_order: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'country-usa',
    name: 'United States',
    slug: 'united-states',
    code: 'USA',
    flag_emoji: '🇺🇸',
    capital: 'Washington, D.C.',
    region: 'Americas',
    language: 'English',
    description: 'H-1B Specialty Occupation, L-1 Intra-company transfer, and F-1 STEM OPT Study routes.',
    why_work: 'Top compensation globally for tech, healthcare, and engineering.',
    why_study: 'Ivy League & Tier-1 universities with 36-month STEM OPT work extension.',
    lifestyle: 'Dynamic economic opportunities, multicultural environment.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Approved H-1B Petition (Form I-797) OR Form I-20.',
      'Bachelor / Master degree in relevant field.',
      'IELTS 6.5+ / TOEFL 80+ / GRE as required.',
      'DS-160 approval and US Embassy Interview.',
      'Valid Passport.',
    ],
    work_eligibility_criteria: [
      'Approved Form I-797 (H-1B / L-1 petition approval notice).',
      'Bachelor or Master degree matching specialty occupation.',
      'LCA (Labor Condition Application) certified by US Dept of Labor.',
      'DS-160 Form submission and US Embassy interview pass.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: [
      'Official Form I-20 issued by SEVP-certified US University.',
      'SEVIS I-901 Fee payment receipt.',
      'TOEFL iBT 80+ / IELTS 6.5+ / Duolingo 115+.',
      'Financial Proof covering 1st Year Tuition + Living Expenses.',
      'DS-160 Form and US Consular Visa Interview pass.',
    ],
    success_rate: 87.4,
    avg_processing_days: 120,
    monthly_living_cost: 110000,
    is_active: true,
    sort_order: 16,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // --- REMAINING WORK-ONLY EUROPEAN DESTINATIONS ---
  ...([
    { id: 'country-belarus', name: 'Belarus', slug: 'belarus', code: 'BLR', flag_emoji: '🇧🇾', capital: 'Minsk', language: 'Belarusian, Russian', visa: 'Work Visa', work: ['Work Permit approval from Belarus Ministry of Internal Affairs.', 'Employment contract with registered Belarusian company.', 'Valid Passport with 18+ months validity.', 'PCC from RPO Surat with MEA Apostille.', 'Medical Fitness clearance.'], rate: 93, days: 25, cost: 35000 },
    { id: 'country-denmark', name: 'Denmark', slug: 'denmark', code: 'DNK', flag_emoji: '🇩🇰', capital: 'Copenhagen', language: 'Danish, English', visa: 'Positive List / Work Permit', work: ['Work Permit on Danish Positive List occupation OR employer offer.', 'Recognised Degree / Vocational qualification.', 'Annual salary meeting DKK threshold (DKK 375,000+ for Pay Limit Scheme).', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 90, days: 45, cost: 90000 },
    { id: 'country-finland', name: 'Finland', slug: 'finland', code: 'FIN', flag_emoji: '🇫🇮', capital: 'Helsinki', language: 'Finnish, English', visa: 'Residence Permit for Work', work: ['TE Office Labour Market test approval.', 'Employment contract with Finnish employer.', 'Degree / Vocational qualification.', 'PCC from RPO Surat.', 'Valid Passport and Health Insurance.'], rate: 91, days: 40, cost: 85000 },
    { id: 'country-hungary', name: 'Hungary', slug: 'hungary', code: 'HUN', flag_emoji: '🇭🇺', capital: 'Budapest', language: 'Hungarian, English', visa: 'Guest Worker / Work Permit', work: ['Guest Worker Permit from Hungarian Immigration Authority (OIF).', 'Employment contract.', '10th/12th/ITI or Diploma certificate.', 'Apostilled PCC from Passport Office.', 'Valid Passport.'], rate: 94, days: 30, cost: 40000 },
    { id: 'country-ireland', name: 'Ireland', slug: 'ireland', code: 'IRL', flag_emoji: '🇮🇪', capital: 'Dublin', language: 'English', visa: 'Critical Skills Employment Permit', work: ['CSEP issued by DETE Ireland (€38,000+ salary threshold).', 'Degree in IT, Biotech, Healthcare, or Finance.', 'IELTS 6.5+ or PTE 63+.', 'Medical Insurance.', 'PCC from RPO Surat.'], rate: 94, days: 25, cost: 88000 },
    { id: 'country-italy', name: 'Italy', slug: 'italy', code: 'ITA', flag_emoji: '🇮🇹', capital: 'Rome', language: 'Italian, English', visa: 'Work / Decreto Flussi routes', work: ['Nulla Osta (Work Authorization) issued via Decreto Flussi quota.', 'Employment contract registered at Sportello Unico.', 'Apostilled PCC from RPO Surat.', 'Valid Passport with 18+ months validity.', 'Medical Fitness clearance.'], rate: 92, days: 45, cost: 65000 },
    { id: 'country-malta', name: 'Malta', slug: 'malta', code: 'MLT', flag_emoji: '🇲🇹', capital: 'Valletta', language: 'Maltese, English', visa: 'Single Permit', work: ['Jobsplus Approval Letter from Maltese Employment Agency.', 'Identità Malta Single Permit Authorization.', 'Apostilled PCC from RPO Surat.', 'Health Insurance.', 'Valid Passport.'], rate: 94, days: 30, cost: 55000 },
    { id: 'country-moldova', name: 'Moldova', slug: 'moldova', code: 'MDA', flag_emoji: '🇲🇩', capital: 'Chișinău', language: 'Romanian, Russian', visa: 'Work Permit', work: ['Work Permit from Moldova Bureau for Migration and Asylum (BMA).', 'Employment contract with Moldovan company.', 'Apostilled PCC.', 'Valid Passport.', 'Medical Fitness certificate.'], rate: 95, days: 20, cost: 28000 },
    { id: 'country-netherlands', name: 'Netherlands', slug: 'netherlands', code: 'NLD', flag_emoji: '🇳🇱', capital: 'Amsterdam', language: 'Dutch, English', visa: 'Highly Skilled Migrant', work: ['IND Recognised Sponsor employer nomination.', 'Monthly salary meeting HSM threshold (€5,008/month for 30+).', 'Bachelor / Master degree.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 91, days: 30, cost: 90000 },
    { id: 'country-norway', name: 'Norway', slug: 'norway', code: 'NOR', flag_emoji: '🇳🇴', capital: 'Oslo', language: 'Norwegian, English', visa: 'Skilled Worker Residence', work: ['UDI Skilled Worker residence permit approval.', 'Job offer from Norwegian employer.', 'Relevant qualification / vocational training.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 89, days: 50, cost: 95000 },
    { id: 'country-portugal', name: 'Portugal', slug: 'portugal', code: 'PRT', flag_emoji: '🇵🇹', capital: 'Lisbon', language: 'Portuguese, English', visa: 'D1 / Work Visa', work: ['SEF / AIMA Work Visa (D1) Authorization.', 'Employment contract with Portuguese company.', 'Apostilled PCC from RPO Surat.', 'NIF (Tax Number) registration.', 'Valid Passport.'], rate: 92, days: 30, cost: 55000 },
    { id: 'country-slovakia', name: 'Slovakia', slug: 'slovakia', code: 'SVK', flag_emoji: '🇸🇰', capital: 'Bratislava', language: 'Slovak, English', visa: 'Temporary Residence for Employment', work: ['Temporary Residence Permit from Slovak Foreign Police.', 'Employment contract with Slovak employer.', 'Apostilled PCC.', 'Valid Passport.', 'Medical Insurance.'], rate: 94, days: 30, cost: 42000 },
    { id: 'country-sweden', name: 'Sweden', slug: 'sweden', code: 'SWE', flag_emoji: '🇸🇪', capital: 'Stockholm', language: 'Swedish, English', visa: 'Work Permit', work: ['Migrationsverket Work Permit approval.', 'Job offer meeting Swedish salary & insurance threshold.', 'Degree / Vocational certificate.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 90, days: 45, cost: 90000 },
    { id: 'country-switzerland', name: 'Switzerland', slug: 'switzerland', code: 'CHE', flag_emoji: '🇨🇭', capital: 'Bern', language: 'German, French, Italian', visa: 'Long-stay Work Permit', work: ['SEM Labour Market approval and Cantonal Work Permit (L/B permit).', 'Employment contract with Swiss employer.', 'Degree / relevant professional qualification.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 88, days: 60, cost: 120000 },
  ] as const).map((c, i) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    code: c.code,
    flag_emoji: c.flag_emoji,
    capital: c.capital,
    region: 'Europe',
    language: c.language,
    description: `${c.visa} pathways for skilled professionals, engineers, healthcare, and trade workers.`,
    why_work: `${c.name} work visa with ${c.visa} route. Employer-sponsored pathways with Schengen/EU access.`,
    why_study: 'Work visa focused destination.',
    lifestyle: `European quality of life in ${c.capital}.`,
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: c.work,
    work_eligibility_criteria: c.work,
    study_eligibility_criteria: ['Study Visa not offered for this destination — Work Visa & Employment Permits available.'],
    success_rate: c.rate,
    avg_processing_days: c.days,
    monthly_living_cost: c.cost,
    is_active: true,
    sort_order: 17 + i,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as AdminCountryItem)),

  // --- REMAINING WORK-ONLY ASIA / MIDDLE EAST ---
  ...([
    { id: 'country-azerbaijan', name: 'Azerbaijan', slug: 'azerbaijan', code: 'AZE', flag_emoji: '🇦🇿', capital: 'Baku', language: 'Azerbaijani, English', visa: 'Work Visa', work: ['State Migration Service (DMS) Work Permit approval.', 'Employment contract with Azerbaijani employer.', 'Apostilled PCC from RPO Surat.', 'Medical Fitness Certificate.', 'Valid Passport.'], rate: 93, days: 25, cost: 40000 },
    { id: 'country-israel', name: 'Israel', slug: 'israel', code: 'ISR', flag_emoji: '🇮🇱', capital: 'Jerusalem', language: 'Hebrew, English', visa: 'B/1 Work Visa', work: ['PIBA (Population and Immigration Border Authority) B/1 Visa permit.', 'Employer-sponsored Work Contract.', 'Relevant trade/technical certification.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 91, days: 30, cost: 60000 },
    { id: 'country-kazakhstan', name: 'Kazakhstan', slug: 'kazakhstan', code: 'KAZ', flag_emoji: '🇰🇿', capital: 'Astana', language: 'Kazakh, Russian', visa: 'Work Visa', work: ['Ministry of Labour Work Permit or Labour Quota allocation.', 'Employment contract with registered Kazakh company.', 'Apostilled PCC.', 'Medical Certificate.', 'Valid Passport.'], rate: 93, days: 25, cost: 35000 },
    { id: 'country-malaysia', name: 'Malaysia', slug: 'malaysia', code: 'MYS', flag_emoji: '🇲🇾', capital: 'Kuala Lumpur', language: 'Malay, English', visa: 'Employment Pass', work: ['ESD Online Employment Pass approval from Immigration Dept.', 'Employment contract meeting minimum salary (RM 5,000+).', 'Degree or relevant qualification.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 92, days: 20, cost: 40000 },
    { id: 'country-maldives', name: 'Maldives', slug: 'maldives', code: 'MDV', flag_emoji: '🇲🇻', capital: 'Malé', language: 'Dhivehi, English', visa: 'Employment Approval', work: ['Employment Approval from Maldives Ministry of Economic Development.', 'Employer Work Visa sponsorship.', 'Trade or hospitality certification.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 95, days: 15, cost: 30000 },
    { id: 'country-qatar', name: 'Qatar', slug: 'qatar', code: 'QAT', flag_emoji: '🇶🇦', capital: 'Doha', language: 'Arabic, English', visa: 'Work Residence Permit', work: ['Ministry of Interior Work Visa Approval.', 'Degree attested by MOFA Qatar & Qatar Embassy Delhi.', 'GAMCA Medical Fitness clearance.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 97, days: 15, cost: 55000 },
    { id: 'country-russia', name: 'Russia', slug: 'russia', code: 'RUS', flag_emoji: '🇷🇺', capital: 'Moscow', language: 'Russian, English', visa: 'Work / HQS Visa', work: ['Work Invitation from Russian Migration Ministry (GUVM).', 'Relevant ITI / Diploma / Engineering degree.', 'HIV Negative & Medical Fitness Certificate.', 'Apostilled PCC.', 'Valid Passport with 18+ months validity.'], rate: 85, days: 40, cost: 45000 },
    { id: 'country-saudi-arabia', name: 'Saudi Arabia', slug: 'saudi-arabia', code: 'SAU', flag_emoji: '🇸🇦', capital: 'Riyadh', language: 'Arabic, English', visa: 'Iqama Work Permit', work: ['Saudi Visa Enjaz Authorization Number.', 'GAMCA Medical Fitness Clearance.', 'Degree / ITI attested by Saudi Cultural & Embassy Delhi.', 'PCC from RPO Surat.', 'Valid Passport.'], rate: 96, days: 15, cost: 50000 },
  ] as const).map((c, i) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    code: c.code,
    flag_emoji: c.flag_emoji,
    capital: c.capital,
    region: ['Qatar', 'Saudi Arabia'].includes(c.name) ? 'Middle East' : 'Asia',
    language: c.language,
    description: `${c.visa} pathways for skilled professionals and trade workers.`,
    why_work: `${c.name} employer-sponsored ${c.visa} for eligible Indian candidates.`,
    why_study: 'Work visa focused destination.',
    lifestyle: `Working opportunities in ${c.capital}.`,
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: c.work,
    work_eligibility_criteria: c.work,
    study_eligibility_criteria: ['Study Visa not offered for this destination — Work Visa & Employment Permits available.'],
    success_rate: c.rate,
    avg_processing_days: c.days,
    monthly_living_cost: c.cost,
    is_active: true,
    sort_order: 31 + i,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as AdminCountryItem)),

  // --- NEW ZEALAND (Oceania Work + Study) ---
  {
    id: 'country-new-zealand',
    name: 'New Zealand',
    slug: 'new-zealand',
    code: 'NZL',
    flag_emoji: '🇳🇿',
    capital: 'Wellington',
    region: 'Oceania',
    language: 'English',
    description: 'Accredited Employer Work Visa (AEWV), Green List Direct to Residence, and Study Visas.',
    why_work: 'Fast-track Direct to Residence for Green List roles (Engineering, Healthcare, Trades).',
    why_study: '3-Year Post-Study Work Visa for Master graduates.',
    lifestyle: 'Stunning natural scenery, high safety, friendly communities.',
    has_work_visa: true,
    has_study_visa: true,
    eligibility_criteria: [
      'Job offer from NZ Accredited Employer at median wage ($31.61/hr+).',
      'IQA qualification assessment from NZQA.',
      'IELTS General 6.5+ for skilled residence.',
      'Medical Examination & Chest X-Ray clearance.',
      'PCC from RPO Surat.',
    ],
    work_eligibility_criteria: [
      'AEWV job offer at median wage ($31.61/hr+) from Accredited Employer.',
      'International Qualification Assessment (IQA) from NZQA.',
      'IELTS General 6.5+ for Green List residence.',
      'Medical & Chest X-Ray clearance.',
      'PCC from India.',
    ],
    study_eligibility_criteria: [
      'Offer of Place from NZQA accredited university/polytechnic.',
      'IELTS Academic 6.5+ (no band below 6.0).',
      'Proof of Funds: NZD 20,000/year living expenses + tuition fee.',
      'Medical & Chest X-Ray clearance.',
      'PCC from India.',
    ],
    success_rate: 88.7,
    avg_processing_days: 75,
    monthly_living_cost: 80000,
    is_active: true,
    sort_order: 39,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdminCountryItem,

  // --- REGIONAL COVERAGE ---
  {
    id: 'country-africa-regional',
    name: 'Africa (Regional)',
    slug: 'africa',
    code: 'AFR',
    flag_emoji: '🌍',
    capital: '',
    region: 'Africa',
    language: 'Various',
    description: 'Country-specific work permits for selected African employment destinations.',
    why_work: 'Employer-driven roles in Mining, Infrastructure, Agriculture, and Energy sectors.',
    why_study: 'Work visa focused destination.',
    lifestyle: 'Diverse continent with growing economic opportunities.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'Country-specific Work Permit from destination government.',
      'Employment contract from African-based employer.',
      'Relevant trade or professional qualification.',
      'PCC from RPO Surat with MEA Apostille.',
      'Valid Passport and Medical Clearance.',
    ],
    work_eligibility_criteria: [
      'Country-specific Work Permit from destination government.',
      'Employment contract from African-based employer.',
      'Relevant trade or professional qualification.',
      'PCC from RPO Surat with MEA Apostille.',
      'Valid Passport and Medical Clearance.',
    ],
    study_eligibility_criteria: ['Study Visa not offered for this destination — Work Visa & Employment Permits available.'],
    success_rate: 90,
    avg_processing_days: 40,
    monthly_living_cost: 30000,
    is_active: true,
    sort_order: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdminCountryItem,
  {
    id: 'country-gulf-regional',
    name: 'Gulf Region',
    slug: 'gulf',
    code: 'GCC',
    flag_emoji: '🏜️',
    capital: '',
    region: 'Middle East',
    language: 'Arabic, English',
    description: 'Employment / Residence work visas across GCC-oriented employer pathways.',
    why_work: 'Tax-free salaries, employer-provided accommodation, high demand for skilled labour.',
    why_study: 'Work visa focused destination.',
    lifestyle: 'Modern infrastructure, strong Indian community, close to India.',
    has_work_visa: true,
    has_study_visa: false,
    eligibility_criteria: [
      'GCC Employer-sponsored Work Visa Approval.',
      'GAMCA / Equivalent Medical Fitness clearance.',
      'Degree / ITI attested by respective Embassy.',
      'PCC from RPO Surat.',
      'Valid Passport.',
    ],
    work_eligibility_criteria: [
      'GCC Employer-sponsored Work Visa Approval.',
      'GAMCA / Equivalent Medical Fitness clearance.',
      'Degree / ITI attested by respective Embassy.',
      'PCC from RPO Surat.',
      'Valid Passport.',
    ],
    study_eligibility_criteria: ['Study Visa not offered for this destination — Work Visa & Employment Permits available.'],
    success_rate: 95,
    avg_processing_days: 20,
    monthly_living_cost: 45000,
    is_active: true,
    sort_order: 41,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdminCountryItem,
]

const LEGACY_CACHE_KEY = 'svo_admin_countries_v5'
// Must not collide with other `['admin-countries']` queries (the applications pages cache
// only { id, name } there), or this hook would read rows without code/slug and crash.
const QUERY_KEY = 'admin-country-catalog'

type CountryRow = {
  id: string
  code: string
  name: string
  slug: string
  capital: string | null
  region: string | null
  subregion: string | null
  latitude: number | string | null
  longitude: number | string | null
  currency: string | null
  currency_code: string | null
  language: string | null
  flag_emoji: string | null
  description: string | null
  why_study: string | null
  why_work: string | null
  lifestyle: string | null
  cost_of_living: unknown
  climate: unknown
  images: unknown
  visa_stats: unknown
  is_active: boolean
  sort_order: number | null
  meta_title: string | null
  meta_desc: string | null
  created_at: string
  updated_at: string
}

type Json = Record<string, unknown>

const asObject = (value: unknown): Json =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : {}

const asStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => (typeof entry === 'string' ? entry : asObject(entry).url))
        .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []

const asNumber = (value: unknown): number | null => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

export const countryKey = (value: string) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const bySortOrder = (a: AdminCountryItem, b: AdminCountryItem) =>
  a.sort_order - b.sort_order || a.name.localeCompare(b.name)

function fromRow(row: CountryRow): AdminCountryItem {
  const stats = asObject(row.visa_stats)
  const cost = asObject(row.cost_of_living)
  const climate = asObject(row.climate)
  const general = asStrings(stats.eligibility)
  const work = asStrings(stats.work_eligibility)
  const study = asStrings(stats.study_eligibility)

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    code: row.code ?? '',
    flag_emoji: row.flag_emoji ?? '',
    capital: row.capital ?? '',
    region: row.region ?? '',
    subregion: row.subregion ?? '',
    language: row.language ?? '',
    currency: row.currency ?? '',
    currency_code: row.currency_code ?? '',
    latitude: asNumber(row.latitude),
    longitude: asNumber(row.longitude),
    description: row.description ?? '',
    why_work: row.why_work ?? '',
    why_study: row.why_study ?? '',
    lifestyle: row.lifestyle ?? '',
    climate_summary: typeof climate.summary === 'string' ? climate.summary : '',
    has_work_visa: typeof stats.has_work_visa === 'boolean' ? stats.has_work_visa : work.length > 0 || general.length > 0,
    has_study_visa: typeof stats.has_study_visa === 'boolean' ? stats.has_study_visa : study.length > 0,
    eligibility_criteria: general.length ? general : work.length ? work : study,
    work_eligibility_criteria: work.length ? work : general,
    study_eligibility_criteria: study.length ? study : general,
    success_rate: asNumber(stats.success_rate) ?? 0,
    avg_processing_days: asNumber(stats.avg_processing_days) ?? 0,
    monthly_living_cost: asNumber(cost.monthly_single) ?? 0,
    monthly_family_cost: asNumber(cost.monthly_family),
    images: asStrings(row.images),
    meta_title: row.meta_title ?? '',
    meta_desc: row.meta_desc ?? '',
    is_active: row.is_active,
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: 'database',
    raw: { visa_stats: row.visa_stats, cost_of_living: row.cost_of_living, climate: row.climate },
  }
}

function fromStarter(starter: StarterCountry): AdminCountryItem {
  return {
    ...starter,
    subregion: '',
    currency: '',
    currency_code: '',
    latitude: null,
    longitude: null,
    climate_summary: '',
    monthly_family_cost: null,
    images: [],
    meta_title: '',
    meta_desc: '',
    source: 'starter',
  }
}

export const STARTER_COUNTRIES: AdminCountryItem[] = STARTER_ROWS.map(fromStarter)

const flagFromAlpha2 = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Every ISO 3166 country, so admins can add any destination, not just the bundled ones. */
export const WORLD_COUNTRIES: AdminCountryItem[] = (() => {
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {
    return []
  }
  const now = new Date().toISOString()
  return ISO_COUNTRY_CODES.filter((code) => /^[A-Z]{2}$/.test(code))
    .map((code) => ({ code, name: names?.of(code) ?? '' }))
    .filter(({ code, name }) => name && name !== code && !/unknown/i.test(name))
    .map(({ code, name }) => ({
      ...fromStarter({
        id: `world-${code.toLowerCase()}`,
        name,
        slug: toSlug(name),
        code,
        flag_emoji: flagFromAlpha2(code),
        capital: '',
        region: '',
        language: '',
        description: '',
        why_work: '',
        why_study: '',
        lifestyle: '',
        has_work_visa: false,
        has_study_visa: false,
        eligibility_criteria: [],
        work_eligibility_criteria: [],
        study_eligibility_criteria: [],
        success_rate: 0,
        avg_processing_days: 0,
        monthly_living_cost: 0,
        is_active: false,
        sort_order: 1000,
        created_at: now,
        updated_at: now,
      }),
      source: 'world' as const,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})()

export function countryToInput(item: AdminCountryItem, overrides: Partial<CountryInput> = {}): CountryInput {
  const { id: _id, created_at: _created, updated_at: _updated, source: _source, raw: _raw, ...rest } = item
  return { ...rest, ...overrides }
}

const blankToNull = (value: string) => (value.trim() === '' ? null : value.trim())

function toPayload(input: CountryInput, raw?: AdminCountryItem['raw']) {
  const work = input.work_eligibility_criteria.map((rule) => rule.trim()).filter(Boolean)
  const study = input.study_eligibility_criteria.map((rule) => rule.trim()).filter(Boolean)

  const climate: Json = { ...asObject(raw?.climate) }
  if (input.climate_summary.trim()) climate.summary = input.climate_summary.trim()
  else delete climate.summary

  const cost: Json = { ...asObject(raw?.cost_of_living), monthly_single: input.monthly_living_cost }
  if (input.monthly_family_cost === null) delete cost.monthly_family
  else cost.monthly_family = input.monthly_family_cost

  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    code: input.code.trim().toUpperCase(),
    flag_emoji: input.flag_emoji.trim() || '🌍',
    capital: blankToNull(input.capital),
    region: blankToNull(input.region),
    subregion: blankToNull(input.subregion),
    language: blankToNull(input.language),
    currency: blankToNull(input.currency),
    currency_code: blankToNull(input.currency_code.toUpperCase()),
    latitude: input.latitude,
    longitude: input.longitude,
    description: blankToNull(input.description),
    why_work: blankToNull(input.why_work),
    why_study: blankToNull(input.why_study),
    lifestyle: blankToNull(input.lifestyle),
    meta_title: blankToNull(input.meta_title),
    meta_desc: blankToNull(input.meta_desc),
    is_active: input.is_active,
    sort_order: input.sort_order,
    images: input.images.map((url) => url.trim()).filter(Boolean),
    climate,
    cost_of_living: cost,
    visa_stats: {
      ...asObject(raw?.visa_stats),
      success_rate: input.success_rate,
      avg_processing_days: input.avg_processing_days,
      has_work_visa: input.has_work_visa,
      has_study_visa: input.has_study_visa,
      eligibility: work.length ? work : study,
      work_eligibility: work,
      study_eligibility: study,
    },
  }
}

export class CountrySaveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CountrySaveError'
  }
}

function friendlyDbError(error: { code?: string }) {
  switch (error.code) {
    case '42501':
      return "You don't have permission to change countries."
    case '23505':
      return 'Another country already uses this URL slug or ISO code.'
    case '23514':
      return 'Some values are out of range. Latitude and longitude must both be set or both be empty.'
    case '23503':
      return 'This country is linked to applications or visa programmes. Hide it instead of deleting it.'
    case '22001':
      return 'One of the values is longer than the database allows.'
    case '23502':
      return 'A required field is missing.'
    default:
      return 'We could not save this country. Please try again.'
  }
}

/**
 * Countries are read straight from the `countries` table and kept fresh through realtime,
 * window-focus refetches and cache invalidation, so every page that uses this hook shows
 * the latest saved data. Bundled starter data is shown only if the table is empty or unreachable.
 */
export function useAdminCountries() {
  const queryClient = useQueryClient()
  const channelId = useId()
  const queryKey = useMemo(() => [QUERY_KEY], [])

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_CACHE_KEY)
    } catch {
      // storage unavailable
    }
  }, [])

  const query = useQuery<AdminCountryItem[], Error>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return ((data ?? []) as CountryRow[]).map(fromRow)
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  })

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    void queryClient.invalidateQueries({ queryKey: ['countries'] })
    void queryClient.invalidateQueries({ queryKey: ['country'] })
  }, [queryClient])

  useEffect(
    () =>
      subscribePostgresChanges(
        supabase,
        `countries-sync-${channelId}`,
        { event: '*', schema: 'public', table: 'countries' },
        invalidateAll,
      ),
    [channelId, invalidateAll],
  )

  // Staff see hidden rows through RLS, so refetch when the signed-in user changes.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') window.setTimeout(invalidateAll, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [invalidateAll])

  const dbCountries = useMemo(() => query.data ?? [], [query.data])
  const isFallback = query.isError || (query.isSuccess && dbCountries.length === 0)
  const { countries, starterCountries } = useMemo(() => {
    const saved = isFallback ? [] : dbCountries
    // Rows can have missing fields (older data), so skip blank keys instead of crashing
    // or treating every blank value as the same country.
    const keysOf = (c: AdminCountryItem) =>
      [countryKey(c.slug ?? ''), countryKey(c.name ?? ''), (c.code ?? '').trim().toUpperCase()].filter(Boolean)
    const known = new Set(saved.flatMap(keysOf))
    const isNew = (c: AdminCountryItem) => {
      const keys = keysOf(c)
      if (keys.some((k) => known.has(k))) return false
      keys.forEach((k) => known.add(k))
      return true
    }
    const starters = STARTER_COUNTRIES.filter(isNew)
    const world = WORLD_COUNTRIES.filter(isNew)
    return { countries: [...saved, ...starters, ...world], starterCountries: starters }
  }, [dbCountries, isFallback])

  const saveMutation = useMutation({
    mutationFn: async ({ input, existing }: { input: CountryInput; existing?: AdminCountryItem | null }) => {
      const payload = toPayload(input, existing?.raw)
      const { data, error } =
        existing?.source === 'database'
          ? await supabase.from('countries').update(payload).eq('id', existing.id).select('*').maybeSingle()
          : await supabase.from('countries').insert(payload).select('*').maybeSingle()
      if (error) throw new CountrySaveError(friendlyDbError(error))
      if (!data) throw new CountrySaveError("The change wasn't saved. Your account may not have permission to edit countries.")
      return fromRow(data as CountryRow)
    },
    onSuccess: (item) => {
      queryClient.setQueryData<AdminCountryItem[]>(queryKey, (prev = []) => {
        const exists = prev.some((c) => c.id === item.id)
        return (exists ? prev.map((c) => (c.id === item.id ? item : c)) : [...prev, item]).sort(bySortOrder)
      })
      invalidateAll()
    },
  })

  const { mutateAsync: saveAsync } = saveMutation

  const saveCountry = useCallback(
    (input: CountryInput, existing?: AdminCountryItem | null) => saveAsync({ input, existing }),
    [saveAsync],
  )

  const toggleCountryActive = useCallback(
    async (item: AdminCountryItem) => {
      const previous = queryClient.getQueryData<AdminCountryItem[]>(queryKey)
      if (item.source === 'database') {
        queryClient.setQueryData<AdminCountryItem[]>(queryKey, (prev = []) =>
          prev.map((c) => (c.id === item.id ? { ...c, is_active: !c.is_active } : c)),
        )
      }
      try {
        return await saveAsync({ input: countryToInput(item, { is_active: !item.is_active }), existing: item })
      } catch (err) {
        if (previous) queryClient.setQueryData(queryKey, previous)
        throw err
      }
    },
    [queryClient, queryKey, saveAsync],
  )

  const deleteMutation = useMutation({
    mutationFn: async (item: AdminCountryItem) => {
      if (item.source !== 'database') {
        throw new CountrySaveError('This starter country is not stored in the database, so there is nothing to delete.')
      }
      const { data, error } = await supabase.from('countries').delete().eq('id', item.id).select('id')
      if (error) throw new CountrySaveError(friendlyDbError(error))
      if (!data?.length) {
        throw new CountrySaveError(
          'Your database rules do not allow deleting countries yet. Hide the country instead, or apply the countries admin migration.',
        )
      }
      return item.id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AdminCountryItem[]>(queryKey, (prev = []) => prev.filter((c) => c.id !== id))
      invalidateAll()
    },
  })

  const importMutation = useMutation({
    mutationFn: async (items: AdminCountryItem[]) => {
      if (!items.length) return 0
      const rows = items.map((item) => toPayload(countryToInput(item)))
      const { data, error } = await supabase
        .from('countries')
        .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
        .select('id')
      if (error) throw new CountrySaveError(friendlyDbError(error))
      return data?.length ?? 0
    },
    onSuccess: invalidateAll,
  })

  return {
    countries,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isFallback,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
    starterCountries,
    saveCountry,
    isSaving: saveMutation.isPending,
    deleteCountry: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    toggleCountryActive,
    importStarterCountries: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
  }
}
