-- PEDSAFE 1/7 — Extensions, enums, shared helpers

create extension if not exists "pgcrypto";

do $$ begin
  create type public.lab_result_status as enum ('Low', 'Normal', 'High');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dose_unit as enum ('mg', 'mcg', 'IU', 'ml');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.note_type as enum ('general', 'cycle', 'bloodwork', 'compound');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
