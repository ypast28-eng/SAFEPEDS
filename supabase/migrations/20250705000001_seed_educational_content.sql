-- Seed educational articles and scientific references for AI citations

insert into public.educational_articles (slug, title, category, summary, body, tags, display_order)
values
  (
    'understanding-liver-enzymes',
    'Understanding Liver Enzymes (ALT & AST)',
    'bloodwork',
    'Educational overview of hepatic markers commonly tracked in lab panels.',
    'Alanine aminotransferase (ALT) and aspartate aminotransferase (AST) are enzymes found primarily in liver cells. When liver cells are stressed or damaged, these enzymes may leak into the bloodstream and appear elevated on a lab report. ALT is generally considered more liver-specific than AST. These markers are commonly discussed in performance health monitoring contexts. Reference ranges vary by laboratory and should always be interpreted with your clinician using the ranges printed on your report.',
    array['liver', 'alt', 'ast', 'bloodwork'],
    1
  ),
  (
    'hdl-cholesterol-monitoring',
    'HDL Cholesterol: Why It Is Monitored',
    'bloodwork',
    'Educational context on HDL as a commonly tracked lipid marker.',
    'High-density lipoprotein (HDL) cholesterol is often called "good" cholesterol in educational materials because it helps transport cholesterol from tissues back to the liver. HDL levels can be influenced by genetics, diet, exercise, and other factors. In performance health monitoring, HDL is frequently tracked alongside other lipids. Trends over time may be more informative than a single value. This is educational information only — not a diagnosis or treatment recommendation.',
    array['hdl', 'lipids', 'cholesterol', 'bloodwork'],
    2
  ),
  (
    'hematocrit-education',
    'Hematocrit: Educational Monitoring Context',
    'bloodwork',
    'Why hematocrit appears on monitoring panels in performance health contexts.',
    'Hematocrit measures the proportion of red blood cells in your blood volume. It is related to hemoglobin and oxygen-carrying capacity. In educational performance health monitoring, hematocrit is commonly tracked because certain compounds may influence red blood cell production. Elevated hematocrit relative to your lab''s reference range is a reason to discuss results with a qualified healthcare provider — not a diagnosis.',
    array['hematocrit', 'cbc', 'bloodwork'],
    3
  ),
  (
    'cycle-monitoring-basics',
    'Educational Cycle Monitoring Principles',
    'cycles',
    'General harm-reduction monitoring concepts — not medical advice.',
    'Structured cycle monitoring typically includes regular bloodwork, blood pressure tracking, and subjective wellness markers such as sleep and mood. The PED Health AI platform provides rule-based educational risk scores to highlight areas that may warrant increased monitoring frequency. These scores do not determine safety, prescribe compounds, or replace clinical judgment.',
    array['cycles', 'monitoring', 'harm-reduction'],
    4
  ),
  (
    'risk-scores-explained',
    'How Rule-Based Risk Scores Work',
    'risk',
    'Educational explanation of the platform''s deterministic risk engine.',
    'Risk scores on this platform are calculated by a transparent rule engine — not by AI. Each category score (0–100) reflects triggered rules based on your cycle composition, compound profiles, and optional bloodwork status. AI explanations describe what these scores mean educationally. They do not calculate, override, or validate the scores.',
    array['risk', 'scoring', 'education'],
    5
  )
on conflict (slug) do nothing;

insert into public.educational_references (article_id, title, url, citation_text, evidence_level, display_order)
select a.id, 'NIH MedlinePlus — Liver Function Tests', 'https://medlineplus.gov/lab-tests/liver-function-tests/', 'MedlinePlus. Liver Function Tests. U.S. National Library of Medicine.', 'educational', 1
from public.educational_articles a where a.slug = 'understanding-liver-enzymes'
on conflict do nothing;

insert into public.educational_references (article_id, title, url, citation_text, evidence_level, display_order)
select a.id, 'NIH MedlinePlus — HDL Test', 'https://medlineplus.gov/lab-tests/hdl-cholesterol-test/', 'MedlinePlus. HDL Cholesterol Test. U.S. National Library of Medicine.', 'educational', 1
from public.educational_articles a where a.slug = 'hdl-cholesterol-monitoring'
on conflict do nothing;

insert into public.educational_references (article_id, title, url, citation_text, evidence_level, display_order)
select a.id, 'NIH MedlinePlus — Hematocrit Test', 'https://medlineplus.gov/lab-tests/hematocrit-test/', 'MedlinePlus. Hematocrit Test. U.S. National Library of Medicine.', 'educational', 1
from public.educational_articles a where a.slug = 'hematocrit-education'
on conflict do nothing;
