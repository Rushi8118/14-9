-- ============================================================
-- ACTIVITY LOGS: every click, navigation, form submit and app error
-- Written in batches by src/lib/activity-logger.ts for visitors and signed-in
-- users. Form field VALUES are never collected (so passwords can't leak) —
-- only which form/button was used. Readable by staff with audit.read.
-- Rows older than 180 days are removed daily when pg_cron is enabled.
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurred_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  category TEXT NOT NULL CHECK (category IN ('click', 'navigation', 'form_submit', 'error', 'api_error', 'app')),
  action TEXT NOT NULL CHECK (length(action) <= 200),
  page_path TEXT CHECK (length(page_path) <= 500),
  target TEXT CHECK (length(target) <= 300),
  details JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (pg_column_size(details) <= 8192),
  device_type TEXT CHECK (length(device_type) <= 20),
  browser TEXT CHECK (length(browser) <= 40)
);

CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_category_idx ON public.activity_logs (category, created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Always record the real signed-in user (or NULL for visitors), whatever the client sent.
CREATE OR REPLACE FUNCTION public.activity_logs_set_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := auth.uid();
  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_logs_set_user ON public.activity_logs;
CREATE TRIGGER trg_activity_logs_set_user
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.activity_logs_set_user();

DROP POLICY IF EXISTS "Anyone can write activity logs" ON public.activity_logs;
CREATE POLICY "Anyone can write activity logs" ON public.activity_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can read activity logs" ON public.activity_logs;
CREATE POLICY "Staff can read activity logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.user_has_permission(ARRAY['audit.read']));

GRANT INSERT ON public.activity_logs TO anon, authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;

-- ─── Retention ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purge_old_activity_logs()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.activity_logs WHERE created_at < NOW() - INTERVAL '180 days';
$$;

REVOKE ALL ON FUNCTION public.purge_old_activity_logs() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'purge-activity-logs';
    PERFORM cron.schedule('purge-activity-logs', '23 3 * * *', 'SELECT public.purge_old_activity_logs()');
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
