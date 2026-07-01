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
