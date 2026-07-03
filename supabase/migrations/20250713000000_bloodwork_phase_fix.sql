-- Ensure bloodwork_reports.phase exists with cruise/blast/off/unknown values.
-- Safe to run on databases that never applied 20250711000000_bloodwork_phase.sql.

ALTER TABLE public.bloodwork_reports
  ADD COLUMN IF NOT EXISTS phase text DEFAULT 'cruise';

UPDATE public.bloodwork_reports
  SET phase = 'cruise'
  WHERE phase IS NULL;

ALTER TABLE public.bloodwork_reports
  ALTER COLUMN phase SET DEFAULT 'cruise';

DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'bloodwork_reports'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%phase%'
  LOOP
    EXECUTE format('ALTER TABLE public.bloodwork_reports DROP CONSTRAINT IF EXISTS %I', conname);
  END LOOP;
END $$;

ALTER TABLE public.bloodwork_reports
  DROP CONSTRAINT IF EXISTS bloodwork_reports_phase_check;

ALTER TABLE public.bloodwork_reports
  ADD CONSTRAINT bloodwork_reports_phase_check
  CHECK (phase IN ('cruise', 'blast', 'off', 'unknown'));

COMMENT ON COLUMN public.bloodwork_reports.phase IS
  'Bloodwork collection phase: cruise (baseline), blast (cycle), off, or unknown.';

CREATE INDEX IF NOT EXISTS bloodwork_reports_user_phase_idx
  ON public.bloodwork_reports (user_id, phase, collection_date DESC);

NOTIFY pgrst, 'reload schema';
