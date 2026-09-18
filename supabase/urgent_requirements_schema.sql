-- ============================================================
-- URGENT REQUIREMENTS - COMPLETE DATABASE STRUCTURE SCHEMA
-- File: supabase/urgent_requirements_schema.sql
-- Description: Complete table schema, indexes, RLS policies,
--              triggers, and RPC functions for urgent requirements.
-- ============================================================

-- Step 1: Create or update urgent_requirements table
CREATE TABLE IF NOT EXISTS public.urgent_requirements (
    id                      TEXT PRIMARY KEY,
    title                   TEXT NOT NULL,
    slug                    TEXT NOT NULL UNIQUE,
    employer                TEXT,
    country                 TEXT NOT NULL,
    country_code            TEXT NOT NULL DEFAULT 'XX',
    city                    TEXT,
    visa_type               TEXT,
    category                TEXT NOT NULL,
    vacancies               INTEGER NOT NULL DEFAULT 1,
    salary                  TEXT NOT NULL,
    currency                TEXT,
    experience_required     TEXT,
    education               TEXT,
    skills                  JSONB NOT NULL DEFAULT '[]'::jsonb,
    benefits                JSONB NOT NULL DEFAULT '[]'::jsonb,
    contract_type           TEXT,
    working_hours           TEXT,
    image_url               TEXT,
    detail_image_url        TEXT,
    image_alt               TEXT,
    summary                 TEXT,
    content                 TEXT NOT NULL,
    application_instructions TEXT,
    eligibility             JSONB NOT NULL DEFAULT '[]'::jsonb,
    required_documents      JSONB NOT NULL DEFAULT '[]'::jsonb,
    seo_title               TEXT,
    meta_description        TEXT,
    focus_keyword           TEXT,
    related_keywords        JSONB NOT NULL DEFAULT '[]'::jsonb,
    long_tail_keywords      JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags                    JSONB NOT NULL DEFAULT '[]'::jsonb,
    faq                     JSONB NOT NULL DEFAULT '[]'::jsonb,
    admin_input_required    JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_generated            BOOLEAN NOT NULL DEFAULT FALSE,
    status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'expired')),
    expires_at              TIMESTAMPTZ,
    deadline_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_status ON public.urgent_requirements(status);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_country ON public.urgent_requirements(country);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_expires_at ON public.urgent_requirements(expires_at);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_deadline ON public.urgent_requirements(deadline_at);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_slug ON public.urgent_requirements(slug);
CREATE INDEX IF NOT EXISTS idx_urgent_requirements_created_at ON public.urgent_requirements(created_at DESC);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.urgent_requirements ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old/deprecated policies if they exist
DROP POLICY IF EXISTS "Public can view active urgent requirements" ON public.urgent_requirements;
DROP POLICY IF EXISTS "Authenticated users can manage urgent requirements" ON public.urgent_requirements;
DROP POLICY IF EXISTS "Admin staff can view all urgent requirements" ON public.urgent_requirements;
DROP POLICY IF EXISTS "Admin staff can write urgent requirements" ON public.urgent_requirements;
DROP POLICY IF EXISTS "Admin staff can update urgent requirements" ON public.urgent_requirements;
DROP POLICY IF EXISTS "Admin staff can delete urgent requirements" ON public.urgent_requirements;

-- Step 5: Define Row Level Security Policies

-- 5a. Public access: Anyone (anon or authenticated) can view active, non-expired requirements
CREATE POLICY "Public can view active urgent requirements"
ON public.urgent_requirements
FOR SELECT
TO anon, authenticated
USING (
    status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
);

-- 5b. Admin view: Staff can see all requirements (including drafts, closed, expired)
CREATE POLICY "Admin staff can view all urgent requirements"
ON public.urgent_requirements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles p
        WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
);

-- 5c. Admin insert
CREATE POLICY "Admin staff can write urgent requirements"
ON public.urgent_requirements
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles p
        WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
);

-- 5d. Admin update
CREATE POLICY "Admin staff can update urgent requirements"
ON public.urgent_requirements
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles p
        WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles p
        WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
);

-- 5e. Admin delete
CREATE POLICY "Admin staff can delete urgent requirements"
ON public.urgent_requirements
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles p
        WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
);

-- Step 6: Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_urgent_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_urgent_requirements_updated_at ON public.urgent_requirements;

CREATE TRIGGER trigger_urgent_requirements_updated_at
BEFORE UPDATE ON public.urgent_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_urgent_requirements_updated_at();

-- Step 7: Grant database permissions
GRANT SELECT ON public.urgent_requirements TO anon;
GRANT ALL ON public.urgent_requirements TO authenticated;
GRANT ALL ON public.urgent_requirements TO service_role;

-- Step 8: Administrative RPC Function (save_urgent_requirement)
CREATE OR REPLACE FUNCTION public.save_urgent_requirement(payload JSONB)
RETURNS public.urgent_requirements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_role TEXT;
    result public.urgent_requirements;
    target_id TEXT;
    target_slug TEXT;
    duplicate_id TEXT;
BEGIN
    -- Enforce admin authorization
    SELECT user_role INTO profile_role FROM public.user_profiles WHERE id = auth.uid();
    IF profile_role IS NULL OR profile_role NOT IN ('super_admin', 'superadmin', 'admin', 'manager') THEN
        RAISE EXCEPTION 'You do not have permission to manage urgent requirements';
    END IF;

    target_slug := NULLIF(BTRIM(payload->>'slug'), '');
    IF target_slug IS NULL THEN
        RAISE EXCEPTION 'slug is required';
    END IF;
    IF NULLIF(BTRIM(payload->>'title'), '') IS NULL THEN
        RAISE EXCEPTION 'title is required';
    END IF;

    target_id := NULLIF(payload->>'id', '');

    -- Ensure slug uniqueness across distinct IDs
    SELECT id INTO duplicate_id FROM public.urgent_requirements
    WHERE slug = target_slug AND id IS DISTINCT FROM target_id
    LIMIT 1;
    IF duplicate_id IS NOT NULL THEN
        RAISE EXCEPTION 'Slug "%" is already used by another urgent requirement', target_slug;
    END IF;

    INSERT INTO public.urgent_requirements (
        id, title, slug, country, country_code, category, vacancies, salary, currency,
        experience_required, education, skills, benefits, contract_type, working_hours,
        employer, city, visa_type, image_url, detail_image_url, image_alt,
        summary, content, application_instructions, eligibility, required_documents,
        seo_title, meta_description, focus_keyword, related_keywords, long_tail_keywords,
        tags, faq, admin_input_required, ai_generated,
        status, expires_at, deadline_at, updated_at
    ) VALUES (
        COALESCE(target_id, 'req-' || REPLACE(gen_random_uuid()::TEXT, '-', '')),
        payload->>'title', target_slug, payload->>'country', COALESCE(payload->>'country_code', 'XX'),
        COALESCE(payload->>'category', 'General'), COALESCE((payload->>'vacancies')::INTEGER, 1),
        COALESCE(payload->>'salary', 'Admin input required'), payload->>'currency',
        payload->>'experience_required', payload->>'education',
        COALESCE(payload->'skills', '[]'::jsonb), COALESCE(payload->'benefits', '[]'::jsonb),
        payload->>'contract_type', payload->>'working_hours',
        payload->>'employer', payload->>'city', payload->>'visa_type',
        payload->>'image_url', payload->>'detail_image_url', payload->>'image_alt',
        payload->>'summary', COALESCE(payload->>'content', ''), payload->>'application_instructions',
        COALESCE(payload->'eligibility', '[]'::jsonb), COALESCE(payload->'required_documents', '[]'::jsonb),
        payload->>'seo_title', payload->>'meta_description', payload->>'focus_keyword',
        COALESCE(payload->'related_keywords', '[]'::jsonb), COALESCE(payload->'long_tail_keywords', '[]'::jsonb),
        COALESCE(payload->'tags', '[]'::jsonb), COALESCE(payload->'faq', '[]'::jsonb),
        COALESCE(payload->'admin_input_required', '[]'::jsonb), COALESCE((payload->>'ai_generated')::BOOLEAN, FALSE),
        COALESCE(payload->>'status', 'draft'),
        NULLIF(payload->>'expires_at', '')::TIMESTAMPTZ, NULLIF(payload->>'deadline_at', '')::TIMESTAMPTZ,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        country = EXCLUDED.country,
        country_code = EXCLUDED.country_code,
        category = EXCLUDED.category,
        vacancies = EXCLUDED.vacancies,
        salary = EXCLUDED.salary,
        currency = EXCLUDED.currency,
        experience_required = EXCLUDED.experience_required,
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        benefits = EXCLUDED.benefits,
        contract_type = EXCLUDED.contract_type,
        working_hours = EXCLUDED.working_hours,
        employer = EXCLUDED.employer,
        city = EXCLUDED.city,
        visa_type = EXCLUDED.visa_type,
        image_url = EXCLUDED.image_url,
        detail_image_url = EXCLUDED.detail_image_url,
        image_alt = EXCLUDED.image_alt,
        summary = EXCLUDED.summary,
        content = EXCLUDED.content,
        application_instructions = EXCLUDED.application_instructions,
        eligibility = EXCLUDED.eligibility,
        required_documents = EXCLUDED.required_documents,
        seo_title = EXCLUDED.seo_title,
        meta_description = EXCLUDED.meta_description,
        focus_keyword = EXCLUDED.focus_keyword,
        related_keywords = EXCLUDED.related_keywords,
        long_tail_keywords = EXCLUDED.long_tail_keywords,
        tags = EXCLUDED.tags,
        faq = EXCLUDED.faq,
        admin_input_required = EXCLUDED.admin_input_required,
        ai_generated = EXCLUDED.ai_generated,
        status = EXCLUDED.status,
        expires_at = EXCLUDED.expires_at,
        deadline_at = EXCLUDED.deadline_at,
        updated_at = NOW()
    RETURNING * INTO result;

    -- Write audit log if function exists
    BEGIN
        PERFORM public.write_audit_log(
            'urgent_requirement.save',
            'urgent_requirements',
            result.id,
            NULL,
            jsonb_build_object('status', result.status, 'slug', result.slug),
            'info'
        );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- audit logging must never block a legitimate save
    END;

    RETURN result;
END;
$$;
