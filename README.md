# PED Health AI

Educational health-monitoring SaaS platform for performance athletes. Track bloodwork, understand compound risks, and receive AI-powered educational insights.

> **Not medical advice.** This platform does not diagnose diseases or provide medical treatment recommendations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| AI | OpenAI API (Phase 3+) |

## Project Structure

```
/
├── frontend/          # Next.js 15 application
├── backend/           # FastAPI application (scaffold)
└── supabase/          # SQL migrations & Supabase config
    └── migrations/
```

## Phase 1 — Complete

- [x] Project scaffolding, dark theme, landing page, UI component library
- [x] Placeholder app pages with responsive sidebar

## Phase 2 — Complete

- [x] Supabase Auth (login, signup, forgot password, email verification)
- [x] Protected routes via Next.js middleware
- [x] `profiles` table with RLS and auto-create on signup
- [x] Reusable hooks: `useAuth`, `useUser`, `useProfile`

## Phase 3 — Complete

- [x] Compound knowledge database (categories, compounds, compound_profiles)
- [x] User cycles & cycle_compounds tables with RLS
- [x] 86 compounds seeded across 17 categories (via migration)
- [x] Cycle Builder — search, filter, dose, units, frequency, duration, notes
- [x] My Cycles — view, edit, delete, duplicate
- [x] Knowledge Base — database-driven compound browser

### Apply Phase 3 migrations

Run after Phase 2 migrations:

```bash
# In Supabase SQL Editor, run in order:
# 1. supabase/migrations/20250702000000_compounds_and_cycles.sql
# 2. supabase/migrations/20250702000001_seed_compounds.sql
```

Or regenerate seed: `node scripts/generate-compound-seed.mjs`

## Phase 4 — Complete

- [x] Bloodwork reports, results, and history tables with RLS
- [x] `blood_markers` reference catalog (extensible without code changes)
- [x] Supabase Storage bucket for PDF/image uploads
- [x] Bloodwork dashboard, manual entry, file upload
- [x] Report detail view with status (Low/Normal/High from user-supplied ranges)
- [x] Trend dashboard with 3m / 6m / 12m / all-time filters

### Apply Phase 4 migrations

```bash
# 4. supabase/migrations/20250703000000_bloodwork.sql
# 5. supabase/migrations/20250703000001_seed_blood_markers.sql
```

## Phase 5 — Complete

- [x] Dedicated Risk Engine service (Python) — separate from UI, database, and AI
- [x] Modular rule framework with configurable weights, conditions, and explanations
- [x] 14 risk categories with 0–100 scores and five display levels
- [x] `risk_categories`, `risk_rules`, and `risk_assessments` tables in Supabase
- [x] FastAPI endpoints: calculate, compare, what-if, history
- [x] Risk Dashboard with gauges, category cards, and monitoring placeholders
- [x] Compare Cycles and What-If analysis UIs
- [x] Placeholder scoring — rules editable in Supabase without code changes

### Apply Phase 5 migrations

```bash
# 6. supabase/migrations/20250704000000_risk_engine.sql
# 7. supabase/migrations/20250704000001_seed_risk_rules.sql
```

### Run the Risk Engine API

The frontend calls the FastAPI backend for risk calculations. Start both services:

```bash
# Terminal 1 — backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

Optional backend env (`backend/.env`) for full rule set and history persistence:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-or-anon-key
```

Without Supabase configured, the engine uses built-in fallback rules.

## Phase 6 — Complete

- [x] Dedicated AI Service — all requests through FastAPI with structured JSON only
- [x] OpenAI integration with retry, rate limiting, token tracking, and audit logging
- [x] Prompt templates — no raw prompts from frontend; injection protection
- [x] AI Bloodwork Report on report detail page
- [x] AI Cycle Report on Risk Dashboard (explains rule-based scores only)
- [x] AI Health Timeline, Insights, and secure Chat interfaces
- [x] Educational articles and scientific references in Supabase
- [x] AI memory and audit log tables with RLS
- [x] Deterministic fallback when `OPENAI_API_KEY` is not configured

### Apply Phase 6 migrations

```bash
# 8. supabase/migrations/20250705000000_ai_intelligence.sql
# 9. supabase/migrations/20250705000001_seed_educational_content.sql
```

### AI backend configuration

Add to `backend/.env`:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

AI endpoints require `Authorization: Bearer <supabase_access_token>` from the frontend session.

## Phase 7 — Complete

- [x] `knowledge_categories`, `knowledge_articles`, `knowledge_references` tables
- [x] `compound_articles` and `blood_marker_articles` junction tables
- [x] Full-text search with filters (compound, blood marker, peptide, SARM, keyword, category)
- [x] Article detail pages with related compounds, markers, references
- [x] RAG integration — AI prioritizes Knowledge Base articles as context
- [x] Admin CMS at `/admin/knowledge` (requires `profiles.is_admin`)
- [x] Featured articles on homepage (newest, popular, recently updated)
- [x] 20 seeded categories and starter articles

### Apply Phase 7 migrations

```bash
# 10. supabase/migrations/20250706000000_knowledge_base.sql
# 11. supabase/migrations/20250706000001_seed_knowledge_base.sql
```

### Grant admin access

```sql
update public.profiles set is_admin = true where email = 'your-admin@email.com';
```

## Getting Started

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/20250701000000_create_profiles.sql` via the **SQL Editor** or Supabase CLI
3. Under **Authentication → URL Configuration**, add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
4. Enable **Email confirmations** under Authentication → Providers → Email (recommended)

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Backend (optional)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

`frontend/.env.local`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Never commit real keys.** Use `.env.local` locally and CI/CD secrets in production.

## Auth Routes

| Route | Purpose |
|-------|---------|
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password (from email link) |
| `/verify-email` | Post-signup verification instructions |
| `/auth/callback` | Email/OAuth session exchange |

Protected routes (`/dashboard`, `/cycle-builder`, `/bloodwork`, `/knowledge-base`, `/settings`) redirect unauthenticated users to `/login`.

## License

Proprietary — All rights reserved.
