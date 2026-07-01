-- PED Health AI — Phase 8: Educational Health Support Library
-- Educational only — does not diagnose, prescribe, or recommend dosages.

-- ─── health_topics ───────────────────────────────────────────────────────────

create table if not exists public.health_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  summary text,
  content text not null default '',
  overview text,
  why_it_matters text,
  blood_markers_involved text[] not null default '{}',
  image_url text,
  view_count integer not null default 0 check (view_count >= 0),
  published boolean not null default false,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_topics_category_idx on public.health_topics (category);
create index if not exists health_topics_published_idx on public.health_topics (published) where published = true;
create index if not exists health_topics_slug_idx on public.health_topics (slug);
create index if not exists health_topics_search_idx on public.health_topics using gin (search_vector);

create or replace function public.health_topics_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.overview, '')), 'B');
  return new;
end;
$$;

drop trigger if exists health_topics_search_vector on public.health_topics;
create trigger health_topics_search_vector
  before insert or update of title, summary, content, overview on public.health_topics
  for each row execute function public.health_topics_search_vector_update();

-- ─── support_options ─────────────────────────────────────────────────────────

create type public.support_option_type_enum as enum (
  'Lifestyle',
  'Monitoring',
  'Nutrition',
  'Supplement',
  'Medication Information',
  'Educational'
);

create table if not exists public.support_options (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  title text not null,
  type public.support_option_type_enum not null default 'Educational',
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists support_options_topic_idx on public.support_options (topic_id);

-- ─── support_details ─────────────────────────────────────────────────────────

create table if not exists public.support_details (
  id uuid primary key default gen_random_uuid(),
  support_option_id uuid not null references public.support_options (id) on delete cascade,
  description text not null,
  scientific_references jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists support_details_option_idx on public.support_details (support_option_id);

-- ─── Junction: health topics ↔ blood markers ─────────────────────────────────

create table if not exists public.health_topic_blood_markers (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  blood_marker_id uuid not null references public.blood_markers (id) on delete cascade,
  unique (topic_id, blood_marker_id)
);

-- ─── Junction: health topics ↔ compounds ─────────────────────────────────────

create table if not exists public.health_topic_compounds (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  compound_id uuid not null references public.compounds (id) on delete cascade,
  unique (topic_id, compound_id)
);

-- ─── Junction: health topics ↔ knowledge articles ────────────────────────────

create table if not exists public.health_topic_knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  unique (topic_id, article_id)
);

-- ─── Junction: risk categories ↔ health topics ───────────────────────────────

create table if not exists public.risk_category_health_topics (
  id uuid primary key default gen_random_uuid(),
  risk_category_slug text not null,
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  unique (risk_category_slug, topic_id)
);

create index if not exists risk_category_health_topics_slug_idx
  on public.risk_category_health_topics (risk_category_slug);

-- ─── User bookmarks & recently viewed ────────────────────────────────────────

create table if not exists public.health_topic_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.health_topic_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.health_topics (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists health_topic_views_user_idx
  on public.health_topic_views (user_id, viewed_at desc);

-- ─── updated_at ──────────────────────────────────────────────────────────────

drop trigger if exists health_topics_updated_at on public.health_topics;
create trigger health_topics_updated_at
  before update on public.health_topics
  for each row execute function public.set_updated_at();

-- ─── View count RPC ──────────────────────────────────────────────────────────

create or replace function public.increment_health_topic_view_count(topic_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.health_topics set view_count = view_count + 1
  where slug = topic_slug and published = true;
end;
$$;

grant execute on function public.increment_health_topic_view_count(text) to anon, authenticated;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.health_topics enable row level security;
alter table public.support_options enable row level security;
alter table public.support_details enable row level security;
alter table public.health_topic_blood_markers enable row level security;
alter table public.health_topic_compounds enable row level security;
alter table public.health_topic_knowledge_articles enable row level security;
alter table public.risk_category_health_topics enable row level security;
alter table public.health_topic_bookmarks enable row level security;
alter table public.health_topic_views enable row level security;

create policy "Anyone can read published health topics"
  on public.health_topics for select using (published = true);

create policy "Admins manage health topics"
  on public.health_topics for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Anyone can read support for published topics"
  on public.support_options for select
  using (exists (select 1 from public.health_topics t where t.id = topic_id and t.published = true));

create policy "Admins manage support options"
  on public.support_options for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Anyone can read support details for published topics"
  on public.support_details for select
  using (exists (
    select 1 from public.support_options o
    join public.health_topics t on t.id = o.topic_id
    where o.id = support_option_id and t.published = true
  ));

create policy "Admins manage support details"
  on public.support_details for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Public read health topic links"
  on public.health_topic_blood_markers for select using (true);
create policy "Admins manage health topic blood markers"
  on public.health_topic_blood_markers for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Public read health topic compound links"
  on public.health_topic_compounds for select using (true);
create policy "Admins manage health topic compounds"
  on public.health_topic_compounds for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Public read health topic knowledge links"
  on public.health_topic_knowledge_articles for select using (true);
create policy "Admins manage health topic knowledge links"
  on public.health_topic_knowledge_articles for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Anyone can read risk category topic links"
  on public.risk_category_health_topics for select using (true);
create policy "Admins manage risk category topic links"
  on public.risk_category_health_topics for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Users manage own bookmarks"
  on public.health_topic_bookmarks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own views"
  on public.health_topic_views for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.health_topics is 'Educational health support topics — primary AI health content source';
