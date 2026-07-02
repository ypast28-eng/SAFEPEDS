-- Run in Supabase SQL Editor if bloodwork file upload fails (bucket / RLS missing).
-- Safe to re-run: no drops or deletes.

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

alter table public.bloodwork_reports
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size integer,
  add column if not exists file_path text,
  add column if not exists file_url text,
  add column if not exists uploaded_file_url text,
  add column if not exists status text default 'uploaded';

drop policy if exists "Users can upload own bloodwork files" on storage.objects;
create policy "Users can upload own bloodwork files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can view own bloodwork files" on storage.objects;
create policy "Users can view own bloodwork files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own bloodwork files" on storage.objects;
create policy "Users can update own bloodwork files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own bloodwork files" on storage.objects;
create policy "Users can delete own bloodwork files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
