-- ============================================================
-- TWO-WAY NOTIFICATIONS: staff side
-- 20260915000002 notifies applicants when staff act. This file adds the other
-- direction: everyone who can open the admin panel (super_admin, superadmin,
-- admin, manager) is notified when clients submit applications, book, cancel or
-- move consultations, send website enquiries, upload documents, send chat
-- messages or register. It also notifies officers and applicants on assignment.
-- Staff are never notified about their own actions, and a failed notification
-- never blocks the change that triggered it.
-- Run after 20260915000002. Safe to re-run.
-- ============================================================

-- Re-declared so this file also works if 20260915000002 hasn't been applied yet.
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT,
  p_action_label TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
  VALUES (p_user_id, p_type, LEFT(p_title, 200), p_message, LEFT(p_action_url, 500), LEFT(p_action_label, 50));
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_user_notification failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Fan-out to everyone with admin panel access ─────────────
CREATE OR REPLACE FUNCTION public.notify_staff(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT,
  p_action_label TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_id UUID;
BEGIN
  FOR staff_id IN
    SELECT p.id
    FROM public.user_profiles p
    WHERE p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
      AND COALESCE(p.status, 'active') = 'active'
      AND p.id IS DISTINCT FROM auth.uid() -- never notify staff about their own action
  LOOP
    PERFORM public.create_user_notification(staff_id, p_type, p_title, p_message, p_action_url, p_action_label);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_staff(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Readable name for a client (account name, or name typed into a website form) ───
CREATE OR REPLACE FUNCTION public.notification_person_label(p_user_id UUID, p_form_notes JSONB DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  label TEXT;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(BTRIM(full_name), ''), NULLIF(BTRIM(email), ''))
    INTO label
    FROM public.user_profiles
    WHERE id = p_user_id;
  END IF;

  IF label IS NULL AND jsonb_typeof(p_form_notes) = 'object' THEN
    label := COALESCE(
      NULLIF(BTRIM(p_form_notes->>'applicant_name'), ''),
      NULLIF(BTRIM(p_form_notes->>'full_name'), ''),
      NULLIF(BTRIM(p_form_notes->>'fullName'), ''),
      NULLIF(BTRIM(p_form_notes->>'name'), ''),
      NULLIF(BTRIM(p_form_notes->>'applicant_email'), ''),
      NULLIF(BTRIM(p_form_notes->>'email'), '')
    );
  END IF;

  RETURN COALESCE(label, 'A website visitor');
END;
$$;

REVOKE ALL ON FUNCTION public.notification_person_label(UUID, JSONB) FROM PUBLIC, anon, authenticated;

-- ─── Applications: submitted / withdrawn by the client ───────
CREATE OR REPLACE FUNCTION public.notify_staff_application_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_data JSONB := to_jsonb(NEW);
  who TEXT;
  kind TEXT;
  ref TEXT;
BEGIN
  who := public.notification_person_label(NEW.user_id);
  kind := COALESCE(NULLIF(BTRIM(replace(row_data->>'application_type', '_', ' ')), ''), 'visa');
  ref := CASE
    WHEN NULLIF(BTRIM(row_data->>'application_id'), '') IS NOT NULL THEN ' (' || (row_data->>'application_id') || ')'
    ELSE ''
  END;

  IF (TG_OP = 'INSERT' AND NEW.status IS DISTINCT FROM 'draft')
     OR (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'submitted') THEN
    PERFORM public.notify_staff(
      'application_update',
      'New application submitted',
      format('%s submitted a %s application%s.', who, kind, ref),
      '/admin/applications',
      'Review application'
    );
  ELSIF TG_OP = 'UPDATE'
     AND NEW.status = 'withdrawn'
     AND OLD.status IS DISTINCT FROM 'withdrawn'
     AND auth.uid() = NEW.user_id THEN
    PERFORM public.notify_staff(
      'application_update',
      'Application withdrawn by client',
      format('%s withdrew their %s application%s.', who, kind, ref),
      '/admin/applications',
      'View application'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_staff_application_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_application_change ON public.applications;
CREATE TRIGGER trg_notify_staff_application_change
  AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_staff_application_change();

-- ─── Applications & consultations: officer assigned ──────────
CREATE OR REPLACE FUNCTION public.notify_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_application BOOLEAN := TG_TABLE_NAME = 'applications';
  client TEXT;
  officer TEXT;
BEGIN
  IF NEW.assigned_consultant IS NULL
     OR NEW.assigned_consultant IS NOT DISTINCT FROM OLD.assigned_consultant THEN
    RETURN NEW;
  END IF;

  client := public.notification_person_label(NEW.user_id, to_jsonb(NEW)->'user_notes');
  officer := public.notification_person_label(NEW.assigned_consultant);

  -- Tell the officer, unless they assigned it to themselves.
  IF NEW.assigned_consultant IS DISTINCT FROM auth.uid() THEN
    PERFORM public.create_user_notification(
      NEW.assigned_consultant,
      CASE WHEN is_application THEN 'application_update' ELSE 'consultation_reminder' END,
      CASE WHEN is_application THEN 'Application assigned to you' ELSE 'Consultation assigned to you' END,
      format('You are now handling %s for %s.', CASE WHEN is_application THEN 'the application' ELSE 'the consultation' END, client),
      '/admin/applications',
      'Open'
    );
  END IF;

  -- Tell the client who is looking after them.
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      CASE WHEN is_application THEN 'application_update' ELSE 'consultation_reminder' END,
      'Case officer assigned',
      format('%s is now looking after your %s.', officer, CASE WHEN is_application THEN 'application' ELSE 'consultation' END),
      CASE WHEN is_application THEN '/dashboard/applications' ELSE '/dashboard/appointments' END,
      'View details'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_assignment_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_assignment ON public.applications;
CREATE TRIGGER trg_notify_application_assignment
  AFTER UPDATE OF assigned_consultant ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_assignment_change();

DROP TRIGGER IF EXISTS trg_notify_consultation_assignment ON public.consultations;
CREATE TRIGGER trg_notify_consultation_assignment
  AFTER UPDATE OF assigned_consultant ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.notify_assignment_change();

-- ─── Consultations: booked, enquiries, cancelled / moved by client ───
CREATE OR REPLACE FUNCTION public.notify_staff_consultation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_data JSONB := to_jsonb(NEW);
  notes JSONB := to_jsonb(NEW)->'user_notes';
  kind_raw TEXT := COALESCE(NULLIF(BTRIM(to_jsonb(NEW)->>'consultation_type'), ''), 'consultation');
  kind TEXT;
  who TEXT;
  country TEXT;
  phone TEXT;
  slot TEXT;
  -- Guests have no session; signed-in clients own the row. Staff edits are not client actions.
  client_action BOOLEAN := auth.uid() IS NULL OR auth.uid() = NEW.user_id;
BEGIN
  kind := lower(replace(kind_raw, '_', ' '));
  who := public.notification_person_label(NEW.user_id, notes);
  country := NULLIF(BTRIM(row_data->>'preferred_country'), '');
  phone := NULLIF(BTRIM(row_data->>'phone_number'), '');
  slot := to_char(NEW.scheduled_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST';

  IF TG_OP = 'INSERT' THEN
    IF kind_raw = 'urgent_requirement' THEN
      PERFORM public.notify_staff(
        'consultation_reminder',
        'New urgent job application',
        format('%s applied for "%s"%s.',
          who,
          COALESCE(NULLIF(BTRIM(CASE WHEN jsonb_typeof(notes) = 'object' THEN notes->>'urgent_requirement_title' END), ''), 'an urgent opening'),
          CASE WHEN phone IS NOT NULL THEN ' · ' || phone ELSE '' END),
        '/admin/applications',
        'View request'
      );
    ELSE
      PERFORM public.notify_staff(
        'consultation_reminder',
        CASE WHEN NEW.user_id IS NULL THEN 'New website enquiry' ELSE 'New consultation booked' END,
        format('%s requested a %s%s%s.',
          who,
          kind,
          CASE WHEN country IS NOT NULL THEN ' for ' || country ELSE '' END,
          CASE WHEN phone IS NOT NULL THEN ' · ' || phone ELSE '' END),
        '/admin/applications',
        'View request'
      );
    END IF;
  ELSIF client_action AND NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    PERFORM public.notify_staff(
      'consultation_reminder',
      'Consultation cancelled by client',
      format('%s cancelled their %s on %s.', who, kind, slot),
      '/admin/applications',
      'View request'
    );
  ELSIF client_action AND NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at THEN
    PERFORM public.notify_staff(
      'consultation_reminder',
      'Consultation moved by client',
      format('%s moved their %s to %s.', who, kind, slot),
      '/admin/applications',
      'View request'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_staff_consultation_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_consultation_change ON public.consultations;
CREATE TRIGGER trg_notify_staff_consultation_change
  AFTER INSERT OR UPDATE OF status, scheduled_at ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.notify_staff_consultation_change();

-- ─── Documents: uploaded by the client ───────────────────────
CREATE OR REPLACE FUNCTION public.notify_staff_document_uploaded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Uploaded' AND (auth.uid() IS NULL OR auth.uid() = NEW.user_id) THEN
    PERFORM public.notify_staff(
      'document_request',
      'New document uploaded',
      format('%s uploaded "%s".',
        public.notification_person_label(NEW.user_id),
        COALESCE(NULLIF(BTRIM(NEW.name), ''), 'a document')),
      '/admin/users/' || NEW.user_id::TEXT,
      'View client'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_staff_document_uploaded failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_document_uploaded ON public.documents;
CREATE TRIGGER trg_notify_staff_document_uploaded
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_staff_document_uploaded();

-- ─── New registrations ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_staff_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Accounts created for staff by an admin are not client sign-ups.
  IF COALESCE(NEW.user_role, 'customer') NOT IN ('super_admin', 'superadmin', 'admin', 'manager') THEN
    PERFORM public.notify_staff(
      'general',
      'New user registered',
      format('%s created an account.', COALESCE(NULLIF(BTRIM(NEW.full_name), ''), NULLIF(BTRIM(NEW.email), ''), 'Someone')),
      '/admin/users/' || NEW.id::TEXT,
      'View user'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_staff_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_new_user ON public.user_profiles;
CREATE TRIGGER trg_notify_staff_new_user
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_staff_new_user();

-- ─── Officer Chat: client messages to the desk (only if the chat table exists) ───
CREATE OR REPLACE FUNCTION public.notify_staff_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.receiver_id IS NULL THEN
    PERFORM public.notify_staff(
      'general',
      'New chat message',
      format('%s: %s',
        public.notification_person_label(NEW.sender_id),
        COALESCE(NULLIF(LEFT(BTRIM(NEW.message), 140), ''), 'sent an attachment')),
      '/admin/users/' || NEW.sender_id::TEXT,
      'View client'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_staff_chat_message failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_notify_staff_chat_message ON public.messages';
    EXECUTE 'CREATE TRIGGER trg_notify_staff_chat_message AFTER INSERT ON public.messages
             FOR EACH ROW EXECUTE FUNCTION public.notify_staff_chat_message()';
  END IF;
END;
$$;

-- ─── Live bell updates (no-op if 20260915000002 already added it) ───
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
