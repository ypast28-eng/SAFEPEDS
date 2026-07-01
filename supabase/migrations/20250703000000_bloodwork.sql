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

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.blood_markers enable row level security;
alter table public.bloodwork_reports enable row level security;
alter table public.bloodwork_results enable row level security;
alter table public.bloodwork_history enable row level security;

create policy "Authenticated users can read blood markers"
  on public.blood_markers for select to authenticated using (active = true);

create policy "Users can view own reports"
  on public.bloodwork_reports for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.bloodwork_reports for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.bloodwork_reports for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own reports"
  on public.bloodwork_reports for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own results"
  on public.bloodwork_results for select to authenticated
  using (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can insert own results"
  on public.bloodwork_results for insert to authenticated
  with check (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can update own results"
  on public.bloodwork_results for update to authenticated
  using (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can delete own results"
  on public.bloodwork_results for delete to authenticated
  using (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can view own history"
  on public.bloodwork_history for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.bloodwork_history for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own history"
  on public.bloodwork_history for delete to authenticated
  using (auth.uid() = user_id);

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

create policy "Users can upload own bloodwork files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own bloodwork files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own bloodwork files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own bloodwork files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
