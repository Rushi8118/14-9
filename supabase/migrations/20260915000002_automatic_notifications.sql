-- ============================================================
-- AUTOMATIC NOTIFICATIONS
-- The bell, notifications page and realtime hook were all wired up, but no
-- code or trigger ever inserted a notification, so every list stayed empty.
-- These triggers create notifications for the events applicants care about.
-- A failed notification never blocks the change that triggered it.
-- Safe to re-run.
-- ============================================================

-- ─── Shared helper ───────────────────────────────────────────
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
  -- notifications.user_id references user_profiles; skip accounts without a profile row.
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
  VALUES (p_user_id, p_type, LEFT(p_title, 200), p_message, LEFT(p_action_url, 500), LEFT(p_action_label, 50));
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_user_notification failed: %', SQLERRM;
END;
$$;

-- Only triggers may create notifications this way; users must not be able to spam each other.
REVOKE ALL ON FUNCTION public.create_user_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Applications: status changes ────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref TEXT := CASE
    WHEN NULLIF(BTRIM(NEW.application_id::TEXT), '') IS NOT NULL THEN 'application ' || NEW.application_id::TEXT
    ELSE 'your application'
  END;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_user_notification(
    NEW.user_id,
    'application_update',
    CASE NEW.status
      WHEN 'submitted'    THEN 'Application submitted'
      WHEN 'under_review' THEN 'Application under review'
      WHEN 'approved'     THEN 'Application approved'
      WHEN 'rejected'     THEN 'Update on your application'
      WHEN 'withdrawn'    THEN 'Application withdrawn'
      ELSE 'Application updated'
    END,
    CASE NEW.status
      WHEN 'submitted'    THEN format('We have received %s. Our team will review it shortly.', ref)
      WHEN 'under_review' THEN format('A case officer is now reviewing %s.', ref)
      WHEN 'approved'     THEN format('Good news: %s has been approved. Open it to see your next steps.', ref)
      WHEN 'rejected'     THEN format('There is a decision on %s. Open it or message your case officer to discuss your options.', ref)
      -- Capitalise only the first letter: initcap() would mangle reference codes like SVO-2026-001.
      WHEN 'withdrawn'    THEN format('%s has been withdrawn.', upper(left(ref, 1)) || substr(ref, 2))
      ELSE format('There is an update on %s.', ref)
    END,
    '/dashboard/applications',
    'View application'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_status_change ON public.applications;
CREATE TRIGGER trg_notify_application_status_change
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_status_change();

-- ─── Applications: case officer needs something ──────────────
CREATE OR REPLACE FUNCTION public.notify_application_waiting_for_applicant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.case_status = 'waiting_for_applicant' AND OLD.case_status IS DISTINCT FROM NEW.case_status THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'document_request',
      'Action needed on your application',
      'Your case officer needs something from you before your application can move forward. Please check your application and messages.',
      '/dashboard/applications',
      'Review application'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_waiting_for_applicant ON public.applications;
CREATE TRIGGER trg_notify_application_waiting_for_applicant
  AFTER UPDATE OF case_status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_waiting_for_applicant();

-- ─── Application conversation: officer replies ───────────────
CREATE OR REPLACE FUNCTION public.notify_application_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  applicant UUID;
BEGIN
  SELECT user_id INTO applicant FROM public.applications WHERE id = NEW.application_id;
  IF applicant IS NULL OR applicant = NEW.author_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_user_notification(
    applicant,
    'application_update',
    'New reply from your case officer',
    LEFT(NEW.body, 160),
    '/dashboard/applications',
    'Read reply'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_reply ON public.application_messages;
CREATE TRIGGER trg_notify_application_reply
  AFTER INSERT ON public.application_messages
  FOR EACH ROW
  WHEN (NEW.visibility = 'public')
  EXECUTE FUNCTION public.notify_application_reply();

-- ─── Consultations: requested / confirmed / rescheduled / cancelled ───
CREATE OR REPLACE FUNCTION public.notify_consultation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kind TEXT := initcap(replace(COALESCE(NULLIF(BTRIM(NEW.consultation_type), ''), 'consultation'), '_', ' '));
  slot TEXT := to_char(NEW.scheduled_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST';
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW; -- website enquiries without an account have nobody to notify
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'consultation_reminder', 'Consultation request received',
      'We have received your consultation request. Our team will confirm a time with you soon.',
      '/dashboard/appointments', 'View appointments'
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('scheduled', 'confirmed') THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'consultation_reminder', 'Consultation confirmed',
      format('Your %s is booked for %s.', kind, slot),
      '/dashboard/appointments', 'View appointment'
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'cancelled' THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'consultation_reminder', 'Consultation cancelled',
      format('Your %s on %s has been cancelled. You can book a new time from your dashboard.', kind, slot),
      '/dashboard/appointments', 'Book again'
    );
  ELSIF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at AND NEW.status IN ('scheduled', 'confirmed') THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'consultation_reminder', 'Consultation rescheduled',
      format('Your %s has moved to %s.', kind, slot),
      '/dashboard/appointments', 'View appointment'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_consultation_change ON public.consultations;
CREATE TRIGGER trg_notify_consultation_change
  AFTER INSERT OR UPDATE OF status, scheduled_at ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.notify_consultation_change();

-- ─── Documents: verified / rejected / requested ──────────────
CREATE OR REPLACE FUNCTION public.notify_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc TEXT := COALESCE(NULLIF(BTRIM(NEW.name), ''), 'your document');
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'Verified' AND TG_OP = 'UPDATE' THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'application_update', 'Document verified',
      format('"%s" has been checked and verified by our team.', doc),
      '/dashboard/documents', 'View documents'
    );
  ELSIF NEW.status = 'Rejected' AND TG_OP = 'UPDATE' THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'document_request', 'Document needs attention',
      format('"%s" could not be accepted. Please upload a new copy.', doc),
      '/dashboard/documents', 'Upload again'
    );
  ELSIF NEW.status = 'Missing' THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'document_request', 'Document requested',
      format('Please upload "%s" so we can continue with your application.', doc),
      '/dashboard/documents', 'Upload document'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_document_status_change ON public.documents;
CREATE TRIGGER trg_notify_document_status_change
  AFTER INSERT OR UPDATE OF status ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_document_status_change();

-- ─── Welcome notification for new accounts ───────────────────
CREATE OR REPLACE FUNCTION public.notify_new_user_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_user_notification(
    NEW.id, 'general', 'Welcome to Siddhivinayak Overseas',
    'Complete your profile so our team can suggest the right study or work visa pathway for you.',
    '/dashboard/profile', 'Complete profile'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_user_welcome ON public.user_profiles;
CREATE TRIGGER trg_notify_new_user_welcome
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_user_welcome();

-- ─── Officer Chat replies (only if the chat table exists) ────
CREATE OR REPLACE FUNCTION public.notify_officer_chat_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.receiver_id IS NOT NULL AND NEW.receiver_id IS DISTINCT FROM NEW.sender_id THEN
    PERFORM public.create_user_notification(
      NEW.receiver_id, 'general', 'New message from your case officer',
      COALESCE(NULLIF(LEFT(BTRIM(NEW.message), 160), ''), 'You have a new message.'),
      '/dashboard/chat', 'Open chat'
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_notify_officer_chat_reply ON public.messages';
    EXECUTE 'CREATE TRIGGER trg_notify_officer_chat_reply AFTER INSERT ON public.messages
             FOR EACH ROW EXECUTE FUNCTION public.notify_officer_chat_reply()';
  END IF;
END;
$$;

-- ─── Live bell updates ───────────────────────────────────────
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
