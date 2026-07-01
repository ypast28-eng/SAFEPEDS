-- PEDSAFE 7/7 — Seed starter compounds

insert into public.compounds (name, scientific_name, compound_type, administration, description)
values
  ('Testosterone Enanthate', 'Testosterone enanthate', 'androgen', 'intramuscular', 'Educational reference entry'),
  ('Turinabol', 'Chlorodehydromethyltestosterone', 'anabolic', 'oral', 'Educational reference entry'),
  ('Anastrozole', 'Anastrozole', 'ancillary', 'oral', 'Educational reference entry — informational only')
on conflict (name) do nothing;
