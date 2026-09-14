-- Store administrator / super-administrator activity completely separately from
-- public visitor activity. Admin page views, logins and other tracked events go to
-- public.admin_access_logs; public.interactions keeps only guests and non-admin users.

-- ---------------------------------------------------------------------------
-- 1) Helper: is this user an administrator?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles p
    WHERE p.id = uid
      AND lower(p.user_role::text) IN ('super_admin', 'superadmin', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- 2) Separate admin activity table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_access_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  session_id   varchar(100),
  event_type   varchar(50) NOT NULL,
  page_path    varchar(500),
  page_title   varchar(200),
  referrer     varchar(500),
  device_type  varchar(20),
  browser      varchar(50),
  country_code varchar(3),
  request_id   text,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_access_logs_request_id_key
  ON public.admin_access_logs (request_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_desc
  ON public.admin_access_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_event_created
  ON public.admin_access_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_user_created
  ON public.admin_access_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_page_path
  ON public.admin_access_logs (page_path);

ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins insert own admin access logs" ON public.admin_access_logs;
DROP POLICY IF EXISTS "Admins read admin access logs" ON public.admin_access_logs;

-- Only a signed-in administrator can record their own activity here.
CREATE POLICY "Admins insert own admin access logs" ON public.admin_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_admin_user(auth.uid()));

-- Only administrators can read admin activity.
CREATE POLICY "Admins read admin access logs" ON public.admin_access_logs
  FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3) Safety net: route any admin event written to interactions (older clients,
--    login/logout events fired before the profile loads) into admin_access_logs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.route_admin_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND public.is_admin_user(NEW.user_id) THEN
    INSERT INTO public.admin_access_logs (
      user_id, session_id, event_type, page_path, page_title, referrer,
      device_type, browser, country_code, request_id, metadata, created_at
    ) VALUES (
      NEW.user_id, NEW.session_id, NEW.event_type, NEW.page_path, NEW.page_title, NEW.referrer,
      NEW.device_type, NEW.browser, NEW.country_code, NEW.request_id,
      COALESCE(NEW.metadata, '{}'::jsonb), COALESCE(NEW.created_at, now())
    )
    ON CONFLICT (request_id) DO NOTHING;
    RETURN NULL; -- never store admin activity in the visitor log
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_route_admin_interaction ON public.interactions;
CREATE TRIGGER trg_route_admin_interaction
  BEFORE INSERT ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.route_admin_interaction();

-- ---------------------------------------------------------------------------
-- 4) Move existing admin rows out of the visitor log
-- ---------------------------------------------------------------------------
INSERT INTO public.admin_access_logs (
  user_id, session_id, event_type, page_path, page_title, referrer,
  device_type, browser, country_code, request_id, metadata, created_at
)
SELECT
  i.user_id, i.session_id, i.event_type, i.page_path, i.page_title, i.referrer,
  i.device_type, i.browser, i.country_code, i.request_id,
  COALESCE(i.metadata, '{}'::jsonb), i.created_at
FROM public.interactions i
WHERE i.user_id IS NOT NULL AND public.is_admin_user(i.user_id)
ON CONFLICT (request_id) DO NOTHING;

DELETE FROM public.interactions i
WHERE i.user_id IS NOT NULL AND public.is_admin_user(i.user_id);
