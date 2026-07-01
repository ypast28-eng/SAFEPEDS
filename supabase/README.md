# Supabase

## Apply migrations (in order)

| # | File | Phase |
|---|------|-------|
| 1 | `migrations/20250701000000_create_profiles.sql` | 2 |
| 2 | `migrations/20250702000000_compounds_and_cycles.sql` | 3 |
| 3 | `migrations/20250702000001_seed_compounds.sql` | 3 |
| 4 | `migrations/20250703000000_bloodwork.sql` | 4 |
| 5 | `migrations/20250703000001_seed_blood_markers.sql` | 4 |
| 6 | `migrations/20250704000000_risk_engine.sql` | 5 |
| 7 | `migrations/20250704000001_seed_risk_rules.sql` | 5 |
| 8 | `migrations/20250705000000_ai_intelligence.sql` | 6 |
| 9 | `migrations/20250705000001_seed_educational_content.sql` | 6 |
| 10 | `migrations/20250706000000_knowledge_base.sql` | 7 |
| 11 | `migrations/20250706000001_seed_knowledge_base.sql` | 7 |
| 12 | `migrations/20250707000000_health_support_library.sql` | 8 |
| 13 | `migrations/20250707000001_seed_health_topics.sql` | 8 |

### PEDSAFE (greenfield — separate table names)

See **`supabase/PEDSAFE.md`** for Dashboard + GitHub deploy steps (no CLI, no copy/paste).

| # | File |
|---|------|
| P1 | `migrations/20250708100000_pedsafe_foundation.sql` |
| P2 | `migrations/20250708100001_pedsafe_profiles.sql` |
| P3 | `migrations/20250708100002_pedsafe_compounds.sql` |
| P4 | `migrations/20250708100003_pedsafe_cycles.sql` |
| P5 | `migrations/20250708100004_pedsafe_bloodwork.sql` |
| P6 | `migrations/20250708100005_pedsafe_notes.sql` |
| P7 | `migrations/20250708100006_pedsafe_seed_compounds.sql` |

### Option A — Supabase Dashboard + GitHub (no manual SQL copy)

Use this to deploy migrations from the repo without pasting SQL.

1. **Push this repo to GitHub** (branch `main` must contain `supabase/migrations/`).

2. **Open Supabase Dashboard** → your project → **Project Settings** (gear) → **Integrations**.

3. Click **GitHub** → **Authorize** → select repository **`ypast28-eng/SAFEPEDS`** (or your fork).

4. Enable **Supabase integration** for the repo and set:
   - **Supabase directory:** `supabase`
   - **Production branch:** `main`

5. Go to **Database** → **Migrations** in the left sidebar.

6. You should see pending migrations from `supabase/migrations/`. Click **Deploy** (or **Run migration**) on each pending file, or **Deploy all** if offered.

7. Wait for success. Confirm tables in **Table Editor**.

> **PEDSAFE-only?** See `supabase/PEDSAFE.md` — deploy migrations `20250708100000`–`20250708100006` only.

> **SAFEPEDS app?** Deploy migrations `1–13` only. Do not mix with PEDSAFE on the same database.

### Option B — Supabase CLI (no manual SQL copy)

```bash
npm install -g supabase   # or: npx supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

`db push` applies every migration in `supabase/migrations/` that is not yet recorded in `supabase_migrations.schema_migrations`.

### Option C — SQL Editor (manual)

Run each file in order in **SQL Editor** (copy/paste).

### Regenerate compound seed

```bash
node scripts/generate-compound-seed.mjs
```

## Phase 3 tables

### `compound_categories`
Educational grouping for compounds (17 categories).

### `compounds`
Core compound records — name, type, administration, ester, etc.  
**Read-only** for authenticated users.

### `compound_profiles`
Risk scores (0–10 placeholders), monitoring markers, mechanism notes.  
**Read-only** for authenticated users.

### `user_cycles`
User-owned cycle plans (name, goal, dates, notes).

### `cycle_compounds`
Compounds in a cycle with dose, unit, frequency, duration, notes.

## Phase 4 tables

### `blood_markers`
Reference catalog of lab markers (CBC, liver, lipids, hormones, etc.). Add rows to support new markers without code changes.

### `bloodwork_reports`
User lab reports with metadata and optional uploaded file path.

### `bloodwork_results`
Per-marker results with user-supplied reference ranges and status (Low/Normal/High).

### `bloodwork_history`
Historical values for trend charts (auto-populated via trigger).

### Storage: `bloodwork-reports`
Private bucket for PDF/image pathology reports.

## Phase 5 tables

### `risk_categories`
Educational risk category definitions (liver, kidney, cardiovascular, etc.).

### `risk_rules`
Configurable scoring rules — condition JSON, weight, explanation, evidence placeholder.  
Admins can enable/disable and update without application code changes.

### `risk_assessments`
Persisted risk calculation history (calculate, compare, what_if).

## Phase 6 tables

### `educational_articles`
Curated educational content for AI citations and knowledge base expansion.

### `educational_references`
Scientific citations linked to articles or compounds.

### `ai_memory`
Per-user context for personalized educational explanations.

### `ai_audit_logs`
Audit trail for every AI request (compliance and security).

### `ai_reports`
Cached AI-generated reports (bloodwork, cycle, timeline, insights).

### `ai_chat_messages`
Persisted chat history per user.

## Phase 7 tables

### `knowledge_categories`, `knowledge_articles`, `knowledge_references`
Educational knowledge base with full-text search and RAG integration.

### `compound_articles`, `blood_marker_articles`
Junction tables linking articles to compounds and blood markers.

## Phase 8 tables

### `health_topics`
Educational health support topics (bloodwork findings, health concerns, monitoring).

### `support_options`, `support_details`
Structured support content per topic (Lifestyle, Monitoring, Nutrition, Supplement, Medication Information, Educational).

### Junction tables
- `health_topic_blood_markers` — links topics to blood marker catalog
- `health_topic_compounds` — links topics to compounds
- `health_topic_knowledge_articles` — links topics to knowledge base articles
- `risk_category_health_topics` — links risk categories to relevant topics

### User engagement
- `health_topic_bookmarks` — saved topics per user
- `health_topic_views` — recently viewed topics per user

## RLS summary

| Table | Access |
|-------|--------|
| `compound_categories` | Authenticated read |
| `compounds` | Authenticated read (active only) |
| `compound_profiles` | Authenticated read |
| `user_cycles` | Owner CRUD |
| `cycle_compounds` | Owner CRUD via cycle |
| `blood_markers` | Authenticated read |
| `bloodwork_reports` | Owner CRUD |
| `bloodwork_results` | Owner CRUD via report |
| `bloodwork_history` | Owner read/insert/delete |
| `risk_categories` | Authenticated read (active) |
| `risk_rules` | Authenticated read (enabled) |
| `risk_assessments` | Owner CRUD |
| `educational_articles` | Authenticated read (published) |
| `educational_references` | Authenticated read |
| `ai_memory` | Owner CRUD |
| `ai_audit_logs` | Owner read |
| `ai_reports` | Owner read |
| `ai_chat_messages` | Owner CRUD |
| `knowledge_categories` | Authenticated read |
| `knowledge_articles` | Published read; admin CRUD |
| `health_topics` | Published read; admin CRUD |
| `support_options`, `support_details` | Published read via topic; admin CRUD |
| `health_topic_bookmarks` | Owner CRUD |
| `health_topic_views` | Owner insert/read |

## Auth redirect URLs

Configure in **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (or your production domain)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`
