-- PED Health AI — Phase 6: AI Health Intelligence
-- Educational AI layer — explains platform data only; does NOT score risk or diagnose.

-- ─── educational_articles ────────────────────────────────────────────────────

create table if not exists public.educational_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text,
  body text not null,
  tags text[] not null default '{}',
  published boolean not null default true,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists educational_articles_category_idx on public.educational_articles (category);
create index if not exists educational_articles_published_idx on public.educational_articles (published) where published = true;

-- ─── educational_references ──────────────────────────────────────────────────

create table if not exists public.educational_references (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.educational_articles (id) on delete set null,
  compound_id uuid references public.compounds (id) on delete set null,
  title text not null,
  url text,
  citation_text text,
  evidence_level text check (
    evidence_level is null
    or evidence_level in ('review', 'guideline', 'study', 'educational')
  ),
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists educational_references_article_idx on public.educational_references (article_id);

-- ─── ai_memory (user context for personalized explanations) ──────────────────

create type public.ai_memory_type_enum as enum (
  'training_goal',
  'current_cycle',
  'conversation_summary',
  'user_preference',
  'last_report_context'
);

create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  memory_type public.ai_memory_type_enum not null,
  context_key text not null default 'default',
  content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, memory_type, context_key)
);

create index if not exists ai_memory_user_id_idx on public.ai_memory (user_id);

-- ─── ai_audit_logs (compliance & security) ───────────────────────────────────

create type public.ai_feature_enum as enum (
  'bloodwork_report',
  'cycle_report',
  'timeline',
  'insights',
  'chat'
);

create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature public.ai_feature_enum not null,
  model text,
  prompt_hash text,
  input_snapshot jsonb not null default '{}',
  output_snapshot jsonb,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  status text not null default 'success' check (status in ('success', 'error', 'blocked')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_audit_logs_user_id_idx on public.ai_audit_logs (user_id, created_at desc);

-- ─── ai_reports (cached generated reports) ───────────────────────────────────

create type public.ai_report_type_enum as enum (
  'bloodwork',
  'cycle',
  'timeline',
  'insights'
);

create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_type public.ai_report_type_enum not null,
  source_id uuid,
  model text,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ai_reports_user_type_idx on public.ai_reports (user_id, report_type, created_at desc);
create index if not exists ai_reports_source_idx on public.ai_reports (source_id) where source_id is not null;

-- ─── ai_chat_messages ────────────────────────────────────────────────────────

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_user_idx on public.ai_chat_messages (user_id, created_at desc);

-- ─── updated_at triggers ───────────────────────────────────────────────────────

drop trigger if exists educational_articles_updated_at on public.educational_articles;
create trigger educational_articles_updated_at
  before update on public.educational_articles
  for each row execute function public.set_updated_at();

drop trigger if exists ai_memory_updated_at on public.ai_memory;
create trigger ai_memory_updated_at
  before update on public.ai_memory
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.educational_articles enable row level security;
alter table public.educational_references enable row level security;
alter table public.ai_memory enable row level security;
alter table public.ai_audit_logs enable row level security;
alter table public.ai_reports enable row level security;
alter table public.ai_chat_messages enable row level security;

create policy "Authenticated users can read published articles"
  on public.educational_articles for select to authenticated
  using (published = true);

create policy "Authenticated users can read educational references"
  on public.educational_references for select to authenticated
  using (true);

create policy "Users can manage own ai memory"
  on public.ai_memory for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view own ai audit logs"
  on public.ai_audit_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own ai reports"
  on public.ai_reports for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can manage own chat messages"
  on public.ai_chat_messages for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.educational_articles is 'Curated educational content for AI citations and knowledge base';
comment on table public.ai_audit_logs is 'Audit trail for all AI requests — compliance and security';
comment on table public.ai_memory is 'User context memory for personalized educational explanations only';
