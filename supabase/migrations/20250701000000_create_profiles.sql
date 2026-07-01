-- PED Health AI — User profiles table
-- Run via Supabase CLI or SQL Editor: supabase db push

-- ─── Profiles ───────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  age integer check (age is null or (age >= 13 and age <= 120)),
  sex text check (
    sex is null
    or sex in ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  height numeric check (height is null or (height > 0 and height <= 300)),
  weight numeric check (weight is null or (weight > 0 and weight <= 500)),
  body_fat numeric check (
    body_fat is null
    or (body_fat >= 0 and body_fat <= 100)
  ),
  training_experience text check (
    training_experience is null
    or training_experience in ('beginner', 'intermediate', 'advanced', 'elite')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

comment on table public.profiles is 'Extended user profile data for PED Health AI';
comment on column public.profiles.height is 'Height in centimeters';
comment on column public.profiles.weight is 'Weight in kilograms';
comment on column public.profiles.body_fat is 'Body fat percentage';

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── Auto-create profile on signup ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── Updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
