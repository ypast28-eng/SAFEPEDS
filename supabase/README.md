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

### Option A — SQL Editor

Run each file in order in **SQL Editor**.

### Option B — Supabase CLI

```bash
supabase link --project-ref your-project-ref
supabase db push
```

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

## Auth redirect URLs

Configure in **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (or your production domain)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`
