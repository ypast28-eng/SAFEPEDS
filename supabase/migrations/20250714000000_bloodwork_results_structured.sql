-- Structured bloodwork_results columns for PDF extraction (panel, marker, comparator, etc.)
-- Safe to run when legacy columns (marker_name, result_value, …) still exist.

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
  ADD COLUMN IF NOT EXISTS range_high numeric;

COMMENT ON COLUMN public.bloodwork_results.panel IS 'Lab panel / section from the report';
COMMENT ON COLUMN public.bloodwork_results.marker IS 'Marker name as printed on the lab report';
COMMENT ON COLUMN public.bloodwork_results.result IS 'Result as printed on the lab report, e.g. <1 or 5.2';
COMMENT ON COLUMN public.bloodwork_results.numeric_value IS 'Parsed numeric value when available';
COMMENT ON COLUMN public.bloodwork_results.comparator IS 'Comparator prefix from the report, e.g. < or >';
COMMENT ON COLUMN public.bloodwork_results.flag IS 'Lab flag from the report, e.g. H or L';
COMMENT ON COLUMN public.bloodwork_results.reference_range IS 'Reference interval as printed on the lab report';
COMMENT ON COLUMN public.bloodwork_results.range_low IS 'Parsed reference range low bound';
COMMENT ON COLUMN public.bloodwork_results.range_high IS 'Parsed reference range high bound';

-- Backfill structured columns from legacy columns and parent report
UPDATE public.bloodwork_results br
SET
  user_id = COALESCE(br.user_id, r.user_id),
  panel = COALESCE(NULLIF(trim(br.panel), ''), NULLIF(trim(br.category), ''), 'Other'),
  marker = COALESCE(NULLIF(trim(br.marker), ''), NULLIF(trim(br.marker_name), '')),
  result = COALESCE(
    NULLIF(trim(br.result), ''),
    NULLIF(trim(br.result_text), ''),
    br.result_value::text
  ),
  numeric_value = COALESCE(br.numeric_value, br.result_value),
  range_low = COALESCE(br.range_low, br.reference_low),
  range_high = COALESCE(br.range_high, br.reference_high)
FROM public.bloodwork_reports r
WHERE br.report_id = r.id
  AND (
    br.user_id IS NULL
    OR br.panel IS NULL
    OR br.marker IS NULL
    OR br.result IS NULL
    OR br.numeric_value IS NULL
    OR (br.range_low IS NULL AND br.reference_low IS NOT NULL)
    OR (br.range_high IS NULL AND br.reference_high IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS bloodwork_results_user_id_idx
  ON public.bloodwork_results (user_id);

-- Default user_id from parent report when omitted on insert
CREATE OR REPLACE FUNCTION public.bloodwork_results_set_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.user_id IS NULL THEN
    SELECT br.user_id INTO new.user_id
    FROM public.bloodwork_reports br
    WHERE br.id = new.report_id;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS bloodwork_results_set_user_id ON public.bloodwork_results;
CREATE TRIGGER bloodwork_results_set_user_id
  BEFORE INSERT ON public.bloodwork_results
  FOR EACH ROW EXECUTE FUNCTION public.bloodwork_results_set_user_id();

-- History sync: prefer structured columns, fall back to legacy names
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
  IF tg_op = 'DELETE' THEN
    v_marker_name := COALESCE(old.marker, old.marker_name);
    SELECT br.user_id, br.collection_date
    INTO v_user_id, v_collection_date
    FROM public.bloodwork_reports br
    WHERE br.id = old.report_id;

    DELETE FROM public.bloodwork_history
    WHERE user_id = v_user_id
      AND marker_name = v_marker_name
      AND collection_date = v_collection_date
      AND report_id = old.report_id;
    RETURN old;
  END IF;

  v_marker_name := COALESCE(new.marker, new.marker_name);
  v_result_value := COALESCE(new.numeric_value, new.result_value);
  v_ref_low := COALESCE(new.range_low, new.reference_low);
  v_ref_high := COALESCE(new.range_high, new.reference_high);

  SELECT br.user_id, br.collection_date
  INTO v_user_id, v_collection_date
  FROM public.bloodwork_reports br
  WHERE br.id = new.report_id;

  IF new.user_id IS NULL THEN
    new.user_id := v_user_id;
  END IF;

  IF new.status IS NULL THEN
    new.status := public.calculate_bloodwork_status(v_result_value, v_ref_low, v_ref_high);
  END IF;

  DELETE FROM public.bloodwork_history
  WHERE user_id = v_user_id
    AND marker_name = v_marker_name
    AND collection_date = v_collection_date
    AND report_id = new.report_id;

  INSERT INTO public.bloodwork_history (
    user_id, marker_name, result_value, unit, collection_date, report_id
  ) VALUES (
    v_user_id, v_marker_name, v_result_value, new.unit, v_collection_date, new.report_id
  );

  RETURN new;
END;
$$;

NOTIFY pgrst, 'reload schema';
