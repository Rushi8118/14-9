-- =========================================================
-- URGENT: close public read access to enquiry and applicant data
--
-- Paste the whole file into the Supabase SQL Editor and RUN once.
-- Idempotent: running it twice is harmless.
--
-- WHAT IS WRONG
--
-- Anonymous requests using the publishable key -- the key that ships inside the
-- browser bundle and is visible in DevTools on the live site -- can currently
-- read these tables:
--
--     consultations    13 rows, including phone_number, whatsapp_number,
--                      preferred_country, visa_category, user_notes and
--                      consultant_notes (internal staff commentary)
--     applications      6 rows
--     notifications    60 rows
--
-- Verified 2026-09-30 by an anonymous GET against the REST endpoint, which
-- returned HTTP 200 with rows. Only row counts and one bare id were retrieved.
--
-- The policies below already exist in schema.sql (lines 1100-1124) and in
-- migrations/021_enterprise_rbac.sql (lines 596-614), so this is not a design
-- gap: those migrations were never applied to this project. user_profiles,
-- interactions, documents and admin_sessions ARE protected, which is how we know
-- the mechanism works and only these three tables were missed.
--
-- WHAT THIS KEEPS WORKING
--
-- The public enquiry form must keep accepting submissions from visitors who are
-- not logged in. consultations.user_id is nullable precisely for that case, so
-- the INSERT policy below allows a row with a NULL user_id while the SELECT
-- policy prevents anyone reading the table back. An anonymous enquirer can
-- submit and cannot retrieve -- which is correct: they have no account to
-- retrieve it into.
-- =========================================================


-- ── Prerequisite ────────────────────────────────────────────
-- The staff branch of every policy below calls user_has_permission(). If it does
-- not exist, staff lose access the moment RLS switches on and the admin panel
-- goes blank. Run supabase/FIX_BLOG_SAVE.sql first if this returns 'MISSING'.
SELECT
  'user_has_permission() exists' AS prerequisite,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'user_has_permission'
  ) THEN 'OK' ELSE 'MISSING - run supabase/FIX_BLOG_SAVE.sql first, then this file' END AS status;


-- ── 1) consultations ────────────────────────────────────────
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can insert own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON public.consultations;
DROP POLICY IF EXISTS "View consultations" ON public.consultations;
DROP POLICY IF EXISTS "Insert consultations" ON public.consultations;
DROP POLICY IF EXISTS "Update consultations" ON public.consultations;
DROP POLICY IF EXISTS "Delete consultations" ON public.consultations;
DROP POLICY IF EXISTS "consultations_select" ON public.consultations;
DROP POLICY IF EXISTS "consultations_insert" ON public.consultations;
DROP POLICY IF EXISTS "consultations_update" ON public.consultations;
DROP POLICY IF EXISTS "consultations_delete" ON public.consultations;

-- Read: your own, the one assigned to you, or staff.
CREATE POLICY "consultations_select" ON public.consultations
  FOR SELECT TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NOT NULL AND auth.uid() = assigned_consultant)
    OR public.user_has_permission(ARRAY['appointments.read','crm.read','leads.read'])
  );

-- Write: an anonymous visitor may create an enquiry that belongs to nobody; a
-- signed-in user may create one only for themselves. This is what keeps the
-- public contact form working. Without the `user_id IS NULL` branch, every
-- anonymous submission is rejected, because in SQL `NULL = NULL` is NULL, not
-- true -- which is how a policy that looks correct silently breaks the form.
CREATE POLICY "consultations_insert" ON public.consultations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.user_has_permission(ARRAY['appointments.create','crm.create','leads.create'])
  );

CREATE POLICY "consultations_update" ON public.consultations
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_consultant
    OR public.user_has_permission(ARRAY['appointments.update','crm.update','leads.update'])
  );

CREATE POLICY "consultations_delete" ON public.consultations
  FOR DELETE TO authenticated
  USING (public.user_has_permission(ARRAY['crm.delete','leads.delete']));


-- ── 2) applications ─────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
DROP POLICY IF EXISTS "applications_select" ON public.applications;
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_update" ON public.applications;

-- user_id is NOT NULL here, so no anonymous branch is needed or wanted.
CREATE POLICY "applications_select" ON public.applications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.user_has_permission(ARRAY['applications.read','crm.read'])
  );

CREATE POLICY "applications_insert" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.user_has_permission(ARRAY['applications.create'])
  );

CREATE POLICY "applications_update" ON public.applications
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.user_has_permission(ARRAY['applications.update','applications.process'])
  );


-- ── 3) notifications ────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.user_has_permission(ARRAY['crm.read'])
  );

-- Marking your own notification read.
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.user_has_permission(ARRAY['crm.update']));

-- Notifications are created by triggers and Edge Functions running as the
-- service role, which bypasses RLS. Staff may also create them by hand.
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_permission(ARRAY['crm.create','notifications.create']));


-- ── 4) Confirm RLS is on ────────────────────────────────────
-- This checks table state, not auth.uid(). The SQL Editor runs as postgres where
-- auth.uid() is NULL, so any auth.uid() self-test reports a false negative --
-- two earlier files in this directory made exactly that mistake.
SELECT
  c.relname AS table_name,
  CASE WHEN c.relrowsecurity THEN 'RLS ON' ELSE 'RLS OFF - STILL EXPOSED' END AS rls,
  (SELECT COUNT(*) FROM pg_policies p
   WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('consultations','applications','notifications')
ORDER BY c.relname;

-- Expected: three rows, all "RLS ON", each with 3-4 policies.
--
-- AFTER RUNNING THIS, verify from outside the database. In a terminal, with your
-- publishable key, an anonymous read must come back as an empty array:
--
--   curl -s -H "apikey: <publishable key>" \
--     "<project url>/rest/v1/consultations?select=id&limit=1"
--
-- Expected: []    Before this fix it returned a row.
--
-- Then open the admin panel and confirm consultations, applications and
-- notifications still list. If they are empty, user_has_permission() is missing
-- or your user_role is not one it recognises.
