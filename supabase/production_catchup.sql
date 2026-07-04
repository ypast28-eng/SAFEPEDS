-- =============================================================================
-- SAFEPEDS / PED Health AI — Production schema catch-up (idempotent)
-- Paste this entire script into the Supabase SQL Editor and run once.
-- Safe on existing databases: preserves all data, uses IF NOT EXISTS / OR REPLACE.
-- Covers migrations 20250701000000 through 20250714000000.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Shared helpers ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Enums (idempotent) ───────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.compound_type_enum AS ENUM (
  'anabolic','androgen','peptide','hormone','sarm','fat_loss','pct','ancillary','support','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.administration_enum AS ENUM (
  'oral','intramuscular','subcutaneous','intravenous','transdermal','nasal','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.dose_unit_enum AS ENUM ('mg','mcg','IU','ml'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.bloodwork_status_enum AS ENUM ('Low','Normal','High'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.risk_assessment_type_enum AS ENUM ('calculate','compare','what_if'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.ai_memory_type_enum AS ENUM (
  'training_goal','current_cycle','conversation_summary','user_preference','last_report_context'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.ai_feature_enum AS ENUM (
  'bloodwork_report','cycle_report','timeline','insights','chat'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.ai_report_type_enum AS ENUM (
  'bloodwork','cycle','timeline','insights'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.knowledge_difficulty_enum AS ENUM ('beginner','intermediate','advanced'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.support_option_type_enum AS ENUM (
  'Lifestyle','Monitoring','Nutrition','Supplement','Medication Information','Educational'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  age integer CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
  sex text CHECK (sex IS NULL OR sex IN ('male','female','other','prefer_not_to_say')),
  height numeric CHECK (height IS NULL OR (height > 0 AND height <= 300)),
  weight numeric CHECK (weight IS NULL OR (weight > 0 AND weight <= 500)),
  body_fat numeric CHECK (body_fat IS NULL OR (body_fat >= 0 AND body_fat <= 100)),
  training_experience text CHECK (
    training_experience IS NULL
    OR training_experience IN ('beginner','intermediate','advanced','elite')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Compounds & cycles ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.compound_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.compound_categories (id) ON DELETE RESTRICT,
  name text NOT NULL,
  scientific_name text,
  compound_type public.compound_type_enum NOT NULL DEFAULT 'other',
  administration public.administration_enum NOT NULL DEFAULT 'other',
  ester text,
  half_life text,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

CREATE INDEX IF NOT EXISTS compounds_category_id_idx ON public.compounds (category_id);
CREATE INDEX IF NOT EXISTS compounds_active_idx ON public.compounds (active) WHERE active = true;

CREATE TABLE IF NOT EXISTS public.compound_profiles (
  compound_id uuid PRIMARY KEY REFERENCES public.compounds (id) ON DELETE CASCADE,
  liver_toxicity smallint CHECK (liver_toxicity IS NULL OR (liver_toxicity BETWEEN 0 AND 10)),
  kidney_toxicity smallint CHECK (kidney_toxicity IS NULL OR (kidney_toxicity BETWEEN 0 AND 10)),
  cardiovascular_toxicity smallint CHECK (cardiovascular_toxicity IS NULL OR (cardiovascular_toxicity BETWEEN 0 AND 10)),
  lipid_impact smallint CHECK (lipid_impact IS NULL OR (lipid_impact BETWEEN 0 AND 10)),
  hematocrit_impact smallint CHECK (hematocrit_impact IS NULL OR (hematocrit_impact BETWEEN 0 AND 10)),
  blood_pressure_impact smallint CHECK (blood_pressure_impact IS NULL OR (blood_pressure_impact BETWEEN 0 AND 10)),
  estrogenic_activity smallint CHECK (estrogenic_activity IS NULL OR (estrogenic_activity BETWEEN 0 AND 10)),
  androgenic_activity smallint CHECK (androgenic_activity IS NULL OR (androgenic_activity BETWEEN 0 AND 10)),
  prolactin_activity smallint CHECK (prolactin_activity IS NULL OR (prolactin_activity BETWEEN 0 AND 10)),
  bloodwork_markers text[] NOT NULL DEFAULT '{}',
  monitoring_frequency text,
  mechanism_of_action text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  cycle_name text NOT NULL,
  goal text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_cycles_user_id_idx ON public.user_cycles (user_id);

CREATE TABLE IF NOT EXISTS public.cycle_compounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.user_cycles (id) ON DELETE CASCADE,
  compound_id uuid NOT NULL REFERENCES public.compounds (id) ON DELETE RESTRICT,
  dose_amount numeric NOT NULL CHECK (dose_amount > 0),
  dose_unit public.dose_unit_enum NOT NULL DEFAULT 'mg',
  frequency text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cycle_compounds_cycle_id_idx ON public.cycle_compounds (cycle_id);

DROP TRIGGER IF EXISTS user_cycles_updated_at ON public.user_cycles;
CREATE TRIGGER user_cycles_updated_at
  BEFORE UPDATE ON public.user_cycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Bloodwork core tables ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blood_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  default_unit text,
  default_reference_low numeric,
  default_reference_high numeric,
  display_order smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blood_markers_category_idx ON public.blood_markers (category);
CREATE INDEX IF NOT EXISTS blood_markers_active_idx ON public.blood_markers (active) WHERE active = true;

CREATE TABLE IF NOT EXISTS public.bloodwork_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  report_name text NOT NULL,
  lab_name text,
  collection_date date NOT NULL,
  uploaded_file_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bloodwork_reports_user_id_idx ON public.bloodwork_reports (user_id);
CREATE INDEX IF NOT EXISTS bloodwork_reports_collection_date_idx ON public.bloodwork_reports (collection_date DESC);

CREATE TABLE IF NOT EXISTS public.bloodwork_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.bloodwork_reports (id) ON DELETE CASCADE,
  marker_name text NOT NULL,
  category text NOT NULL,
  result_value numeric NOT NULL,
  unit text NOT NULL,
  reference_low numeric,
  reference_high numeric,
  status public.bloodwork_status_enum,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bloodwork_results_report_id_idx ON public.bloodwork_results (report_id);
CREATE INDEX IF NOT EXISTS bloodwork_results_marker_name_idx ON public.bloodwork_results (marker_name);

CREATE TABLE IF NOT EXISTS public.bloodwork_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  marker_name text NOT NULL,
  result_value numeric NOT NULL,
  unit text NOT NULL,
  collection_date date NOT NULL,
  report_id uuid REFERENCES public.bloodwork_reports (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bloodwork_history_user_marker_date_idx
  ON public.bloodwork_history (user_id, marker_name, collection_date DESC);

-- ─── Bloodwork incremental columns (20250710–20250714) ────────────────────────

ALTER TABLE public.bloodwork_reports
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_type text,
  ADD COLUMN IF NOT EXISTS file_size integer,
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS phase text DEFAULT 'cruise',
  ADD COLUMN IF NOT EXISTS extraction_snapshot jsonb;

ALTER TABLE public.bloodwork_results
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS panel text,
  ADD COLUMN IF NOT EXISTS marker text,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS numeric_value numeric,
  ADD COLUMN IF NOT EXISTS comparator text,
  ADD COLUMN IF NOT EXISTS flag text,
  ADD COLUMN IF NOT EXISTS reference_range text,
  ADD COLUMN IF NOT EXISTS range_low numeric,
  ADD COLUMN IF NOT EXISTS range_high numeric,
  ADD COLUMN IF NOT EXISTS result_text text;

UPDATE public.bloodwork_reports SET phase = 'cruise' WHERE phase IS NULL;
ALTER TABLE public.bloodwork_reports ALTER COLUMN phase SET DEFAULT 'cruise';

DO $$
DECLARE conname text;
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

ALTER TABLE public.bloodwork_reports DROP CONSTRAINT IF EXISTS bloodwork_reports_phase_check;
ALTER TABLE public.bloodwork_reports
  ADD CONSTRAINT bloodwork_reports_phase_check
  CHECK (phase IN ('cruise','blast','off','unknown'));

CREATE INDEX IF NOT EXISTS bloodwork_reports_user_phase_idx
  ON public.bloodwork_reports (user_id, phase, collection_date DESC);

CREATE INDEX IF NOT EXISTS bloodwork_results_user_id_idx
  ON public.bloodwork_results (user_id);

-- Backfill structured ↔ legacy columns on existing rows
UPDATE public.bloodwork_results br
SET
  user_id = COALESCE(br.user_id, r.user_id),
  panel = COALESCE(NULLIF(trim(br.panel), ''), NULLIF(trim(br.category), ''), 'Other'),
  marker = COALESCE(NULLIF(trim(br.marker), ''), NULLIF(trim(br.marker_name), '')),
  marker_name = COALESCE(NULLIF(trim(br.marker_name), ''), NULLIF(trim(br.marker), '')),
  category = COALESCE(NULLIF(trim(br.category), ''), NULLIF(trim(br.panel), ''), 'Other'),
  result = COALESCE(NULLIF(trim(br.result), ''), NULLIF(trim(br.result_text), ''), br.result_value::text),
  result_text = COALESCE(NULLIF(trim(br.result_text), ''), NULLIF(trim(br.result), ''), br.result_value::text),
  numeric_value = COALESCE(br.numeric_value, br.result_value),
  result_value = COALESCE(br.result_value, br.numeric_value),
  range_low = COALESCE(br.range_low, br.reference_low),
  range_high = COALESCE(br.range_high, br.reference_high),
  reference_low = COALESCE(br.reference_low, br.range_low),
  reference_high = COALESCE(br.reference_high, br.range_high),
  unit = COALESCE(br.unit, '')
FROM public.bloodwork_reports r
WHERE br.report_id = r.id
  AND (
    br.user_id IS NULL OR br.panel IS NULL OR br.marker IS NULL OR br.marker_name IS NULL
    OR br.result IS NULL OR br.numeric_value IS NULL OR br.result_value IS NULL
    OR (br.range_low IS NULL AND br.reference_low IS NOT NULL)
    OR (br.range_high IS NULL AND br.reference_high IS NOT NULL)
  );

-- ─── Bloodwork functions & triggers ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.calculate_bloodwork_status(
  val numeric, ref_low numeric, ref_high numeric
)
RETURNS public.bloodwork_status_enum
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF ref_low IS NOT NULL AND val < ref_low THEN RETURN 'Low'::public.bloodwork_status_enum; END IF;
  IF ref_high IS NOT NULL AND val > ref_high THEN RETURN 'High'::public.bloodwork_status_enum; END IF;
  IF ref_low IS NOT NULL OR ref_high IS NOT NULL THEN RETURN 'Normal'::public.bloodwork_status_enum; END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bloodwork_results_normalize_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NULLIF(trim(NEW.marker_name), ''), NULL) IS NULL AND NEW.marker IS NOT NULL THEN
    NEW.marker_name := NULLIF(trim(NEW.marker), '');
  END IF;
  IF COALESCE(NULLIF(trim(NEW.marker), ''), NULL) IS NULL AND NEW.marker_name IS NOT NULL THEN
    NEW.marker := NULLIF(trim(NEW.marker_name), '');
  END IF;
  IF COALESCE(NULLIF(trim(NEW.category), ''), NULL) IS NULL THEN
    NEW.category := COALESCE(NULLIF(trim(NEW.panel), ''), 'Other');
  END IF;
  IF COALESCE(NULLIF(trim(NEW.panel), ''), NULL) IS NULL THEN
    NEW.panel := COALESCE(NULLIF(trim(NEW.category), ''), 'Other');
  END IF;
  IF NEW.result_value IS NULL AND NEW.numeric_value IS NOT NULL THEN NEW.result_value := NEW.numeric_value; END IF;
  IF NEW.numeric_value IS NULL AND NEW.result_value IS NOT NULL THEN NEW.numeric_value := NEW.result_value; END IF;
  IF NEW.reference_low IS NULL AND NEW.range_low IS NOT NULL THEN NEW.reference_low := NEW.range_low; END IF;
  IF NEW.range_low IS NULL AND NEW.reference_low IS NOT NULL THEN NEW.range_low := NEW.reference_low; END IF;
  IF NEW.reference_high IS NULL AND NEW.range_high IS NOT NULL THEN NEW.reference_high := NEW.range_high; END IF;
  IF NEW.range_high IS NULL AND NEW.reference_high IS NOT NULL THEN NEW.range_high := NEW.reference_high; END IF;
  IF COALESCE(NULLIF(trim(NEW.result_text), ''), NULL) IS NULL AND NEW.result IS NOT NULL THEN
    NEW.result_text := NULLIF(trim(NEW.result), '');
  END IF;
  IF COALESCE(NULLIF(trim(NEW.result), ''), NULL) IS NULL AND NEW.result_text IS NOT NULL THEN
    NEW.result := NULLIF(trim(NEW.result_text), '');
  END IF;
  IF NEW.result IS NULL AND NEW.result_value IS NOT NULL THEN NEW.result := NEW.result_value::text; END IF;
  IF NEW.unit IS NULL THEN NEW.unit := ''; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bloodwork_results_set_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT br.user_id INTO NEW.user_id FROM public.bloodwork_reports br WHERE br.id = NEW.report_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_bloodwork_history_from_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_collection_date date;
  v_marker_name text;
  v_result_value numeric;
  v_ref_low numeric;
  v_ref_high numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_marker_name := COALESCE(OLD.marker, OLD.marker_name);
    SELECT br.user_id, br.collection_date INTO v_user_id, v_collection_date
    FROM public.bloodwork_reports br WHERE br.id = OLD.report_id;
    DELETE FROM public.bloodwork_history
    WHERE user_id = v_user_id AND marker_name = v_marker_name
      AND collection_date = v_collection_date AND report_id = OLD.report_id;
    RETURN OLD;
  END IF;

  v_marker_name := COALESCE(NEW.marker, NEW.marker_name);
  v_result_value := COALESCE(NEW.numeric_value, NEW.result_value);
  v_ref_low := COALESCE(NEW.range_low, NEW.reference_low);
  v_ref_high := COALESCE(NEW.range_high, NEW.reference_high);

  SELECT br.user_id, br.collection_date INTO v_user_id, v_collection_date
  FROM public.bloodwork_reports br WHERE br.id = NEW.report_id;

  IF NEW.user_id IS NULL THEN NEW.user_id := v_user_id; END IF;
  IF NEW.status IS NULL THEN
    NEW.status := public.calculate_bloodwork_status(v_result_value, v_ref_low, v_ref_high);
  END IF;

  DELETE FROM public.bloodwork_history
  WHERE user_id = v_user_id AND marker_name = v_marker_name
    AND collection_date = v_collection_date AND report_id = NEW.report_id;

  INSERT INTO public.bloodwork_history (user_id, marker_name, result_value, unit, collection_date, report_id)
  VALUES (v_user_id, v_marker_name, v_result_value, NEW.unit, v_collection_date, NEW.report_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bloodwork_reports_updated_at ON public.bloodwork_reports;
CREATE TRIGGER bloodwork_reports_updated_at
  BEFORE UPDATE ON public.bloodwork_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS bloodwork_results_normalize_columns ON public.bloodwork_results;
CREATE TRIGGER bloodwork_results_normalize_columns
  BEFORE INSERT OR UPDATE ON public.bloodwork_results
  FOR EACH ROW EXECUTE FUNCTION public.bloodwork_results_normalize_columns();

DROP TRIGGER IF EXISTS bloodwork_results_set_user_id ON public.bloodwork_results;
CREATE TRIGGER bloodwork_results_set_user_id
  BEFORE INSERT ON public.bloodwork_results
  FOR EACH ROW EXECUTE FUNCTION public.bloodwork_results_set_user_id();

DROP TRIGGER IF EXISTS bloodwork_results_sync_history ON public.bloodwork_results;
CREATE TRIGGER bloodwork_results_sync_history
  AFTER INSERT OR UPDATE ON public.bloodwork_results
  FOR EACH ROW EXECUTE FUNCTION public.sync_bloodwork_history_from_result();

DROP TRIGGER IF EXISTS bloodwork_results_delete_history ON public.bloodwork_results;
CREATE TRIGGER bloodwork_results_delete_history
  AFTER DELETE ON public.bloodwork_results
  FOR EACH ROW EXECUTE FUNCTION public.sync_bloodwork_history_from_result();

-- ─── Risk engine ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.risk_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  display_order smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.risk_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  category_slug text NOT NULL REFERENCES public.risk_categories (slug) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  condition jsonb NOT NULL DEFAULT '{}',
  weight numeric NOT NULL DEFAULT 10 CHECK (weight >= 0 AND weight <= 100),
  evidence_placeholder text,
  explanation text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_rules_category_slug_idx ON public.risk_rules (category_slug);
CREATE INDEX IF NOT EXISTS risk_rules_enabled_idx ON public.risk_rules (enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES public.user_cycles (id) ON DELETE SET NULL,
  assessment_type public.risk_assessment_type_enum NOT NULL DEFAULT 'calculate',
  input_snapshot jsonb NOT NULL DEFAULT '{}',
  output jsonb NOT NULL DEFAULT '{}',
  overall_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_assessments_user_id_idx ON public.risk_assessments (user_id, created_at DESC);

DROP TRIGGER IF EXISTS risk_rules_updated_at ON public.risk_rules;
CREATE TRIGGER risk_rules_updated_at
  BEFORE UPDATE ON public.risk_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── AI intelligence ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.educational_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  summary text,
  body text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.educational_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.educational_articles (id) ON DELETE SET NULL,
  compound_id uuid REFERENCES public.compounds (id) ON DELETE SET NULL,
  title text NOT NULL,
  url text,
  citation_text text,
  evidence_level text CHECK (evidence_level IS NULL OR evidence_level IN ('review','guideline','study','educational')),
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  memory_type public.ai_memory_type_enum NOT NULL,
  context_key text NOT NULL DEFAULT 'default',
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, memory_type, context_key)
);

CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  feature public.ai_feature_enum NOT NULL,
  model text,
  prompt_hash text,
  input_snapshot jsonb NOT NULL DEFAULT '{}',
  output_snapshot jsonb,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success','error','blocked')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  report_type public.ai_report_type_enum NOT NULL,
  source_id uuid,
  model text,
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_memory_user_id_idx ON public.ai_memory (user_id);
CREATE INDEX IF NOT EXISTS ai_audit_logs_user_id_idx ON public.ai_audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_reports_user_type_idx ON public.ai_reports (user_id, report_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_chat_messages_user_idx ON public.ai_chat_messages (user_id, created_at DESC);

-- ─── Knowledge base ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_id uuid NOT NULL REFERENCES public.knowledge_categories (id) ON DELETE RESTRICT,
  summary text,
  content text NOT NULL DEFAULT '',
  difficulty_level public.knowledge_difficulty_enum NOT NULL DEFAULT 'beginner',
  image_url text,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  published boolean NOT NULL DEFAULT false,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.knowledge_articles (id) ON DELETE CASCADE,
  title text NOT NULL,
  authors text,
  journal text,
  publication_year smallint,
  doi text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compound_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_id uuid NOT NULL REFERENCES public.compounds (id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.knowledge_articles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (compound_id, article_id)
);

CREATE TABLE IF NOT EXISTS public.blood_marker_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_marker_id uuid NOT NULL REFERENCES public.blood_markers (id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.knowledge_articles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blood_marker_id, article_id)
);

CREATE OR REPLACE FUNCTION public.knowledge_articles_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knowledge_articles_search_vector ON public.knowledge_articles;
CREATE TRIGGER knowledge_articles_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, content ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_articles_search_vector_update();

CREATE OR REPLACE FUNCTION public.increment_knowledge_article_view_count(article_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.knowledge_articles SET view_count = view_count + 1 WHERE slug = article_slug;
END;
$$;

-- ─── Health support library ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.health_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  summary text,
  content text NOT NULL DEFAULT '',
  overview text,
  why_it_matters text,
  blood_markers_involved text[] NOT NULL DEFAULT '{}',
  image_url text,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  published boolean NOT NULL DEFAULT false,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.health_topics (id) ON DELETE CASCADE,
  title text NOT NULL,
  type public.support_option_type_enum NOT NULL DEFAULT 'Educational',
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_option_id uuid NOT NULL REFERENCES public.support_options (id) ON DELETE CASCADE,
  description text NOT NULL,
  scientific_references jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_topic_blood_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.health_topics (id) ON DELETE CASCADE,
  blood_marker_id uuid NOT NULL REFERENCES public.blood_markers (id) ON DELETE CASCADE,
  UNIQUE (topic_id, blood_marker_id)
);

CREATE TABLE IF NOT EXISTS public.health_topic_compounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.health_topics (id) ON DELETE CASCADE,
  compound_id uuid NOT NULL REFERENCES public.compounds (id) ON DELETE CASCADE,
  UNIQUE (topic_id, compound_id)
);

CREATE TABLE IF NOT EXISTS public.health_topic_knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.health_topics (id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.knowledge_articles (id) ON DELETE CASCADE,
  UNIQUE (topic_id, article_id)
);

CREATE TABLE IF NOT EXISTS public.risk_category_health_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_category_slug text NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.health_topics (id) ON DELETE CASCADE,
  UNIQUE (risk_category_slug, topic_id)
);

CREATE TABLE IF NOT EXISTS public.health_topic_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.health_topics (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.health_topic_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.health_topics (id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.health_topics_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.overview, '')), 'B');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS health_topics_search_vector ON public.health_topics;
CREATE TRIGGER health_topics_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, content, overview ON public.health_topics
  FOR EACH ROW EXECUTE FUNCTION public.health_topics_search_vector_update();

CREATE OR REPLACE FUNCTION public.increment_health_topic_view_count(topic_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.health_topics SET view_count = view_count + 1 WHERE slug = topic_slug;
END;
$$;

-- ─── Row Level Security (enable + idempotent policies) ──────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compound_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compound_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloodwork_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloodwork_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloodwork_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compound_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_marker_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_topic_blood_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_topic_compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_topic_knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_category_health_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_topic_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_topic_views ENABLE ROW LEVEL SECURITY;

DO $policies$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT * FROM (VALUES
    ('profiles','Users can view own profile','SELECT','authenticated','auth.uid() = id',NULL),
    ('profiles','Users can insert own profile','INSERT','authenticated',NULL,'auth.uid() = id'),
    ('profiles','Users can update own profile','UPDATE','authenticated','auth.uid() = id','auth.uid() = id'),
    ('compound_categories','Authenticated users can read compound categories','SELECT','authenticated','true',NULL),
    ('compounds','Authenticated users can read active compounds','SELECT','authenticated','active = true',NULL),
    ('compound_profiles','Authenticated users can read compound profiles','SELECT','authenticated','true',NULL),
    ('user_cycles','Users can view own cycles','SELECT','authenticated','auth.uid() = user_id',NULL),
    ('user_cycles','Users can insert own cycles','INSERT','authenticated',NULL,'auth.uid() = user_id'),
    ('user_cycles','Users can update own cycles','UPDATE','authenticated','auth.uid() = user_id','auth.uid() = user_id'),
    ('user_cycles','Users can delete own cycles','DELETE','authenticated','auth.uid() = user_id',NULL),
    ('cycle_compounds','Users can view own cycle compounds','SELECT','authenticated',
      'exists (select 1 from public.user_cycles uc where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid())',NULL),
    ('cycle_compounds','Users can insert own cycle compounds','INSERT','authenticated',NULL,
      'exists (select 1 from public.user_cycles uc where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid())'),
    ('cycle_compounds','Users can update own cycle compounds','UPDATE','authenticated',
      'exists (select 1 from public.user_cycles uc where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid())',
      'exists (select 1 from public.user_cycles uc where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid())'),
    ('cycle_compounds','Users can delete own cycle compounds','DELETE','authenticated',
      'exists (select 1 from public.user_cycles uc where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid())',NULL),
    ('blood_markers','Authenticated users can read blood markers','SELECT','authenticated','active = true',NULL),
    ('bloodwork_reports','Users can view own reports','SELECT','authenticated','auth.uid() = user_id',NULL),
    ('bloodwork_reports','Users can insert own reports','INSERT','authenticated',NULL,'auth.uid() = user_id'),
    ('bloodwork_reports','Users can update own reports','UPDATE','authenticated','auth.uid() = user_id','auth.uid() = user_id'),
    ('bloodwork_reports','Users can delete own reports','DELETE','authenticated','auth.uid() = user_id',NULL),
    ('bloodwork_results','Users can view own results','SELECT','authenticated',
      'exists (select 1 from public.bloodwork_reports br where br.id = bloodwork_results.report_id and br.user_id = auth.uid())',NULL),
    ('bloodwork_results','Users can insert own results','INSERT','authenticated',NULL,
      'exists (select 1 from public.bloodwork_reports br where br.id = bloodwork_results.report_id and br.user_id = auth.uid())'),
    ('bloodwork_results','Users can update own results','UPDATE','authenticated',
      'exists (select 1 from public.bloodwork_reports br where br.id = bloodwork_results.report_id and br.user_id = auth.uid())',
      'exists (select 1 from public.bloodwork_reports br where br.id = bloodwork_results.report_id and br.user_id = auth.uid())'),
    ('bloodwork_results','Users can delete own results','DELETE','authenticated',
      'exists (select 1 from public.bloodwork_reports br where br.id = bloodwork_results.report_id and br.user_id = auth.uid())',NULL),
    ('bloodwork_history','Users can view own history','SELECT','authenticated','auth.uid() = user_id',NULL),
    ('bloodwork_history','Users can insert own history','INSERT','authenticated',NULL,'auth.uid() = user_id'),
    ('bloodwork_history','Users can delete own history','DELETE','authenticated','auth.uid() = user_id',NULL),
    ('risk_categories','Authenticated users can read risk categories','SELECT','authenticated','active = true',NULL),
    ('risk_rules','Authenticated users can read enabled risk rules','SELECT','authenticated','enabled = true',NULL),
    ('risk_assessments','Users can view own risk assessments','SELECT','authenticated','auth.uid() = user_id',NULL),
    ('risk_assessments','Users can insert own risk assessments','INSERT','authenticated',NULL,'auth.uid() = user_id'),
    ('risk_assessments','Users can delete own risk assessments','DELETE','authenticated','auth.uid() = user_id',NULL),
    ('educational_articles','Authenticated users can read published educational articles','SELECT','authenticated','published = true',NULL),
    ('educational_references','Authenticated users can read educational references','SELECT','authenticated','true',NULL),
    ('ai_memory','Users can manage own ai memory','ALL','authenticated','auth.uid() = user_id','auth.uid() = user_id'),
    ('ai_audit_logs','Users can view own ai audit logs','SELECT','authenticated','auth.uid() = user_id',NULL),
    ('ai_reports','Users can manage own ai reports','ALL','authenticated','auth.uid() = user_id','auth.uid() = user_id'),
    ('ai_chat_messages','Users can manage own chat messages','ALL','authenticated','auth.uid() = user_id','auth.uid() = user_id'),
    ('knowledge_categories','Authenticated users can read knowledge categories','SELECT','authenticated','true',NULL),
    ('knowledge_articles','Authenticated users can read published knowledge articles','SELECT','authenticated','published = true',NULL),
    ('knowledge_references','Authenticated users can read knowledge references','SELECT','authenticated','true',NULL),
    ('compound_articles','Authenticated users can read compound articles','SELECT','authenticated','true',NULL),
    ('blood_marker_articles','Authenticated users can read blood marker articles','SELECT','authenticated','true',NULL),
    ('health_topics','Authenticated users can read published health topics','SELECT','authenticated','published = true',NULL),
    ('support_options','Authenticated users can read support options','SELECT','authenticated','true',NULL),
    ('support_details','Authenticated users can read support details','SELECT','authenticated','true',NULL),
    ('health_topic_blood_markers','Authenticated users can read health topic blood markers','SELECT','authenticated','true',NULL),
    ('health_topic_compounds','Authenticated users can read health topic compounds','SELECT','authenticated','true',NULL),
    ('health_topic_knowledge_articles','Authenticated users can read health topic knowledge articles','SELECT','authenticated','true',NULL),
    ('risk_category_health_topics','Authenticated users can read risk category health topics','SELECT','authenticated','true',NULL),
    ('health_topic_bookmarks','Users can manage own health topic bookmarks','ALL','authenticated','auth.uid() = user_id','auth.uid() = user_id'),
    ('health_topic_views','Users can manage own health topic views','ALL','authenticated','auth.uid() = user_id','auth.uid() = user_id')
  ) AS t(tablename, policyname, cmd, role_name, qual, with_check)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy pol
      JOIN pg_class cls ON cls.oid = pol.polrelid
      JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
      WHERE nsp.nspname = 'public' AND cls.relname = p.tablename AND pol.polname = p.policyname
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR %s TO %s %s %s',
        p.policyname,
        p.tablename,
        p.cmd,
        p.role_name,
        CASE WHEN p.qual IS NOT NULL THEN format('USING (%s)', p.qual) ELSE '' END,
        CASE WHEN p.with_check IS NOT NULL THEN format('WITH CHECK (%s)', p.with_check) ELSE '' END
      );
    END IF;
  END LOOP;
END
$policies$;

-- ─── Storage: bloodwork reports bucket ──────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bloodwork-reports',
  'bloodwork-reports',
  false,
  20971520,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $storage$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT * FROM (VALUES
    ('Users can upload own bloodwork files','INSERT',NULL,
      'bucket_id = ''bloodwork-reports'' and (storage.foldername(name))[1] = auth.uid()::text'),
    ('Users can view own bloodwork files','SELECT',
      'bucket_id = ''bloodwork-reports'' and (storage.foldername(name))[1] = auth.uid()::text',NULL),
    ('Users can update own bloodwork files','UPDATE',
      'bucket_id = ''bloodwork-reports'' and (storage.foldername(name))[1] = auth.uid()::text',NULL),
    ('Users can delete own bloodwork files','DELETE',
      'bucket_id = ''bloodwork-reports'' and (storage.foldername(name))[1] = auth.uid()::text',NULL)
  ) AS t(policyname, cmd, qual, with_check)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy pol
      JOIN pg_class cls ON cls.oid = pol.polrelid
      JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
      WHERE nsp.nspname = 'storage' AND cls.relname = 'objects' AND pol.polname = p.policyname
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR %s TO authenticated %s %s',
        p.policyname,
        p.cmd,
        CASE WHEN p.qual IS NOT NULL THEN format('USING (%s)', p.qual) ELSE '' END,
        CASE WHEN p.with_check IS NOT NULL THEN format('WITH CHECK (%s)', p.with_check) ELSE '' END
      );
    END IF;
  END LOOP;
END
$storage$;

-- ─── Reload PostgREST schema cache ──────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

-- Done. Retry PDF extraction after this script completes successfully.
