-- PEDSAFE — Full compound library seed for public.compounds (generated)
-- Source: scripts/generate-compound-seed.mjs
-- Safe to re-run: does not truncate or delete rows. Existing compounds are preserved via ON CONFLICT (name) DO NOTHING.
-- Run in Supabase SQL Editor, or: psql $DATABASE_URL -f supabase/seed/compounds.sql

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Testosterone Enanthate', 'anabolic', 'intramuscular', 'Enanthate', 'Educational profile for Testosterone Enanthate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Testosterone Cypionate', 'anabolic', 'intramuscular', 'Cypionate', 'Educational profile for Testosterone Cypionate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Testosterone Propionate', 'anabolic', 'intramuscular', 'Propionate', 'Educational profile for Testosterone Propionate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Testosterone Suspension', 'anabolic', 'intramuscular', null, 'Educational profile for Testosterone Suspension. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Testosterone Undecanoate', 'anabolic', 'intramuscular', 'Undecanoate', 'Educational profile for Testosterone Undecanoate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Masteron Enanthate', 'anabolic', 'intramuscular', 'Enanthate', 'Educational profile for Masteron Enanthate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Masteron Propionate', 'anabolic', 'intramuscular', 'Propionate', 'Educational profile for Masteron Propionate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Primobolan Enanthate', 'anabolic', 'intramuscular', 'Enanthate', 'Educational profile for Primobolan Enanthate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Primobolan Acetate', 'anabolic', 'intramuscular', 'Acetate', 'Educational profile for Primobolan Acetate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Anavar', 'anabolic', 'oral', null, 'Educational profile for Anavar. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Winstrol', 'anabolic', 'oral', null, 'Educational profile for Winstrol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Proviron', 'androgen', 'oral', null, 'Educational profile for Proviron. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Superdrol', 'anabolic', 'oral', null, 'Educational profile for Superdrol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Halotestin', 'anabolic', 'oral', null, 'Educational profile for Halotestin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Trenbolone Acetate', 'anabolic', 'intramuscular', 'Acetate', 'Educational profile for Trenbolone Acetate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Trenbolone Enanthate', 'anabolic', 'intramuscular', 'Enanthate', 'Educational profile for Trenbolone Enanthate. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Trenbolone Hex', 'anabolic', 'intramuscular', 'Hexahydrobenzylcarbonate', 'Educational profile for Trenbolone Hex. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Deca Durabolin', 'anabolic', 'intramuscular', null, 'Educational profile for Deca Durabolin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('NPP', 'anabolic', 'intramuscular', null, 'Educational profile for NPP. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('MENT (Trestolone)', 'anabolic', 'intramuscular', null, 'Educational profile for MENT (Trestolone). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Equipoise', 'anabolic', 'intramuscular', null, 'Educational profile for Equipoise. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('DHB (1-Testosterone Cypionate)', 'anabolic', 'intramuscular', 'Cypionate', 'Educational profile for DHB (1-Testosterone Cypionate). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Dianabol', 'anabolic', 'oral', null, 'Educational profile for Dianabol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Anadrol', 'anabolic', 'oral', null, 'Educational profile for Anadrol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Turinabol', 'anabolic', 'oral', null, 'Educational profile for Turinabol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Methyltestosterone', 'anabolic', 'oral', null, 'Educational profile for Methyltestosterone. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Human Growth Hormone (HGH)', 'hormone', 'subcutaneous', null, 'Educational profile for Human Growth Hormone (HGH). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('IGF-1 LR3', 'hormone', 'subcutaneous', null, 'Educational profile for IGF-1 LR3. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('IGF-1 DES', 'hormone', 'subcutaneous', null, 'Educational profile for IGF-1 DES. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('MK-677', 'other', 'oral', null, 'Educational profile for MK-677. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Insulin', 'hormone', 'subcutaneous', null, 'Educational profile for Insulin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('BPC-157', 'peptide', 'subcutaneous', null, 'Educational profile for BPC-157. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('TB-500', 'peptide', 'subcutaneous', null, 'Educational profile for TB-500. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('CJC-1295 DAC', 'peptide', 'subcutaneous', null, 'Educational profile for CJC-1295 DAC. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('CJC-1295 No DAC', 'peptide', 'subcutaneous', null, 'Educational profile for CJC-1295 No DAC. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Ipamorelin', 'peptide', 'subcutaneous', null, 'Educational profile for Ipamorelin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('GHRP-2', 'peptide', 'subcutaneous', null, 'Educational profile for GHRP-2. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('GHRP-6', 'peptide', 'subcutaneous', null, 'Educational profile for GHRP-6. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Hexarelin', 'peptide', 'subcutaneous', 'Hexahydrobenzylcarbonate', 'Educational profile for Hexarelin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Sermorelin', 'peptide', 'subcutaneous', null, 'Educational profile for Sermorelin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Tesamorelin', 'peptide', 'subcutaneous', null, 'Educational profile for Tesamorelin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('PEG-MGF', 'peptide', 'subcutaneous', null, 'Educational profile for PEG-MGF. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('AOD-9604', 'peptide', 'subcutaneous', null, 'Educational profile for AOD-9604. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Kisspeptin-10', 'peptide', 'subcutaneous', null, 'Educational profile for Kisspeptin-10. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Thymosin Alpha-1', 'peptide', 'subcutaneous', null, 'Educational profile for Thymosin Alpha-1. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Thymalin', 'peptide', 'subcutaneous', null, 'Educational profile for Thymalin. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Epitalon', 'peptide', 'subcutaneous', null, 'Educational profile for Epitalon. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('MOTS-c', 'peptide', 'subcutaneous', null, 'Educational profile for MOTS-c. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('SS-31', 'peptide', 'subcutaneous', null, 'Educational profile for SS-31. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('GHK-Cu', 'peptide', 'subcutaneous', null, 'Educational profile for GHK-Cu. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('KPV', 'peptide', 'subcutaneous', null, 'Educational profile for KPV. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('B7-33', 'peptide', 'subcutaneous', null, 'Educational profile for B7-33. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Follistatin-344', 'peptide', 'subcutaneous', null, 'Educational profile for Follistatin-344. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Ostarine (MK-2866)', 'sarm', 'oral', null, 'Educational profile for Ostarine (MK-2866). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Ligandrol (LGD-4033)', 'sarm', 'oral', null, 'Educational profile for Ligandrol (LGD-4033). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('RAD-140', 'sarm', 'oral', null, 'Educational profile for RAD-140. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('S23', 'sarm', 'oral', null, 'Educational profile for S23. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('ACP-105', 'sarm', 'oral', null, 'Educational profile for ACP-105. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('AC-262536', 'sarm', 'oral', null, 'Educational profile for AC-262536. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Andarine (S4)', 'sarm', 'oral', null, 'Educational profile for Andarine (S4). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Cardarine (GW-501516)', 'sarm', 'oral', null, 'Educational profile for Cardarine (GW-501516). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('SR9009', 'sarm', 'oral', null, 'Educational profile for SR9009. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('YK-11', 'sarm', 'oral', null, 'Educational profile for YK-11. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Clenbuterol', 'fat_loss', 'oral', null, 'Educational profile for Clenbuterol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Salbutamol', 'fat_loss', 'oral', null, 'Educational profile for Salbutamol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Yohimbine', 'fat_loss', 'oral', null, 'Educational profile for Yohimbine. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('T3', 'fat_loss', 'oral', null, 'Educational profile for T3. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('T4', 'fat_loss', 'oral', null, 'Educational profile for T4. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('HCG', 'pct', 'subcutaneous', null, 'Educational profile for HCG. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Enclomiphene', 'pct', 'oral', null, 'Educational profile for Enclomiphene. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Clomiphene', 'pct', 'oral', null, 'Educational profile for Clomiphene. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Tamoxifen', 'pct', 'oral', null, 'Educational profile for Tamoxifen. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Raloxifene', 'pct', 'oral', null, 'Educational profile for Raloxifene. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Arimidex (Anastrozole)', 'ancillary', 'oral', null, 'Educational profile for Arimidex (Anastrozole). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Aromasin (Exemestane)', 'ancillary', 'oral', null, 'Educational profile for Aromasin (Exemestane). Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Letrozole', 'ancillary', 'oral', null, 'Educational profile for Letrozole. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Cabergoline', 'ancillary', 'oral', null, 'Educational profile for Cabergoline. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Pramipexole', 'ancillary', 'oral', null, 'Educational profile for Pramipexole. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('TUDCA', 'support', 'oral', null, 'Educational profile for TUDCA. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('NAC', 'support', 'oral', null, 'Educational profile for NAC. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Telmisartan', 'support', 'oral', null, 'Educational profile for Telmisartan. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Nebivolol', 'support', 'oral', null, 'Educational profile for Nebivolol. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Ezetimibe', 'support', 'oral', null, 'Educational profile for Ezetimibe. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Omega-3 Fish Oil', 'support', 'oral', null, 'Educational profile for Omega-3 Fish Oil. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('Citrus Bergamot', 'support', 'oral', null, 'Educational profile for Citrus Bergamot. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.compounds (name, compound_type, administration, ester, description)
VALUES ('CoQ10', 'support', 'oral', null, 'Educational profile for CoQ10. Risk scores pending evidence-based review.')
ON CONFLICT (name) DO NOTHING;

