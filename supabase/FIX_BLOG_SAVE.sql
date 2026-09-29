-- =========================================================
-- FIX: blog post save fails in the admin panel
--
-- Paste the whole file into the Supabase SQL Editor and RUN once.
-- It is idempotent: running it twice is harmless.
--
-- WHAT WENT WRONG
--
-- The previous version of this file defined save_blog_post() with only 12
-- columns, while migration 20260914000002_ai_content_system.sql defines the
-- same function with all 26. Because both use
-- `CREATE OR REPLACE FUNCTION public.save_blog_post(payload JSONB)` — the same
-- name and signature — whichever ran last won.
--
-- So running the old copy of this file AFTER the migration silently downgraded
-- the function, and every subsequent save dropped 13 fields on the floor:
-- focus_keyword, related_keywords, long_tail_keywords, search_intent, faq,
-- internal_links, related_urgent_requirements, image_alt, image_caption,
-- reading_time_minutes, structured_data, last_reviewed_at, disclaimer and
-- ai_generated.
--
-- That is worse than a visible error. The save appears to succeed, the editor
-- closes, and the FAQ answers and keywords are simply gone the next time the
-- post is opened.
--
-- This file now carries the COMPLETE function, so it can no longer downgrade
-- anything. It also creates the columns first, so it works on a project where
-- the migrations were never applied.
-- =========================================================


-- 1) Columns the editor writes to. Safe on a project that already has them.
--    Mirrors supabase/migrations/20260914000002_ai_content_system.sql.
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
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT;


-- 2) Permission helper: trust the profile role.
CREATE OR REPLACE FUNCTION public.user_has_permission(required_permissions TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  profile_role TEXT;
BEGIN
  SELECT user_role INTO profile_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF profile_role IN ('super_admin', 'superadmin', 'admin') THEN
    RETURN TRUE;
  END IF;

  IF profile_role = 'marketing' AND required_permissions && ARRAY[
    'blogs.read','blogs.create','blogs.update','blogs.delete','blogs.publish',
    'seo.read','seo.update','settings.read'
  ] THEN
    RETURN TRUE;
  END IF;

  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM public.get_my_permissions()
      WHERE permission_slug = ANY(required_permissions)
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT[]) TO authenticated, anon;


-- 3) Row-level security: published posts are public, staff see and write everything.
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published blog posts are public" ON public.blog_posts;
DROP POLICY IF EXISTS "Staff can write blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Staff can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Staff can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_delete" ON public.blog_posts;

CREATE POLICY "blog_posts_select" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND (published_at IS NULL OR published_at <= NOW()))
    OR (
      auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_profiles p
        WHERE p.id = auth.uid()
          AND p.user_role IN ('super_admin','superadmin','admin','marketing')
      )
    )
  );

CREATE POLICY "blog_posts_insert" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin','superadmin','admin','marketing')
    )
  );

CREATE POLICY "blog_posts_update" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin','superadmin','admin','marketing')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin','superadmin','admin','marketing')
    )
  );

CREATE POLICY "blog_posts_delete" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid()
        AND p.user_role IN ('super_admin','superadmin','admin')
    )
  );


-- 4) The save RPC the admin editor calls.
--
--    SECURITY DEFINER so it works even when table policies are misconfigured,
--    with its own role check and a server-side slug-uniqueness check that gives
--    a readable message instead of a raw UNIQUE-constraint error.
--
--    This must stay in sync with the payload built in
--    src/hooks/useAdminBlogPosts.ts. If you add a field there, add it here — a
--    field this function does not name is silently discarded on save.
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

REVOKE ALL ON FUNCTION public.save_blog_post(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_blog_post(JSONB) TO authenticated;


-- 5) Optional: create admin_sessions to stop dashboard 404s.
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT,
  user_agent TEXT,
  ip_address INET,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location TEXT,
  timezone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,
  terminated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;


-- 6) Check it worked. Both rows should say OK.
SELECT
  'save_blog_post handles all fields' AS check,
  CASE WHEN (
    SELECT COUNT(*) FROM regexp_matches(
      pg_get_functiondef(p.oid),
      'focus_keyword|faq|disclaimer|ai_generated|image_alt|reading_time_minutes|structured_data',
      'g'
    )
  ) >= 7 THEN 'OK' ELSE 'STILL THE OLD 12-FIELD VERSION' END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'save_blog_post'

UNION ALL

SELECT
  'your role can save posts',
  CASE WHEN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND user_role IN ('super_admin','superadmin','admin','marketing')
  ) THEN 'OK' ELSE 'YOUR user_role CANNOT SAVE — see user_profiles.user_role' END;
