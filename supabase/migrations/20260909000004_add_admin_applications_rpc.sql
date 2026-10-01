-- Allow authorized staff to load the combined applications view used by the admin page.
CREATE OR REPLACE FUNCTION public.get_all_applications(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  result JSONB;
  v_page INTEGER := GREATEST(COALESCE(p_page, 1), 1);
  v_page_size INTEGER := LEAST(GREATEST(COALESCE(p_page_size, 50), 1), 100);
  v_offset INTEGER;
BEGIN
  IF NOT user_has_permission(ARRAY['applications.read', 'applications.process']) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  v_offset := (v_page - 1) * v_page_size;

  SELECT COALESCE(jsonb_agg(row_data), '[]'::JSONB)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', a.id,
      'application_id', a.application_id,
      'user_id', a.user_id,
      'visa_program_id', a.visa_program_id,
      'country_id', a.country_id,
      'country_name', c.name,
      'country_flag_emoji', c.flag_emoji,
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
      'meta', COALESCE(a.meta, '{}'::JSONB),
      'metadata', COALESCE(a.meta, '{}'::JSONB),
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'user_profile_full_name', up.full_name,
      'user_profile_email', up.email
      ,'assigned_officer_name', officer.full_name
      ,'assigned_officer_email', officer.email
    ) AS row_data,
    a.created_at AS sort_date
    FROM applications AS a
    LEFT JOIN user_profiles AS up ON up.id = a.user_id
    LEFT JOIN countries AS c ON c.id = a.country_id
    LEFT JOIN user_profiles AS officer ON officer.id = a.assigned_consultant

    UNION ALL

    SELECT jsonb_build_object(
      'id', c.id,
      'application_id', 'ENQ-' || LEFT(REPLACE(c.id::TEXT, '-', ''), 8),
      'user_id', c.user_id,
      'visa_program_id', NULL,
      'country_id', NULL,
      -- 'business' used to be the catch-all here, so an appointment booking and
      -- a vacancy application both displayed as Business, which is simply untrue
      -- of either. Each known consultation_type now maps to what it actually is;
      -- only a genuine B2B enquiry is Business.
      'application_type', CASE
        WHEN c.consultation_type = 'study_visa' THEN 'study'
        WHEN c.consultation_type = 'work_visa' THEN 'work'
        WHEN c.consultation_type = 'urgent_requirement' THEN 'work'
        WHEN c.consultation_type = 'b2b_enquiry' THEN 'business'
        WHEN c.consultation_type = 'general' THEN 'consultation'
        ELSE 'enquiry'
      END,
      -- Was hardcoded to 'submitted', so a consultation's real status was never
      -- reported: changing an enquiry to Under Review wrote 'scheduled' to the
      -- table correctly and the list read back "Submitted" every time, which
      -- looked exactly like the update had failed.
      --
      -- This is the inverse of the mapping the admin client writes:
      --   approved -> confirmed, rejected -> cancelled,
      --   under_review -> scheduled, anything else -> requested
      'status', CASE c.status
        WHEN 'requested' THEN 'submitted'
        WHEN 'scheduled' THEN 'under_review'
        WHEN 'confirmed' THEN 'approved'
        WHEN 'completed' THEN 'approved'
        WHEN 'cancelled' THEN 'rejected'
        WHEN 'no_show'   THEN 'withdrawn'
        ELSE 'submitted'
      END,
      -- consultations has no priority column, so this stays constant. Changing
      -- priority on an enquiry row therefore cannot persist -- it needs a column
      -- before the control can mean anything.
      'priority', 'normal',
      'personal_info', c.user_notes,
      'education_history', '[]'::JSONB,
      'work_history', '[]'::JSONB,
      'document_checklist', '{}'::JSONB,
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
        -- UrgentRequirementDetailPage writes the applicant under these two keys.
        -- Missing them is why "apply for this vacancy" leads still read Unknown
        -- after the first pass of this fix.
        NULLIF(TRIM(c.user_notes ->> 'applicant_name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'applicantName'), ''),
        NULLIF(TRIM(c.user_notes ->> 'contact_person'), ''),
        NULLIF(TRIM(CONCAT_WS(' ', c.user_notes ->> 'first_name', c.user_notes ->> 'last_name')), ''),
        NULLIF(TRIM(c.user_notes ->> 'company'), '')
      ),
      'user_profile_email', COALESCE(
        up.email,
        NULLIF(TRIM(c.user_notes ->> 'email'), ''),
        NULLIF(TRIM(c.user_notes ->> 'applicant_email'), ''),
        NULLIF(TRIM(c.user_notes ->> 'applicantEmail'), ''),
        NULLIF(TRIM(c.user_notes ->> 'business_email'), '')
      )
    ) AS row_data,
    c.created_at AS sort_date
    FROM consultations AS c
    LEFT JOIN user_profiles AS up ON up.id = c.user_id

    ORDER BY sort_date DESC
    LIMIT v_page_size
    OFFSET v_offset
  ) AS rows;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_applications(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_applications(INTEGER, INTEGER) TO authenticated;