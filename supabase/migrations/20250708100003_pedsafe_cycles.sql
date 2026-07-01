-- PEDSAFE 4/7 — Cycles + cycle_compounds + RLS

create table if not exists public.cycles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  goal        text,
  start_date  date,
  end_date    date,
  status      text not null default 'planned'
                check (status in ('planned', 'active', 'completed', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cycles_user_id_idx on public.cycles (user_id);
create index if not exists cycles_user_updated_idx on public.cycles (user_id, updated_at desc);

comment on table public.cycles is 'User cycle plans — educational tracking only';

create table if not exists public.cycle_compounds (
  id                  uuid primary key default gen_random_uuid(),
  cycle_id            uuid not null references public.cycles (id) on delete cascade,
  compound_id         uuid not null references public.compounds (id) on delete restrict,
  weekly_dose         numeric not null check (weekly_dose > 0),
  unit                public.dose_unit not null default 'mg',
  frequency_per_week  smallint not null default 1 check (frequency_per_week between 1 and 14),
  duration_weeks      smallint not null check (duration_weeks > 0),
  notes               text,
  sort_order          smallint not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint cycle_compounds_unique unique (cycle_id, compound_id)
);

create index if not exists cycle_compounds_cycle_id_idx on public.cycle_compounds (cycle_id);

drop trigger if exists cycles_updated_at on public.cycles;
create trigger cycles_updated_at
  before update on public.cycles
  for each row execute function public.set_updated_at();

drop trigger if exists cycle_compounds_updated_at on public.cycle_compounds;
create trigger cycle_compounds_updated_at
  before update on public.cycle_compounds
  for each row execute function public.set_updated_at();

alter table public.cycles enable row level security;
alter table public.cycle_compounds enable row level security;

drop policy if exists "cycles_select_own" on public.cycles;
create policy "cycles_select_own"
  on public.cycles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "cycles_insert_own" on public.cycles;
create policy "cycles_insert_own"
  on public.cycles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "cycles_update_own" on public.cycles;
create policy "cycles_update_own"
  on public.cycles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cycles_delete_own" on public.cycles;
create policy "cycles_delete_own"
  on public.cycles for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "cycle_compounds_select_own" on public.cycle_compounds;
create policy "cycle_compounds_select_own"
  on public.cycle_compounds for select to authenticated
  using (
    exists (
      select 1 from public.cycles c
      where c.id = cycle_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "cycle_compounds_insert_own" on public.cycle_compounds;
create policy "cycle_compounds_insert_own"
  on public.cycle_compounds for insert to authenticated
  with check (
    exists (
      select 1 from public.cycles c
      where c.id = cycle_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "cycle_compounds_update_own" on public.cycle_compounds;
create policy "cycle_compounds_update_own"
  on public.cycle_compounds for update to authenticated
  using (
    exists (
      select 1 from public.cycles c
      where c.id = cycle_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cycles c
      where c.id = cycle_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "cycle_compounds_delete_own" on public.cycle_compounds;
create policy "cycle_compounds_delete_own"
  on public.cycle_compounds for delete to authenticated
  using (
    exists (
      select 1 from public.cycles c
      where c.id = cycle_id and c.user_id = auth.uid()
    )
  );
