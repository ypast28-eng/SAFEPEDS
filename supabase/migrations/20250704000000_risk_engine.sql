-- PED Health AI — Phase 5: Evidence-based risk engine configuration
-- Rules are evaluated by the backend Risk Engine — AI does NOT set scores.

-- ─── risk_categories ─────────────────────────────────────────────────────────

create table if not exists public.risk_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  display_order smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── risk_rules (configurable without app code changes) ──────────────────────

create table if not exists public.risk_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  category_slug text not null references public.risk_categories (slug) on delete cascade,
  name text not null,
  description text,
  -- JSON condition evaluated by the Risk Engine rule framework
  condition jsonb not null default '{}',
  weight numeric not null default 10 check (weight >= 0 and weight <= 100),
  evidence_placeholder text,
  explanation text not null,
  enabled boolean not null default true,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists risk_rules_category_slug_idx on public.risk_rules (category_slug);
create index if not exists risk_rules_enabled_idx on public.risk_rules (enabled) where enabled = true;

-- ─── risk_assessments (history) ──────────────────────────────────────────────

create type public.risk_assessment_type_enum as enum (
  'calculate',
  'compare',
  'what_if'
);

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_id uuid references public.user_cycles (id) on delete set null,
  assessment_type public.risk_assessment_type_enum not null default 'calculate',
  input_snapshot jsonb not null default '{}',
  output jsonb not null default '{}',
  overall_score numeric,
  created_at timestamptz not null default now()
);

create index if not exists risk_assessments_user_id_idx on public.risk_assessments (user_id, created_at desc);

-- ─── updated_at ──────────────────────────────────────────────────────────────

drop trigger if exists risk_rules_updated_at on public.risk_rules;
create trigger risk_rules_updated_at
  before update on public.risk_rules
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.risk_categories enable row level security;
alter table public.risk_rules enable row level security;
alter table public.risk_assessments enable row level security;

-- Categories & rules: read-only for authenticated users
create policy "Authenticated users can read risk categories"
  on public.risk_categories for select to authenticated using (active = true);

create policy "Authenticated users can read enabled risk rules"
  on public.risk_rules for select to authenticated using (enabled = true);

-- Assessments: users own their history
create policy "Users can view own risk assessments"
  on public.risk_assessments for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own risk assessments"
  on public.risk_assessments for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own risk assessments"
  on public.risk_assessments for delete to authenticated
  using (auth.uid() = user_id);
