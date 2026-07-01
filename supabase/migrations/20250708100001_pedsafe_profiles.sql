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
