-- Seed knowledge categories and starter articles for Phase 7

insert into public.knowledge_categories (slug, name, display_order)
values
  ('compounds', 'Compounds', 1),
  ('bloodwork', 'Bloodwork', 2),
  ('hormones', 'Hormones', 3),
  ('cardiovascular-health', 'Cardiovascular Health', 4),
  ('liver-health', 'Liver Health', 5),
  ('kidney-health', 'Kidney Health', 6),
  ('lipids', 'Lipids', 7),
  ('hematology', 'Hematology', 8),
  ('endocrinology', 'Endocrinology', 9),
  ('peptides', 'Peptides', 10),
  ('sarms', 'SARMs', 11),
  ('fat-loss', 'Fat Loss', 12),
  ('pct', 'PCT', 13),
  ('estrogen', 'Estrogen', 14),
  ('prolactin', 'Prolactin', 15),
  ('training', 'Training', 16),
  ('nutrition', 'Nutrition', 17),
  ('supplementation', 'Supplementation', 18),
  ('recovery', 'Recovery', 19),
  ('general-health', 'General Health', 20)
on conflict (slug) do nothing;

-- Starter articles (migrated from Phase 6 educational content + new entries)
insert into public.knowledge_articles (title, slug, category_id, summary, content, difficulty_level, published, view_count)
select
  v.title,
  v.slug,
  c.id,
  v.summary,
  v.content,
  v.difficulty::public.knowledge_difficulty_enum,
  true,
  v.views
from (values
  (
    'Understanding Liver Enzymes (ALT & AST)',
    'understanding-liver-enzymes',
    'liver-health',
    'Educational overview of hepatic markers commonly tracked in lab panels.',
    E'Alanine aminotransferase (ALT) and aspartate aminotransferase (AST) are enzymes found primarily in liver cells. When liver cells are stressed or damaged, these enzymes may leak into the bloodstream and appear elevated on a lab report.\n\nALT is generally considered more liver-specific than AST. These markers are commonly discussed in performance health monitoring contexts. Reference ranges vary by laboratory and should always be interpreted with your clinician using the ranges printed on your report.\n\n## Key educational points\n\n- ALT and AST are **monitoring markers**, not diagnoses\n- Trends over time may be more informative than a single value\n- Always use the reference range supplied by your laboratory',
    'beginner',
    42
  ),
  (
    'HDL Cholesterol: Why It Is Monitored',
    'hdl-cholesterol-monitoring',
    'lipids',
    'Educational context on HDL as a commonly tracked lipid marker.',
    E'High-density lipoprotein (HDL) cholesterol is often called "good" cholesterol in educational materials because it helps transport cholesterol from tissues back to the liver.\n\nHDL levels can be influenced by genetics, diet, exercise, and other factors. In performance health monitoring, HDL is frequently tracked alongside LDL and triglycerides.\n\n## Monitoring context\n\n- A downward trend across multiple tests may warrant discussion with your clinician\n- Single values should be interpreted using your lab''s reference range\n- This is educational information only — not a diagnosis',
    'beginner',
    38
  ),
  (
    'Hematocrit: Educational Monitoring Context',
    'hematocrit-education',
    'hematology',
    'Why hematocrit appears on monitoring panels in performance health contexts.',
    E'Hematocrit measures the proportion of red blood cells in your blood volume. It is related to hemoglobin and oxygen-carrying capacity.\n\nIn educational performance health monitoring, hematocrit is commonly tracked because certain compounds may influence red blood cell production.\n\n## Educational notes\n\n- Elevated hematocrit relative to your lab''s reference range is a reason to discuss results with a healthcare provider\n- Consecutive elevated readings may increase monitoring priority in educational frameworks\n- Not a diagnosis or treatment recommendation',
    'beginner',
    31
  ),
  (
    'Educational Cycle Monitoring Principles',
    'cycle-monitoring-basics',
    'compounds',
    'General harm-reduction monitoring concepts — not medical advice.',
    E'Structured cycle monitoring typically includes regular bloodwork, blood pressure tracking, and subjective wellness markers such as sleep and mood.\n\nThe PED Health AI platform provides rule-based educational risk scores to highlight areas that may warrant increased monitoring frequency. These scores do not determine safety, prescribe compounds, or replace clinical judgment.',
    'beginner',
    55
  ),
  (
    'How Rule-Based Risk Scores Work',
    'risk-scores-explained',
    'general-health',
    'Educational explanation of the platform''s deterministic risk engine.',
    E'Risk scores on this platform are calculated by a transparent rule engine — not by AI. Each category score (0–100) reflects triggered rules based on your cycle composition, compound profiles, and optional bloodwork status.\n\nAI explanations describe what these scores mean educationally. They do not calculate, override, or validate the scores.',
    'intermediate',
    67
  ),
  (
    'Introduction to SARMs',
    'introduction-to-sarms',
    'sarms',
    'Educational overview of selective androgen receptor modulators.',
    E'Selective Androgen Receptor Modulators (SARMs) are a class of compounds that interact with androgen receptors in tissue-selective ways in research literature.\n\nIn educational harm-reduction contexts, SARMs are often discussed alongside liver enzymes, lipids, and hormone panels. This article provides general educational background only.',
    'intermediate',
    24
  ),
  (
    'Peptide Monitoring Overview',
    'peptide-monitoring-overview',
    'peptides',
    'Educational context for commonly discussed peptides in monitoring frameworks.',
    E'Peptides used in performance contexts vary widely in mechanism and monitoring considerations. Educational monitoring may include glucose markers, inflammatory markers, and injection site practices.\n\nAlways consult primary literature and qualified healthcare providers for individualized guidance.',
    'advanced',
    19
  ),
  (
    'Post-Cycle Therapy (PCT) — Educational Overview',
    'pct-educational-overview',
    'pct',
    'Educational introduction to PCT concepts in harm-reduction literature.',
    E'Post-cycle therapy (PCT) is discussed in educational harm-reduction literature as an approach to support endogenous hormone recovery after suppressive protocols.\n\nThis article does not recommend specific compounds or protocols. It explains why hormone panels are commonly monitored in educational PCT discussions.',
    'advanced',
    45
  )
) as v(title, slug, cat_slug, summary, content, difficulty, views)
join public.knowledge_categories c on c.slug = v.cat_slug
on conflict (slug) do nothing;

-- Scientific references
insert into public.knowledge_references (article_id, title, authors, journal, publication_year, url)
select a.id, 'NIH MedlinePlus — Liver Function Tests', 'U.S. National Library of Medicine', 'MedlinePlus', 2024, 'https://medlineplus.gov/lab-tests/liver-function-tests/'
from public.knowledge_articles a where a.slug = 'understanding-liver-enzymes'
on conflict do nothing;

insert into public.knowledge_references (article_id, title, authors, journal, publication_year, url)
select a.id, 'NIH MedlinePlus — HDL Cholesterol Test', 'U.S. National Library of Medicine', 'MedlinePlus', 2024, 'https://medlineplus.gov/lab-tests/hdl-cholesterol-test/'
from public.knowledge_articles a where a.slug = 'hdl-cholesterol-monitoring'
on conflict do nothing;

insert into public.knowledge_references (article_id, title, authors, journal, publication_year, url)
select a.id, 'NIH MedlinePlus — Hematocrit Test', 'U.S. National Library of Medicine', 'MedlinePlus', 2024, 'https://medlineplus.gov/lab-tests/hematocrit-test/'
from public.knowledge_articles a where a.slug = 'hematocrit-education'
on conflict do nothing;

-- Link articles to blood markers by name
insert into public.blood_marker_articles (blood_marker_id, article_id)
select m.id, a.id
from public.blood_markers m
cross join public.knowledge_articles a
where (m.name = 'ALT' and a.slug = 'understanding-liver-enzymes')
   or (m.name = 'AST' and a.slug = 'understanding-liver-enzymes')
   or (m.name = 'HDL' and a.slug = 'hdl-cholesterol-monitoring')
   or (m.name = 'Hematocrit' and a.slug = 'hematocrit-education')
on conflict do nothing;

-- Link articles to compounds (sample matches by name patterns)
insert into public.compound_articles (compound_id, article_id)
select c.id, a.id
from public.compounds c
cross join public.knowledge_articles a
where (c.name ilike '%ostarine%' and a.slug = 'introduction-to-sarms')
   or (c.name ilike '%lgd%' and a.slug = 'introduction-to-sarms')
   or (c.name ilike '%testosterone%' and a.slug = 'cycle-monitoring-basics')
on conflict do nothing;

-- Refresh search vectors for seeded articles
update public.knowledge_articles
set title = title
where slug in (
  'understanding-liver-enzymes',
  'hdl-cholesterol-monitoring',
  'hematocrit-education',
  'cycle-monitoring-basics',
  'risk-scores-explained',
  'introduction-to-sarms',
  'peptide-monitoring-overview',
  'pct-educational-overview'
);
