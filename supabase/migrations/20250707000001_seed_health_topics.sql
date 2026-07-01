-- Seed Phase 8 health topics with educational placeholder content

-- Helper: insert topic with default support options
create or replace function public._seed_health_topic(
  p_title text, p_slug text, p_category text, p_summary text,
  p_overview text, p_why text, p_markers text[]
) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.health_topics (title, slug, category, summary, content, overview, why_it_matters, blood_markers_involved, published)
  values (
    p_title, p_slug, p_category, p_summary,
    p_overview || E'\n\n' || p_why,
    p_overview, p_why, p_markers, true
  )
  on conflict (slug) do update set
    title = excluded.title, summary = excluded.summary, overview = excluded.overview,
    why_it_matters = excluded.why_it_matters, blood_markers_involved = excluded.blood_markers_involved,
    published = true, content = excluded.content
  returning id into v_id;
  if v_id is null then select id into v_id from public.health_topics where slug = p_slug; end if;

  -- Lifestyle support
  insert into public.support_options (topic_id, title, type, display_order)
  select v_id, 'Lifestyle Considerations', 'Lifestyle', 1
  where not exists (select 1 from public.support_options where topic_id = v_id and type = 'Lifestyle');
  insert into public.support_details (support_option_id, description, notes)
  select o.id,
    'Educational lifestyle factors may include sleep quality, hydration, stress management, and regular physical activity. Discuss personalized approaches with a qualified healthcare provider.',
    'Not medical advice. No dosing or treatment recommendations.'
  from public.support_options o where o.topic_id = v_id and o.type = 'Lifestyle'
  and not exists (select 1 from public.support_details d where d.support_option_id = o.id);

  -- Monitoring
  insert into public.support_options (topic_id, title, type, display_order)
  select v_id, 'Monitoring Considerations', 'Monitoring', 2
  where not exists (select 1 from public.support_options where topic_id = v_id and type = 'Monitoring');
  insert into public.support_details (support_option_id, description, scientific_references)
  select o.id,
  'Regular bloodwork tracking using your laboratory''s reference ranges helps identify trends over time. Educational monitoring does not replace clinical follow-up.',
  '[{"title": "NIH MedlinePlus Lab Tests", "url": "https://medlineplus.gov/lab-tests/"}]'::jsonb
  from public.support_options o where o.topic_id = v_id and o.type = 'Monitoring'
  and not exists (select 1 from public.support_details d where d.support_option_id = o.id);

  -- Supplement (educational)
  insert into public.support_options (topic_id, title, type, display_order)
  select v_id, 'Commonly Discussed Supplements (Educational)', 'Supplement', 3
  where not exists (select 1 from public.support_options where topic_id = v_id and type = 'Supplement');
  insert into public.support_details (support_option_id, description, notes)
  select o.id,
    'Some topics are discussed alongside general wellness supplements in educational literature. This platform does not recommend specific products, brands, or dosages.',
    'Educational information only — not an endorsement.'
  from public.support_options o where o.topic_id = v_id and o.type = 'Supplement'
  and not exists (select 1 from public.support_details d where d.support_option_id = o.id);

  -- Medication Information (educational, no dosing)
  insert into public.support_options (topic_id, title, type, display_order)
  select v_id, 'Medication Information (Educational Only)', 'Medication Information', 4
  where not exists (select 1 from public.support_options where topic_id = v_id and type = 'Medication Information');
  insert into public.support_details (support_option_id, description, notes)
  select o.id,
    'Certain health markers are sometimes discussed in medical practice alongside prescription therapies. This is general educational context only. Do not start, stop, or change any medication based on this information.',
    'No dosing recommendations. Consult a licensed healthcare provider.'
  from public.support_options o where o.topic_id = v_id and o.type = 'Medication Information'
  and not exists (select 1 from public.support_details d where d.support_option_id = o.id);

  return v_id;
end;
$$;

-- Blood Health
select public._seed_health_topic('High Hematocrit', 'high-hematocrit', 'Blood Health',
  'Educational overview when hematocrit is above your supplied reference range.',
  'Hematocrit measures the proportion of red blood cells in blood volume.',
  'Elevated hematocrit relative to your lab range is commonly monitored in performance health contexts. It relates to oxygen-carrying capacity and blood viscosity.',
  array['Hematocrit', 'Hemoglobin', 'RBC']);

select public._seed_health_topic('Low Hemoglobin', 'low-hemoglobin', 'Blood Health',
  'Educational context for hemoglobin below your supplied reference range.',
  'Hemoglobin is the protein in red blood cells that carries oxygen.',
  'Low hemoglobin on a lab report means your value is below the reference range you entered — not a diagnosis.',
  array['Hemoglobin', 'Hematocrit', 'RBC']);

select public._seed_health_topic('High RBC', 'high-rbc', 'Blood Health',
  'Educational overview of elevated red blood cell count.',
  'Red blood cell (RBC) count reflects the number of erythrocytes per volume of blood.',
  'Trends in RBC alongside hematocrit and hemoglobin may provide additional context for educational monitoring.',
  array['RBC', 'Hematocrit', 'Hemoglobin']);

-- Cardiovascular
select public._seed_health_topic('High Blood Pressure', 'high-blood-pressure', 'Cardiovascular',
  'Educational information on elevated blood pressure readings.',
  'Blood pressure measures the force of blood against artery walls.',
  'Sustained elevated readings may warrant discussion with a healthcare provider. Self-monitoring can help track trends.',
  array['Blood Pressure']);

select public._seed_health_topic('High LDL', 'high-ldl', 'Cardiovascular',
  'Educational context for LDL above your reference range.',
  'LDL cholesterol is a lipoprotein that carries cholesterol in the bloodstream.',
  'LDL is commonly tracked alongside HDL and triglycerides in lipid panels.',
  array['LDL', 'Total Cholesterol']);

select public._seed_health_topic('Low HDL', 'low-hdl', 'Cardiovascular',
  'Educational context for HDL below your reference range.',
  'HDL cholesterol helps transport cholesterol from tissues back to the liver.',
  'A downward HDL trend across multiple tests may be worth discussing with your clinician.',
  array['HDL', 'Total Cholesterol']);

select public._seed_health_topic('High Triglycerides', 'high-triglycerides', 'Cardiovascular',
  'Educational overview of elevated triglycerides.',
  'Triglycerides are a type of fat found in the blood.',
  'Elevated triglycerides relative to your lab range are a monitoring consideration, not a diagnosis.',
  array['Triglycerides']);

-- Liver
select public._seed_health_topic('Elevated ALT', 'elevated-alt', 'Liver',
  'Educational overview of ALT above your reference range.',
  'ALT (alanine aminotransferase) is a liver enzyme measured in blood panels.',
  'ALT is generally considered more liver-specific than AST. Trends over time may be informative.',
  array['ALT', 'AST']);

select public._seed_health_topic('Elevated AST', 'elevated-ast', 'Liver',
  'Educational overview of AST above your reference range.',
  'AST (aspartate aminotransferase) is an enzyme found in liver and other tissues.',
  'AST may rise with liver stress; interpret alongside ALT and your clinical context.',
  array['AST', 'ALT']);

select public._seed_health_topic('Elevated GGT', 'elevated-ggt', 'Liver',
  'Educational overview of GGT above your reference range.',
  'GGT (gamma-glutamyl transferase) is a liver-related enzyme.',
  'GGT is sometimes monitored alongside other liver enzymes in educational frameworks.',
  array['GGT', 'ALT', 'AST']);

-- Kidney
select public._seed_health_topic('Elevated Creatinine', 'elevated-creatinine', 'Kidney',
  'Educational context for creatinine above your reference range.',
  'Creatinine is a waste product filtered by the kidneys.',
  'Elevated creatinine may prompt discussion of renal function with a healthcare provider.',
  array['Creatinine', 'BUN']);

select public._seed_health_topic('Reduced eGFR', 'reduced-egfr', 'Kidney',
  'Educational context for estimated glomerular filtration rate below reference.',
  'eGFR estimates how well the kidneys filter blood.',
  'A single low eGFR should be interpreted with clinical context and repeat testing.',
  array['eGFR', 'Creatinine']);

-- Hormones
select public._seed_health_topic('High Estradiol', 'high-estradiol', 'Hormones',
  'Educational overview of estradiol above your reference range.',
  'Estradiol (E2) is a form of estrogen measured in hormone panels.',
  'Estradiol levels are commonly discussed in educational harm-reduction monitoring.',
  array['Estradiol', 'E2']);

select public._seed_health_topic('Low Estradiol', 'low-estradiol', 'Hormones',
  'Educational overview of estradiol below your reference range.',
  'Low estradiol relative to your lab range is a monitoring finding, not a diagnosis.',
  'Hormone panels should be interpreted with your clinician using assay-specific ranges.',
  array['Estradiol', 'E2']);

select public._seed_health_topic('High Prolactin', 'high-prolactin', 'Hormones',
  'Educational context for prolactin above your reference range.',
  'Prolactin is a hormone produced by the pituitary gland.',
  'Elevated prolactin may have various causes — clinical evaluation is appropriate.',
  array['Prolactin']);

select public._seed_health_topic('Low Testosterone', 'low-testosterone', 'Hormones',
  'Educational context for testosterone below your reference range.',
  'Total testosterone is commonly measured in hormone panels.',
  'Low values relative to your lab range should be discussed with a qualified provider.',
  array['Testosterone', 'Total Testosterone']);

select public._seed_health_topic('Low LH', 'low-lh', 'Hormones',
  'Educational overview of luteinizing hormone below reference.',
  'LH plays a role in reproductive hormone regulation.',
  'LH is often interpreted alongside FSH and testosterone in educational contexts.',
  array['LH']);

select public._seed_health_topic('Low FSH', 'low-fsh', 'Hormones',
  'Educational overview of follicle-stimulating hormone below reference.',
  'FSH is involved in reproductive hormone signaling.',
  'Interpret FSH with full hormone panel context and clinical guidance.',
  array['FSH']);

-- General
select public._seed_health_topic('Acne', 'acne', 'General',
  'Educational overview of acne as a subjective monitoring concern.',
  'Acne involves inflammation of pilosebaceous units of the skin.',
  'Skin changes may be tracked subjectively alongside protocol changes — not a lab diagnosis.',
  array[]::text[]);

select public._seed_health_topic('Hair Loss', 'hair-loss', 'General',
  'Educational context on hair thinning and shedding.',
  'Hair loss can have multiple contributing factors including genetics and hormones.',
  'Document changes over time and discuss persistent concerns with a dermatologist or clinician.',
  array[]::text[]);

select public._seed_health_topic('Sleep Issues', 'sleep-issues', 'General',
  'Educational support for tracking sleep quality.',
  'Sleep quality affects recovery, mood, and overall wellbeing.',
  'Subjective sleep tracking complements objective health monitoring.',
  array[]::text[]);

select public._seed_health_topic('Mood Changes', 'mood-changes', 'General',
  'Educational context on mood and wellbeing monitoring.',
  'Mood fluctuations may be tracked as part of holistic health monitoring.',
  'Seek professional mental health support if you experience persistent distress.',
  array[]::text[]);

select public._seed_health_topic('Injection Site Problems', 'injection-site-problems', 'General',
  'Educational information on injection site reactions.',
  'Injection site reactions can include redness, swelling, or discomfort.',
  'Proper technique and rotation are commonly discussed in harm-reduction education.',
  array[]::text[]);

select public._seed_health_topic('Water Retention', 'water-retention', 'General',
  'Educational overview of fluid retention as a subjective concern.',
  'Water retention refers to excess fluid in body tissues.',
  'Track subjective symptoms alongside blood pressure and other markers if relevant.',
  array[]::text[]);

-- Link blood markers where they exist
insert into public.health_topic_blood_markers (topic_id, blood_marker_id)
select t.id, m.id from public.health_topics t
join public.blood_markers m on m.name = any(t.blood_markers_involved)
on conflict do nothing;

-- Link to knowledge articles by slug pattern
insert into public.health_topic_knowledge_articles (topic_id, article_id)
select t.id, a.id from public.health_topics t
join public.knowledge_articles a on (
  (t.slug in ('elevated-alt', 'elevated-ast') and a.slug = 'understanding-liver-enzymes')
  or (t.slug = 'low-hdl' and a.slug = 'hdl-cholesterol-monitoring')
  or (t.slug = 'high-hematocrit' and a.slug = 'hematocrit-education')
)
on conflict do nothing;

-- Risk category → health topic links
insert into public.risk_category_health_topics (risk_category_slug, topic_id)
select v.slug, t.id from (values
  ('liver', 'elevated-alt'),
  ('liver', 'elevated-ast'),
  ('liver', 'elevated-ggt'),
  ('kidney', 'elevated-creatinine'),
  ('kidney', 'reduced-egfr'),
  ('cardiovascular', 'high-ldl'),
  ('cardiovascular', 'high-triglycerides'),
  ('blood_pressure', 'high-blood-pressure'),
  ('lipids', 'low-hdl'),
  ('lipids', 'high-ldl'),
  ('lipids', 'high-triglycerides'),
  ('hematocrit', 'high-hematocrit'),
  ('estrogen', 'high-estradiol'),
  ('estrogen', 'low-estradiol'),
  ('prolactin', 'high-prolactin'),
  ('hormonal_suppression', 'low-testosterone'),
  ('hormonal_suppression', 'low-lh'),
  ('hormonal_suppression', 'low-fsh'),
  ('sleep', 'sleep-issues'),
  ('mental_wellbeing', 'mood-changes'),
  ('fertility', 'low-testosterone'),
  ('injection_burden', 'injection-site-problems')
) as v(risk_slug, topic_slug)
join public.health_topics t on t.slug = v.topic_slug
on conflict do nothing;

-- Refresh search vectors
update public.health_topics set title = title;

drop function if exists public._seed_health_topic(text, text, text, text, text, text, text[]);
