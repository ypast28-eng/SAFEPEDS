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
