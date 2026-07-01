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

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.compound_categories enable row level security;
alter table public.compounds enable row level security;
alter table public.compound_profiles enable row level security;
alter table public.user_cycles enable row level security;
alter table public.cycle_compounds enable row level security;

-- Knowledge base: read-only for authenticated users
create policy "Authenticated users can read categories"
  on public.compound_categories for select to authenticated using (true);

create policy "Authenticated users can read compounds"
  on public.compounds for select to authenticated using (active = true);

create policy "Authenticated users can read compound profiles"
  on public.compound_profiles for select to authenticated using (true);

-- User cycles: full CRUD on own rows
create policy "Users can view own cycles"
  on public.user_cycles for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own cycles"
  on public.user_cycles for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own cycles"
  on public.user_cycles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own cycles"
  on public.user_cycles for delete to authenticated
  using (auth.uid() = user_id);

-- Cycle compounds: access via owning cycle
create policy "Users can view own cycle compounds"
  on public.cycle_compounds for select to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

create policy "Users can insert own cycle compounds"
  on public.cycle_compounds for insert to authenticated
  with check (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

create policy "Users can update own cycle compounds"
  on public.cycle_compounds for update to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

create policy "Users can delete own cycle compounds"
  on public.cycle_compounds for delete to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );
