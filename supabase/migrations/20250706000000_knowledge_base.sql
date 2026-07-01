-- PED Health AI — Phase 7: Scientific Knowledge Base (RAG)
-- Proprietary educational content for AI context and user browsing.

-- ─── Admin flag on profiles ──────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is 'Grants access to Knowledge Base CMS';

-- ─── knowledge_categories ────────────────────────────────────────────────────

create table if not exists public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_categories_slug_idx on public.knowledge_categories (slug);

-- ─── knowledge_articles ──────────────────────────────────────────────────────

create type public.knowledge_difficulty_enum as enum (
  'beginner',
  'intermediate',
  'advanced'
);

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category_id uuid not null references public.knowledge_categories (id) on delete restrict,
  summary text,
  content text not null default '',
  difficulty_level public.knowledge_difficulty_enum not null default 'beginner',
  image_url text,
  view_count integer not null default 0 check (view_count >= 0),
  published boolean not null default false,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_articles_category_idx on public.knowledge_articles (category_id);
create index if not exists knowledge_articles_published_idx on public.knowledge_articles (published) where published = true;
create index if not exists knowledge_articles_slug_idx on public.knowledge_articles (slug);
create index if not exists knowledge_articles_view_count_idx on public.knowledge_articles (view_count desc);
create index if not exists knowledge_articles_search_idx on public.knowledge_articles using gin (search_vector);

-- Full-text search vector maintenance
create or replace function public.knowledge_articles_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content, '')), 'C');
  return new;
end;
$$;

drop trigger if exists knowledge_articles_search_vector on public.knowledge_articles;
create trigger knowledge_articles_search_vector
  before insert or update of title, summary, content on public.knowledge_articles
  for each row execute function public.knowledge_articles_search_vector_update();

-- ─── knowledge_references (scientific citations) ─────────────────────────────

create table if not exists public.knowledge_references (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  title text not null,
  authors text,
  journal text,
  publication_year smallint check (publication_year is null or publication_year between 1900 and 2100),
  doi text,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_references_article_idx on public.knowledge_references (article_id);

-- ─── compound_articles ───────────────────────────────────────────────────────

create table if not exists public.compound_articles (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.compounds (id) on delete cascade,
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (compound_id, article_id)
);

create index if not exists compound_articles_compound_idx on public.compound_articles (compound_id);
create index if not exists compound_articles_article_idx on public.compound_articles (article_id);

-- ─── blood_marker_articles ───────────────────────────────────────────────────

create table if not exists public.blood_marker_articles (
  id uuid primary key default gen_random_uuid(),
  blood_marker_id uuid not null references public.blood_markers (id) on delete cascade,
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blood_marker_id, article_id)
);

create index if not exists blood_marker_articles_marker_idx on public.blood_marker_articles (blood_marker_id);
create index if not exists blood_marker_articles_article_idx on public.blood_marker_articles (article_id);

-- ─── updated_at ──────────────────────────────────────────────────────────────

drop trigger if exists knowledge_articles_updated_at on public.knowledge_articles;
create trigger knowledge_articles_updated_at
  before update on public.knowledge_articles
  for each row execute function public.set_updated_at();

-- ─── Storage: knowledge-images ───────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('knowledge-images', 'knowledge-images', true)
on conflict (id) do nothing;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.knowledge_categories enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.knowledge_references enable row level security;
alter table public.compound_articles enable row level security;
alter table public.blood_marker_articles enable row level security;

-- Public read for published content (anon + authenticated)
create policy "Anyone can read knowledge categories"
  on public.knowledge_categories for select
  using (true);

create policy "Anyone can read published knowledge articles"
  on public.knowledge_articles for select
  using (published = true);

create policy "Admins can manage knowledge articles"
  on public.knowledge_articles for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Anyone can read references for published articles"
  on public.knowledge_references for select
  using (
    exists (
      select 1 from public.knowledge_articles a
      where a.id = article_id and a.published = true
    )
  );

create policy "Admins can manage knowledge references"
  on public.knowledge_references for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Anyone can read compound article links"
  on public.compound_articles for select
  using (
    exists (
      select 1 from public.knowledge_articles a
      where a.id = article_id and a.published = true
    )
  );

create policy "Admins can manage compound article links"
  on public.compound_articles for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Anyone can read blood marker article links"
  on public.blood_marker_articles for select
  using (
    exists (
      select 1 from public.knowledge_articles a
      where a.id = article_id and a.published = true
    )
  );

create policy "Admins can manage blood marker article links"
  on public.blood_marker_articles for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Storage policies for knowledge images
create policy "Public read knowledge images"
  on storage.objects for select
  using (bucket_id = 'knowledge-images');

create policy "Admins upload knowledge images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'knowledge-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Admins update knowledge images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'knowledge-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Admins delete knowledge images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'knowledge-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Increment view count (callable by anyone for published articles)
create or replace function public.increment_article_view_count(article_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.knowledge_articles
  set view_count = view_count + 1
  where slug = article_slug and published = true;
end;
$$;

grant execute on function public.increment_article_view_count(text) to anon, authenticated;

comment on table public.knowledge_articles is 'Proprietary educational articles — primary AI knowledge source';
comment on table public.knowledge_references is 'Scientific references linked to knowledge articles';
