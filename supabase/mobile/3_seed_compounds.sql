-- =============================================================================
-- SAFEPEDS / PED Health AI — Seed reference data (compounds + supporting catalogs)
-- Step 3 of 3 for Supabase SQL Editor (mobile-friendly)
-- Run after 2_rls_policies.sql. Compound library is seeded first.
-- Generated from safepeds_app_complete_schema.sql — do not edit by hand.
-- Regenerate: node scripts/split-safepeds-schema.mjs
-- =============================================================================



-- ─── 20250702000001_seed_compounds.sql ───
-- PED Health AI — Seed compound categories and compounds (generated)

-- Categories
INSERT INTO public.compound_categories (name, description)
VALUES ('Testosterone', 'Testosterone esters and base compounds')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('DHT Derivatives', 'Dihydrotestosterone-derived anabolic agents')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('19-Nor', '19-nortestosterone derived compounds')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Oral Anabolics', 'Oral anabolic-androgenic steroids')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Injectable Anabolics', 'Injectable anabolic-androgenic steroids')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Growth Hormones', 'Growth hormone and secretagogues')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Peptides', 'Peptide-based performance and recovery compounds')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('SARMs', 'Selective androgen receptor modulators and related')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Fat Loss', 'Fat loss and metabolic agents')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('PCT', 'Post-cycle therapy compounds')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Estrogen Control', 'Aromatase inhibitors and estrogen management')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Prolactin Control', 'Prolactin management compounds')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Blood Pressure Support', 'Cardiovascular blood pressure support')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Liver Support', 'Hepatoprotective supplements and compounds')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Cholesterol Support', 'Lipid and cholesterol management support')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('Kidney Support', 'Renal support compounds')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compound_categories (name, description)
VALUES ('General Health', 'General health and wellness support')
ON CONFLICT (name) DO NOTHING;

-- Compounds + placeholder profiles
INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Testosterone Enanthate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Enanthate', 'Educational profile for Testosterone Enanthate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Testosterone'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Testosterone' AND comp.name = 'Testosterone Enanthate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Testosterone Cypionate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Cypionate', 'Educational profile for Testosterone Cypionate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Testosterone'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Testosterone' AND comp.name = 'Testosterone Cypionate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Testosterone Propionate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Propionate', 'Educational profile for Testosterone Propionate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Testosterone'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Testosterone' AND comp.name = 'Testosterone Propionate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Testosterone Suspension', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, null, 'Educational profile for Testosterone Suspension. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Testosterone'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Testosterone' AND comp.name = 'Testosterone Suspension'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Testosterone Undecanoate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Undecanoate', 'Educational profile for Testosterone Undecanoate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Testosterone'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Testosterone' AND comp.name = 'Testosterone Undecanoate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Masteron Enanthate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Enanthate', 'Educational profile for Masteron Enanthate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Masteron Enanthate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Masteron Propionate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Propionate', 'Educational profile for Masteron Propionate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Masteron Propionate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Primobolan Enanthate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Enanthate', 'Educational profile for Primobolan Enanthate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Primobolan Enanthate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Primobolan Acetate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Acetate', 'Educational profile for Primobolan Acetate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Primobolan Acetate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Anavar', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Anavar. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Anavar'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Winstrol', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Winstrol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Winstrol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Proviron', 'androgen'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Proviron. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Proviron'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Superdrol', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Superdrol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Superdrol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Halotestin', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Halotestin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'DHT Derivatives'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'DHT Derivatives' AND comp.name = 'Halotestin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Trenbolone Acetate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Acetate', 'Educational profile for Trenbolone Acetate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = '19-Nor'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = '19-Nor' AND comp.name = 'Trenbolone Acetate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Trenbolone Enanthate', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Enanthate', 'Educational profile for Trenbolone Enanthate. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = '19-Nor'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = '19-Nor' AND comp.name = 'Trenbolone Enanthate'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Trenbolone Hex', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Hexahydrobenzylcarbonate', 'Educational profile for Trenbolone Hex. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = '19-Nor'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = '19-Nor' AND comp.name = 'Trenbolone Hex'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Deca Durabolin', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, null, 'Educational profile for Deca Durabolin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = '19-Nor'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = '19-Nor' AND comp.name = 'Deca Durabolin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'NPP', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, null, 'Educational profile for NPP. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = '19-Nor'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = '19-Nor' AND comp.name = 'NPP'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'MENT (Trestolone)', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, null, 'Educational profile for MENT (Trestolone). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = '19-Nor'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = '19-Nor' AND comp.name = 'MENT (Trestolone)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Equipoise', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, null, 'Educational profile for Equipoise. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Injectable Anabolics'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Injectable Anabolics' AND comp.name = 'Equipoise'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'DHB (1-Testosterone Cypionate)', 'anabolic'::public.compound_type_enum, 'intramuscular'::public.administration_enum, 'Cypionate', 'Educational profile for DHB (1-Testosterone Cypionate). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Injectable Anabolics'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Injectable Anabolics' AND comp.name = 'DHB (1-Testosterone Cypionate)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Dianabol', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Dianabol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Oral Anabolics'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Oral Anabolics' AND comp.name = 'Dianabol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Anadrol', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Anadrol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Oral Anabolics'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Oral Anabolics' AND comp.name = 'Anadrol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Turinabol', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Turinabol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Oral Anabolics'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Oral Anabolics' AND comp.name = 'Turinabol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Methyltestosterone', 'anabolic'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Methyltestosterone. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Oral Anabolics'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Oral Anabolics' AND comp.name = 'Methyltestosterone'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Human Growth Hormone (HGH)', 'hormone'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Human Growth Hormone (HGH). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Growth Hormones'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Growth Hormones' AND comp.name = 'Human Growth Hormone (HGH)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'IGF-1 LR3', 'hormone'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for IGF-1 LR3. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Growth Hormones'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Growth Hormones' AND comp.name = 'IGF-1 LR3'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'IGF-1 DES', 'hormone'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for IGF-1 DES. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Growth Hormones'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Growth Hormones' AND comp.name = 'IGF-1 DES'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'MK-677', 'other'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for MK-677. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Growth Hormones'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Growth Hormones' AND comp.name = 'MK-677'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Insulin', 'hormone'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Insulin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Growth Hormones'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Growth Hormones' AND comp.name = 'Insulin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'BPC-157', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for BPC-157. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'BPC-157'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'TB-500', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for TB-500. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'TB-500'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'CJC-1295 DAC', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for CJC-1295 DAC. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'CJC-1295 DAC'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'CJC-1295 No DAC', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for CJC-1295 No DAC. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'CJC-1295 No DAC'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Ipamorelin', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Ipamorelin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Ipamorelin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'GHRP-2', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for GHRP-2. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'GHRP-2'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'GHRP-6', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for GHRP-6. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'GHRP-6'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Hexarelin', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, 'Hexahydrobenzylcarbonate', 'Educational profile for Hexarelin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Hexarelin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Sermorelin', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Sermorelin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Sermorelin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Tesamorelin', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Tesamorelin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Tesamorelin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'PEG-MGF', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for PEG-MGF. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'PEG-MGF'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'AOD-9604', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for AOD-9604. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'AOD-9604'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Kisspeptin-10', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Kisspeptin-10. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Kisspeptin-10'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Thymosin Alpha-1', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Thymosin Alpha-1. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Thymosin Alpha-1'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Thymalin', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Thymalin. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Thymalin'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Epitalon', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Epitalon. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Epitalon'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'MOTS-c', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for MOTS-c. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'MOTS-c'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'SS-31', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for SS-31. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'SS-31'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'GHK-Cu', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for GHK-Cu. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'GHK-Cu'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'KPV', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for KPV. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'KPV'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'B7-33', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for B7-33. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'B7-33'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Follistatin-344', 'peptide'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for Follistatin-344. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Peptides'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Peptides' AND comp.name = 'Follistatin-344'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Ostarine (MK-2866)', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Ostarine (MK-2866). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'Ostarine (MK-2866)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Ligandrol (LGD-4033)', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Ligandrol (LGD-4033). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'Ligandrol (LGD-4033)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'RAD-140', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for RAD-140. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'RAD-140'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'S23', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for S23. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'S23'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'ACP-105', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for ACP-105. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'ACP-105'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'AC-262536', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for AC-262536. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'AC-262536'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Andarine (S4)', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Andarine (S4). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'Andarine (S4)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Cardarine (GW-501516)', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Cardarine (GW-501516). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'Cardarine (GW-501516)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'SR9009', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for SR9009. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'SR9009'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'YK-11', 'sarm'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for YK-11. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'SARMs'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'SARMs' AND comp.name = 'YK-11'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Clenbuterol', 'fat_loss'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Clenbuterol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Fat Loss'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Fat Loss' AND comp.name = 'Clenbuterol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Salbutamol', 'fat_loss'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Salbutamol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Fat Loss'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Fat Loss' AND comp.name = 'Salbutamol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Yohimbine', 'fat_loss'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Yohimbine. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Fat Loss'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Fat Loss' AND comp.name = 'Yohimbine'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'T3', 'fat_loss'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for T3. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Fat Loss'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Fat Loss' AND comp.name = 'T3'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'T4', 'fat_loss'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for T4. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Fat Loss'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Fat Loss' AND comp.name = 'T4'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'HCG', 'pct'::public.compound_type_enum, 'subcutaneous'::public.administration_enum, null, 'Educational profile for HCG. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'PCT'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'PCT' AND comp.name = 'HCG'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Enclomiphene', 'pct'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Enclomiphene. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'PCT'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'PCT' AND comp.name = 'Enclomiphene'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Clomiphene', 'pct'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Clomiphene. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'PCT'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'PCT' AND comp.name = 'Clomiphene'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Tamoxifen', 'pct'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Tamoxifen. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'PCT'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'PCT' AND comp.name = 'Tamoxifen'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Raloxifene', 'pct'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Raloxifene. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'PCT'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'PCT' AND comp.name = 'Raloxifene'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Arimidex (Anastrozole)', 'ancillary'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Arimidex (Anastrozole). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Estrogen Control'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Estrogen Control' AND comp.name = 'Arimidex (Anastrozole)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Aromasin (Exemestane)', 'ancillary'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Aromasin (Exemestane). Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Estrogen Control'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Estrogen Control' AND comp.name = 'Aromasin (Exemestane)'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Letrozole', 'ancillary'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Letrozole. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Estrogen Control'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Estrogen Control' AND comp.name = 'Letrozole'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Cabergoline', 'ancillary'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Cabergoline. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Prolactin Control'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Prolactin Control' AND comp.name = 'Cabergoline'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Pramipexole', 'ancillary'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Pramipexole. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Prolactin Control'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Prolactin Control' AND comp.name = 'Pramipexole'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'TUDCA', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for TUDCA. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Liver Support'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Liver Support' AND comp.name = 'TUDCA'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'NAC', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for NAC. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Liver Support'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Liver Support' AND comp.name = 'NAC'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Telmisartan', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Telmisartan. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Blood Pressure Support'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Blood Pressure Support' AND comp.name = 'Telmisartan'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Nebivolol', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Nebivolol. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Blood Pressure Support'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Blood Pressure Support' AND comp.name = 'Nebivolol'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Ezetimibe', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Ezetimibe. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Cholesterol Support'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Cholesterol Support' AND comp.name = 'Ezetimibe'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Omega-3 Fish Oil', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Omega-3 Fish Oil. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Cholesterol Support'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Cholesterol Support' AND comp.name = 'Omega-3 Fish Oil'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'Citrus Bergamot', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for Citrus Bergamot. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'Cholesterol Support'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'Cholesterol Support' AND comp.name = 'Citrus Bergamot'
ON CONFLICT (compound_id) DO NOTHING;

INSERT INTO public.compounds (category_id, name, compound_type, administration, ester, description)
SELECT c.id, 'CoQ10', 'support'::public.compound_type_enum, 'oral'::public.administration_enum, null, 'Educational profile for CoQ10. Risk scores pending evidence-based review.'
FROM public.compound_categories c WHERE c.name = 'General Health'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.compound_profiles (compound_id, notes)
SELECT comp.id, 'Risk profile placeholder — to be completed from evidence-based research.'
FROM public.compounds comp
JOIN public.compound_categories cat ON cat.id = comp.category_id
WHERE cat.name = 'General Health' AND comp.name = 'CoQ10'
ON CONFLICT (compound_id) DO NOTHING;

-- ─── 20250703000001_seed_blood_markers.sql ───
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

-- ─── 20250704000001_seed_risk_rules.sql ───
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

-- ─── 20250705000001_seed_educational_content.sql ───
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

-- ─── 20250706000001_seed_knowledge_base.sql ───
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

-- ─── 20250707000001_seed_health_topics.sql ───
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
select v.risk_slug, t.id from (values
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
