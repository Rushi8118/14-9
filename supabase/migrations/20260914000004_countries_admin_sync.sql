-- Countries admin: allow staff with countries.delete to delete rows, and broadcast
-- row changes over Supabase Realtime so public pages refresh without a reload.

DROP POLICY IF EXISTS "Staff can delete countries" ON countries;
CREATE POLICY "Staff can delete countries" ON countries
  FOR DELETE USING (user_has_permission(ARRAY['countries.delete']));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'countries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.countries;
  END IF;
END $$;
