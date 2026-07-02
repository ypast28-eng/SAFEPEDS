-- Bloodwork upload metadata (file name, type, processing status)
-- Safe on existing databases: ADD COLUMN IF NOT EXISTS only.

alter table public.bloodwork_reports
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists status text not null default 'uploaded'
    check (status in ('uploaded', 'pending_review', 'complete'));

comment on column public.bloodwork_reports.uploaded_file_url is
  'Storage path in bucket bloodwork-reports (user_id/report_id/...)';
comment on column public.bloodwork_reports.status is
  'uploaded = file only; pending_review = manual marker entry; complete = markers saved';

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
