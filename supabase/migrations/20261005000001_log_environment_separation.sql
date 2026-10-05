-- ============================================================
-- LOG ENVIRONMENT SEPARATION
--
-- Development activity was being written to the same log tables as real
-- visitor activity, so the admin access log mixed them together:
--   * `npm run dev` / `vite preview` on localhost records page views, clicks,
--     logins and admin actions exactly like a real visitor;
--   * `npm run build` drives a headless browser over every route to prerender
--     it (scripts/prerender.mjs), which wrote one page view per page per build.
--
-- Every log row now carries `environment`:
--   'production' — the live site
--   'local'      — localhost, a LAN IP, or any *.localhost / *.local / *.test
--   'build'      — the prerender browser during `npm run build`
--
-- The client stamps the value and a BEFORE INSERT trigger re-derives it from
-- the page URL already stored on the row, so a stale or patched client cannot
-- label localhost traffic as production.
--
-- Existing rows are backfilled from that same stored URL — no row is deleted.
-- Safe to re-run.
-- ============================================================

-- ─── 1) Classify a URL ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_environment_from_url(p_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_authority text;
  v_host      text;
BEGIN
  IF p_url IS NULL OR btrim(p_url) = '' THEN
    RETURN NULL;
  END IF;

  -- scheme://  →  strip; then keep everything before the first path separator
  v_authority := regexp_replace(btrim(p_url), '^[a-zA-Z][a-zA-Z0-9+.-]*://', '');
  v_authority := split_part(v_authority, '/', 1);
  v_authority := split_part(v_authority, '?', 1);
  v_authority := split_part(v_authority, '#', 1);
  v_authority := regexp_replace(v_authority, '^[^@]*@', '');   -- user:pass@

  IF v_authority = '' THEN
    RETURN NULL;
  END IF;

  -- [::1]:5173 keeps its brackets; host:port does not
  IF left(v_authority, 1) = '[' THEN
    v_host := split_part(substring(v_authority from 2), ']', 1);
  ELSE
    v_host := split_part(v_authority, ':', 1);
  END IF;

  v_host := lower(regexp_replace(v_host, '\.$', ''));

  IF v_host = '' THEN
    RETURN NULL;
  END IF;

  IF v_host IN ('localhost', '127.0.0.1', '0.0.0.0', '::1') THEN
    RETURN 'local';
  END IF;

  IF v_host ~ '\.(localhost|local|test|internal)$' THEN
    RETURN 'local';
  END IF;

  -- private and link-local IPv4 (a phone on the same Wi-Fi hitting the dev server)
  IF v_host ~ '^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.)' THEN
    RETURN 'local';
  END IF;

  RETURN 'production';
END;
$$;

COMMENT ON FUNCTION public.log_environment_from_url(text) IS
  'Classifies a page URL as local or production for log separation. NULL when no host can be read.';

-- ─── 2) Stamp the environment on insert ─────────────────────
-- One function for every log table: the page URL is read out of whichever
-- column that table keeps it in (metadata.href, details.href or url).
CREATE OR REPLACE FUNCTION public.set_log_environment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row     jsonb := to_jsonb(NEW);
  v_href    text;
  v_derived text;
BEGIN
  v_href := COALESCE(
    v_row -> 'metadata' ->> 'href',
    v_row -> 'details'  ->> 'href',
    v_row ->> 'url'
  );
  v_derived := public.log_environment_from_url(v_href);

  IF v_derived = 'local' THEN
    -- The URL wins: localhost traffic cannot be recorded as production. The
    -- prerender browser also runs on localhost, so keep its narrower label.
    IF NEW.environment IS DISTINCT FROM 'build' THEN
      NEW.environment := 'local';
    END IF;
  ELSIF NEW.environment IS NULL
     OR NEW.environment NOT IN ('production', 'local', 'build') THEN
    NEW.environment := COALESCE(v_derived, 'production');
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 3) Column, backfill, constraint and trigger per table ──
DO $$
DECLARE
  v_table text;
  v_url_expr text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['interactions', 'admin_access_logs', 'activity_logs', 'audit_logs']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      RAISE NOTICE 'skipping %: table not present', v_table;
      CONTINUE;
    END IF;

    -- A default backfills every existing row as production in one pass; rows
    -- that can be proven local are corrected immediately below.
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT ''production''',
      v_table
    );

    -- Converge on the intended shape even if an earlier partial run left the
    -- column nullable or without its default.
    EXECUTE format(
      'UPDATE public.%I SET environment = ''production'' WHERE environment IS NULL',
      v_table
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN environment SET DEFAULT ''production''',
      v_table
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN environment SET NOT NULL',
      v_table
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (environment, created_at DESC)',
      v_table || '_environment_created_idx', v_table
    );

    -- Backfill from the URL this table already stores.
    v_url_expr := CASE v_table
      WHEN 'audit_logs' THEN 'url'
      WHEN 'activity_logs' THEN 'details->>''href'''
      ELSE 'metadata->>''href'''
    END;

    EXECUTE format(
      'UPDATE public.%I SET environment = ''local''
         WHERE environment = ''production''
           AND public.log_environment_from_url(%s) = ''local''',
      v_table, v_url_expr
    );

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      v_table, v_table || '_environment_check'
    );
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I
         CHECK (environment IN (''production'', ''local'', ''build''))',
      v_table, v_table || '_environment_check'
    );

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I',
      'trg_' || v_table || '_set_environment', v_table);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_log_environment()',
      'trg_' || v_table || '_set_environment', v_table
    );

    EXECUTE format(
      'COMMENT ON COLUMN public.%I.environment IS %L',
      v_table,
      'Where this row was produced: production (live site), local (localhost/LAN) or build (prerender during npm run build).'
    );
  END LOOP;
END;
$$;

-- ─── 4) Backfill activity_logs by session ───────────────────
-- activity_logs does not store the page URL, so step 3 could not classify its
-- existing rows. A session id is shared with the visitor log, which can be
-- classified — so any session already known to be local marks its clicks and
-- navigations local too. Heuristic, and only applied to historical rows:
-- new rows are stamped by the client and the trigger above.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'activity_logs')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'interactions')
  THEN
    UPDATE public.activity_logs a
       SET environment = 'local'
     WHERE a.environment = 'production'
       AND a.session_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM public.interactions i
          WHERE i.session_id = a.session_id
            AND i.environment IN ('local', 'build')
       );
  END IF;
END;
$$;

-- ─── 5) write_audit_log: carry the environment through ──────
-- Same signature as before (the client calls it with these named arguments);
-- the environment is derived from p_url, which the client already sends.
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
    device_type, browser, success, error_reason, environment
  ) VALUES (
    auth.uid(), v_email, v_role, p_action, p_resource, p_resource_id,
    p_old_value, p_new_value, p_severity, p_request_id, p_session_id, p_url, p_referrer,
    p_device_type, p_browser, p_success, p_error_reason,
    COALESCE(public.log_environment_from_url(p_url), 'production')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.write_audit_log(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.write_audit_log(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
