-- =========================================================
-- Read-only. Shows why an enquiry row has no applicant name.
--
-- Run this only if rows still show "Unknown" in Admin > Applications after
-- running FIX_APP_RPC.sql. It SELECTs and nothing else: no table is written,
-- no function is replaced, and it is safe to run as many times as you like.
--
-- The point is to stop guessing. Each enquiry's name lives in the user_notes
-- JSON under whatever key the form that created it happened to use, and the
-- forms on this site do not agree: the contact form writes `name`, the urgent
-- vacancy form writes `applicant_name`, the appointments page writes no name at
-- all and relies on the signed-in profile. This lists the keys that are
-- actually present so the next fix matches real data rather than a guess.
-- =========================================================


-- 1) Which enquiries have no resolvable name, and what keys do they carry?
SELECT
  'ENQ-' || UPPER(LEFT(REPLACE(c.id::text, '-', ''), 8)) AS shown_id,
  c.consultation_type,
  c.created_at::date                                     AS created,
  (c.user_id IS NOT NULL)                                AS has_account,
  up.full_name                                           AS profile_name,
  -- every top-level key in user_notes, so a missing name is obvious
  (SELECT string_agg(k, ', ' ORDER BY k)
     FROM jsonb_object_keys(COALESCE(c.user_notes, '{}'::jsonb)) AS k) AS user_notes_keys
FROM consultations c
LEFT JOIN user_profiles up ON up.id = c.user_id
WHERE COALESCE(
        up.full_name,
        NULLIF(TRIM(c.user_notes ->> 'name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'full_name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'fullName'), ''),
        NULLIF(TRIM(c.user_notes ->> 'applicant_name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'applicantName'), ''),
        NULLIF(TRIM(c.user_notes ->> 'contact_person'), ''),
        NULLIF(TRIM(CONCAT_WS(' ', c.user_notes ->> 'first_name', c.user_notes ->> 'last_name')), ''),
        NULLIF(TRIM(c.user_notes ->> 'company'), '')
      ) IS NULL
ORDER BY c.created_at DESC
LIMIT 50;

-- Reading the result:
--   has_account = false and user_notes_keys has no name-ish key
--       -> the form never captured a name. Nothing can recover it; the fix is
--          to make that form require one going forward.
--   has_account = true and profile_name is NULL
--       -> the person has an account with no full_name set. The name may exist
--          in auth.users metadata, or they simply never entered one.
--   user_notes_keys shows a name-ish key not in the list above
--       -> send that key name back and it gets added to the COALESCE.


-- 2) How many enquiries of each type, and how many of them resolve to a name?
SELECT
  c.consultation_type,
  COUNT(*)                                                    AS total,
  COUNT(*) FILTER (WHERE COALESCE(
      up.full_name,
      NULLIF(TRIM(c.user_notes ->> 'name'), ''),
      NULLIF(TRIM(c.user_notes ->> 'applicant_name'), ''),
      NULLIF(TRIM(c.user_notes ->> 'full_name'), '')
    ) IS NOT NULL)                                            AS with_name,
  COUNT(*) FILTER (WHERE c.user_id IS NULL)                   AS anonymous
FROM consultations c
LEFT JOIN user_profiles up ON up.id = c.user_id
GROUP BY c.consultation_type
ORDER BY total DESC;


-- 3) Confirm the RPC in the database is the guarded version.
--    This checks the function body, not auth.uid(), because the SQL Editor runs
--    as postgres where auth.uid() is NULL and any such self-test reports a
--    false negative.
SELECT
  p.proname                                                       AS function_name,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'INVOKER' END AS security,
  CASE WHEN pg_get_functiondef(p.oid) ILIKE '%insufficient privileges%'
       THEN 'GUARDED'
       ELSE 'NO PERMISSION CHECK - run supabase/FIX_APP_RPC.sql'
  END                                                              AS permission_check,
  CASE WHEN pg_get_functiondef(p.oid) ILIKE '%applicant_name%'
       THEN 'has the name fallback'
       ELSE 'OLD VERSION - run supabase/FIX_APP_RPC.sql'
  END                                                              AS name_fallback
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_all_applications';
