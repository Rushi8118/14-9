-- =========================================================
-- Admin dashboard performance: move access-stats aggregation into Postgres
--
-- Paste into the Supabase SQL Editor and RUN once. Idempotent.
--
-- WHY
--
-- src/hooks/useAdminAccessStats.ts fetches up to 15,000 `interactions` rows
-- (5,000 for today + 10,000 for the week), transfers them to the browser, and
-- then computes the numbers in JavaScript on the main thread: two filters, two
-- Set builds for unique sessions, and a group-by for top pages. That is what
-- makes the admin panel stutter.
--
-- Everything it computes is a one-line aggregate in Postgres over an indexed
-- column. This function returns the finished numbers, so the browser downloads
-- a few hundred bytes instead of several megabytes and does no aggregation at
-- all.
--
-- It also fixes a correctness problem that the row limits introduced: once a
-- busy week exceeds 10,000 page views, "unique sessions (7d)" silently becomes
-- "unique sessions among the first 10,000 rows". A COUNT(DISTINCT ...) has no
-- such ceiling.
--
-- AFTER RUNNING THIS, switch the hook over to it:
--   const { data } = await supabase.rpc('get_admin_access_stats')
-- The hook is not changed automatically, because the function has to exist
-- first or the dashboard breaks.
-- =========================================================


-- 1) Index the columns the aggregate filters and groups on.
--    CONCURRENTLY is deliberately not used: it cannot run inside the implicit
--    transaction the SQL Editor wraps statements in. On a large interactions
--    table this locks writes briefly, so run it outside peak hours.
CREATE INDEX IF NOT EXISTS interactions_event_created_idx
  ON public.interactions (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS interactions_created_idx
  ON public.interactions (created_at DESC);


-- 2) The aggregate itself.
--
--    SECURITY DEFINER with an explicit role check, matching the pattern already
--    used by save_blog_post and get_dashboard_analytics. Without the check, any
--    authenticated user could read site-wide traffic figures.
CREATE OR REPLACE FUNCTION public.get_admin_access_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  profile_role TEXT;
  today_start TIMESTAMPTZ := date_trunc('day', NOW());
  week_start  TIMESTAMPTZ := date_trunc('day', NOW()) - INTERVAL '6 days';
  result JSONB;
BEGIN
  SELECT user_role INTO profile_role FROM public.user_profiles WHERE id = auth.uid();
  IF profile_role IS NULL OR profile_role NOT IN ('super_admin', 'superadmin', 'admin', 'marketing') THEN
    RAISE EXCEPTION 'Not allowed to read access stats';
  END IF;

  WITH public_views AS (
    SELECT session_id, page_path, created_at
    FROM public.interactions
    WHERE event_type = 'page_view'
      AND created_at >= week_start
      -- Same rule as isPublicPath() in the hook: admin and dashboard traffic is
      -- staff activity, not site visits, and must not inflate the numbers.
      AND page_path IS NOT NULL
      AND page_path NOT LIKE '/admin%'
      AND page_path NOT LIKE '/dashboard%'
  )
  SELECT jsonb_build_object(
    'viewsToday',        (SELECT COUNT(*) FROM public_views WHERE created_at >= today_start),
    'views7d',           (SELECT COUNT(*) FROM public_views),
    'uniqueSessionsToday',(SELECT COUNT(DISTINCT session_id) FROM public_views WHERE created_at >= today_start),
    'uniqueSessions7d',  (SELECT COUNT(DISTINCT session_id) FROM public_views),
    'topPaths', COALESCE((
      SELECT jsonb_agg(t)
      FROM (
        SELECT page_path AS path, COUNT(*) AS views
        FROM public_views
        GROUP BY page_path
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb),
    'generatedAt', NOW()
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_access_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_access_stats() TO authenticated;


-- 3) Check it worked. Both rows should say OK.
SELECT
  'get_admin_access_stats exists' AS check,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_admin_access_stats'
  ) THEN 'OK' ELSE 'MISSING' END AS status

UNION ALL

SELECT
  'your role can read access stats',
  CASE WHEN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND user_role IN ('super_admin','superadmin','admin','marketing')
  ) THEN 'OK' ELSE 'YOUR user_role CANNOT -- see user_profiles.user_role' END;
