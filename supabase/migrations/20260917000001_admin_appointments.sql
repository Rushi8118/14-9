-- ============================================================
-- ADMIN APPOINTMENTS
-- Dashboard bookings and website enquiries are stored in consultations. Staff had
-- no screen showing booked date/time/status, so bookings looked "missing".
-- Also allows the 'urgent_requirement' type the urgent job form already sends
-- (it was silently rejected by the CHECK constraint).
-- Safe to re-run.
-- ============================================================

ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_consultation_type_check;
ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_consultation_type_check
  CHECK (consultation_type IN (
    'general', 'work_visa', 'study_visa', 'country_specific', 'document_review',
    'mock_interview', 'urgent_requirement'
  )) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON public.consultations(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

-- ─── List for the admin Appointments page ────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_consultations(
  p_status TEXT DEFAULT NULL,       -- NULL = all
  p_upcoming_only BOOLEAN DEFAULT FALSE,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  q TEXT := NULLIF(BTRIM(p_search), '');
BEGIN
  IF NOT public.user_has_permission(ARRAY['applications.read', 'applications.process', 'appointments.read', 'crm.read', 'leads.read']) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_data ORDER BY sort_key)
    FROM (
      SELECT
        jsonb_build_object(
          'id', c.id,
          'user_id', c.user_id,
          'consultation_type', c.consultation_type,
          'status', c.status,
          'scheduled_at', c.scheduled_at,
          'duration_minutes', c.duration_minutes,
          'phone_number', c.phone_number,
          'whatsapp_number', c.whatsapp_number,
          'preferred_country', c.preferred_country,
          'visa_category', c.visa_category,
          'user_notes', c.user_notes,
          'consultant_notes', c.consultant_notes,
          'assigned_consultant', c.assigned_consultant,
          'assigned_officer_name', officer.full_name,
          'created_at', c.created_at,
          'client_name', COALESCE(
            NULLIF(BTRIM(up.full_name), ''),
            NULLIF(BTRIM(c.user_notes->>'applicant_name'), ''),
            NULLIF(BTRIM(c.user_notes->>'full_name'), ''),
            NULLIF(BTRIM(c.user_notes->>'name'), '')
          ),
          'client_email', COALESCE(
            NULLIF(BTRIM(up.email), ''),
            NULLIF(BTRIM(c.user_notes->>'applicant_email'), ''),
            NULLIF(BTRIM(c.user_notes->>'email'), '')
          ),
          'client_phone', COALESCE(NULLIF(BTRIM(c.phone_number), ''), NULLIF(BTRIM(up.phone), ''))
        ) AS row_data,
        -- Upcoming view: soonest first. Otherwise newest bookings first.
        CASE WHEN p_upcoming_only THEN extract(epoch FROM c.scheduled_at) ELSE -extract(epoch FROM c.created_at) END AS sort_key
      FROM public.consultations c
      LEFT JOIN public.user_profiles up ON up.id = c.user_id
      LEFT JOIN public.user_profiles officer ON officer.id = c.assigned_consultant
      WHERE (p_status IS NULL OR c.status = p_status)
        AND (NOT p_upcoming_only OR (c.scheduled_at >= NOW() - INTERVAL '1 hour' AND c.status IN ('requested', 'scheduled', 'confirmed')))
        AND (
          q IS NULL
          OR up.full_name ILIKE '%' || q || '%'
          OR up.email ILIKE '%' || q || '%'
          OR c.phone_number ILIKE '%' || q || '%'
          OR c.preferred_country ILIKE '%' || q || '%'
          OR c.user_notes::TEXT ILIKE '%' || q || '%'
        )
      ORDER BY sort_key
      LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
    ) rows
  ), '[]'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_consultations(TEXT, BOOLEAN, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_consultations(TEXT, BOOLEAN, TEXT, INTEGER) TO authenticated;

-- ─── Staff actions: confirm / complete / cancel / no-show / reschedule ───
CREATE OR REPLACE FUNCTION public.admin_update_consultation(
  p_id UUID,
  p_status TEXT DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_consultant_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated public.consultations;
BEGIN
  IF NOT public.user_has_permission(ARRAY['applications.update', 'applications.process', 'appointments.update', 'crm.update', 'leads.update']) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('requested', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  UPDATE public.consultations SET
    status = COALESCE(p_status, status),
    scheduled_at = COALESCE(p_scheduled_at, scheduled_at),
    consultant_notes = COALESCE(p_consultant_notes, consultant_notes),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'appointment not found';
  END IF;

  BEGIN
    PERFORM public.write_audit_log('consultation.update', 'consultations', updated.id::TEXT, NULL,
      jsonb_build_object('status', updated.status, 'scheduled_at', updated.scheduled_at), 'info');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- audit logging must never block the update
  END;

  RETURN to_jsonb(updated);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_consultation(UUID, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_consultation(UUID, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
