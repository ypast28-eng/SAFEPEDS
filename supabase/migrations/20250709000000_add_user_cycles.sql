-- SAFEPEDS app cycle tables (user_cycles + cycle_compounds)
-- Safe to run on databases that only have PEDSAFE `cycles` / `cycle_compounds`.
-- Does not delete or truncate existing data.

-- ─── Shared helpers / enums ───────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create type public.dose_unit_enum as enum ('mg', 'mcg', 'IU', 'ml');
exception
  when duplicate_object then null;
end $$;

-- ─── user_cycles (app table; distinct from PEDSAFE public.cycles) ─────────────

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

comment on table public.user_cycles is
  'SAFEPEDS user cycle plans — used by the Vercel frontend cycle builder';

create index if not exists user_cycles_user_id_idx on public.user_cycles (user_id);

drop trigger if exists user_cycles_updated_at on public.user_cycles;
create trigger user_cycles_updated_at
  before update on public.user_cycles
  for each row execute function public.set_updated_at();

-- ─── cycle_compounds (stack line items) ───────────────────────────────────────
-- If PEDSAFE already created cycle_compounds referencing public.cycles, rename it
-- so we can create the SAFEPEDS table the app queries without dropping rows.

do $$
declare
  parent_table text;
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'cycle_compounds'
  ) then
    return;
  end if;

  select parent.relname
  into parent_table
  from pg_constraint con
  join pg_class child on child.oid = con.conrelid
  join pg_namespace child_ns on child_ns.oid = child.relnamespace
  join pg_class parent on parent.oid = con.confrelid
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
  where child_ns.nspname = 'public'
    and child.relname = 'cycle_compounds'
    and con.contype = 'f'
    and att.attname = 'cycle_id'
  limit 1;

  if parent_table = 'cycles' then
    alter table public.cycle_compounds rename to pedsafe_cycle_compounds;
    comment on table public.pedsafe_cycle_compounds is
      'Legacy PEDSAFE cycle stack rows (references public.cycles). Renamed to avoid clashing with SAFEPEDS cycle_compounds.';
  end if;
end $$;

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

comment on table public.cycle_compounds is
  'Compounds in a SAFEPEDS user cycle — one row per compound per cycle';

create index if not exists cycle_compounds_cycle_id_idx on public.cycle_compounds (cycle_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

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
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
