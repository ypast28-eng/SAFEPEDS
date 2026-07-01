-- Seed risk categories (14 educational risk domains)

INSERT INTO public.risk_categories (slug, name, description, display_order) VALUES
  ('liver', 'Liver', 'Hepatic stress and liver enzyme monitoring considerations', 1),
  ('kidney', 'Kidney', 'Renal function and kidney-related monitoring', 2),
  ('cardiovascular', 'Cardiovascular', 'Heart and vascular system educational risk factors', 3),
  ('blood_pressure', 'Blood Pressure', 'Blood pressure monitoring considerations', 4),
  ('lipids', 'Lipids', 'Lipid panel and cholesterol-related monitoring', 5),
  ('hematocrit', 'Hematocrit', 'Red blood cell concentration and polycythemia monitoring', 6),
  ('hormonal_suppression', 'Hormonal Suppression', 'HPTA and endogenous hormone suppression considerations', 7),
  ('estrogen', 'Estrogen', 'Estrogenic activity and aromatization-related monitoring', 8),
  ('prolactin', 'Prolactin', 'Prolactin-related monitoring considerations', 9),
  ('sleep', 'Sleep', 'Sleep quality and recovery monitoring', 10),
  ('mental_wellbeing', 'Mental Wellbeing', 'Mood and psychological wellbeing monitoring', 11),
  ('fertility', 'Fertility', 'Reproductive health monitoring considerations', 12),
  ('injection_burden', 'Injection Burden', 'Injection frequency and administration burden', 13),
  ('overall_monitoring_priority', 'Overall Monitoring Priority', 'Composite monitoring priority score', 14)
ON CONFLICT (slug) DO NOTHING;

-- Placeholder rules — weights and thresholds to be refined with evidence
INSERT INTO public.risk_rules (rule_key, category_slug, name, condition, weight, evidence_placeholder, explanation, display_order) VALUES
  -- Liver
  ('liver_oral_compound', 'liver', 'Oral compound present',
    '{"type": "has_administration", "value": "oral"}', 25,
    'Placeholder — oral AAS hepatotoxicity literature', 'One or more oral compounds increases hepatic monitoring priority.', 1),
  ('liver_high_toxicity_profile', 'liver', 'Elevated liver toxicity profile',
    '{"type": "compound_profile_gte", "field": "liver_toxicity", "threshold": 5}', 20,
    'Placeholder — compound hepatotoxicity ratings', 'Compound profile indicates elevated liver toxicity placeholder score.', 2),
  ('liver_base', 'liver', 'Base liver monitoring',
    '{"type": "always"}', 10,
    'Placeholder — baseline monitoring', 'Baseline hepatic monitoring consideration for any cycle.', 3),

  -- Kidney
  ('kidney_high_toxicity', 'kidney', 'Elevated kidney toxicity profile',
    '{"type": "compound_profile_gte", "field": "kidney_toxicity", "threshold": 5}', 20,
    'Placeholder — nephrotoxicity ratings', 'Compound profile indicates kidney monitoring priority.', 1),
  ('kidney_base', 'kidney', 'Base kidney monitoring',
    '{"type": "always"}', 8, 'Placeholder', 'Baseline renal monitoring consideration.', 2),

  -- Cardiovascular
  ('cv_profile_elevated', 'cardiovascular', 'Elevated cardiovascular profile',
    '{"type": "compound_profile_gte", "field": "cardiovascular_toxicity", "threshold": 5}', 22,
    'Placeholder — CV risk literature', 'Compound cardiovascular toxicity placeholder elevated.', 1),
  ('cv_lipid_impact', 'cardiovascular', 'Lipid impact compounds',
    '{"type": "compound_profile_gte", "field": "lipid_impact", "threshold": 5}', 18,
    'Placeholder — lipid impact data', 'Compounds with lipid impact placeholder scores present.', 2),
  ('cv_base', 'cardiovascular', 'Base cardiovascular monitoring',
    '{"type": "always"}', 10, 'Placeholder', 'Baseline cardiovascular monitoring consideration.', 3),

  -- Blood Pressure
  ('bp_profile_elevated', 'blood_pressure', 'BP impact profile',
    '{"type": "compound_profile_gte", "field": "blood_pressure_impact", "threshold": 5}', 25,
    'Placeholder — BP impact data', 'Compounds with blood pressure impact placeholder present.', 1),
  ('bp_base', 'blood_pressure', 'Base BP monitoring',
    '{"type": "always"}', 8, 'Placeholder', 'Baseline blood pressure monitoring consideration.', 2),

  -- Lipids
  ('lipids_profile', 'lipids', 'Lipid impact profile',
    '{"type": "compound_profile_gte", "field": "lipid_impact", "threshold": 4}', 22,
    'Placeholder — lipid literature', 'Lipid-affecting compounds in stack.', 1),
  ('lipids_bloodwork_ldl', 'lipids', 'Elevated LDL on bloodwork',
    '{"type": "bloodwork_marker_status", "marker": "LDL", "status": "High"}', 15,
    'Placeholder — user-supplied lab ranges', 'Latest LDL marked High per user reference range.', 2),
  ('lipids_base', 'lipids', 'Base lipid monitoring',
    '{"type": "always"}', 10, 'Placeholder', 'Baseline lipid panel monitoring.', 3),

  -- Hematocrit
  ('hema_profile', 'hematocrit', 'Hematocrit impact profile',
    '{"type": "compound_profile_gte", "field": "hematocrit_impact", "threshold": 5}', 22,
    'Placeholder — erythropoiesis data', 'Compounds with hematocrit impact placeholder.', 1),
  ('hema_bloodwork', 'hematocrit', 'Elevated hematocrit on bloodwork',
    '{"type": "bloodwork_marker_status", "marker": "Hematocrit", "status": "High"}', 18,
    'Placeholder — CBC ranges', 'Hematocrit marked High per user reference range.', 2),
  ('hema_testosterone', 'hematocrit', 'Testosterone present',
    '{"type": "compound_category_contains", "category": "Testosterone"}', 12,
    'Placeholder — testosterone RBC literature', 'Testosterone category compound in cycle.', 3),

  -- Hormonal Suppression
  ('hormonal_exogenous', 'hormonal_suppression', 'Exogenous androgen use',
    '{"type": "compound_type_any", "values": ["anabolic", "androgen"]}', 20,
    'Placeholder — HPTA suppression literature', 'Exogenous androgenic compounds present.', 1),
  ('hormonal_19nor', 'hormonal_suppression', '19-Nor compound',
    '{"type": "compound_category_contains", "category": "19-Nor"}', 18,
    'Placeholder — 19-nor suppression data', '19-Nor category compound detected.', 2),
  ('hormonal_base', 'hormonal_suppression', 'Base hormonal monitoring',
    '{"type": "always"}', 8, 'Placeholder', 'Baseline hormone panel monitoring.', 3),

  -- Estrogen
  ('estrogen_aromatizable', 'estrogen', 'Estrogenic activity profile',
    '{"type": "compound_profile_gte", "field": "estrogenic_activity", "threshold": 5}', 22,
    'Placeholder — aromatization data', 'Compounds with estrogenic activity placeholder.', 1),
  ('estrogen_no_ai', 'estrogen', 'No estrogen control compound',
    '{"type": "not_has_category", "category": "Estrogen Control"}', 12,
    'Placeholder — ancillary use patterns', 'No estrogen control compound in stack.', 2),

  -- Prolactin
  ('prolactin_19nor', 'prolactin', '19-Nor / prolactin activity',
    '{"type": "compound_category_contains", "category": "19-Nor"}', 20,
    'Placeholder — prolactin literature', '19-Nor compounds may increase prolactin monitoring priority.', 1),
  ('prolactin_profile', 'prolactin', 'Prolactin activity profile',
    '{"type": "compound_profile_gte", "field": "prolactin_activity", "threshold": 5}', 18,
    'Placeholder', 'Compound prolactin activity placeholder elevated.', 2),

  -- Sleep
  ('sleep_stimulant', 'sleep', 'Stimulant / fat loss agent',
    '{"type": "has_compound_type", "value": "fat_loss"}', 15,
    'Placeholder — stimulant sleep impact', 'Fat loss / stimulant category present.', 1),
  ('sleep_tren', 'sleep', 'Trenbolone compound',
    '{"type": "compound_name_contains", "substring": "Trenbolone"}', 18,
    'Placeholder — anecdotal sleep reports', 'Trenbolone compound name detected in stack.', 2),
  ('sleep_base', 'sleep', 'Base sleep monitoring',
    '{"type": "always"}', 5, 'Placeholder', 'General sleep quality self-monitoring.', 3),

  -- Mental Wellbeing
  ('mental_19nor', 'mental_wellbeing', '19-Nor compound',
    '{"type": "compound_category_contains", "category": "19-Nor"}', 15,
    'Placeholder — neuropsychiatric anecdotes', '19-Nor present — mood monitoring consideration.', 1),
  ('mental_high_androgenic', 'mental_wellbeing', 'High androgenic activity',
    '{"type": "compound_profile_gte", "field": "androgenic_activity", "threshold": 7}', 12,
    'Placeholder', 'High androgenic activity placeholder in stack.', 2),
  ('mental_base', 'mental_wellbeing', 'Base wellbeing monitoring',
    '{"type": "always"}', 5, 'Placeholder', 'Subjective mood and wellbeing tracking.', 3),

  -- Fertility
  ('fertility_suppression', 'fertility', 'Hormonal suppression compounds',
    '{"type": "compound_type_any", "values": ["anabolic", "androgen", "hormone"]}', 18,
    'Placeholder — fertility literature', 'Compounds that may affect fertility monitoring.', 1),
  ('fertility_base', 'fertility', 'Base fertility awareness',
    '{"type": "always"}', 6, 'Placeholder', 'Reproductive health awareness placeholder.', 2),

  -- Injection Burden
  ('injection_count', 'injection_burden', 'Multiple injectable compounds',
    '{"type": "injectable_count_gte", "threshold": 2}', 15,
    'Placeholder — administration burden', 'Two or more injectable compounds.', 1),
  ('injection_high_frequency', 'injection_burden', 'High injection frequency',
    '{"type": "max_frequency_gte", "threshold": 7}', 18,
    'Placeholder', 'At least one compound injected daily or more.', 2),
  ('injection_daily', 'injection_burden', 'Daily injection compound',
    '{"type": "max_frequency_gte", "threshold": 7}', 10,
    'Placeholder', 'High weekly injection frequency detected.', 3),

  -- Overall Monitoring Priority
  ('overall_compound_count', 'overall_monitoring_priority', 'Large compound stack',
    '{"type": "compound_count_gte", "threshold": 4}', 15,
    'Placeholder — complexity factor', 'Four or more compounds increases monitoring complexity.', 1),
  ('overall_long_duration', 'overall_monitoring_priority', 'Extended cycle duration',
    '{"type": "max_duration_gte", "threshold": 16}', 12,
    'Placeholder — duration risk factor', 'Cycle duration 16+ weeks on at least one compound.', 2),
  ('overall_no_bloodwork', 'overall_monitoring_priority', 'No recent bloodwork',
    '{"type": "bloodwork_absent"}', 10,
    'Placeholder — monitoring gap', 'No bloodwork data supplied with assessment.', 3),
  ('overall_base', 'overall_monitoring_priority', 'Base monitoring priority',
    '{"type": "always"}', 15, 'Placeholder', 'Baseline overall monitoring priority.', 4)
ON CONFLICT (rule_key) DO NOTHING;
