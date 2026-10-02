-- ============================================================================
-- 20261002000001_fix_applications_assign_and_officers.sql
-- Fixes:
-- 1. get_application_officers() to return all active staff/officers
-- 2. admin_assign_officer() RPC to reliably assign officers to both
--    applications and consultations (ENQ-xxxx)
-- 3. manage_application() to allow is_staff() without granular RBAC failures
-- 4. get_all_applications() to join and return assigned_officer_name and email
-- 5. consultations and applications RLS policies to allow staff updates
-- ============================================================================

-- ── 1) Ensure is_staff() helper exists ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND user_role IN ('super_admin', 'superadmin', 'admin', 'manager', 'hr', 'visa_officer', 'counselor', 'consultant')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;

-- ── 2) get_application_officers(): returns all active staff ───────────────────
CREATE OR REPLACE FUNCTION public.get_application_officers()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'full_name', COALESCE(NULLIF(TRIM(full_name), ''), email),
        'email', email,
        'user_role', COALESCE(user_role, 'staff')
      )
      ORDER BY full_name, email
    ),
    '[]'::JSONB
  )
  FROM public.user_profiles
  WHERE user_role IN ('super_admin', 'superadmin', 'admin', 'manager', 'hr', 'visa_officer', 'counselor', 'consultant')
  AND (status IS NULL OR LOWER(status) = 'active');
$$;

REVOKE ALL ON FUNCTION public.get_application_officers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_application_officers() TO authenticated;

-- ── 3) admin_assign_officer(): Dedicated assignment RPC ──────────────────────
CREATE OR REPLACE FUNCTION public.admin_assign_officer(
  p_id UUID,
  p_officer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer_name TEXT := NULL;
  v_officer_email TEXT := NULL;
BEGIN
  IF NOT (public.is_staff() OR public.user_has_permission(ARRAY['applications.update', 'appointments.update', 'crm.update'])) THEN
    RAISE EXCEPTION 'insufficient privileges to assign officer';
  END IF;

  IF p_officer_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(TRIM(full_name), ''), email), email
    INTO v_officer_name, v_officer_email
    FROM public.user_profiles
    WHERE id = p_officer_id;
  END IF;

  -- 1) Try updating public.applications
  IF EXISTS (SELECT 1 FROM public.applications WHERE id = p_id) THEN
    UPDATE public.applications
    SET assigned_consultant = p_officer_id,
        updated_at = NOW()
    WHERE id = p_id;

    -- Audit log
    INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
    VALUES (
      p_id,
      auth.uid(),
      'assign',
      CASE WHEN p_officer_id IS NOT NULL THEN 'Assigned to ' || COALESCE(v_officer_name, 'Officer') ELSE 'Officer unassigned' END,
      jsonb_build_object('officer_id', p_officer_id, 'officer_name', v_officer_name, 'officer_email', v_officer_email)
    );

    RETURN jsonb_build_object(
      'success', TRUE,
      'target', 'applications',
      'id', p_id,
      'assigned_consultant', p_officer_id,
      'officer_name', v_officer_name,
      'officer_email', v_officer_email
    );
  END IF;

  -- 2) Try updating public.consultations (ENQ-xxxx rows)
  IF EXISTS (SELECT 1 FROM public.consultations WHERE id = p_id) THEN
    UPDATE public.consultations
    SET assigned_consultant = p_officer_id,
        updated_at = NOW()
    WHERE id = p_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'target', 'consultations',
      'id', p_id,
      'assigned_consultant', p_officer_id,
      'officer_name', v_officer_name,
      'officer_email', v_officer_email
    );
  END IF;

  RAISE EXCEPTION 'Record % not found in applications or consultations', p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_assign_officer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_assign_officer(UUID, UUID) TO authenticated;

-- Ensure priority column exists on consultations
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';

-- ── 3b) admin_quick_update_application(): Direct update for status, priority, or officer ──
CREATE OR REPLACE FUNCTION public.admin_quick_update_application(
  p_id UUID,
  p_field TEXT,
  p_value TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer_id UUID;
  v_officer_name TEXT := NULL;
  v_officer_email TEXT := NULL;
  v_consultation_status TEXT;
BEGIN
  IF NOT (public.is_staff() OR public.user_has_permission(ARRAY['applications.update', 'applications.process', 'appointments.update', 'crm.update'])) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  -- 1) Try updating public.applications
  IF EXISTS (SELECT 1 FROM public.applications WHERE id = p_id) THEN
    IF p_field = 'status' THEN
      UPDATE public.applications
      SET status = p_value,
          decision_at = CASE WHEN p_value = 'approved' THEN NOW() ELSE decision_at END,
          updated_at = NOW()
      WHERE id = p_id;

      INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
      VALUES (p_id, auth.uid(), 'change_status', 'Status changed to ' || p_value, jsonb_build_object('status', p_value));

    ELSIF p_field = 'priority' THEN
      UPDATE public.applications
      SET priority = p_value,
          updated_at = NOW()
      WHERE id = p_id;

      INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
      VALUES (p_id, auth.uid(), 'change_priority', 'Priority changed to ' || p_value, jsonb_build_object('priority', p_value));

    ELSIF p_field = 'officer' THEN
      v_officer_id := NULLIF(p_value, '')::UUID;
      UPDATE public.applications
      SET assigned_consultant = v_officer_id,
          updated_at = NOW()
      WHERE id = p_id;

      IF v_officer_id IS NOT NULL THEN
        SELECT COALESCE(NULLIF(TRIM(full_name), ''), email), email
        INTO v_officer_name, v_officer_email
        FROM public.user_profiles WHERE id = v_officer_id;
      END IF;

      INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
      VALUES (
        p_id, auth.uid(), 'assign',
        CASE WHEN v_officer_id IS NOT NULL THEN 'Assigned to ' || COALESCE(v_officer_name, 'Officer') ELSE 'Officer unassigned' END,
        jsonb_build_object('officer_id', v_officer_id, 'officer_name', v_officer_name, 'officer_email', v_officer_email)
      );
    ELSE
      RAISE EXCEPTION 'invalid field %', p_field;
    END IF;

    RETURN jsonb_build_object('success', TRUE, 'target', 'applications', 'id', p_id, 'field', p_field, 'value', p_value);
  END IF;

  -- 2) Try updating public.consultations (ENQ-xxxx)
  IF EXISTS (SELECT 1 FROM public.consultations WHERE id = p_id) THEN
    IF p_field = 'status' THEN
      v_consultation_status := CASE p_value
        WHEN 'approved' THEN 'confirmed'
        WHEN 'rejected' THEN 'cancelled'
        WHEN 'under_review' THEN 'scheduled'
        WHEN 'withdrawn' THEN 'no_show'
        ELSE 'requested'
      END;

      UPDATE public.consultations
      SET status = v_consultation_status,
          updated_at = NOW()
      WHERE id = p_id;

    ELSIF p_field = 'priority' THEN
      UPDATE public.consultations
      SET priority = COALESCE(p_value, 'normal'),
          updated_at = NOW()
      WHERE id = p_id;

    ELSIF p_field = 'officer' THEN
      v_officer_id := NULLIF(p_value, '')::UUID;
      UPDATE public.consultations
      SET assigned_consultant = v_officer_id,
          updated_at = NOW()
      WHERE id = p_id;
    ELSE
      RAISE EXCEPTION 'invalid field %', p_field;
    END IF;

    RETURN jsonb_build_object('success', TRUE, 'target', 'consultations', 'id', p_id, 'field', p_field, 'value', p_value);
  END IF;

  RAISE EXCEPTION 'Record % not found in applications or consultations', p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_quick_update_application(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_quick_update_application(UUID, TEXT, TEXT) TO authenticated;

-- ── 4) manage_application(): accept is_staff() without strict permission failures ─
CREATE OR REPLACE FUNCTION public.manage_application(
  p_application_id UUID,
  p_action TEXT,
  p_value JSONB DEFAULT '{}'::JSONB,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_app public.applications;
  updated_app public.applications;
  action_reason TEXT := NULLIF(BTRIM(p_reason), '');
BEGIN
  IF (p_action = 'delete' AND NOT (public.is_staff() OR user_has_permission(ARRAY['applications.delete'])))
     OR (p_action IN ('approve', 'reject', 'return_for_corrections', 'request_documents', 'change_status') AND NOT (public.is_staff() OR user_has_permission(ARRAY['applications.process'])))
     OR (p_action NOT IN ('delete', 'approve', 'reject', 'return_for_corrections', 'request_documents', 'change_status') AND NOT (public.is_staff() OR user_has_permission(ARRAY['applications.update']))) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  SELECT * INTO current_app FROM public.applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'application not found'; END IF;

  IF p_action IN ('approve', 'reject', 'return_for_corrections', 'request_documents', 'change_status', 'archive', 'delete')
     AND p_action <> 'approve' AND action_reason IS NULL THEN
    RAISE EXCEPTION 'a reason is required for this action';
  END IF;

  IF p_action = 'delete' THEN
    INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
    VALUES (p_application_id, auth.uid(), p_action, action_reason, COALESCE(p_value, '{}'::JSONB));
    DELETE FROM public.applications WHERE id = p_application_id;
    RETURN jsonb_build_object('deleted', TRUE, 'id', p_application_id);
  END IF;

  IF p_action = 'duplicate' THEN
    INSERT INTO public.applications (user_id, visa_program_id, country_id, application_type, status, priority, personal_info, education_history, work_history, document_checklist, meta, consultant_notes)
    VALUES (current_app.user_id, current_app.visa_program_id, current_app.country_id, current_app.application_type, 'draft', current_app.priority, current_app.personal_info, current_app.education_history, current_app.work_history, current_app.document_checklist, current_app.meta || jsonb_build_object('duplicated_from', current_app.id), current_app.consultant_notes)
    RETURNING * INTO updated_app;
  ELSE
    updated_app := current_app;
    IF p_action IN ('approve', 'reject', 'return_for_corrections', 'request_documents', 'change_status') THEN
      updated_app.status := CASE p_action
        WHEN 'approve' THEN 'approved'
        WHEN 'reject' THEN 'rejected'
        WHEN 'return_for_corrections' THEN 'draft'
        WHEN 'request_documents' THEN 'under_review'
        ELSE COALESCE(p_value->>'status', current_app.status)
      END;
      IF updated_app.status = 'approved' THEN updated_app.decision_at := NOW(); END IF;
    ELSIF p_action = 'change_priority' THEN
      updated_app.priority := COALESCE(p_value->>'priority', current_app.priority);
    ELSIF p_action = 'assign' THEN
      updated_app.assigned_consultant := NULLIF(p_value->>'officer_id', '')::UUID;
    ELSIF p_action = 'add_note' THEN
      updated_app.consultant_notes := action_reason;
    ELSIF p_action = 'archive' THEN
      updated_app.meta := COALESCE(current_app.meta, '{}'::JSONB) || jsonb_build_object('archived', TRUE, 'archived_at', NOW());
    END IF;

    UPDATE public.applications
    SET status = updated_app.status,
        priority = updated_app.priority,
        assigned_consultant = updated_app.assigned_consultant,
        consultant_notes = updated_app.consultant_notes,
        meta = updated_app.meta,
        decision_at = updated_app.decision_at,
        updated_at = NOW()
    WHERE id = p_application_id;
  END IF;

  INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
  VALUES (p_application_id, auth.uid(), p_action, action_reason, COALESCE(p_value, '{}'::JSONB));

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', p_application_id,
    'action', p_action,
    'status', updated_app.status,
    'priority', updated_app.priority,
    'assigned_consultant', updated_app.assigned_consultant
  );
END;
$$;

REVOKE ALL ON FUNCTION public.manage_application(UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_application(UUID, TEXT, JSONB, TEXT) TO authenticated;

-- ── 5) Update consultations RLS to allow staff updates ────────────────────────
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations_update" ON public.consultations;
DROP POLICY IF EXISTS "consultations_select" ON public.consultations;

CREATE POLICY "consultations_select" ON public.consultations
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR auth.uid() = user_id
    OR auth.uid() = assigned_consultant
    OR public.user_has_permission(ARRAY['appointments.read','crm.read','leads.read'])
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

-- Update applications RLS to allow staff updates
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_staff_update" ON public.applications;
CREATE POLICY "applications_staff_update" ON public.applications
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR auth.uid() = user_id
    OR auth.uid() = assigned_consultant
    OR public.user_has_permission(ARRAY['applications.update','applications.process'])
  )
  WITH CHECK (
    public.is_staff()
    OR auth.uid() = user_id
    OR auth.uid() = assigned_consultant
    OR public.user_has_permission(ARRAY['applications.update','applications.process'])
  );

-- ── 6) get_all_applications(): Join assigned_consultant to user_profiles ──────
DROP FUNCTION IF EXISTS public.get_all_applications();
DROP FUNCTION IF EXISTS public.get_all_applications(integer, integer);

CREATE OR REPLACE FUNCTION public.get_all_applications(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_offset INTEGER := GREATEST(0, (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 15));
BEGIN
  SELECT jsonb_agg(row_data ORDER BY sort_date DESC) INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', a.id,
      'application_id', COALESCE(a.application_id, a.id::text),
      'user_id', a.user_id,
      'visa_program_id', a.visa_program_id,
      'country_id', a.country_id,
      'country_name', co.name,
      'country_flag_emoji', co.flag_emoji,
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
      'assigned_officer_name', COALESCE(NULLIF(TRIM(officer.full_name), ''), officer.email),
      'assigned_officer_email', officer.email,
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
    LEFT JOIN countries co ON co.id = a.country_id
    LEFT JOIN user_profiles officer ON officer.id = a.assigned_consultant
    UNION ALL
    SELECT jsonb_build_object(
      'id', c.id,
      'application_id', 'ENQ-' || LEFT(REPLACE(c.id::text, '-', ''), 8),
      'user_id', c.user_id,
      'visa_program_id', NULL,
      'country_id', NULL,
      'country_name', NULLIF(TRIM(c.preferred_country), ''),
      'country_flag_emoji', NULL,
      'application_type', CASE
        WHEN c.consultation_type = 'study_visa' THEN 'study'
        WHEN c.consultation_type = 'work_visa' THEN 'work'
        WHEN c.consultation_type = 'urgent_requirement' THEN 'work'
        WHEN c.consultation_type = 'b2b_enquiry' THEN 'business'
        WHEN c.consultation_type = 'general' THEN 'consultation'
        ELSE 'enquiry'
      END,
      'status', CASE c.status
        WHEN 'requested' THEN 'submitted'
        WHEN 'scheduled' THEN 'under_review'
        WHEN 'confirmed' THEN 'approved'
        WHEN 'completed' THEN 'approved'
        WHEN 'cancelled' THEN 'rejected'
        WHEN 'no_show'   THEN 'withdrawn'
        ELSE 'submitted'
      END,
      'priority', COALESCE(NULLIF(BTRIM(c.priority), ''), 'normal'),
      'personal_info', c.user_notes,
      'education_history', '[]'::jsonb,
      'work_history', '[]'::jsonb,
      'document_checklist', '{}'::jsonb,
      'submitted_at', c.created_at,
      'review_started_at', NULL,
      'decision_at', NULL,
      'estimated_completion', NULL,
      'assigned_consultant', c.assigned_consultant,
      'assigned_officer_name', COALESCE(NULLIF(TRIM(c_officer.full_name), ''), c_officer.email),
      'assigned_officer_email', c_officer.email,
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
      'user_profile_full_name', COALESCE(
        up.full_name,
        NULLIF(TRIM(c.user_notes ->> 'name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'full_name'), ''),
        NULLIF(TRIM(c.user_notes ->> 'fullName'), ''),
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
    FROM consultations c
    LEFT JOIN user_profiles up ON up.id = c.user_id
    LEFT JOIN user_profiles c_officer ON c_officer.id = c.assigned_consultant
    ORDER BY sort_date DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_applications(integer, integer) TO authenticated;
