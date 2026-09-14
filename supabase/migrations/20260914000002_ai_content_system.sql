-- ============================================================
-- AI CONTENT SYSTEM: expanded SEO/structured fields for blog posts
-- and urgent requirements, admin-only write access, and
-- SECURITY DEFINER save RPCs with server-side slug-uniqueness and
-- role checks (mirrors the existing save_blog_post pattern).
-- ============================================================

-- ─── blog_posts: new SEO / AI-content columns ─────────────────
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS related_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS long_tail_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS search_intent TEXT,
  ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS internal_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_urgent_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS image_caption TEXT,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disclaimer TEXT,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── urgent_requirements: full structured job/visa fields ─────
ALTER TABLE public.urgent_requirements
  ADD COLUMN IF NOT EXISTS employer TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS visa_type TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS working_hours TEXT,
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eligibility JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS application_instructions TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS related_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS long_tail_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS admin_input_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow a private 'draft' state (not shown anywhere publicly) in addition to
-- the existing active/closed/expired lifecycle.
ALTER TABLE public.urgent_requirements DROP CONSTRAINT IF EXISTS urgent_requirements_status_check;
ALTER TABLE public.urgent_requirements
  ADD CONSTRAINT urgent_requirements_status_check
  CHECK (status IN ('draft', 'active', 'closed', 'expired'));

CREATE INDEX IF NOT EXISTS idx_urgent_requirements_deadline ON public.urgent_requirements(deadline_at);

-- ─── urgent_requirements RLS: admin-tier only (was "any authenticated
-- user can do anything", which fails "enforce admin authorization") ───
DROP POLICY IF EXISTS "Authenticated users can manage urgent requirements" ON public.urgent_requirements;
DROP POLICY IF EXISTS "Public can view active urgent requirements" ON public.urgent_requirements;

CREATE POLICY "Public can view active urgent requirements" ON public.urgent_requirements
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admin staff can view all urgent requirements" ON public.urgent_requirements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admin staff can write urgent requirements" ON public.urgent_requirements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admin staff can update urgent requirements" ON public.urgent_requirements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admin staff can delete urgent requirements" ON public.urgent_requirements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    )
  );

-- ─── save_urgent_requirement: SECURITY DEFINER RPC ────────────
-- Centralizes admin-role check + server-side slug-uniqueness so a client
-- bug or a loosened RLS policy can't silently let anyone else write.
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
    title = EXCLUDED.title, slug = EXCLUDED.slug, country = EXCLUDED.country,
    country_code = EXCLUDED.country_code, category = EXCLUDED.category, vacancies = EXCLUDED.vacancies,
    salary = EXCLUDED.salary, currency = EXCLUDED.currency, experience_required = EXCLUDED.experience_required,
    education = EXCLUDED.education, skills = EXCLUDED.skills, benefits = EXCLUDED.benefits,
    contract_type = EXCLUDED.contract_type, working_hours = EXCLUDED.working_hours,
    employer = EXCLUDED.employer, city = EXCLUDED.city, visa_type = EXCLUDED.visa_type,
    image_url = EXCLUDED.image_url, detail_image_url = EXCLUDED.detail_image_url, image_alt = EXCLUDED.image_alt,
    summary = EXCLUDED.summary, content = EXCLUDED.content, application_instructions = EXCLUDED.application_instructions,
    eligibility = EXCLUDED.eligibility, required_documents = EXCLUDED.required_documents,
    seo_title = EXCLUDED.seo_title, meta_description = EXCLUDED.meta_description, focus_keyword = EXCLUDED.focus_keyword,
    related_keywords = EXCLUDED.related_keywords, long_tail_keywords = EXCLUDED.long_tail_keywords,
    tags = EXCLUDED.tags, faq = EXCLUDED.faq, admin_input_required = EXCLUDED.admin_input_required,
    ai_generated = EXCLUDED.ai_generated, status = EXCLUDED.status,
    expires_at = EXCLUDED.expires_at, deadline_at = EXCLUDED.deadline_at, updated_at = NOW()
  RETURNING * INTO result;

  BEGIN
    PERFORM public.write_audit_log('urgent_requirement.save', 'urgent_requirements', result.id, NULL, jsonb_build_object('status', result.status, 'slug', result.slug), 'info');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- audit logging must never block a legitimate save
  END;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_urgent_requirement(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_urgent_requirement(JSONB) TO authenticated;

-- ─── save_blog_post: extend with the new SEO/AI columns + a
-- server-side slug-uniqueness check (was previously left to the raw
-- UNIQUE constraint, which surfaces an unfriendly Postgres error) ───
CREATE OR REPLACE FUNCTION public.save_blog_post(payload JSONB)
RETURNS public.blog_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_role TEXT;
  result public.blog_posts;
  post_id UUID;
  target_slug TEXT;
  duplicate_id UUID;
BEGIN
  SELECT user_role INTO profile_role FROM public.user_profiles WHERE id = auth.uid();
  IF profile_role IS NULL OR profile_role NOT IN ('super_admin', 'superadmin', 'admin', 'marketing') THEN
    RAISE EXCEPTION 'Not allowed to save blog posts';
  END IF;

  target_slug := NULLIF(BTRIM(payload->>'slug'), '');
  IF target_slug IS NULL THEN
    RAISE EXCEPTION 'slug is required';
  END IF;

  post_id := NULLIF(payload->>'id', '')::UUID;

  SELECT id INTO duplicate_id FROM public.blog_posts
  WHERE slug = target_slug AND id IS DISTINCT FROM post_id
  LIMIT 1;
  IF duplicate_id IS NOT NULL THEN
    RAISE EXCEPTION 'Slug "%" is already used by another post', target_slug;
  END IF;

  IF post_id IS NULL THEN
    INSERT INTO public.blog_posts (
      author_id, title, slug, excerpt, content, category, tags,
      meta_title, meta_desc, keywords, canonical_url, status, published_at, updated_at,
      focus_keyword, related_keywords, long_tail_keywords, search_intent, faq,
      internal_links, related_urgent_requirements, image_alt, image_caption,
      reading_time_minutes, structured_data, last_reviewed_at, disclaimer, ai_generated
    ) VALUES (
      auth.uid(), payload->>'title', target_slug, payload->>'excerpt', payload->>'content',
      COALESCE(payload->>'category', 'general'), COALESCE(payload->'tags', '[]'::jsonb),
      payload->>'meta_title', payload->>'meta_desc', COALESCE(payload->'keywords', '[]'::jsonb),
      payload->>'canonical_url', COALESCE(payload->>'status', 'draft'),
      CASE WHEN payload->>'status' = 'published' THEN NOW() ELSE NULL END, NOW(),
      payload->>'focus_keyword', COALESCE(payload->'related_keywords', '[]'::jsonb),
      COALESCE(payload->'long_tail_keywords', '[]'::jsonb), payload->>'search_intent',
      COALESCE(payload->'faq', '[]'::jsonb), COALESCE(payload->'internal_links', '[]'::jsonb),
      COALESCE(payload->'related_urgent_requirements', '[]'::jsonb), payload->>'image_alt',
      payload->>'image_caption', NULLIF(payload->>'reading_time_minutes', '')::INTEGER,
      COALESCE(payload->'structured_data', '{}'::jsonb),
      COALESCE(NULLIF(payload->>'last_reviewed_at', '')::TIMESTAMPTZ, NOW()),
      payload->>'disclaimer', COALESCE((payload->>'ai_generated')::BOOLEAN, FALSE)
    )
    RETURNING * INTO result;
  ELSE
    UPDATE public.blog_posts SET
      title = payload->>'title',
      slug = target_slug,
      excerpt = payload->>'excerpt',
      content = payload->>'content',
      category = COALESCE(payload->>'category', category),
      tags = COALESCE(payload->'tags', tags),
      meta_title = payload->>'meta_title',
      meta_desc = payload->>'meta_desc',
      keywords = COALESCE(payload->'keywords', keywords),
      canonical_url = payload->>'canonical_url',
      status = COALESCE(payload->>'status', status),
      published_at = CASE
        WHEN payload->>'status' = 'published' THEN COALESCE(published_at, NOW())
        WHEN payload->>'status' = 'draft' THEN NULL
        ELSE published_at
      END,
      focus_keyword = payload->>'focus_keyword',
      related_keywords = COALESCE(payload->'related_keywords', related_keywords),
      long_tail_keywords = COALESCE(payload->'long_tail_keywords', long_tail_keywords),
      search_intent = payload->>'search_intent',
      faq = COALESCE(payload->'faq', faq),
      internal_links = COALESCE(payload->'internal_links', internal_links),
      related_urgent_requirements = COALESCE(payload->'related_urgent_requirements', related_urgent_requirements),
      image_alt = payload->>'image_alt',
      image_caption = payload->>'image_caption',
      reading_time_minutes = COALESCE(NULLIF(payload->>'reading_time_minutes', '')::INTEGER, reading_time_minutes),
      structured_data = COALESCE(payload->'structured_data', structured_data),
      last_reviewed_at = COALESCE(NULLIF(payload->>'last_reviewed_at', '')::TIMESTAMPTZ, NOW()),
      disclaimer = payload->>'disclaimer',
      ai_generated = COALESCE((payload->>'ai_generated')::BOOLEAN, ai_generated),
      updated_at = NOW()
    WHERE id = post_id
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_blog_post(JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
