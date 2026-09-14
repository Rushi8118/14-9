-- ============================================================
-- Admin dashboard analytics RPC + audit-log hardening
--
-- 1) get_dashboard_analytics(): real, server-side aggregated metrics for
--    the redesigned /admin dashboard (daily series, today/range/prior-range
--    comparisons, device/browser/traffic-source/country breakdowns, top
--    pages) — admin activity is excluded from the public numbers.
-- 2) audit_logs gains the request/session/context columns the task's
--    activity-logging spec calls for, plus supporting indexes.
-- 3) interactions gains a nullable, uniquely-indexed request_id so a
--    retried/duplicated client write can't double-insert.
-- ============================================================

-- ─── interactions: duplicate-event prevention ──────────────────
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Plain (non-partial) unique index: NULLs never conflict with each other in
-- Postgres, so rows without a request_id are unaffected, while this shape
-- still lets `ON CONFLICT (request_id)` upserts (used for dedup) target it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_interactions_request_id
  ON public.interactions(request_id);

-- ─── audit_logs: extended context columns ──────────────────────
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS browser TEXT,
  ADD COLUMN IF NOT EXISTS success BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS error_reason TEXT;

CREATE INDEX IF NOT EXISTS audit_logs_session_id_idx ON public.audit_logs(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_request_id_idx ON public.audit_logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_logs_resource_id_idx ON public.audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_created_idx ON public.audit_logs(action, created_at DESC);

-- Only the SECURITY DEFINER write_audit_log() RPC should create rows —
-- direct client inserts (anon or otherwise) are no longer allowed, and
-- there has never been an UPDATE/DELETE policy, so normal admins already
-- cannot edit or delete audit records.
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- ─── write_audit_log: extended signature (single overload) ─────
-- Drop the old 6-arg version first so PostgREST never has to choose
-- between two overloads for the same call.
DROP FUNCTION IF EXISTS public.write_audit_log(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action       TEXT,
  p_resource     TEXT,
  p_resource_id  TEXT DEFAULT NULL,
  p_old_value    JSONB DEFAULT NULL,
  p_new_value    JSONB DEFAULT NULL,
  p_severity     TEXT DEFAULT 'info',
  p_request_id   TEXT DEFAULT NULL,
  p_session_id   TEXT DEFAULT NULL,
  p_url          TEXT DEFAULT NULL,
  p_referrer     TEXT DEFAULT NULL,
  p_device_type  TEXT DEFAULT NULL,
  p_browser      TEXT DEFAULT NULL,
  p_success      BOOLEAN DEFAULT TRUE,
  p_error_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_existing UUID;
BEGIN
  -- Idempotency: a repeated write carrying the same request_id is a retry,
  -- not a new event — return the original row's id instead of duplicating.
  IF p_request_id IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.audit_logs WHERE request_id = p_request_id;
    IF v_existing IS NOT NULL THEN
      RETURN v_existing;
    END IF;
  END IF;

  SELECT email, user_role INTO v_email, v_role
  FROM public.user_profiles WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    user_id, user_email, user_role, action, resource, resource_id,
    old_value, new_value, severity, request_id, session_id, url, referrer,
    device_type, browser, success, error_reason
  ) VALUES (
    auth.uid(), v_email, v_role, p_action, p_resource, p_resource_id,
    p_old_value, p_new_value, p_severity, p_request_id, p_session_id, p_url, p_referrer,
    p_device_type, p_browser, p_success, p_error_reason
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.write_audit_log(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.write_audit_log(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- ─── get_dashboard_analytics: real server-side dashboard metrics ─
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  result JSONB;
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 30), 1), 90);
  v_profile_role TEXT;
  v_authorized BOOLEAN := FALSE;
BEGIN
  SELECT user_role INTO v_profile_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_profile_role IN ('admin', 'super_admin', 'superadmin', 'manager') THEN
    v_authorized := TRUE;
  ELSIF user_has_permission(ARRAY['analytics.view', 'analytics.realtime']) THEN
    v_authorized := TRUE;
  END IF;
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  WITH bounds AS (
    SELECT
      date_trunc('day', NOW()) AS today_start,
      date_trunc('day', NOW()) - (v_days || ' days')::INTERVAL AS range_start,
      date_trunc('day', NOW()) - (v_days * 2 || ' days')::INTERVAL AS prev_range_start
  ),
  public_events AS (
    SELECT i.event_type, i.session_id, i.page_path, i.referrer, i.device_type, i.browser, i.country_code, i.created_at
    FROM public.interactions i
    LEFT JOIN public.user_profiles up ON up.id = i.user_id
    WHERE i.created_at >= (SELECT prev_range_start FROM bounds)
      AND (up.user_role IS NULL OR up.user_role NOT IN ('admin', 'super_admin', 'superadmin'))
  ),
  daily AS (
    SELECT
      date_trunc('day', created_at) AS day,
      COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS visitors,
      COUNT(*) FILTER (WHERE event_type = 'login') AS logins
    FROM public_events
    WHERE created_at >= (SELECT range_start FROM bounds)
    GROUP BY 1
    ORDER BY 1
  ),
  today AS (
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= (SELECT today_start FROM bounds)) AS page_views_today,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view' AND created_at >= (SELECT today_start FROM bounds)) AS visitors_today,
      COUNT(*) FILTER (WHERE event_type = 'login' AND created_at >= (SELECT today_start FROM bounds)) AS logins_today
    FROM public_events
  ),
  range_totals AS (
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= (SELECT range_start FROM bounds)) AS page_views_range,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view' AND created_at >= (SELECT range_start FROM bounds)) AS visitors_range,
      COUNT(*) FILTER (WHERE event_type = 'login' AND created_at >= (SELECT range_start FROM bounds)) AS logins_range,
      COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at < (SELECT range_start FROM bounds)) AS page_views_prev,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view' AND created_at < (SELECT range_start FROM bounds)) AS visitors_prev,
      COUNT(*) FILTER (WHERE event_type = 'login' AND created_at < (SELECT range_start FROM bounds)) AS logins_prev
    FROM public_events
  ),
  devices AS (
    SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS device, COUNT(*) AS count
    FROM public_events
    WHERE event_type = 'page_view' AND created_at >= (SELECT range_start FROM bounds)
    GROUP BY 1
  ),
  browsers AS (
    SELECT COALESCE(NULLIF(browser, ''), 'Other') AS browser, COUNT(*) AS count
    FROM public_events
    WHERE event_type = 'page_view' AND created_at >= (SELECT range_start FROM bounds)
    GROUP BY 1
  ),
  top_pages AS (
    SELECT page_path, COUNT(*) AS views
    FROM public_events
    WHERE event_type = 'page_view' AND page_path IS NOT NULL AND created_at >= (SELECT range_start FROM bounds)
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 8
  ),
  sources AS (
    SELECT
      CASE
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        WHEN referrer ILIKE '%google.%' THEN 'Google'
        WHEN referrer ILIKE '%facebook.%' THEN 'Facebook'
        WHEN referrer ILIKE '%instagram.%' THEN 'Instagram'
        WHEN referrer ILIKE '%linkedin.%' THEN 'LinkedIn'
        WHEN referrer ILIKE '%whatsapp%' THEN 'WhatsApp'
        WHEN referrer ILIKE '%siddhivinayakoverseas%' THEN 'Direct'
        ELSE 'Other'
      END AS source,
      COUNT(*) AS count
    FROM public_events
    WHERE event_type = 'page_view' AND created_at >= (SELECT range_start FROM bounds)
    GROUP BY 1
  ),
  countries AS (
    SELECT country_code, COUNT(*) AS count
    FROM public_events
    WHERE event_type = 'page_view' AND country_code IS NOT NULL AND created_at >= (SELECT range_start FROM bounds)
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', day, 'page_views', page_views, 'visitors', visitors, 'logins', logins) ORDER BY day) FROM daily), '[]'::jsonb),
    'today', (SELECT to_jsonb(today) FROM today),
    'range', (SELECT to_jsonb(range_totals) FROM range_totals),
    'devices', COALESCE((SELECT jsonb_agg(jsonb_build_object('device', device, 'count', count) ORDER BY count DESC) FROM devices), '[]'::jsonb),
    'browsers', COALESCE((SELECT jsonb_agg(jsonb_build_object('browser', browser, 'count', count) ORDER BY count DESC) FROM browsers), '[]'::jsonb),
    'top_pages', COALESCE((SELECT jsonb_agg(jsonb_build_object('path', page_path, 'views', views)) FROM top_pages), '[]'::jsonb),
    'sources', COALESCE((SELECT jsonb_agg(jsonb_build_object('source', source, 'count', count) ORDER BY count DESC) FROM sources), '[]'::jsonb),
    'countries', COALESCE((SELECT jsonb_agg(jsonb_build_object('country', country_code, 'count', count)) FROM countries), '[]'::jsonb),
    'has_country_data', EXISTS(SELECT 1 FROM public_events WHERE country_code IS NOT NULL),
    'range_days', v_days
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_analytics(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics(INTEGER) TO authenticated;

NOTIFY pgrst, 'reload schema';
