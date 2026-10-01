-- =========================================================
-- REPAIR: the admin Applications page can read but not change anything.
--
-- Paste the whole file into the Supabase SQL Editor and RUN once.
-- Idempotent: running it twice is harmless. It changes no application data.
--
-- WHAT WENT WRONG
--
-- FIX_DATA_EXPOSURE.sql enabled RLS on consultations, applications and
-- notifications, which was right -- those tables were readable by anyone with
-- the publishable key. Every staff branch of those policies was written as:
--
--     public.user_has_permission(ARRAY['applications.read', ...])
--
-- and that function answers from get_my_permissions(), which answers from the
-- role_permissions seed in migrations/021_enterprise_rbac.sql. If that seed was
-- never applied to this project -- and the missing RLS policies are evidence
-- that these migrations were not -- then user_has_permission() returns false for
-- everyone, including a super admin, and the policies deny every staff read and
-- every staff write.
--
-- The admin panel then behaves exactly as reported: the list still renders,
-- because get_all_applications is SECURITY DEFINER and bypasses RLS, but no
-- edit, approve, assign or note succeeds, because those go through the table.
--
-- It compounds: manage_application, get_application_management_data and
-- set_application_case_status are defined only in
-- migrations/20260909000005 and 20260914000001. If those were not applied
-- either, the client falls back to updating the table directly -- straight into
-- the policies that are denying it.
--
-- THE FIX
--
-- Staff access stops depending on a seed that may not exist. is_staff() reads
-- user_profiles.user_role directly, which is the column the app already trusts
-- to decide who sees the admin panel at all. Every policy below accepts
-- is_staff() OR user_has_permission(...), so whichever mechanism is actually
-- populated in this database grants access, and neither alone can lock staff
-- out. Anonymous and ordinary signed-in users are unaffected: the exposure
-- FIX_DATA_EXPOSURE.sql closed stays closed.
-- =========================================================


-- ── 0) What is actually in this database? Read this output first. ──────────
SELECT
  'user_has_permission() exists'  AS check,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'user_has_permission')
       THEN 'yes' ELSE 'NO' END   AS result
UNION ALL SELECT 'get_my_permissions() exists',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'get_my_permissions')
       THEN 'yes' ELSE 'NO - this is why permissions deny everything' END
UNION ALL SELECT 'role_permissions rows',
  COALESCE((SELECT COUNT(*)::text FROM information_schema.tables
            WHERE table_schema='public' AND table_name='role_permissions'), '0') || ' table(s); '
  || CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                       WHERE table_schema='public' AND table_name='role_permissions')
          THEN 'seeded rows exist: see next query' ELSE 'TABLE MISSING' END
UNION ALL SELECT 'manage_application() exists',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'manage_application')
       THEN 'yes' ELSE 'NO - client falls back to direct table writes' END
UNION ALL SELECT 'get_application_management_data() exists',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'get_application_management_data')
       THEN 'yes' ELSE 'NO - detail panel uses its fallback query' END
UNION ALL SELECT 'set_application_case_status() exists',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'set_application_case_status')
       THEN 'yes' ELSE 'NO - case status buttons will fail' END;


-- Who currently holds a staff role? If this returns nothing, no account can
-- administer the site and that is the first thing to fix.
SELECT user_role, COUNT(*) AS accounts
FROM public.user_profiles
WHERE user_role IN ('super_admin','superadmin','admin','manager','hr','visa_officer','counselor','consultant')
GROUP BY user_role
ORDER BY accounts DESC;


-- ── 1) is_staff(): role-based access that needs no RBAC seed ───────────────
-- SECURITY DEFINER so it can read user_profiles regardless of that table's own
-- policies, and STABLE so the planner may call it once per statement rather
-- than once per row.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.user_role IN (
        'super_admin','superadmin','admin','manager',
        'hr','visa_officer','counselor','consultant'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;


-- ── 2) consultations ───────────────────────────────────────────────────────
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations_select" ON public.consultations;
DROP POLICY IF EXISTS "consultations_insert" ON public.consultations;
DROP POLICY IF EXISTS "consultations_update" ON public.consultations;
DROP POLICY IF EXISTS "consultations_delete" ON public.consultations;

CREATE POLICY "consultations_select" ON public.consultations
  FOR SELECT TO anon, authenticated
  USING (
    public.is_staff()
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NOT NULL AND auth.uid() = assigned_consultant)
    OR public.user_has_permission(ARRAY['appointments.read','crm.read','leads.read'])
  );

-- The anonymous branch is what keeps the public enquiry form working. Without
-- `user_id IS NULL`, every anonymous submission is rejected, because in SQL
-- NULL = NULL is NULL rather than true.
CREATE POLICY "consultations_insert" ON public.consultations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_staff()
    OR public.user_has_permission(ARRAY['appointments.create','crm.create','leads.create'])
  );

CREATE POLICY "consultations_update" ON public.consultations
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR auth.uid() = user_id
    OR auth.uid() = assigned_consultant
    OR public.user_has_permission(ARRAY['appointments.update','crm.update','leads.update'])
  )
  WITH CHECK (
    public.is_staff()
    OR auth.uid() = user_id
    OR auth.uid() = assigned_consultant
    OR public.user_has_permission(ARRAY['appointments.update','crm.update','leads.update'])
  );

CREATE POLICY "consultations_delete" ON public.consultations
  FOR DELETE TO authenticated
  USING (public.is_staff() OR public.user_has_permission(ARRAY['crm.delete','leads.delete']));


-- ── 3) applications ────────────────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_select" ON public.applications;
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_update" ON public.applications;
DROP POLICY IF EXISTS "applications_delete" ON public.applications;

CREATE POLICY "applications_select" ON public.applications
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR auth.uid() = user_id
    OR public.user_has_permission(ARRAY['applications.read','crm.read'])
  );

CREATE POLICY "applications_insert" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR auth.uid() = user_id
    OR public.user_has_permission(ARRAY['applications.create'])
  );

-- WITH CHECK as well as USING: without it a staff member can select the row to
-- update but the updated row is re-checked and rejected, which reads to the
-- user as "nothing happened".
CREATE POLICY "applications_update" ON public.applications
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR auth.uid() = user_id
    OR public.user_has_permission(ARRAY['applications.update','applications.process'])
  )
  WITH CHECK (
    public.is_staff()
    OR auth.uid() = user_id
    OR public.user_has_permission(ARRAY['applications.update','applications.process'])
  );

CREATE POLICY "applications_delete" ON public.applications
  FOR DELETE TO authenticated
  USING (public.is_staff() OR public.user_has_permission(ARRAY['applications.delete']));


-- ── 4) notifications ───────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (public.is_staff() OR auth.uid() = user_id OR public.user_has_permission(ARRAY['crm.read']));

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.is_staff() OR auth.uid() = user_id OR public.user_has_permission(ARRAY['crm.update']));

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() OR public.user_has_permission(ARRAY['crm.create','notifications.create']));


-- ── 5) Confirm the result ──────────────────────────────────────────────────
-- Table state, not auth.uid(): the SQL Editor runs as postgres where auth.uid()
-- is NULL, so any auth.uid() self-test here reports a false negative.
SELECT
  c.relname AS table_name,
  CASE WHEN c.relrowsecurity THEN 'RLS ON' ELSE 'RLS OFF - STILL EXPOSED' END AS rls,
  (SELECT COUNT(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies,
  (SELECT COUNT(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname
      AND p.qual ILIKE '%is_staff%') AS policies_accepting_staff_role
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('consultations','applications','notifications')
ORDER BY c.relname;

-- Expected: three rows, all "RLS ON", each with policies and a non-zero count
-- in the last column.
--
-- THEN TEST IN THE ADMIN PANEL, because that is the only test that counts:
--   1. Open Admin > Applications and click a row. The detail panel should load.
--   2. Change a status, assign an officer, save a note. Each should persist
--      after a refresh rather than reporting success and reverting.
--   3. Approve an enquiry (an ENQ- row) and a real application. Both should
--      stick.
--
-- If any step still fails, the message now tells you which: a policy denial
-- reads as "No application was updated. Check your admin permissions.", while a
-- missing function reads as a schema-cache or PGRST202 error.
