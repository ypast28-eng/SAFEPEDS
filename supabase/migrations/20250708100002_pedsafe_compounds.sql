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
