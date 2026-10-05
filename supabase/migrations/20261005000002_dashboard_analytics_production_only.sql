-- ============================================================
-- DASHBOARD ANALYTICS: count only real traffic
--
-- get_dashboard_analytics() aggregated every interactions row, so page views
-- and visitor counts included `npm run dev` sessions and the page views the
-- prerender browser makes during `npm run build`. It now reads only rows
-- stamped environment = 'production' by 20261005000001_log_environment_separation.
--
-- The function body is otherwise unchanged from
-- 20260914000003_admin_dashboard_and_audit.sql. Run that migration and the
-- log-environment migration first. Safe to re-run.
-- ============================================================

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
      -- Real traffic only: localhost and build-time page views are kept in the
      -- table and read through the Access Logs environment switch instead.
      AND i.environment = 'production'
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
