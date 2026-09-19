-- ============================================================
-- ADMIN NOTIFICATIONS & BROADCASTS
-- Enables staff/admins to view system-wide notifications, broadcast
-- announcements to all or specific users, and manage alert history.
-- Safe to re-run.
-- ============================================================

-- ─── List notifications for the admin notification page ──────
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
    public.user_has_permission(ARRAY['notifications.read', 'notifications.manage'])
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

-- ─── Admin Send / Broadcast Notification ─────────────────────
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
BEGIN
  IF NOT (
    public.user_has_permission(ARRAY['notifications.create', 'notifications.manage'])
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_role IN ('super_admin', 'admin', 'manager', 'superadmin')
    )
  ) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  IF NULLIF(BTRIM(p_title), '') IS NULL THEN
    RAISE EXCEPTION 'Notification title is required';
  END IF;

  IF p_target = 'user' AND p_target_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
    VALUES (p_target_id, p_type, p_title, p_message, p_action_url, p_action_label);
    RETURN 1;
  ELSIF p_target = 'customers' THEN
    FOR u IN SELECT id FROM public.user_profiles WHERE user_role = 'customer' AND (status IS NULL OR status = 'active') LOOP
      INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
      VALUES (u.id, p_type, p_title, p_message, p_action_url, p_action_label);
      v_count := v_count + 1;
    END LOOP;
  ELSIF p_target = 'staff' THEN
    FOR u IN SELECT id FROM public.user_profiles WHERE user_role IN ('super_admin', 'admin', 'manager', 'superadmin', 'visa_officer', 'counselor') AND (status IS NULL OR status = 'active') LOOP
      INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
      VALUES (u.id, p_type, p_title, p_message, p_action_url, p_action_label);
      v_count := v_count + 1;
    END LOOP;
  ELSE -- 'all'
    FOR u IN SELECT id FROM public.user_profiles WHERE status IS NULL OR status = 'active' LOOP
      INSERT INTO public.notifications (user_id, type, title, message, action_url, action_label)
      VALUES (u.id, p_type, p_title, p_message, p_action_url, p_action_label);
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_send_notification(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_notification(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ─── Admin Delete Notification ───────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.user_has_permission(ARRAY['notifications.manage'])
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

NOTIFY pgrst, 'reload schema';
