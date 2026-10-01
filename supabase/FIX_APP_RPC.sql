-- =========================================================
-- RPC function to fetch all applications (bypasses RLS)
-- Run this in Supabase SQL Editor
--
-- 2026-10-01: fixes the admin Applications list showing "Unknown" for every
-- enquiry row. The consultations branch read the applicant's name from
-- user_profiles via c.user_id, but an enquiry from the public contact form has
-- no account, so user_id is NULL and the LEFT JOIN returned nothing. The name
-- and email the submitter actually typed sit in c.user_notes; they are now read
-- from there whenever there is no profile.
--
-- Re-running this file is safe: it is CREATE OR REPLACE and changes no data.
-- =========================================================

DROP FUNCTION IF EXISTS public.get_all_applications();
DROP FUNCTION IF EXISTS public.get_all_applications(integer, integer);

CREATE OR REPLACE FUNCTION public.get_all_applications(
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_offset INT := (p_page - 1) * p_page_size;
BEGIN
  -- This function is SECURITY DEFINER, so it runs with the owner's rights and
  -- bypasses RLS entirely. Without this check any authenticated user could call
  -- it and read every application and consultation on the site -- names, phone
  -- numbers, whatsapp numbers, preferred countries and consultant_notes.
  --
  -- migrations/20260909000004_add_admin_applications_rpc.sql has always had this
  -- guard. This file did not, and both define the same function with the same
  -- signature, so whichever ran last decided whether the data was protected.
  -- They now match, which is the point: a CREATE OR REPLACE that silently
  -- removes a permission check is the same defect that downgraded
  -- save_blog_post from 26 fields to 12.
  IF NOT user_has_permission(ARRAY['applications.read', 'applications.process']) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb) INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', a.id,
      'application_id', a.application_id,
      'user_id', a.user_id,
      'visa_program_id', a.visa_program_id,
      'country_id', a.country_id,
      'application_type', a.application_type,
      'status', a.status,
      'priority', a.priority,
      'personal_info', a.personal_info,
      'education_history', a.education_history,
      'work_history', a.work_history,
      'document_checklist', a.document_checklist,
      'submitted_at', a.submitted_at,
      'review_started_at', a.review_started_at,
      'decision_at', a.decision_at,
      'estimated_completion', a.estimated_completion,
      'assigned_consultant', a.assigned_consultant,
      'consultant_notes', a.consultant_notes,
      'meta', COALESCE(to_jsonb(a) -> 'meta', '{}'::jsonb),
      'metadata', COALESCE(to_jsonb(a) -> 'meta', '{}'::jsonb),
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'user_profile_full_name', up.full_name,
      'user_profile_email', up.email
    ) AS row_data,
    a.created_at AS sort_date
    FROM applications a
    LEFT JOIN user_profiles up ON up.id = a.user_id
    UNION ALL
    SELECT jsonb_build_object(
      'id', c.id,
      'application_id', 'ENQ-' || LEFT(REPLACE(c.id::text, '-', ''), 8),
      'user_id', c.user_id,
      'visa_program_id', NULL,
      'country_id', NULL,
      'application_type', CASE
        WHEN c.consultation_type = 'study_visa' THEN 'study'
        WHEN c.consultation_type = 'work_visa' THEN 'work'
        ELSE 'business'
      END,
      'status', 'submitted',
      'priority', 'normal',
      'personal_info', c.user_notes,
      'education_history', '[]'::jsonb,
      'work_history', '[]'::jsonb,
      'document_checklist', '{}'::jsonb,
      'submitted_at', c.created_at,
      'review_started_at', NULL,
      'decision_at', NULL,
      'estimated_completion', NULL,
      'assigned_consultant', c.assigned_consultant,
      'consultant_notes', c.consultant_notes,
      'meta', jsonb_build_object(
        'source', 'consultations',
        'consultation_type', c.consultation_type,
        'preferred_country', c.preferred_country,
        'visa_category', c.visa_category
      ),
      'metadata', jsonb_build_object(
        'source', 'consultations',
        'preferred_country', c.preferred_country,
        'visa_category', c.visa_category
      ),
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      -- An enquiry submitted from the public contact form has no account, so
      -- c.user_id is NULL and this LEFT JOIN yields nothing -- which is why the
      -- admin list showed "Unknown" for every such row. The submitter's name and
      -- email are in c.user_notes, put there by the form; read them when there
      -- is no profile to read instead. Several key spellings are tried because
      -- the forms on this site have not always agreed on one.
      'user_profile_full_name', COALESCE(
        up.full_name,
        NULLIF(TRIM(c.user_notes ->> 'name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'full_name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'fullName'), ''),
        NULLIF(TRIM(c.user_notes ->> 'contact_person'), ''),
        NULLIF(TRIM(CONCAT_WS(' ', c.user_notes ->> 'first_name', c.user_notes ->> 'last_name')), ''),
        NULLIF(TRIM(c.user_notes ->> 'company'), '')
      ),
      'user_profile_email', COALESCE(
        up.email,
        NULLIF(TRIM(c.user_notes ->> 'email'), ''),
        NULLIF(TRIM(c.user_notes ->> 'business_email'), '')
      )
    ) AS row_data,
    c.created_at AS sort_date
    FROM consultations c
    LEFT JOIN user_profiles up ON up.id = c.user_id
    ORDER BY sort_date DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_applications(integer, integer) TO authenticated;
