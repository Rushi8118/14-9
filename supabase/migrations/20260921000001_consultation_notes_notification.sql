-- ============================================================
-- CONSULTATION NOTES NOTIFICATION TRIGGER
-- Ensures that when an admin or staff member adds or updates
-- consultant_notes on an appointment/consultation, the client
-- automatically receives a real-time notification on their dashboard.
-- ============================================================

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
        COALESCE(NEW.consultant_notes, format('Your %s is confirmed for %s. Please keep your documents ready.', lower(kind), slot)),
        '/dashboard/appointments', 'View appointment'
      );
    ELSIF NEW.status = 'completed' THEN
      PERFORM public.create_user_notification(
        NEW.user_id, 'consultation_reminder', 'Consultation completed',
        COALESCE(NEW.consultant_notes, format('Thank you for attending your %s on %s. Your case officer will share the next steps with you.', lower(kind), slot)),
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
  ELSIF NEW.consultant_notes IS DISTINCT FROM OLD.consultant_notes AND NULLIF(BTRIM(NEW.consultant_notes), '') IS NOT NULL THEN
    PERFORM public.create_user_notification(
      NEW.user_id, 'consultation_reminder', 'Officer reply on your appointment',
      NEW.consultant_notes,
      '/dashboard/appointments', 'View appointment'
    );
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
  AFTER INSERT OR UPDATE OF status, scheduled_at, consultant_notes ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.notify_consultation_change();
