-- PEDSAFE reference bundle (auto-aligned with migrations 20250708100000–100006)
-- Deploy via Dashboard + GitHub — see PEDSAFE.md

-- ─── 20250708100000_pedsafe_foundation.sql ───
-- PEDSAFE 1/7 — Extensions, enums, shared helpers

create extension if not exists "pgcrypto";

do $$ begin
  create type public.lab_result_status as enum ('Low', 'Normal', 'High');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dose_unit as enum ('mg', 'mcg', 'IU', 'ml');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.note_type as enum ('general', 'cycle', 'bloodwork', 'compound');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 20250708100001_pedsafe_profiles.sql ───
-- PEDSAFE 2/7 — Profiles + signup trigger + RLS

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  age           integer check (age is null or (age >= 13 and age <= 120)),
  sex           text check (
                  sex is null
                  or sex in ('male', 'female', 'other', 'prefer_not_to_say')
                ),
  height_cm     numeric check (height_cm is null or (height_cm > 0 and height_cm <= 300)),
  weight_kg     numeric check (weight_kg is null or (weight_kg > 0 and weight_kg <= 500)),
  body_fat_pct  numeric check (
                  body_fat_pct is null
                  or (body_fat_pct >= 0 and body_fat_pct <= 100)
                ),
  training_experience text check (
                  training_experience is null
                  or training_experience in ('beginner', 'intermediate', 'advanced', 'elite')
                ),
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'User profile data — one row per auth.users record';

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── 20250708100002_pedsafe_compounds.sql ───
-- PEDSAFE 3/7 — Compounds catalog + admin helper + RLS

create table if not exists public.compounds (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  scientific_name text,
  compound_type   text not null default 'other',
  administration  text not null default 'other',
  ester           text,
  half_life       text,
  description     text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint compounds_name_unique unique (name)
);

comment on table public.compounds is 'Educational compound reference catalog (read-only for users)';

drop trigger if exists compounds_updated_at on public.compounds;
create trigger compounds_updated_at
  before update on public.compounds
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.compounds enable row level security;

drop policy if exists "compounds_select_authenticated" on public.compounds;
create policy "compounds_select_authenticated"
  on public.compounds for select to authenticated
  using (active = true or public.is_admin());

drop policy if exists "compounds_admin_insert" on public.compounds;
create policy "compounds_admin_insert"
  on public.compounds for insert to authenticated
  with check (public.is_admin());

drop policy if exists "compounds_admin_update" on public.compounds;
create policy "compounds_admin_update"
  on public.compounds for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "compounds_admin_delete" on public.compounds;
create policy "compounds_admin_delete"
  on public.compounds for delete to authenticated
  using (public.is_admin());

-- ─── 20250708100003_pedsafe_cycles.sql ───
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

-- ─── 20250708100004_pedsafe_bloodwork.sql ───
-- PEDSAFE 5/7 — Bloodwork + lab_results + status triggers + RLS

create table if not exists public.bloodwork (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  report_name       text not null,
  lab_name          text,
  collection_date   date not null,
  uploaded_file_url text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists bloodwork_user_id_idx on public.bloodwork (user_id);
create index if not exists bloodwork_collection_date_idx on public.bloodwork (user_id, collection_date desc);

comment on table public.bloodwork is 'Bloodwork report metadata — one row per lab panel';

create table if not exists public.lab_results (
  id              uuid primary key default gen_random_uuid(),
  bloodwork_id    uuid not null references public.bloodwork (id) on delete cascade,
  marker_name     text not null,
  category        text not null default 'General',
  result_value    numeric not null,
  unit            text not null,
  reference_low   numeric,
  reference_high  numeric,
  status          public.lab_result_status,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists lab_results_bloodwork_id_idx on public.lab_results (bloodwork_id);
create index if not exists lab_results_marker_idx on public.lab_results (marker_name);

comment on table public.lab_results is 'Per-marker lab values belonging to a bloodwork report';

create or replace function public.calculate_lab_status(
  val numeric,
  ref_low numeric,
  ref_high numeric
)
returns public.lab_result_status
language plpgsql
immutable
as $$
begin
  if ref_low is not null and val < ref_low then
    return 'Low'::public.lab_result_status;
  end if;
  if ref_high is not null and val > ref_high then
    return 'High'::public.lab_result_status;
  end if;
  if ref_low is not null or ref_high is not null then
    return 'Normal'::public.lab_result_status;
  end if;
  return null;
end;
$$;

create or replace function public.set_lab_result_status()
returns trigger
language plpgsql
as $$
begin
  new.status := public.calculate_lab_status(
    new.result_value,
    new.reference_low,
    new.reference_high
  );
  return new;
end;
$$;

drop trigger if exists bloodwork_updated_at on public.bloodwork;
create trigger bloodwork_updated_at
  before update on public.bloodwork
  for each row execute function public.set_updated_at();

drop trigger if exists lab_results_updated_at on public.lab_results;
create trigger lab_results_updated_at
  before update on public.lab_results
  for each row execute function public.set_updated_at();

drop trigger if exists lab_results_set_status on public.lab_results;
create trigger lab_results_set_status
  before insert or update of result_value, reference_low, reference_high
  on public.lab_results
  for each row
  execute function public.set_lab_result_status();

alter table public.bloodwork enable row level security;
alter table public.lab_results enable row level security;

drop policy if exists "bloodwork_select_own" on public.bloodwork;
create policy "bloodwork_select_own"
  on public.bloodwork for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "bloodwork_insert_own" on public.bloodwork;
create policy "bloodwork_insert_own"
  on public.bloodwork for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bloodwork_update_own" on public.bloodwork;
create policy "bloodwork_update_own"
  on public.bloodwork for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bloodwork_delete_own" on public.bloodwork;
create policy "bloodwork_delete_own"
  on public.bloodwork for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "lab_results_select_own" on public.lab_results;
create policy "lab_results_select_own"
  on public.lab_results for select to authenticated
  using (
    exists (
      select 1 from public.bloodwork b
      where b.id = bloodwork_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "lab_results_insert_own" on public.lab_results;
create policy "lab_results_insert_own"
  on public.lab_results for insert to authenticated
  with check (
    exists (
      select 1 from public.bloodwork b
      where b.id = bloodwork_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "lab_results_update_own" on public.lab_results;
create policy "lab_results_update_own"
  on public.lab_results for update to authenticated
  using (
    exists (
      select 1 from public.bloodwork b
      where b.id = bloodwork_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bloodwork b
      where b.id = bloodwork_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "lab_results_delete_own" on public.lab_results;
create policy "lab_results_delete_own"
  on public.lab_results for delete to authenticated
  using (
    exists (
      select 1 from public.bloodwork b
      where b.id = bloodwork_id and b.user_id = auth.uid()
    )
  );

-- ─── 20250708100005_pedsafe_notes.sql ───
-- PEDSAFE 6/7 — Notes + RLS

create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text,
  body          text not null,
  note_type     public.note_type not null default 'general',
  cycle_id      uuid references public.cycles (id) on delete set null,
  bloodwork_id  uuid references public.bloodwork (id) on delete set null,
  compound_id   uuid references public.compounds (id) on delete set null,
  pinned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists notes_cycle_id_idx on public.notes (cycle_id);
create index if not exists notes_bloodwork_id_idx on public.notes (bloodwork_id);

comment on table public.notes is 'Free-form user notes with optional links to cycles, bloodwork, or compounds';

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete to authenticated
  using (auth.uid() = user_id);

-- ─── 20250708100006_pedsafe_seed_compounds.sql ───
-- PEDSAFE 7/7 — Seed starter compounds

insert into public.compounds (name, scientific_name, compound_type, administration, description)
values
  ('Testosterone Enanthate', 'Testosterone enanthate', 'androgen', 'intramuscular', 'Educational reference entry'),
  ('Turinabol', 'Chlorodehydromethyltestosterone', 'anabolic', 'oral', 'Educational reference entry'),
  ('Anastrozole', 'Anastrozole', 'ancillary', 'oral', 'Educational reference entry — informational only')
on conflict (name) do nothing;

