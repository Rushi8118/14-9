-- ============================================================
-- OFFICER CHAT: the applicant dashboard's "Officer Chat" reads and writes
-- public.messages and uploads to the chat-attachments bucket. Both were only
-- defined in supabase/add_dashboard_tables.sql, which was never migrated, so
-- every send failed with "Failed to send message".
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = sent to the Siddhivinayak desk
  message     TEXT NOT NULL DEFAULT '',
  file_url    TEXT,          -- storage path inside the private chat-attachments bucket
  file_name   VARCHAR(255),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_has_content;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_has_content CHECK (length(btrim(message)) > 0 OR file_url IS NOT NULL);

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_max_length;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_max_length CHECK (length(message) <= 5000);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON public.messages(receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_id) WHERE is_read = FALSE;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Applicants see only their own conversation.
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Applicants may only write to the desk (receiver NULL); staff may address an applicant.
DROP POLICY IF EXISTS "Users can send own messages" ON public.messages;
CREATE POLICY "Users can send own messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND is_read = FALSE
    AND (
      receiver_id IS NULL
      OR public.user_has_permission(ARRAY['applications.update', 'applications.process'])
    )
  );

DROP POLICY IF EXISTS "Receivers can mark messages read" ON public.messages;
CREATE POLICY "Receivers can mark messages read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Case officers work the whole inbox.
DROP POLICY IF EXISTS "Staff can read all messages" ON public.messages;
CREATE POLICY "Staff can read all messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.user_has_permission(ARRAY['applications.read', 'applications.process']));

DROP POLICY IF EXISTS "Staff can update messages" ON public.messages;
CREATE POLICY "Staff can update messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.user_has_permission(ARRAY['applications.update', 'applications.process']))
  WITH CHECK (public.user_has_permission(ARRAY['applications.update', 'applications.process']));

-- Receivers may flip read status, but never rewrite what was said or who said it.
CREATE OR REPLACE FUNCTION public.messages_guard_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_permission(ARRAY['applications.update', 'applications.process'])
     AND (
       NEW.sender_id   IS DISTINCT FROM OLD.sender_id
       OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
       OR NEW.message     IS DISTINCT FROM OLD.message
       OR NEW.file_url    IS DISTINCT FROM OLD.file_url
       OR NEW.file_name   IS DISTINCT FROM OLD.file_name
       OR NEW.created_at  IS DISTINCT FROM OLD.created_at
     ) THEN
    RAISE EXCEPTION 'only the read status of a message can be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_guard_update ON public.messages;
CREATE TRIGGER trg_messages_guard_update
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_guard_update();

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- Live updates for the chat window (useChat subscribes to postgres_changes on messages).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END;
$$;

-- ─── chat-attachments: PRIVATE bucket (passports, certificates) ───
-- Files are opened through short-lived signed URLs, never public links.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Uploads only into a folder named after the uploader's own user id.
DROP POLICY IF EXISTS "Users upload own chat attachments" ON storage.objects;
CREATE POLICY "Users upload own chat attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Readable by the uploader, by the other side of the message it was attached to, and by staff.
DROP POLICY IF EXISTS "Participants read chat attachments" ON storage.objects;
CREATE POLICY "Participants read chat attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.user_has_permission(ARRAY['applications.read', 'applications.process'])
      OR EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.file_url = storage.objects.name
          AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
      )
    )
  );

NOTIFY pgrst, 'reload schema';
