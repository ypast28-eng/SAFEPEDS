-- Bloodwork cruise vs blast phase tagging

alter table public.bloodwork_reports
  add column if not exists phase text
  check (phase is null or phase in ('cruise', 'blast', 'unknown'));

comment on column public.bloodwork_reports.phase is
  'Whether bloodwork was collected during cruise (baseline) or blast (cycle) phase. Null for legacy records.';

create index if not exists bloodwork_reports_user_phase_idx
  on public.bloodwork_reports (user_id, phase, collection_date desc);
