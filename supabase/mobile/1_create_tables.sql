-- =============================================================================
-- SAFEPEDS / PED Health AI — Create tables, types, functions, triggers
-- Step 1 of 3 for Supabase SQL Editor (mobile-friendly)
-- Run first on an empty Supabase project.
-- Generated from safepeds_app_complete_schema.sql — do not edit by hand.
-- Regenerate: node scripts/split-safepeds-schema.mjs
-- =============================================================================



-- ─── 20250701000000_create_profiles.sql ───
-- PED Health AI — User profiles table
-- Run via Supabase CLI or SQL Editor: supabase db push

-- ─── Profiles ───────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  age integer check (age is null or (age >= 13 and age <= 120)),
  sex text check (
    sex is null
    or sex in ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  height numeric check (height is null or (height > 0 and height <= 300)),
  weight numeric check (weight is null or (weight > 0 and weight <= 500)),
  body_fat numeric check (
    body_fat is null
    or (body_fat >= 0 and body_fat <= 100)
  ),
  training_experience text check (
    training_experience is null
    or training_experience in ('beginner', 'intermediate', 'advanced', 'elite')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

comment on table public.profiles is 'Extended user profile data for PED Health AI';

comment on column public.profiles.height is 'Height in centimeters';

comment on column public.profiles.weight is 'Weight in kilograms';

comment on column public.profiles.body_fat is 'Body fat percentage';

-- ─── Auto-create profile on signup ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── Updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ─── 20250702000000_compounds_and_cycles.sql ───
-- PED Health AI — Phase 3: Compound knowledge base & user cycles
-- Run after 20250701000000_create_profiles.sql

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.compound_type_enum as enum (
  'anabolic',
  'androgen',
  'peptide',
  'hormone',
  'sarm',
  'fat_loss',
  'pct',
  'ancillary',
  'support',
  'other'
);

create type public.administration_enum as enum (
  'oral',
  'intramuscular',
  'subcutaneous',
  'intravenous',
  'transdermal',
  'nasal',
  'other'
);

create type public.dose_unit_enum as enum ('mg', 'mcg', 'IU', 'ml');

-- ─── compound_categories ─────────────────────────────────────────────────────

create table if not exists public.compound_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- ─── compounds ───────────────────────────────────────────────────────────────

create table if not exists public.compounds (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.compound_categories (id) on delete restrict,
  name text not null,
  scientific_name text,
  compound_type public.compound_type_enum not null default 'other',
  administration public.administration_enum not null default 'other',
  ester text,
  half_life text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

create index if not exists compounds_category_id_idx on public.compounds (category_id);

create index if not exists compounds_name_idx on public.compounds using gin (to_tsvector('english', name));

create index if not exists compounds_active_idx on public.compounds (active) where active = true;

-- ─── compound_profiles ───────────────────────────────────────────────────────

create table if not exists public.compound_profiles (
  compound_id uuid primary key references public.compounds (id) on delete cascade,
  liver_toxicity smallint check (liver_toxicity is null or (liver_toxicity between 0 and 10)),
  kidney_toxicity smallint check (kidney_toxicity is null or (kidney_toxicity between 0 and 10)),
  cardiovascular_toxicity smallint check (cardiovascular_toxicity is null or (cardiovascular_toxicity between 0 and 10)),
  lipid_impact smallint check (lipid_impact is null or (lipid_impact between 0 and 10)),
  hematocrit_impact smallint check (hematocrit_impact is null or (hematocrit_impact between 0 and 10)),
  blood_pressure_impact smallint check (blood_pressure_impact is null or (blood_pressure_impact between 0 and 10)),
  estrogenic_activity smallint check (estrogenic_activity is null or (estrogenic_activity between 0 and 10)),
  androgenic_activity smallint check (androgenic_activity is null or (androgenic_activity between 0 and 10)),
  prolactin_activity smallint check (prolactin_activity is null or (prolactin_activity between 0 and 10)),
  bloodwork_markers text[] not null default '{}',
  monitoring_frequency text,
  mechanism_of_action text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── user_cycles ─────────────────────────────────────────────────────────────

create table if not exists public.user_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_name text not null,
  goal text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_cycles_user_id_idx on public.user_cycles (user_id);

-- ─── cycle_compounds ─────────────────────────────────────────────────────────

create table if not exists public.cycle_compounds (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.user_cycles (id) on delete cascade,
  compound_id uuid not null references public.compounds (id) on delete restrict,
  weekly_dose numeric not null check (weekly_dose > 0),
  unit public.dose_unit_enum not null default 'mg',
  frequency_per_week smallint not null check (frequency_per_week between 1 and 14),
  duration_weeks smallint not null check (duration_weeks > 0),
  notes text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (cycle_id, compound_id)
);

create index if not exists cycle_compounds_cycle_id_idx on public.cycle_compounds (cycle_id);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

drop trigger if exists compound_profiles_updated_at on public.compound_profiles;

create trigger compound_profiles_updated_at
  before update on public.compound_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_cycles_updated_at on public.user_cycles;

create trigger user_cycles_updated_at
  before update on public.user_cycles
  for each row execute function public.set_updated_at();

-- ─── 20250703000000_bloodwork.sql ───
-- PED Health AI — Phase 4: Bloodwork management system
-- Run after Phase 3 migrations

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type public.bloodwork_status_enum as enum ('Low', 'Normal', 'High');

-- ─── blood_markers (reference — extensible without app code changes) ─────────

create table if not exists public.blood_markers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  default_unit text,
  default_reference_low numeric,
  default_reference_high numeric,
  display_order smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists blood_markers_category_idx on public.blood_markers (category);

create index if not exists blood_markers_active_idx on public.blood_markers (active) where active = true;

-- ─── bloodwork_reports ───────────────────────────────────────────────────────

create table if not exists public.bloodwork_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_name text not null,
  lab_name text,
  collection_date date not null,
  uploaded_file_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bloodwork_reports_user_id_idx on public.bloodwork_reports (user_id);

create index if not exists bloodwork_reports_collection_date_idx on public.bloodwork_reports (collection_date desc);

-- ─── bloodwork_results ───────────────────────────────────────────────────────

create table if not exists public.bloodwork_results (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.bloodwork_reports (id) on delete cascade,
  marker_name text not null,
  category text not null,
  result_value numeric not null,
  unit text not null,
  reference_low numeric,
  reference_high numeric,
  status public.bloodwork_status_enum,
  created_at timestamptz not null default now()
);

create index if not exists bloodwork_results_report_id_idx on public.bloodwork_results (report_id);

create index if not exists bloodwork_results_marker_name_idx on public.bloodwork_results (marker_name);

-- ─── bloodwork_history (trend graphing) ──────────────────────────────────────

create table if not exists public.bloodwork_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  marker_name text not null,
  result_value numeric not null,
  unit text not null,
  collection_date date not null,
  report_id uuid references public.bloodwork_reports (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bloodwork_history_user_marker_date_idx
  on public.bloodwork_history (user_id, marker_name, collection_date desc);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

drop trigger if exists bloodwork_reports_updated_at on public.bloodwork_reports;

create trigger bloodwork_reports_updated_at
  before update on public.bloodwork_reports
  for each row execute function public.set_updated_at();

-- ─── Status calculation helper ───────────────────────────────────────────────

create or replace function public.calculate_bloodwork_status(
  val numeric,
  ref_low numeric,
  ref_high numeric
)
returns public.bloodwork_status_enum
language plpgsql
immutable
as $$
begin
  if ref_low is not null and val < ref_low then
    return 'Low'::public.bloodwork_status_enum;
  end if;
  if ref_high is not null and val > ref_high then
    return 'High'::public.bloodwork_status_enum;
  end if;
  if ref_low is not null or ref_high is not null then
    return 'Normal'::public.bloodwork_status_enum;
  end if;
  return null;
end;
$$;

-- ─── Sync history on result insert/update ────────────────────────────────────

create or replace function public.sync_bloodwork_history_from_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_collection_date date;
begin
  select br.user_id, br.collection_date
  into v_user_id, v_collection_date
  from public.bloodwork_reports br
  where br.id = new.report_id;

  if tg_op = 'DELETE' then
    delete from public.bloodwork_history
    where report_id = old.report_id
      and marker_name = old.marker_name
      and collection_date = (
        select collection_date from public.bloodwork_reports where id = old.report_id
      );
    return old;
  end if;

  -- Auto-calculate status if not set
  if new.status is null then
    new.status := public.calculate_bloodwork_status(
      new.result_value, new.reference_low, new.reference_high
    );
  end if;

  delete from public.bloodwork_history
  where user_id = v_user_id
    and marker_name = new.marker_name
    and collection_date = v_collection_date
    and report_id = new.report_id;

  insert into public.bloodwork_history (
    user_id, marker_name, result_value, unit, collection_date, report_id
  ) values (
    v_user_id, new.marker_name, new.result_value, new.unit, v_collection_date, new.report_id
  );

  return new;
end;
$$;

drop trigger if exists bloodwork_results_sync_history on public.bloodwork_results;

create trigger bloodwork_results_sync_history
  after insert or update on public.bloodwork_results
  for each row execute function public.sync_bloodwork_history_from_result();

drop trigger if exists bloodwork_results_delete_history on public.bloodwork_results;

create trigger bloodwork_results_delete_history
  after delete on public.bloodwork_results
  for each row execute function public.sync_bloodwork_history_from_result();

-- ─── Supabase Storage bucket for report files ────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bloodwork-reports',
  'bloodwork-reports',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── 20250704000000_risk_engine.sql ───
-- PED Health AI — Phase 5: Evidence-based risk engine configuration
-- Rules are evaluated by the backend Risk Engine — AI does NOT set scores.

-- ─── risk_categories ─────────────────────────────────────────────────────────

create table if not exists public.risk_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  display_order smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── risk_rules (configurable without app code changes) ──────────────────────

create table if not exists public.risk_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  category_slug text not null references public.risk_categories (slug) on delete cascade,
  name text not null,
  description text,
  -- JSON condition evaluated by the Risk Engine rule framework
  condition jsonb not null default '{}',
  weight numeric not null default 10 check (weight >= 0 and weight <= 100),
  evidence_placeholder text,
  explanation text not null,
  enabled boolean not null default true,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists risk_rules_category_slug_idx on public.risk_rules (category_slug);

create index if not exists risk_rules_enabled_idx on public.risk_rules (enabled) where enabled = true;

-- ─── risk_assessments (history) ──────────────────────────────────────────────

create type public.risk_assessment_type_enum as enum (
  'calculate',
  'compare',
  'what_if'
);

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_id uuid references public.user_cycles (id) on delete set null,
  assessment_type public.risk_assessment_type_enum not null default 'calculate',
  input_snapshot jsonb not null default '{}',
  output jsonb not null default '{}',
  overall_score numeric,
  created_at timestamptz not null default now()
);

create index if not exists risk_assessments_user_id_idx on public.risk_assessments (user_id, created_at desc);

-- ─── updated_at ──────────────────────────────────────────────────────────────

drop trigger if exists risk_rules_updated_at on public.risk_rules;

create trigger risk_rules_updated_at
  before update on public.risk_rules
  for each row execute function public.set_updated_at();

-- ─── 20250705000000_ai_intelligence.sql ───
-- PED Health AI — Phase 6: AI Health Intelligence
-- Educational AI layer — explains platform data only; does NOT score risk or diagnose.

-- ─── educational_articles ────────────────────────────────────────────────────

create table if not exists public.educational_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text,
  body text not null,
  tags text[] not null default '{}',
  published boolean not null default true,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists educational_articles_category_idx on public.educational_articles (category);

create index if not exists educational_articles_published_idx on public.educational_articles (published) where published = true;

-- ─── educational_references ──────────────────────────────────────────────────

create table if not exists public.educational_references (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.educational_articles (id) on delete set null,
  compound_id uuid references public.compounds (id) on delete set null,
  title text not null,
  url text,
  citation_text text,
  evidence_level text check (
    evidence_level is null
    or evidence_level in ('review', 'guideline', 'study', 'educational')
  ),
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists educational_references_article_idx on public.educational_references (article_id);

-- ─── ai_memory (user context for personalized explanations) ──────────────────

create type public.ai_memory_type_enum as enum (
  'training_goal',
  'current_cycle',
  'conversation_summary',
  'user_preference',
  'last_report_context'
);

create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  memory_type public.ai_memory_type_enum not null,
  context_key text not null default 'default',
  content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, memory_type, context_key)
);

create index if not exists ai_memory_user_id_idx on public.ai_memory (user_id);

-- ─── ai_audit_logs (compliance & security) ───────────────────────────────────

create type public.ai_feature_enum as enum (
  'bloodwork_report',
  'cycle_report',
  'timeline',
  'insights',
  'chat'
);

create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature public.ai_feature_enum not null,
  model text,
  prompt_hash text,
  input_snapshot jsonb not null default '{}',
  output_snapshot jsonb,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  status text not null default 'success' check (status in ('success', 'error', 'blocked')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_audit_logs_user_id_idx on public.ai_audit_logs (user_id, created_at desc);

-- ─── ai_reports (cached generated reports) ───────────────────────────────────

create type public.ai_report_type_enum as enum (
  'bloodwork',
  'cycle',
  'timeline',
  'insights'
);

create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_type public.ai_report_type_enum not null,
  source_id uuid,
  model text,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ai_reports_user_type_idx on public.ai_reports (user_id, report_type, created_at desc);

create index if not exists ai_reports_source_idx on public.ai_reports (source_id) where source_id is not null;

-- ─── ai_chat_messages ────────────────────────────────────────────────────────

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_user_idx on public.ai_chat_messages (user_id, created_at desc);

-- ─── updated_at triggers ───────────────────────────────────────────────────────

drop trigger if exists educational_articles_updated_at on public.educational_articles;

create trigger educational_articles_updated_at
  before update on public.educational_articles
  for each row execute function public.set_updated_at();

drop trigger if exists ai_memory_updated_at on public.ai_memory;

create trigger ai_memory_updated_at
  before update on public.ai_memory
  for each row execute function public.set_updated_at();

comment on table public.educational_articles is 'Curated educational content for AI citations and knowledge base';

comment on table public.ai_audit_logs is 'Audit trail for all AI requests — compliance and security';

comment on table public.ai_memory is 'User context memory for personalized educational explanations only';

-- ─── 20250706000000_knowledge_base.sql ───
-- PED Health AI — Phase 7: Scientific Knowledge Base (RAG)
-- Proprietary educational content for AI context and user browsing.

-- ─── Admin flag on profiles ──────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is 'Grants access to Knowledge Base CMS';

-- ─── knowledge_categories ────────────────────────────────────────────────────

create table if not exists public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_categories_slug_idx on public.knowledge_categories (slug);

-- ─── knowledge_articles ──────────────────────────────────────────────────────

create type public.knowledge_difficulty_enum as enum (
  'beginner',
  'intermediate',
  'advanced'
);

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category_id uuid not null references public.knowledge_categories (id) on delete restrict,
  summary text,
  content text not null default '',
  difficulty_level public.knowledge_difficulty_enum not null default 'beginner',
  image_url text,
  view_count integer not null default 0 check (view_count >= 0),
  published boolean not null default false,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_articles_category_idx on public.knowledge_articles (category_id);

create index if not exists knowledge_articles_published_idx on public.knowledge_articles (published) where published = true;

create index if not exists knowledge_articles_slug_idx on public.knowledge_articles (slug);

create index if not exists knowledge_articles_view_count_idx on public.knowledge_articles (view_count desc);

create index if not exists knowledge_articles_search_idx on public.knowledge_articles using gin (search_vector);

-- Full-text search vector maintenance
create or replace function public.knowledge_articles_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content, '')), 'C');
  return new;
end;
$$;

drop trigger if exists knowledge_articles_search_vector on public.knowledge_articles;

create trigger knowledge_articles_search_vector
  before insert or update of title, summary, content on public.knowledge_articles
  for each row execute function public.knowledge_articles_search_vector_update();

-- ─── knowledge_references (scientific citations) ─────────────────────────────

create table if not exists public.knowledge_references (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  title text not null,
  authors text,
  journal text,
  publication_year smallint check (publication_year is null or publication_year between 1900 and 2100),
  doi text,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_references_article_idx on public.knowledge_references (article_id);

-- ─── compound_articles ───────────────────────────────────────────────────────

create table if not exists public.compound_articles (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.compounds (id) on delete cascade,
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (compound_id, article_id)
);

create index if not exists compound_articles_compound_idx on public.compound_articles (compound_id);

create index if not exists compound_articles_article_idx on public.compound_articles (article_id);

-- ─── blood_marker_articles ───────────────────────────────────────────────────

create table if not exists public.blood_marker_articles (
  id uuid primary key default gen_random_uuid(),
  blood_marker_id uuid not null references public.blood_markers (id) on delete cascade,
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blood_marker_id, article_id)
);

create index if not exists blood_marker_articles_marker_idx on public.blood_marker_articles (blood_marker_id);

create index if not exists blood_marker_articles_article_idx on public.blood_marker_articles (article_id);

-- ─── updated_at ──────────────────────────────────────────────────────────────

drop trigger if exists knowledge_articles_updated_at on public.knowledge_articles;

create trigger knowledge_articles_updated_at
  before update on public.knowledge_articles
  for each row execute function public.set_updated_at();

-- ─── Storage: knowledge-images ───────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('knowledge-images', 'knowledge-images', true)
on conflict (id) do nothing;

-- Increment view count (callable by anyone for published articles)
create or replace function public.increment_article_view_count(article_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.knowledge_articles
  set view_count = view_count + 1
  where slug = article_slug and published = true;
end;
$$;

grant execute on function public.increment_article_view_count(text) to anon, authenticated;

comment on table public.knowledge_articles is 'Proprietary educational articles — primary AI knowledge source';

comment on table public.knowledge_references is 'Scientific references linked to knowledge articles';

-- ─── 20250707000000_health_support_library.sql ───
-- PED Health AI — Phase 8: Educational Health Support Library
-- Educational only — does not diagnose, prescribe, or recommend dosages.

-- ─── health_topics ───────────────────────────────────────────────────────────

create table if not exists public.health_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  summary text,
  content text not null default '',
  overview text,
  why_it_matters text,
  blood_markers_involved text[] not null default '{}',
  image_url text,
  view_count integer not null default 0 check (view_count >= 0),
  published boolean not null default false,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_topics_category_idx on public.health_topics (category);

create index if not exists health_topics_published_idx on public.health_topics (published) where published = true;

create index if not exists health_topics_slug_idx on public.health_topics (slug);

create index if not exists health_topics_search_idx on public.health_topics using gin (search_vector);

create or replace function public.health_topics_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.overview, '')), 'B');
  return new;
end;
$$;

drop trigger if exists health_topics_search_vector on public.health_topics;

create trigger health_topics_search_vector
  before insert or update of title, summary, content, overview on public.health_topics
  for each row execute function public.health_topics_search_vector_update();

-- ─── support_options ─────────────────────────────────────────────────────────

create type public.support_option_type_enum as enum (
  'Lifestyle',
  'Monitoring',
  'Nutrition',
  'Supplement',
  'Medication Information',
  'Educational'
);

create table if not exists public.support_options (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  title text not null,
  type public.support_option_type_enum not null default 'Educational',
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists support_options_topic_idx on public.support_options (topic_id);

-- ─── support_details ─────────────────────────────────────────────────────────

create table if not exists public.support_details (
  id uuid primary key default gen_random_uuid(),
  support_option_id uuid not null references public.support_options (id) on delete cascade,
  description text not null,
  scientific_references jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists support_details_option_idx on public.support_details (support_option_id);

-- ─── Junction: health topics ↔ blood markers ─────────────────────────────────

create table if not exists public.health_topic_blood_markers (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  blood_marker_id uuid not null references public.blood_markers (id) on delete cascade,
  unique (topic_id, blood_marker_id)
);

-- ─── Junction: health topics ↔ compounds ─────────────────────────────────────

create table if not exists public.health_topic_compounds (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  compound_id uuid not null references public.compounds (id) on delete cascade,
  unique (topic_id, compound_id)
);

-- ─── Junction: health topics ↔ knowledge articles ────────────────────────────

create table if not exists public.health_topic_knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  unique (topic_id, article_id)
);

-- ─── Junction: risk categories ↔ health topics ───────────────────────────────

create table if not exists public.risk_category_health_topics (
  id uuid primary key default gen_random_uuid(),
  risk_category_slug text not null,
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  unique (risk_category_slug, topic_id)
);

create index if not exists risk_category_health_topics_slug_idx
  on public.risk_category_health_topics (risk_category_slug);

-- ─── User bookmarks & recently viewed ────────────────────────────────────────

create table if not exists public.health_topic_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.health_topic_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists health_topic_views_user_idx
  on public.health_topic_views (user_id, viewed_at desc);

-- ─── updated_at ──────────────────────────────────────────────────────────────

drop trigger if exists health_topics_updated_at on public.health_topics;

create trigger health_topics_updated_at
  before update on public.health_topics
  for each row execute function public.set_updated_at();

-- ─── View count RPC ──────────────────────────────────────────────────────────

create or replace function public.increment_health_topic_view_count(topic_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.health_topics set view_count = view_count + 1
  where slug = topic_slug and published = true;
end;
$$;

grant execute on function public.increment_health_topic_view_count(text) to anon, authenticated;

comment on table public.health_topics is 'Educational health support topics — primary AI health content source';
