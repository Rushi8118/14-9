-- ============================================================
-- FIX NOTIFICATIONS & BROADCAST RPC FOR ADMIN
-- Run this in the Supabase SQL Editor
--
-- This script:
-- 1. Ensures staff access works via role check and permissions
-- 2. Sets correct RLS policies on public.notifications
-- 3. Installs/updates public.admin_send_notification (broadcast engine)
-- 4. Installs/updates public.get_admin_notifications (enriched list with profiles)
-- 5. Installs/updates public.admin_delete_notification
-- Safe and idempotent to run multiple times.
-- ============================================================

-- ── 1) Ensure is_staff() helper exists ───────────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.user_role IN (
        'super_admin','superadmin','admin','manager',
        'hr','visa_officer','counselor','consultant'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- ── 2) RLS Policies on public.notifications ───────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "View notifications" ON public.notifications;
DROP POLICY IF EXISTS "Insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Update notifications" ON public.notifications;

-- Select: staff see all; users see their own
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR auth.uid() = user_id
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.read', 'notifications.manage', 'crm.read'])
    )
  );

-- Insert: staff can create for any user; users can insert for own user_id
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR auth.uid() = user_id
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.create', 'notifications.manage', 'crm.create'])
    )
  );

-- Update: staff can update any; users can mark their own as read
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    public.is_staff()
    OR auth.uid() = user_id
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.manage', 'crm.update'])
    )
  );

-- Delete: staff can delete notifications
CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (
    public.is_staff()
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.manage'])
    )
  );

-- ── 3) List Notifications with Recipient Profiles ────────────
CREATE OR REPLACE FUNCTION public.get_admin_notifications(
  p_type TEXT DEFAULT NULL,
  p_unread_only BOOLEAN DEFAULT FALSE,
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
  IF NOT (
    public.is_staff()
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.read', 'notifications.manage'])
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_role IN ('super_admin', 'admin', 'manager', 'superadmin')
    )
  ) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_data ORDER BY (row_data->>'created_at') DESC)
    FROM (
      SELECT
        jsonb_build_object(
          'id', n.id,
          'user_id', n.user_id,
          'type', n.type,
          'title', n.title,
          'message', n.message,
          'action_url', n.action_url,
          'action_label', n.action_label,
          'is_read', n.is_read,
          'read_at', n.read_at,
          'created_at', n.created_at,
          'recipient_name', p.full_name,
          'recipient_email', p.email,
          'recipient_role', p.user_role
        ) AS row_data
      FROM public.notifications n
      LEFT JOIN public.user_profiles p ON p.id = n.user_id
      WHERE
        (p_type IS NULL OR p_type = 'all' OR n.type = p_type)
        AND (NOT p_unread_only OR n.is_read = FALSE)
        AND (
          q IS NULL
          OR n.title ILIKE '%' || q || '%'
          OR n.message ILIKE '%' || q || '%'
          OR p.full_name ILIKE '%' || q || '%'
          OR p.email ILIKE '%' || q || '%'
        )
      ORDER BY n.created_at DESC
      LIMIT LEAST(GREATEST(p_limit, 1), 500)
    ) sub
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_notifications(TEXT, BOOLEAN, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_notifications(TEXT, BOOLEAN, TEXT, INTEGER) TO authenticated;

-- ── 4) Admin Broadcast / Send Notification ───────────────────
CREATE OR REPLACE FUNCTION public.admin_send_notification(
  p_target TEXT,                -- 'all', 'customers', 'staff', 'user'
  p_target_id UUID DEFAULT NULL,
  p_type TEXT DEFAULT 'general',
  p_title TEXT DEFAULT '',
  p_message TEXT DEFAULT '',
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  u RECORD;
  v_title TEXT := BTRIM(COALESCE(p_title, ''));
  v_message TEXT := NULLIF(BTRIM(COALESCE(p_message, '')), '');
  v_action_url TEXT := NULLIF(BTRIM(COALESCE(p_action_url, '')), '');
  v_action_label TEXT := NULLIF(BTRIM(COALESCE(p_action_label, '')), '');
  v_type TEXT := COALESCE(NULLIF(p_type, ''), 'general');
BEGIN
  IF NOT (
    public.is_staff()
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.create', 'notifications.manage'])
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_role IN ('super_admin', 'admin', 'manager', 'superadmin', 'hr', 'visa_officer', 'counselor', 'consultant')
    )
  ) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  IF v_title = '' THEN
    RAISE EXCEPTION 'Notification title is required';
  END IF;

  IF p_target = 'user' AND p_target_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
    VALUES (p_target_id, v_type, v_title, v_message, v_action_url, v_action_label);
    RETURN 1;

  ELSIF p_target = 'customers' THEN
    FOR u IN
      SELECT id FROM public.user_profiles
      WHERE (user_role IS NULL OR user_role NOT IN ('super_admin', 'admin', 'manager', 'superadmin', 'hr', 'visa_officer', 'counselor', 'consultant'))
        AND (status IS NULL OR LOWER(status) = 'active')
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
      VALUES (u.id, v_type, v_title, v_message, v_action_url, v_action_label);
      v_count := v_count + 1;
    END LOOP;

  ELSIF p_target = 'staff' THEN
    FOR u IN
      SELECT id FROM public.user_profiles
      WHERE user_role IN ('super_admin', 'admin', 'manager', 'superadmin', 'hr', 'visa_officer', 'counselor', 'consultant')
        AND (status IS NULL OR LOWER(status) = 'active')
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
      VALUES (u.id, v_type, v_title, v_message, v_action_url, v_action_label);
      v_count := v_count + 1;
    END LOOP;

  ELSE -- 'all'
    FOR u IN
      SELECT id FROM public.user_profiles
      WHERE (status IS NULL OR LOWER(status) = 'active')
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
      VALUES (u.id, v_type, v_title, v_message, v_action_url, v_action_label);
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_send_notification(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_notification(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ── 5) Admin Delete Notification ─────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_staff()
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.manage'])
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_role IN ('super_admin', 'admin', 'manager', 'superadmin')
    )
  ) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  DELETE FROM public.notifications WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_notification(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_notification(UUID) TO authenticated;

-- ── 6) Admin Mark Notifications Read ──────────────────────────
CREATE OR REPLACE FUNCTION public.admin_mark_notifications_read(
  p_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF NOT (
    public.is_staff()
    OR (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_permission')
      AND public.user_has_permission(ARRAY['notifications.manage', 'notifications.read'])
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_role IN ('super_admin', 'admin', 'manager', 'superadmin')
    )
  ) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  IF p_ids IS NOT NULL AND array_length(p_ids, 1) > 0 THEN
    WITH updated AS (
      UPDATE public.notifications
      SET is_read = TRUE,
          read_at = COALESCE(read_at, NOW())
      WHERE id = ANY(p_ids)
        AND is_read = FALSE
      RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM updated;
  ELSE
    WITH updated AS (
      UPDATE public.notifications
      SET is_read = TRUE,
          read_at = COALESCE(read_at, NOW())
      WHERE is_read = FALSE
      RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM updated;
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_notifications_read(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_notifications_read(UUID[]) TO authenticated;

-- Alias for convenience
CREATE OR REPLACE FUNCTION public.admin_mark_all_read(p_ids UUID[] DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.admin_mark_notifications_read(p_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_all_read(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_all_read(UUID[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
