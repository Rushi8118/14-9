-- ============================================================
-- URGENT: RUN THIS IMMEDIATELY TO FIX EVERYTHING
-- ============================================================
-- This will:
-- 1. Create urgent_requirements table
-- 2. Enable RLS with proper policies
-- 3. Add all 10 fallback requirements to database
-- 4. Make hide/show work properly
-- ============================================================

-- STEP 1: Create the table
CREATE TABLE IF NOT EXISTS urgent_requirements (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    country         TEXT NOT NULL,
    country_code    TEXT NOT NULL DEFAULT 'XX',
    category        TEXT NOT NULL,
    vacancies       INTEGER NOT NULL DEFAULT 1,
    salary          TEXT NOT NULL,
    experience_required TEXT,
    image_url       TEXT,
    summary         TEXT,
    content         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_status ON urgent_requirements(status);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_country ON urgent_requirements(country);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_expires_at ON urgent_requirements(expires_at);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_slug ON urgent_requirements(slug);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_created_at ON urgent_requirements(created_at DESC);

-- STEP 3: Enable RLS
ALTER TABLE urgent_requirements ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop old policies if they exist
DROP POLICY IF EXISTS "Public can view active urgent requirements" ON urgent_requirements;
DROP POLICY IF EXISTS "Authenticated users can manage urgent requirements" ON urgent_requirements;

-- STEP 5: Create RLS policies
-- Policy 1: Public users see only active, non-expired items
CREATE POLICY "Public can view active urgent requirements"
ON urgent_requirements
FOR SELECT
TO anon, authenticated
USING (
    status = 'active' 
    AND (expires_at IS NULL OR expires_at > NOW())
);

-- Policy 2: Authenticated users have full access
CREATE POLICY "Authenticated users can manage urgent requirements"
ON urgent_requirements
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- STEP 6: Create update trigger
CREATE OR REPLACE FUNCTION update_urgent_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_urgent_requirements_updated_at ON urgent_requirements;

CREATE TRIGGER trigger_urgent_requirements_updated_at
BEFORE UPDATE ON urgent_requirements
FOR EACH ROW
EXECUTE FUNCTION update_urgent_requirements_updated_at();

-- STEP 7: Grant permissions
GRANT SELECT ON urgent_requirements TO anon;
GRANT ALL ON urgent_requirements TO authenticated;
GRANT ALL ON urgent_requirements TO service_role;

-- ============================================================
-- STEP 8 (DISABLED 2026-10-09 — do not re-enable without reading this)
-- ============================================================
-- The inserts below are the ten placeholder openings that used to live in
-- src/hooks/useUrgentRequirements.ts as FALLBACK_URGENT_REQUIREMENTS. They are
-- NOT real vacancies: the employers, salaries ("EUR 42,000 - 65,000 / year"),
-- vacancy counts and processing times are invented, and every row carries
-- status = 'active'.
--
-- Nine of the ten slugs match no real opening. While the application still
-- fell back to them, /urgent-requirements/ireland-it-critical-skills-urgent
-- was crawled and indexed by Google ("Submitted and indexed", URL Inspection,
-- 2026-10-09) as a genuine job advert. The application-side cause has been
-- removed. Running these inserts would put the same fabricated vacancies into
-- the database, where the next build would add them to sitemap-content.xml and
-- submit them for indexing deliberately.
--
-- STEPS 1-7 above (table, indexes, RLS, trigger, grants) are idempotent and
-- are already applied in production; they are safe to re-run. STEP 8 is not.
--
-- If a listing below describes a real opening, add it through the admin panel
-- with its true figures instead of re-enabling this block.
-- ============================================================

-- -- STEP 8: Insert all 10 default urgent requirements
-- -- This populates the database with initial data
--
-- -- 1. Japan SSW Caregivers
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-japan-ssw-2026',
--     'Urgent: 25 Specified Skilled Workers (SSW Caregivers) for Japan',
--     'japan-ssw-caregiver-urgent',
--     'Japan',
--     'JP',
--     'Specified Skilled Worker (SSW-1)',
--     25,
--     '¥220,000 - ¥280,000 / month (~₹1.25L - ₹1.6L)',
--     'JLPT N4 / NAT-TEST & Caregiving Skill Test',
--     'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
--     'Direct hospital placement in Tokyo and Osaka with fast-track visa sponsorship, subsidized accommodation, and JLPT training support.',
--     '### Urgent Placement Mandate for Japan SSW Caregivers
-- Siddhivinayak Overseas Surat has received an official priority mandate to recruit **25 Qualified Caregivers** for leading healthcare groups in Tokyo and Osaka.
--
-- #### Key Benefits:
-- - **Direct Employer Sponsorship:** 5-year renewable SSW-1 visa.
-- - **Flight & Housing:** Flight ticket allowance & subsidized accommodation.
-- - **High Salary:** Up to ¥280,000/month with overtime opportunities.
-- - **Fast-Track Processing:** COE (Certificate of Eligibility) issued within 45-60 days.
--
-- #### Requirements:
-- 1. JLPT N4 or NAT-TEST Level 4 certification (or currently enrolled).
-- 2. Nursing / GNM diploma OR Nursing Assistant training certificate.
-- 3. Valid Indian Passport with minimum 18 months validity.',
--     'active',
--     NOW() + INTERVAL '30 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 2. UK NHS Healthcare
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-uk-nhs-2026',
--     'Urgent: 15 Health & Care Staff for UK NHS Trust Hospitals',
--     'uk-nhs-healthcare-assistant-urgent',
--     'United Kingdom',
--     'GB',
--     'Health & Care Worker Visa',
--     15,
--     '£23,400 - £28,000 / year (~₹24L - ₹29L)',
--     '1+ Year Healthcare / Nursing experience & IELTS 5.0+',
--     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
--     'NHS-approved healthcare assistant positions with COS (Certificate of Sponsorship) and fast 3-week UK visa processing.',
--     '### Immediate Openings for UK NHS Healthcare Support Workers
-- Recruiting 15 dedicated Health & Care workers for NHS Trust Partner Hospitals across London, Manchester, and Birmingham.
--
-- #### Offer Details:
-- - **COS Provided:** Tier 2 / Health & Care Worker Sponsorship (3-Year renewable).
-- - **Relocation Package:** First month free accommodation + NHS relocation grant.
-- - **Family Visa:** Spousal work permit & free NHS healthcare coverage for dependents.
--
-- #### Eligibility Criteria:
-- 1. GNM Nursing / B.Sc Nursing / ANM diploma with minimum 1 year clinical experience.
-- 2. UKVI IELTS General score 5.0+ or PTE Academic UKVI 43+.
-- 3. Clean Police Clearance Certificate from RPO Gujarat.',
--     'active',
--     NOW() + INTERVAL '20 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 3. Germany Chancenkarte
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-germany-chancenkarte-2026',
--     'Urgent: 30 Opportunity Card IT & Engineering Candidates for Germany',
--     'germany-chancenkarte-it-engineers-urgent',
--     'Germany',
--     'DE',
--     'Opportunity Card (Chancenkarte)',
--     30,
--     '€45,000 - €65,000 / year (~₹40L - ₹58L)',
--     'Degree in Engineering / CS & German A2 or English B2',
--     'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
--     'Fast-track Chancenkarte visa processing for software developers, CNC machinists, electrical engineers, and mechanical technicians.',
--     '### Germany Opportunity Card (Chancenkarte) Priority Pool
-- Siddhivinayak Overseas is facilitating direct Opportunity Card applications for qualified Indian engineers and tech professionals looking to work in Munich, Stuttgart, and Berlin.
--
-- #### Key Advantages:
-- - **No Prior Job Offer Required:** Move to Germany on a 1-year job seeker visa with work rights.
-- - **Part-Time Work Allowed:** Earn up to 20 hours/week while interviewing.
-- - **Fast-Track PR:** Convert to EU Blue Card after securing employment.
--
-- #### Qualification Points:
-- 1. Recognized Engineering or IT Degree (Anabin H+ listed).
-- 2. German language A2 certificate OR English B2 score.
-- 3. 2+ years of relevant industry experience.',
--     'active',
--     NOW() + INTERVAL '25 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 4. Croatia Construction
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-croatia-construction-2026',
--     'Urgent: 20 Construction & MEP Supervisors for Croatia (Schengen)',
--     'croatia-mep-construction-supervisors-urgent',
--     'Croatia',
--     'HR',
--     'Work & Residence Permit (Schengen)',
--     20,
--     '€1,200 - €1,600 / month (~₹1.1L - ₹1.45L)',
--     'ITI / Diploma & 3+ Years Site Experience',
--     'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&auto=format&fit=crop&q=80',
--     'Schengen work permit mandate for commercial construction projects in Zagreb and Split with free food and accommodation provided.',
--     '### Croatia Schengen Work Permit Placement Drive
-- Urgent opening for 20 Construction Foremen, MEP Technicians, Electricians, and Welders for major infrastructure projects in Croatia.
--
-- #### Package Details:
-- - **Free Accommodation & Food:** Provided by employer.
-- - **Schengen Visa:** Full travel rights across 29 Schengen member states.
-- - **Contract Duration:** 1-Year renewable work permit.
--
-- #### Candidate Requirements:
-- 1. ITI / Vocational Diploma in Civil, Electrical, or Mechanical.
-- 2. Minimum 3 years site experience in India or Gulf.
-- 3. Clean Police Clearance Certificate with MEA Apostille.',
--     'active',
--     NOW() + INTERVAL '15 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 5. Poland Manufacturing
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-poland-manufacturing-2026',
--     'Urgent: 40 Manufacturing Workers for Poland (Automotive & Electronics)',
--     'poland-manufacturing-workers-urgent',
--     'Poland',
--     'PL',
--     'Type A Work Permit',
--     40,
--     '4,500 - 6,000 PLN / month (~₹95K - ₹1.3L)',
--     'ITI / 12th Pass & Manufacturing Experience',
--     'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&auto=format&fit=crop&q=80',
--     'Direct recruitment for automotive assembly line workers and electronics manufacturing technicians with company-provided accommodation.',
--     '### Poland Manufacturing Sector Urgent Hiring
-- Major automotive and electronics manufacturers in Warsaw and Wrocław are recruiting 40 production workers immediately.
--
-- #### Key Benefits:
-- - **Work Permit Provided:** Type A Zezwolenie na pracę with 2-year validity.
-- - **Accommodation:** Company dormitory or housing allowance.
-- - **EU Access:** Schengen visa for 29 European countries.
-- - **Overtime Pay:** Time-and-a-half for extra hours.
--
-- #### Requirements:
-- 1. 12th pass or ITI certificate.
-- 2. 1+ year experience in manufacturing/assembly.
-- 3. Basic English communication.
-- 4. Apostilled PCC from RPO.',
--     'active',
--     NOW() + INTERVAL '18 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 6. Dubai Hospitality
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-dubai-hospitality-2026',
--     'Urgent: 35 Restaurant & Hospitality Staff for Dubai UAE',
--     'dubai-hospitality-restaurant-staff-urgent',
--     'United Arab Emirates',
--     'AE',
--     'Employment Visa',
--     35,
--     'AED 2,500 - 4,500 / month (~₹58K - ₹1L)',
--     'Hotel/Restaurant Experience & Basic English',
--     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
--     '5-star hotel and premium restaurant chain hiring chefs, waiters, housekeeping staff with visa and accommodation provided.',
--     '### Dubai Premium Hospitality Urgent Recruitment
-- Leading 5-star hotel groups and restaurant chains in Dubai are urgently recruiting hospitality professionals.
--
-- #### Positions Available:
-- - Commis Chef / Chef de Partie (10 positions)
-- - Waiters / Stewards (15 positions)
-- - Housekeeping Staff (10 positions)
--
-- #### Package:
-- - **Visa Sponsored:** 2-year employment visa.
-- - **Accommodation:** Shared company housing.
-- - **Free Food:** Staff meals during duty hours.
-- - **Medical Insurance:** Covered by employer.
-- - **Service Charge:** Monthly tips distributed to staff.
--
-- #### Requirements:
-- 1. 2+ years experience in hospitality sector.
-- 2. Basic English communication skills.
-- 3. Attested certificates from UAE Embassy.
-- 4. Medical fitness certificate.',
--     'active',
--     NOW() + INTERVAL '22 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 7. Canada Agriculture
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-canada-agriculture-2026',
--     'Urgent: 12 Agriculture Workers for Canada LMIA Jobs',
--     'canada-agriculture-lmia-workers-urgent',
--     'Canada',
--     'CA',
--     'LMIA Work Permit',
--     12,
--     'CAD 16 - 19 / hour (~₹1L - ₹1.25L per month)',
--     'Farm/Agriculture Experience (Training Provided)',
--     'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80',
--     'LMIA-approved farm positions in Ontario and British Columbia with direct PR pathway after 1 year of work.',
--     '### Canada Agriculture LMIA Work Permit Program
-- Approved LMIA positions for greenhouse workers, farm laborers, and livestock handlers with clear pathway to Permanent Residence.
--
-- #### Why This Program:
-- - **PR Pathway:** Qualify for Express Entry after 1 year.
-- - **LMIA Approved:** No need to search for employer.
-- - **Family Sponsorship:** Bring spouse and children.
-- - **Free Healthcare:** Canadian health insurance coverage.',
--     'active',
--     NOW() + INTERVAL '28 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 8. Ireland IT
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-ireland-it-2026',
--     'Urgent: 18 IT Professionals for Ireland Critical Skills Permit',
--     'ireland-it-critical-skills-urgent',
--     'Ireland',
--     'IE',
--     'Critical Skills Employment Permit',
--     18,
--     '€42,000 - €65,000 / year (~₹38L - ₹58L)',
--     'IT Degree + 2 Years Experience in Software/Cloud',
--     'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
--     'Critical Skills Permit for software developers, cloud engineers, and data analysts with fast 2-year PR pathway.',
--     '### Ireland Critical Skills Tech Jobs - Direct PR Route
-- Dublin-based tech companies are hiring Indian IT professionals for Critical Skills Employment Permit with accelerated PR pathway.
--
-- #### Benefits:
-- - **Fast PR:** Eligible for Stamp 4 after just 2 years.
-- - **Family Rights:** Spouse can work immediately.
-- - **EU Access:** Irish passport = EU citizenship.
-- - **High Salaries:** €42K - €65K starting range.',
--     'active',
--     NOW() + INTERVAL '35 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 9. Romania Welders
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-romania-welders-2026',
--     'Urgent: 25 Welders & Pipefitters for Romania Oil & Gas Projects',
--     'romania-welders-pipefitters-urgent',
--     'Romania',
--     'RO',
--     'Work Authorization (EU Schengen)',
--     25,
--     '€1,400 - €2,200 / month (~₹1.25L - ₹2L)',
--     'Welding Certification & 3+ Years Industrial Experience',
--     'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
--     'Oil & gas infrastructure projects hiring certified welders and pipefitters with free accommodation and Schengen work permit.',
--     '### Romania Oil & Gas Sector Urgent Welding Jobs
-- Major energy infrastructure projects in Bucharest and Ploiești require skilled welders and pipefitters immediately.
--
-- #### Salary & Benefits:
-- - Base: €1,400 - €2,200/month
-- - Overtime: 150% of hourly rate
-- - Free accommodation in work camps
-- - Free transportation to site
-- - Medical insurance covered',
--     'active',
--     NOW() + INTERVAL '12 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- 10. Netherlands Warehouse
-- INSERT INTO urgent_requirements (id, title, slug, country, country_code, category, vacancies, salary, experience_required, image_url, summary, content, status, expires_at, created_at, updated_at)
-- VALUES (
--     'req-netherlands-warehouse-2026',
--     'Urgent: 50 Warehouse & Logistics Workers for Netherlands',
--     'netherlands-warehouse-logistics-urgent',
--     'Netherlands',
--     'NL',
--     'TWV Work Permit',
--     50,
--     '€2,100 - €2,800 / month (~₹1.9L - ₹2.5L)',
--     'Warehouse/Logistics Experience Preferred',
--     'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
--     'Major logistics hubs in Amsterdam and Rotterdam hiring warehouse workers, forklift operators, and inventory specialists.',
--     '### Netherlands Logistics Sector Mass Recruitment
-- Dutch logistics and warehouse companies urgently need 50 workers for e-commerce fulfillment centers and distribution hubs.
--
-- #### Why Netherlands:
-- - **High Wages:** €2,100 - €2,800/month + overtime
-- - **Schengen Access:** Work and travel in EU
-- - **Quality of Life:** Excellent healthcare and safety
-- - **English Friendly:** Most Dutch speak English',
--     'active',
--     NOW() + INTERVAL '20 days',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
--
-- -- ============================================================
-- -- VERIFICATION
-- -- ============================================================
--
-- -- Check table exists
-- SELECT 'Table created: ' || EXISTS (
--    SELECT FROM information_schema.tables 
--    WHERE table_name = 'urgent_requirements'
-- )::text as status;
--
-- -- Check RLS enabled
-- SELECT 'RLS enabled: ' || rowsecurity::text as status
-- FROM pg_tables 
-- WHERE tablename = 'urgent_requirements';
--
-- -- Check policies
-- SELECT 'Policies created: ' || COUNT(*)::text as status
-- FROM pg_policies 
-- WHERE tablename = 'urgent_requirements';
--
-- -- Check data inserted
-- SELECT 'Requirements inserted: ' || COUNT(*)::text as status
-- FROM urgent_requirements;
--
-- -- Show all requirements
-- SELECT id, title, country, status, expires_at
-- FROM urgent_requirements
-- ORDER BY created_at DESC;
--
-- -- ============================================================
-- -- SUCCESS!
-- -- ============================================================
-- SELECT '✅ COMPLETE! Now refresh your browser and clear cache.' as message;
--