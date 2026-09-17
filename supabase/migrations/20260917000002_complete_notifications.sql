-- ============================================================
-- COMPLETE NOTIFICATIONS
-- Fills the gaps left by 20260915000002 (client side) and 20260915000003
-- (staff side) so every workflow step notifies the right people:
--   Clients: consultation completed / no-show, reasons behind application
--   decisions, corrections & document requests, case progress, estimated
--   completion date, document received, account suspended / reactivated,
--   24-hour consultation reminders.
--   Staff: client replies in the application conversation, documents
--   re-uploaded after rejection.
-- Also adds admin_set_document_status() for the Verify / Reject buttons.
-- Run after 20260915000003 and 20260917000001. Safe to re-run.
-- ============================================================

-- ─── Consultations: every status the admin can set ───────────
CREATE OR REPLACE FUNCTION public.notify_consultation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kind TEXT := initcap(replace(COALESCE(NULLIF(BTRIM(NEW.consultation_type), ''), 'consultation'), '_', ' '));
  slot TEXT := COALESCE(to_char(NEW.scheduled_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST', 'the requested time');
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'consultation_reminder', 'Consultation request received',
      format('We have received your %s request for %s. Our team will confirm it with you soon.', lower(kind), slot),
      '/dashboard/appointments', 'View appointments'
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('scheduled', 'confirmed') THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'consultation_reminder', 'Consultation confirmed',
        format('Your %s is confirmed for %s. Please keep your documents ready.', lower(kind), slot),
        '/dashboard/appointments', 'View appointment'
      );
    ELSIF NEW.status = 'completed' THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'consultation_reminder', 'Consultation completed',
        format('Thank you for attending your %s on %s. Your case officer will share the next steps with you.', lower(kind), slot),
        '/dashboard/appointments', 'View details'
      );
    ELSIF NEW.status = 'no_show' THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'consultation_reminder', 'We missed you',
        format('You were not able to join your %s on %s. Book a new time whenever it suits you.', lower(kind), slot),
        '/dashboard/appointments', 'Book again'
      );
    ELSIF NEW.status = 'cancelled' THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'consultation_reminder', 'Consultation cancelled',
        format('Your %s on %s has been cancelled. You can book a new time from your dashboard.', lower(kind), slot),
        '/dashboard/appointments', 'Book again'
      );
    END IF;
  ELSIF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at AND NEW.status IN ('requested', 'scheduled', 'confirmed') THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'consultation_reminder', 'Consultation rescheduled',
      format('Your %s has moved to %s.', lower(kind), slot),
      '/dashboard/appointments', 'View appointment'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_consultation_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_consultation_change ON public.consultations;
CREATE TRIGGER trg_notify_consultation_change
  AFTER INSERT OR UPDATE OF status, scheduled_at ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.notify_consultation_change();

-- ─── Applications: status (now also "returned for corrections") ───
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
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = NEW.user_id AND NEW.status <> 'submitted' THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_user_notification(
    NEW.user_id,
    CASE WHEN NEW.status = 'draft' THEN 'document_request' ELSE 'application_update' END,
    CASE NEW.status
      WHEN 'submitted'    THEN 'Application submitted'
      WHEN 'under_review' THEN 'Application under review'
      WHEN 'approved'     THEN 'Application approved'
      WHEN 'rejected'     THEN 'Update on your application'
      WHEN 'withdrawn'    THEN 'Application withdrawn'
      WHEN 'draft'        THEN 'Corrections needed on your application'
      ELSE 'Application updated'
    END,
    CASE NEW.status
      WHEN 'submitted'    THEN format('We have received %s. Our team will review it shortly.', ref)
      WHEN 'under_review' THEN format('A case officer is now reviewing %s.', ref)
      WHEN 'approved'     THEN format('Good news: %s has been approved. Open it to see your next steps.', ref)
      WHEN 'rejected'     THEN format('There is a decision on %s. Open it or message your case officer to discuss your options.', ref)
      WHEN 'withdrawn'    THEN format('%s has been withdrawn.', upper(left(ref, 1)) || substr(ref, 2))
      WHEN 'draft'        THEN format('%s has been returned to you for corrections. Please update it and submit again.', upper(left(ref, 1)) || substr(ref, 2))
      ELSE format('There is an update on %s.', ref)
    END,
    '/dashboard/applications',
    CASE WHEN NEW.status = 'draft' THEN 'Fix application' ELSE 'View application' END
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_application_status_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ─── Applications: attach the officer's reason to the notification ───
-- manage_application() writes the activity row right after the status update,
-- inside the same transaction, so the notification created a moment ago is
-- enriched instead of sending the client a second one.
CREATE OR REPLACE FUNCTION public.notify_application_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  applicant UUID;
  recent_id UUID;
  reason_text TEXT := NULLIF(BTRIM(COALESCE(NEW.reason, '')), '');
BEGIN
  IF NEW.action NOT IN ('approve', 'reject', 'return_for_corrections', 'request_documents', 'change_status') THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO applicant FROM public.applications WHERE id = NEW.application_id;
  IF applicant IS NULL OR applicant = NEW.actor_id THEN
    RETURN NEW;
  END IF;

  SELECT id INTO recent_id
  FROM public.notifications
  WHERE user_id = applicant
    AND action_url = '/dashboard/applications'
    AND created_at >= NOW() - INTERVAL '2 minutes'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NEW.action = 'request_documents' THEN
    IF recent_id IS NOT NULL THEN
      UPDATE public.notifications
      SET type = 'document_request',
          title = 'Documents requested',
          message = 'Your case officer needs more documents to continue.' || COALESCE(' Details: ' || reason_text, ''),
          action_url = '/dashboard/documents',
          action_label = 'Upload documents'
      WHERE id = recent_id;
    ELSE
      PERFORM public.create_user_notification(
        applicant, 'document_request', 'Documents requested',
        'Your case officer needs more documents to continue.' || COALESCE(' Details: ' || reason_text, ''),
        '/dashboard/documents', 'Upload documents'
      );
    END IF;
  ELSIF reason_text IS NOT NULL THEN
    IF recent_id IS NOT NULL THEN
      UPDATE public.notifications
      SET message = message || ' Note from your case officer: ' || LEFT(reason_text, 400)
      WHERE id = recent_id;
    ELSE
      PERFORM public.create_user_notification(
        applicant, 'application_update', 'Note on your application',
        LEFT(reason_text, 400), '/dashboard/applications', 'View application'
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_application_activity failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_activity ON public.application_activity;
CREATE TRIGGER trg_notify_application_activity
  AFTER INSERT ON public.application_activity
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_activity();

-- ─── Applications: case progress + estimated completion ──────
CREATE OR REPLACE FUNCTION public.notify_application_waiting_for_applicant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF NEW.case_status IS DISTINCT FROM OLD.case_status THEN
    IF NEW.case_status = 'waiting_for_applicant' THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'document_request', 'Action needed on your application',
        'Your case officer needs something from you before your application can move forward. Please check your application and messages.',
        '/dashboard/applications', 'Review application'
      );
    ELSIF NEW.case_status = 'in_progress' THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'application_update', 'Work started on your case',
        'Your case officer is actively working on your application.',
        '/dashboard/applications', 'View application'
      );
    ELSIF NEW.case_status IN ('resolved', 'closed') THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'application_update',
        CASE WHEN NEW.case_status = 'resolved' THEN 'Your case is resolved' ELSE 'Your case is closed' END,
        'Your case officer has marked your case as ' || NEW.case_status || '. Message us if you still need help.',
        '/dashboard/applications', 'View application'
      );
    END IF;
  END IF;

  IF NEW.estimated_completion IS DISTINCT FROM OLD.estimated_completion AND NEW.estimated_completion IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'application_update', 'Estimated completion date updated',
      'Your application is now expected to be completed by ' || to_char(NEW.estimated_completion, 'DD Mon YYYY') || '.',
      '/dashboard/applications', 'View application'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_application_waiting_for_applicant failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_waiting_for_applicant ON public.applications;
CREATE TRIGGER trg_notify_application_waiting_for_applicant
  AFTER UPDATE OF case_status, estimated_completion ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_waiting_for_applicant();

-- ─── Application conversation: client replies notify staff ───
CREATE OR REPLACE FUNCTION public.notify_staff_application_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app RECORD;
  label TEXT;
BEGIN
  SELECT id, user_id, application_id, assigned_consultant INTO app FROM public.applications WHERE id = NEW.application_id;
  IF app.user_id IS NULL OR app.user_id IS DISTINCT FROM NEW.author_id THEN
    RETURN NEW; -- staff replies are handled by notify_application_reply()
  END IF;
  label := format('%s replied on application %s: %s',
    public.notification_person_label(app.user_id),
    COALESCE(NULLIF(BTRIM(app.application_id::TEXT), ''), left(app.id::TEXT, 8)),
    LEFT(NEW.body, 140));

  IF app.assigned_consultant IS NOT NULL THEN
    PERFORM public.create_user_notification(
      app.assigned_consultant, 'application_update', 'Client replied', label, '/admin/applications', 'Open conversation'
    );
  END IF;
  -- Everyone else with admin access (skipping the officer, who was just notified).
  PERFORM public.create_user_notification(p.id, 'application_update', 'Client replied', label, '/admin/applications', 'Open conversation')
  FROM public.user_profiles p
  WHERE p.user_role IN ('super_admin', 'superadmin', 'admin', 'manager')
    AND COALESCE(p.status, 'active') = 'active'
    AND p.id IS DISTINCT FROM app.assigned_consultant;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_staff_application_reply failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_application_reply ON public.application_messages;
CREATE TRIGGER trg_notify_staff_application_reply
  AFTER INSERT ON public.application_messages
  FOR EACH ROW
  WHEN (NEW.visibility = 'public')
  EXECUTE FUNCTION public.notify_staff_application_reply();

-- ─── Documents: receipt for the client, re-uploads for staff ───
CREATE OR REPLACE FUNCTION public.notify_document_uploaded_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc TEXT := COALESCE(NULLIF(BTRIM(NEW.name), ''), 'your document');
BEGIN
  IF NEW.status <> 'Uploaded' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'Uploaded' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = NEW.user_id THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'application_update', 'Document received',
      format('We have received "%s". Our team will check it and let you know.', doc),
      '/dashboard/documents', 'View documents'
    );
  END IF;
  -- Staff already hear about brand-new uploads; tell them about replacements too.
  IF TG_OP = 'UPDATE' AND (auth.uid() IS NULL OR auth.uid() = NEW.user_id) THEN
    PERFORM public.notify_staff(
      'document_request', 'Document re-uploaded',
      format('%s uploaded a new copy of "%s".', public.notification_person_label(NEW.user_id), doc),
      '/admin/users/' || NEW.user_id::TEXT, 'View client'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_document_uploaded_receipt failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_document_uploaded_receipt ON public.documents;
CREATE TRIGGER trg_notify_document_uploaded_receipt
  AFTER INSERT OR UPDATE OF status ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_document_uploaded_receipt();

-- ─── Account status changed by an admin ──────────────────────
CREATE OR REPLACE FUNCTION public.notify_account_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR auth.uid() = NEW.id THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'active' THEN
    PERFORM public.create_user_notification(
      NEW.id, 'general', 'Your account is active',
      'Your account has been activated. You can use every dashboard feature again.',
      '/dashboard', 'Open dashboard'
    );
  ELSIF NEW.status IN ('suspended', 'inactive') THEN
    -- Stored so the client sees it once access is restored.
    PERFORM public.create_user_notification(
      NEW.id, 'general', 'Your account was ' || NEW.status,
      'Please contact Siddhivinayak Overseas on +91 99250 64666 if you think this is a mistake.',
      '/contact', 'Contact us'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_account_status_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_account_status_change ON public.user_profiles;
CREATE TRIGGER trg_notify_account_status_change
  AFTER UPDATE OF status ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_account_status_change();

-- ─── Admin: verify / reject a document ───────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_document_status(p_document_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_permission(ARRAY['applications.process', 'applications.update', 'documents.update']) THEN
    RAISE EXCEPTION 'You do not have permission to review documents' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('Verified', 'Rejected', 'Missing', 'Uploaded') THEN
    RAISE EXCEPTION 'Invalid document status' USING ERRCODE = '22023';
  END IF;
  UPDATE public.documents SET status = p_status, updated_at = NOW() WHERE id = p_document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

DO $$
BEGIN
  -- documents.updated_at may not exist on older databases; fall back to a status-only update.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'updated_at'
  ) THEN
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.admin_set_document_status(p_document_id UUID, p_status TEXT)
      RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $b$
      BEGIN
        IF NOT public.user_has_permission(ARRAY['applications.process', 'applications.update', 'documents.update']) THEN
          RAISE EXCEPTION 'You do not have permission to review documents' USING ERRCODE = '42501';
        END IF;
        IF p_status NOT IN ('Verified', 'Rejected', 'Missing', 'Uploaded') THEN
          RAISE EXCEPTION 'Invalid document status' USING ERRCODE = '22023';
        END IF;
        UPDATE public.documents SET status = p_status WHERE id = p_document_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Document not found' USING ERRCODE = 'P0002';
        END IF;
      END;
      $b$;
    $f$;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_document_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_document_status(UUID, TEXT) TO authenticated;

-- ─── 24-hour consultation reminders ──────────────────────────
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.send_consultation_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  sent INTEGER := 0;
BEGIN
  FOR c IN
    SELECT id, user_id, consultation_type, scheduled_at
    FROM public.consultations
    WHERE status IN ('scheduled', 'confirmed')
      AND reminder_sent_at IS NULL
      AND user_id IS NOT NULL
      AND scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.create_user_notification(
      c.user_id, 'consultation_reminder', 'Reminder: consultation tomorrow',
      format('Your %s is at %s. Please be on time and keep your documents ready.',
        lower(replace(COALESCE(c.consultation_type, 'consultation'), '_', ' ')),
        to_char(c.scheduled_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST'),
      '/dashboard/appointments', 'View appointment'
    );
    UPDATE public.consultations SET reminder_sent_at = NOW() WHERE id = c.id;
    sent := sent + 1;
  END LOOP;
  RETURN sent;
END;
$$;

REVOKE ALL ON FUNCTION public.send_consultation_reminders() FROM PUBLIC, anon, authenticated;

-- A moved appointment should get a fresh reminder.
CREATE OR REPLACE FUNCTION public.reset_consultation_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at THEN
    NEW.reminder_sent_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_consultation_reminder ON public.consultations;
CREATE TRIGGER trg_reset_consultation_reminder
  BEFORE UPDATE OF scheduled_at ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.reset_consultation_reminder();

-- Hourly schedule when pg_cron is enabled (Database → Extensions → pg_cron).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'consultation-reminders';
    PERFORM cron.schedule('consultation-reminders', '7 * * * *', 'SELECT public.send_consultation_reminders()');
  ELSE
    RAISE NOTICE 'pg_cron is not enabled: enable it and re-run this file to send 24-hour reminders automatically.';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
