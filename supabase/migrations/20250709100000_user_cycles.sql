-- SAFEPEDS — user_cycles + cycle_compounds (app cycle builder)
-- Safe on existing projects: uses IF NOT EXISTS / OR REPLACE; does not delete data.
-- Run after compounds exist. Coexists with PEDSAFE public.cycles if present.

-- ─── dose_unit_enum (required by cycle_compounds.unit) ───────────────────────

do $$ begin
  create type public.dose_unit_enum as enum ('mg', 'mcg', 'IU', 'ml');
exception
  when duplicate_object then null;
end $$;

-- ─── Shared updated_at helper ────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── user_cycles ─────────────────────────────────────────────────────────────
-- App: frontend/services/cycles.ts → .from("user_cycles")
-- Columns: cycle_name, goal, start_date, end_date, notes, user_id

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

create index if not exists user_cycles_user_updated_idx
  on public.user_cycles (user_id, updated_at desc);

comment on table public.user_cycles is 'User-owned cycle plans (SAFEPEDS app — cycle builder)';

drop trigger if exists user_cycles_updated_at on public.user_cycles;
create trigger user_cycles_updated_at
  before update on public.user_cycles
  for each row execute function public.set_updated_at();

-- ─── cycle_compounds (compound stack per cycle) ──────────────────────────────
-- App: frontend/services/cycles.ts → .from("cycle_compounds")
-- Columns: cycle_id, compound_id, weekly_dose, unit, frequency_per_week,
--          duration_weeks, notes, sort_order

create table if not exists public.cycle_compounds (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.user_cycles (id) on delete cascade,
  compound_id uuid not null references public.compounds (id) on delete restrict,
  weekly_dose numeric not null check (weekly_dose > 0),
  unit public.dose_unit_enum not null default 'mg',
  frequency_per_week smallint not null default 1 check (frequency_per_week between 1 and 14),
  duration_weeks smallint not null check (duration_weeks > 0),
  notes text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint cycle_compounds_unique unique (cycle_id, compound_id)
);

create index if not exists cycle_compounds_cycle_id_idx on public.cycle_compounds (cycle_id);

create index if not exists cycle_compounds_compound_id_idx on public.cycle_compounds (compound_id);

comment on table public.cycle_compounds is 'Compounds in a user cycle with dose, frequency, and duration';

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.user_cycles enable row level security;
alter table public.cycle_compounds enable row level security;

drop policy if exists "Users can view own cycles" on public.user_cycles;
create policy "Users can view own cycles"
  on public.user_cycles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cycles" on public.user_cycles;
create policy "Users can insert own cycles"
  on public.user_cycles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cycles" on public.user_cycles;
create policy "Users can update own cycles"
  on public.user_cycles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cycles" on public.user_cycles;
create policy "Users can delete own cycles"
  on public.user_cycles for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view own cycle compounds" on public.cycle_compounds;
create policy "Users can view own cycle compounds"
  on public.cycle_compounds for select to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own cycle compounds" on public.cycle_compounds;
create policy "Users can insert own cycle compounds"
  on public.cycle_compounds for insert to authenticated
  with check (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own cycle compounds" on public.cycle_compounds;
create policy "Users can update own cycle compounds"
  on public.cycle_compounds for update to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own cycle compounds" on public.cycle_compounds;
create policy "Users can delete own cycle compounds"
  on public.cycle_compounds for delete to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );
