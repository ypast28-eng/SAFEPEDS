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

