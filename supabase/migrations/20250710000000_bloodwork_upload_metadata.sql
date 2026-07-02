-- Bloodwork upload file metadata columns
-- Safe on existing databases: ADD COLUMN IF NOT EXISTS only.

alter table public.bloodwork_reports
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size integer,
  add column if not exists file_path text,
  add column if not exists file_url text,
  add column if not exists uploaded_file_url text,
  add column if not exists status text default 'uploaded';

comment on column public.bloodwork_reports.file_path is
  'Storage object path in bucket bloodwork-reports (user_id/report_id/...)';
comment on column public.bloodwork_reports.file_url is
  'Optional cached public/signed URL; prefer file_path + signed URL at read time';
comment on column public.bloodwork_reports.uploaded_file_url is
  'Legacy alias for file_path — kept for backward compatibility';

-- Ensure storage bucket exists (idempotent)
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
