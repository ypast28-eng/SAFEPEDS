-- SAFEPEDS mobile / SQL Editor fix — missing tables for the current app
-- Safe to re-run on an existing database: CREATE only, no drops or data changes.
-- Run this BEFORE 1_create_tables.sql if your project already has partial PEDSAFE tables.
-- If starting fresh, skip this and run 1 → 2 → 3 instead.

-- Compound library categories (frontend/services/compounds.ts)
create table if not exists public.compound_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Saved cycle metadata (frontend/services/cycles.ts)
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

-- Compounds in a saved cycle (also required by frontend/services/cycles.ts)
create table if not exists public.cycle_compounds (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.user_cycles (id) on delete cascade,
  compound_id uuid not null references public.compounds (id) on delete restrict,
  weekly_dose numeric not null check (weekly_dose > 0),
  unit text not null default 'mg' check (unit in ('mg', 'mcg', 'IU', 'ml')),
  frequency_per_week smallint not null check (frequency_per_week between 1 and 14),
  duration_weeks smallint not null check (duration_weeks > 0),
  notes text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (cycle_id, compound_id)
);

create index if not exists cycle_compounds_cycle_id_idx on public.cycle_compounds (cycle_id);
