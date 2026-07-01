-- PED Health AI — Seed supported blood markers (extensible via DB only)

INSERT INTO public.blood_markers (name, category, default_unit, display_order) VALUES
  -- Complete Blood Count
  ('Hemoglobin', 'Complete Blood Count', 'g/dL', 1),
  ('Hematocrit', 'Complete Blood Count', '%', 2),
  ('RBC', 'Complete Blood Count', 'M/uL', 3),
  ('WBC', 'Complete Blood Count', 'K/uL', 4),
  ('Platelets', 'Complete Blood Count', 'K/uL', 5),
  -- Liver
  ('ALT', 'Liver', 'U/L', 10),
  ('AST', 'Liver', 'U/L', 11),
  ('GGT', 'Liver', 'U/L', 12),
  ('ALP', 'Liver', 'U/L', 13),
  ('Bilirubin', 'Liver', 'mg/dL', 14),
  -- Kidney
  ('Creatinine', 'Kidney', 'mg/dL', 20),
  ('eGFR', 'Kidney', 'mL/min/1.73m²', 21),
  ('Urea', 'Kidney', 'mg/dL', 22),
  -- Lipids
  ('HDL', 'Lipids', 'mg/dL', 30),
  ('LDL', 'Lipids', 'mg/dL', 31),
  ('Total Cholesterol', 'Lipids', 'mg/dL', 32),
  ('Triglycerides', 'Lipids', 'mg/dL', 33),
  -- Hormones
  ('Total Testosterone', 'Hormones', 'ng/dL', 40),
  ('Free Testosterone', 'Hormones', 'pg/mL', 41),
  ('Estradiol', 'Hormones', 'pg/mL', 42),
  ('SHBG', 'Hormones', 'nmol/L', 43),
  ('LH', 'Hormones', 'mIU/mL', 44),
  ('FSH', 'Hormones', 'mIU/mL', 45),
  ('Prolactin', 'Hormones', 'ng/mL', 46),
  -- Metabolic
  ('Glucose', 'Metabolic', 'mg/dL', 50),
  ('HbA1c', 'Metabolic', '%', 51),
  ('Insulin', 'Metabolic', 'uIU/mL', 52),
  -- Inflammation
  ('CRP', 'Inflammation', 'mg/L', 60),
  -- Other
  ('PSA', 'Other', 'ng/mL', 70),
  ('Ferritin', 'Other', 'ng/mL', 71)
ON CONFLICT (name) DO NOTHING;

-- Trend chart aliases: map display names used in trend UI
COMMENT ON TABLE public.blood_markers IS
  'Reference marker catalog. Add rows here to support new markers without application code changes.';
