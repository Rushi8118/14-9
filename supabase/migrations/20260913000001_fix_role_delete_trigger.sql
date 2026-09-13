-- Fix: prevent_system_role_modification() always returned NEW, but on a
-- BEFORE DELETE trigger NEW is NULL. Returning NULL from a BEFORE DELETE
-- trigger silently cancels the delete, so deleting a non-system role
-- appeared to succeed (no error) but the row was never removed.
-- Fix: return OLD for DELETE, NEW for UPDATE, as Postgres requires.

CREATE OR REPLACE FUNCTION prevent_system_role_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_system THEN
    RAISE EXCEPTION 'System roles cannot be modified or deleted';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;
