-- ============================================================
-- KEEP user_profiles.email IN SYNC WITH THE LOGIN EMAIL
-- Changing an email updates auth.users (the login), but the site shows
-- user_profiles.email everywhere and nothing copied the new value across.
-- This trigger copies it whenever the login email changes (after the user
-- confirms, or instantly when an admin changes it), fixes existing accounts
-- that are already out of sync, and notifies the user. Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
    UPDATE public.user_profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id AND email IS DISTINCT FROM NEW.email;

    PERFORM public.create_user_notification(
      NEW.id, 'general', 'Email address changed',
      format('Your login email is now %s. If you did not make this change, contact us on +91 99250 64666.', NEW.email),
      '/dashboard/profile', 'View profile'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_profile_email_from_auth failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_profile_email_from_auth ON auth.users;
CREATE TRIGGER trg_sync_profile_email_from_auth
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email_from_auth();

-- One-time repair for accounts already out of sync.
UPDATE public.user_profiles p
SET email = u.email, updated_at = NOW()
FROM auth.users u
WHERE u.id = p.id
  AND u.email IS NOT NULL
  AND p.email IS DISTINCT FROM u.email;

NOTIFY pgrst, 'reload schema';
