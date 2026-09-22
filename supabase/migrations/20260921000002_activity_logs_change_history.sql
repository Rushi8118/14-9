-- ============================================================
-- ACTIVITY LOGS: Detailed Change History Support
-- Adds dedicated columns and relaxes constraints for storing
-- field-level diffs (table_name, record_id, action_type, changes,
-- old_value, new_value) for every successful data modification.
-- Safe to re-run.
-- ============================================================

-- 1. Add columns for structured change history
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS table_name TEXT,
  ADD COLUMN IF NOT EXISTS record_id TEXT,
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS changes JSONB,
  ADD COLUMN IF NOT EXISTS old_value JSONB,
  ADD COLUMN IF NOT EXISTS new_value JSONB;

-- 2. Update category constraint to include 'data_change' alongside existing categories
ALTER TABLE public.activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_category_check;

ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_category_check
  CHECK (category IN ('click', 'navigation', 'form_submit', 'data_change', 'error', 'api_error', 'app'));

-- 3. Relax details check constraint to allow richer payloads (up to 64KB)
ALTER TABLE public.activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_details_check;

ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_details_check
  CHECK (pg_column_size(details) <= 65536);

-- 4. Create indexes for fast filtering by table, record, and action type
CREATE INDEX IF NOT EXISTS activity_logs_table_record_idx ON public.activity_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_type_idx ON public.activity_logs (action_type, created_at DESC);

NOTIFY pgrst, 'reload schema';
