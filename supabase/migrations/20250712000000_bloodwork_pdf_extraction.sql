-- Structured PDF extraction fields on bloodwork results + AI snapshot on reports

alter table public.bloodwork_results
  add column if not exists result_text text,
  add column if not exists comparator text,
  add column if not exists flag text,
  add column if not exists reference_range text;

comment on column public.bloodwork_results.result_text is
  'Display result as printed on the lab report, e.g. <1 or >90';
comment on column public.bloodwork_results.reference_range is
  'Reference interval as printed on the lab report';

alter table public.bloodwork_reports
  add column if not exists extraction_snapshot jsonb;

comment on column public.bloodwork_reports.extraction_snapshot is
  'Structured marker JSON from PDF extraction for AI Insights';
