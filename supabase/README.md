# Supabase

## Apply migrations (in order)

| # | File | Phase |
|---|------|-------|
| 1 | `migrations/20250701000000_create_profiles.sql` | 2 |
| 2 | `migrations/20250702000000_compounds_and_cycles.sql` | 3 |
| 3 | `migrations/20250702000001_seed_compounds.sql` | 3 |

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

## RLS summary

| Table | Access |
|-------|--------|
| `compound_categories` | Authenticated read |
| `compounds` | Authenticated read (active only) |
| `compound_profiles` | Authenticated read |
| `user_cycles` | Owner CRUD |
| `cycle_compounds` | Owner CRUD via cycle |

## Auth redirect URLs

Configure in **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (or your production domain)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`
