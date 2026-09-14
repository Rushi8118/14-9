-- Application "case" workflow: conversation (applicant-visible replies + internal
-- notes) and a dedicated case status separate from the visa decision status.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS case_status TEXT NOT NULL DEFAULT 'open'
    CHECK (case_status IN ('open', 'in_progress', 'waiting_for_applicant', 'resolved', 'closed'));

CREATE INDEX IF NOT EXISTS idx_applications_case_status ON public.applications(case_status);

CREATE TABLE IF NOT EXISTS public.application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'internal')),
  body TEXT NOT NULL CHECK (length(btrim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_messages_application
  ON public.application_messages(application_id, created_at DESC);

ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

-- All writes go through add_application_message() (SECURITY DEFINER), so only
-- SELECT policies are needed: staff see everything, applicants see only the
-- replies addressed to them (never internal notes).
DROP POLICY IF EXISTS "Staff can read all application messages" ON public.application_messages;
CREATE POLICY "Staff can read all application messages" ON public.application_messages
  FOR SELECT USING (user_has_permission(ARRAY['applications.read', 'applications.process']));

DROP POLICY IF EXISTS "Applicants can read their own public replies" ON public.application_messages;
CREATE POLICY "Applicants can read their own public replies" ON public.application_messages
  FOR SELECT USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_messages.application_id AND a.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.add_application_message(
  p_application_id UUID,
  p_body TEXT,
  p_visibility TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_body TEXT := NULLIF(BTRIM(p_body), '');
  new_message public.application_messages;
  actor_name TEXT;
  actor_email TEXT;
BEGIN
  IF p_visibility NOT IN ('public', 'internal') THEN
    RAISE EXCEPTION 'invalid message visibility';
  END IF;
  IF clean_body IS NULL THEN
    RAISE EXCEPTION 'message body cannot be empty';
  END IF;
  IF NOT user_has_permission(ARRAY['applications.update', 'applications.process']) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.applications WHERE id = p_application_id) THEN
    RAISE EXCEPTION 'application not found';
  END IF;

  INSERT INTO public.application_messages(application_id, author_id, visibility, body)
  VALUES (p_application_id, auth.uid(), p_visibility, clean_body)
  RETURNING * INTO new_message;

  SELECT full_name, email INTO actor_name, actor_email FROM public.user_profiles WHERE id = auth.uid();

  INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
  VALUES (
    p_application_id,
    auth.uid(),
    CASE WHEN p_visibility = 'public' THEN 'reply' ELSE 'internal_note' END,
    LEFT(clean_body, 200),
    jsonb_build_object('message_id', new_message.id)
  );

  UPDATE public.applications SET updated_at = NOW() WHERE id = p_application_id;

  RETURN to_jsonb(new_message) || jsonb_build_object('author_name', actor_name, 'author_email', actor_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_application_case_status(
  p_application_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_app public.applications;
BEGIN
  IF p_status NOT IN ('open', 'in_progress', 'waiting_for_applicant', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'invalid case status';
  END IF;
  IF NOT user_has_permission(ARRAY['applications.update', 'applications.process']) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  UPDATE public.applications
  SET case_status = p_status, updated_at = NOW()
  WHERE id = p_application_id
  RETURNING * INTO updated_app;

  IF NOT FOUND THEN RAISE EXCEPTION 'application not found'; END IF;

  INSERT INTO public.application_activity(application_id, actor_id, action, reason, metadata)
  VALUES (p_application_id, auth.uid(), 'case_status_change', NULLIF(BTRIM(p_reason), ''), jsonb_build_object('status', p_status));

  PERFORM public.write_audit_log('application.case_status_change', 'applications', updated_app.id::TEXT, NULL, jsonb_build_object('status', p_status), 'info');

  RETURN to_jsonb(updated_app);
END;
$$;

-- Extend the detail RPC with the message thread (public replies + internal
-- notes) and author names on both messages and activity so the workspace can
-- render a conversation timeline without extra round-trips.
CREATE OR REPLACE FUNCTION public.get_application_management_data(p_application_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT user_has_permission(ARRAY['applications.read', 'applications.process']) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  SELECT jsonb_build_object(
    'application', to_jsonb(a) || jsonb_build_object(
      'applicant', to_jsonb(up),
      'country', to_jsonb(c),
      'visa_program', to_jsonb(vp),
      'assigned_officer', to_jsonb(officer)
    ),
    'documents', COALESCE((
      SELECT jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC)
      FROM public.documents d
      WHERE d.application_id = a.id
    ), '[]'::JSONB),
    'activity', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(aa) || jsonb_build_object('actor_name', actor.full_name, 'actor_email', actor.email)
        ORDER BY aa.created_at DESC
      )
      FROM public.application_activity aa
      LEFT JOIN public.user_profiles actor ON actor.id = aa.actor_id
      WHERE aa.application_id = a.id
    ), '[]'::JSONB),
    'messages', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(m) || jsonb_build_object('author_name', author.full_name, 'author_email', author.email)
        ORDER BY m.created_at ASC
      )
      FROM public.application_messages m
      LEFT JOIN public.user_profiles author ON author.id = m.author_id
      WHERE m.application_id = a.id
    ), '[]'::JSONB)
  ) INTO result
  FROM public.applications a
  LEFT JOIN public.user_profiles up ON up.id = a.user_id
  LEFT JOIN public.countries c ON c.id = a.country_id
  LEFT JOIN public.visa_programs vp ON vp.id = a.visa_program_id
  LEFT JOIN public.user_profiles officer ON officer.id = a.assigned_consultant
  WHERE a.id = p_application_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.add_application_message(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_application_case_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_application_message(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_application_case_status(UUID, TEXT, TEXT) TO authenticated;

-- Refresh PostgREST's function schema cache immediately after deployment.
NOTIFY pgrst, 'reload schema';
