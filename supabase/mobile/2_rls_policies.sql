-- =============================================================================
-- SAFEPEDS / PED Health AI — Row Level Security policies
-- Step 2 of 3 for Supabase SQL Editor (mobile-friendly)
-- Run after 1_create_tables.sql.
-- Generated from safepeds_app_complete_schema.sql — do not edit by hand.
-- Regenerate: node scripts/split-safepeds-schema.mjs
-- =============================================================================



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

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.compound_categories enable row level security;

alter table public.compounds enable row level security;

alter table public.compound_profiles enable row level security;

alter table public.user_cycles enable row level security;

alter table public.cycle_compounds enable row level security;

-- Knowledge base: read-only for authenticated users
create policy "Authenticated users can read categories"
  on public.compound_categories for select to authenticated using (true);

create policy "Authenticated users can read compounds"
  on public.compounds for select to authenticated using (active = true);

create policy "Authenticated users can read compound profiles"
  on public.compound_profiles for select to authenticated using (true);

-- User cycles: full CRUD on own rows
create policy "Users can view own cycles"
  on public.user_cycles for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own cycles"
  on public.user_cycles for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own cycles"
  on public.user_cycles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own cycles"
  on public.user_cycles for delete to authenticated
  using (auth.uid() = user_id);

-- Cycle compounds: access via owning cycle
create policy "Users can view own cycle compounds"
  on public.cycle_compounds for select to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

create policy "Users can insert own cycle compounds"
  on public.cycle_compounds for insert to authenticated
  with check (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

create policy "Users can update own cycle compounds"
  on public.cycle_compounds for update to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

create policy "Users can delete own cycle compounds"
  on public.cycle_compounds for delete to authenticated
  using (
    exists (
      select 1 from public.user_cycles uc
      where uc.id = cycle_compounds.cycle_id and uc.user_id = auth.uid()
    )
  );

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.blood_markers enable row level security;

alter table public.bloodwork_reports enable row level security;

alter table public.bloodwork_results enable row level security;

alter table public.bloodwork_history enable row level security;

create policy "Authenticated users can read blood markers"
  on public.blood_markers for select to authenticated using (active = true);

create policy "Users can view own reports"
  on public.bloodwork_reports for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.bloodwork_reports for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.bloodwork_reports for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own reports"
  on public.bloodwork_reports for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own results"
  on public.bloodwork_results for select to authenticated
  using (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can insert own results"
  on public.bloodwork_results for insert to authenticated
  with check (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can update own results"
  on public.bloodwork_results for update to authenticated
  using (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can delete own results"
  on public.bloodwork_results for delete to authenticated
  using (
    exists (
      select 1 from public.bloodwork_reports br
      where br.id = bloodwork_results.report_id and br.user_id = auth.uid()
    )
  );

create policy "Users can view own history"
  on public.bloodwork_history for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.bloodwork_history for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own history"
  on public.bloodwork_history for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users can upload own bloodwork files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own bloodwork files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own bloodwork files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own bloodwork files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'bloodwork-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

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
