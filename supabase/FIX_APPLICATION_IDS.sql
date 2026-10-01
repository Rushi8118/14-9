-- =========================================================
-- Application reference numbers, and the consultations.priority column.
--
-- Paste the whole file into the Supabase SQL Editor and RUN once.
-- Idempotent. It issues no new ids by itself and rewrites no existing one.
--
-- FORMAT:  <COUNTRY CODE><DDMMYYYY><NN>     e.g. JPN1509202601
--
--   country code  countries.code for the application's country_id, uppercased.
--                 Whatever is in that column is what appears -- this file does
--                 not invent or normalise codes, so if a country is stored as
--                 "UK" its applications read UK… and not GBR…. Fix the code in
--                 the countries table if that is not what you want.
--   DDMMYYYY      the date in Asia/Kolkata, not UTC. An application created at
--                 2am IST belongs to that day in Surat, which is the only date
--                 anyone in the office will reconcile against.
--   NN            a counter that resets each day and is shared by every
--                 country, so the three applications taken on 15 Sep read 01,
--                 02 and 03 whichever countries they are for. Two digits, and
--                 it simply grows to three if a day ever passes 99.
--
-- A note on the counter, because it is a decision that cannot be taken back
-- once ids are issued: schema.sql had this designed per country per day, and
-- the existing JPN/GBR/CAN rows follow that. The business owner chose a single
-- daily counter instead. Old ids are left exactly as they are, so ids issued
-- before today and after today follow different rules. That is deliberate and
-- preferable to rewriting reference numbers that have already been sent to
-- applicants.
-- =========================================================


-- ── 1) consultations.priority ──────────────────────────────────────────────
-- The admin panel has a Priority control on every row, but consultations had no
-- column behind it: setting priority on an enquiry reported success and
-- reverted. get_all_applications hardcoded 'normal' for the same reason.
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'normal';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultations_priority_check'
  ) THEN
    ALTER TABLE public.consultations
      ADD CONSTRAINT consultations_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END $$;


-- ── 2) The daily counter ───────────────────────────────────────────────────
-- Keyed by date alone. A per-country key would give two countries the same
-- number on the same day, which is the thing the owner asked to avoid.
CREATE TABLE IF NOT EXISTS public.application_counters (
  ist_date DATE PRIMARY KEY,
  counter  INTEGER NOT NULL DEFAULT 0
);

-- Nobody reaches this table directly; the functions below are SECURITY DEFINER.
ALTER TABLE public.application_counters ENABLE ROW LEVEL SECURITY;


-- ── 3) generate_application_id ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_application_id(p_country_code VARCHAR)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code     TEXT;
  v_ist_date DATE;
  v_date_str TEXT;
  v_next     INTEGER;
BEGIN
  v_code := UPPER(BTRIM(COALESCE(p_country_code, '')));
  IF v_code = '' THEN
    RAISE EXCEPTION 'country code is required to generate an application id';
  END IF;

  v_ist_date := (timezone('Asia/Kolkata', now()))::date;
  v_date_str := to_char(v_ist_date, 'DDMMYYYY');

  -- Two applications submitted in the same second would otherwise read the
  -- counter before either had written it and both take the same number. The
  -- lock is held to the end of the transaction and is keyed on the date, which
  -- is exactly the scope of the counter.
  PERFORM pg_advisory_xact_lock(hashtext('application_id:' || v_date_str));

  INSERT INTO public.application_counters(ist_date, counter)
  VALUES (v_ist_date, 0)
  ON CONFLICT (ist_date) DO NOTHING;

  UPDATE public.application_counters
     SET counter = counter + 1
   WHERE ist_date = v_ist_date
  RETURNING counter INTO v_next;

  RETURN v_code || v_date_str || lpad(v_next::text, 2, '0');
END;
$$;


-- ── 4) Issue the id on insert ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_application_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- An id supplied explicitly is kept. Migrations and imports set their own,
  -- and silently replacing one would break whatever already refers to it.
  IF NEW.application_id IS NOT NULL AND BTRIM(NEW.application_id) <> '' THEN
    RETURN NEW;
  END IF;

  SELECT code INTO v_code FROM public.countries WHERE id = NEW.country_id;

  IF v_code IS NULL OR BTRIM(v_code) = '' THEN
    RAISE EXCEPTION
      'Cannot issue an application id: country % has no code in the countries table',
      NEW.country_id;
  END IF;

  NEW.application_id := public.generate_application_id(v_code);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_application_id ON public.applications;
CREATE TRIGGER trg_set_application_id
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_application_id();


-- ── 5) Check the result ────────────────────────────────────────────────────

-- Is everything in place?
SELECT 'application_counters table' AS item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                         WHERE table_schema='public' AND table_name='application_counters')
            THEN 'OK' ELSE 'MISSING' END AS state
UNION ALL SELECT 'generate_application_id()',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                         WHERE n.nspname='public' AND p.proname='generate_application_id')
            THEN 'OK' ELSE 'MISSING' END
UNION ALL SELECT 'trigger on applications',
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger
                         WHERE tgname='trg_set_application_id' AND NOT tgisinternal)
            THEN 'OK' ELSE 'MISSING' END
UNION ALL SELECT 'consultations.priority column',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema='public' AND table_name='consultations'
                           AND column_name='priority')
            THEN 'OK' ELSE 'MISSING' END;

-- Any country without a code cannot receive an application. Fix these before
-- relying on the trigger, or inserts for them will raise.
SELECT id, name, code
FROM public.countries
WHERE code IS NULL OR BTRIM(code) = ''
ORDER BY name;

-- Applications that predate the trigger and have no reference number. They are
-- left alone on purpose; this lists them so you can decide, not so the file
-- can decide for you.
SELECT COUNT(*) AS applications_without_an_id
FROM public.applications
WHERE application_id IS NULL OR BTRIM(application_id) = '';

-- What the next id issued today would look like, without consuming a number.
SELECT
  (SELECT COALESCE(MAX(code), '???') FROM public.countries WHERE BTRIM(COALESCE(code,'')) <> '')
  || to_char((timezone('Asia/Kolkata', now()))::date, 'DDMMYYYY')
  || lpad((COALESCE((SELECT counter FROM public.application_counters
                     WHERE ist_date = (timezone('Asia/Kolkata', now()))::date), 0) + 1)::text, 2, '0')
  AS example_of_the_next_id_today;
